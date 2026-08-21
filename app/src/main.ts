import {
  AmbientLight,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COUNTRIES, type Continent, type Country } from "./data/countries";
import { EARTH_RADIUS, formatCoords, formatPopulation, latLngToVector3 } from "./geo";
import { createEarth, createStarfield } from "./scene/earth";
import { createImmediateTextures, loadRemoteTextures } from "./scene/textures";

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Elemento ${selector} mancante`);
  }
  return element;
}

const canvas = required<HTMLCanvasElement>("#globe");
const loader = required<HTMLElement>("#loader");
const searchInput = required<HTMLInputElement>("#search");
const suggestions = required<HTMLUListElement>("#suggestions");
const panel = required<HTMLElement>("#panel");
const tooltip = required<HTMLElement>("#tooltip");
const filters = required<HTMLElement>("#filters");

const requiredIds = [
  "flag",
  "continent-label",
  "country-name",
  "capital",
  "population",
  "coords",
  "close-panel",
  "fly-again",
  "toggle-rotate",
  "toggle-clouds",
  "toggle-night",
] as const;

const elements = Object.fromEntries(
  requiredIds.map((id) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Elemento #${id} mancante`);
    }
    return [id, element];
  }),
) as Record<(typeof requiredIds)[number], HTMLElement>;

const rotateToggle = elements["toggle-rotate"] as HTMLInputElement;
const cloudsToggle = elements["toggle-clouds"] as HTMLInputElement;
const nightToggle = elements["toggle-night"] as HTMLInputElement;
const flag = elements.flag as HTMLImageElement;

const scene = new Scene();
scene.background = new Color("#020617");

const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.copy(latLngToVector3(22, 12, 280));

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 140;
controls.maxDistance = 520;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45;
controls.enablePan = false;

scene.add(new AmbientLight(0x6f86a8, 0.55));
const sun = new DirectionalLight(0xffffff, 1.35);
sun.position.set(240, 80, 120);
scene.add(sun);

const dummy = new Object3D();
const raycaster = new Raycaster();
const pointer = new Vector2();
const markerIndex = new Map<number, Country>();

let selected: Country | null = null;
let hoverIndex = -1;
let filterContinent: Continent | "Tutti" = "Tutti";
let flyAnimation: number | null = null;
let ready = false;
let pointerStart = new Vector2();
let dragged = false;
let markers: InstancedMesh;
let markerHalo: Mesh;
let clouds: Mesh;
let earthMaterial: ReturnType<typeof createEarth>["earthMaterial"];

function visibleCountries(): Country[] {
  if (filterContinent === "Tutti") {
    return COUNTRIES;
  }
  return COUNTRIES.filter((country) => country.continent === filterContinent);
}

function flagUrl(id: string): string {
  return `https://flagcdn.com/w80/${id.toLowerCase()}.png`;
}

function setInstanceColor(index: number, hex: number): void {
  markers.setColorAt(index, new Color(hex));
  if (markers.instanceColor) {
    markers.instanceColor.needsUpdate = true;
  }
}

function refreshMarkers(preferred?: Country | null): void {
  if (!ready) {
    return;
  }
  const countries = visibleCountries();
  markerIndex.clear();
  countries.forEach((country, index) => {
    const position = latLngToVector3(country.lat, country.lng, EARTH_RADIUS * 1.02);
    dummy.position.copy(position);
    dummy.lookAt(0, 0, 0);
    dummy.updateMatrix();
    markers.setMatrixAt(index, dummy.matrix);
    markerIndex.set(index, country);
    setInstanceColor(index, country.id === preferred?.id ? 0xfbbf24 : 0x7dd3fc);
  });
  markers.count = countries.length;
  markers.instanceMatrix.needsUpdate = true;
}

function hideSuggestions(): void {
  suggestions.hidden = true;
  suggestions.innerHTML = "";
}

function showCountry(country: Country, fly = true): void {
  selected = country;
  refreshMarkers(country);
  panel.hidden = false;
  elements["continent-label"].textContent = country.continent;
  elements["country-name"].textContent = country.name;
  elements.capital.textContent = country.capital;
  elements.population.textContent = formatPopulation(country.population);
  elements.coords.textContent = formatCoords(country.lat, country.lng);
  flag.src = flagUrl(country.id);
  flag.alt = `Bandiera di ${country.name}`;
  searchInput.value = country.name;
  hideSuggestions();
  const haloPos = latLngToVector3(country.lat, country.lng, EARTH_RADIUS * 1.03);
  markerHalo.position.copy(haloPos);
  markerHalo.lookAt(0, 0, 0);
  markerHalo.visible = true;
  if (fly) {
    flyTo(country);
  }
}

function clearSelection(): void {
  selected = null;
  panel.hidden = true;
  markerHalo.visible = false;
  refreshMarkers();
}

function flyTo(country: Country): void {
  const destination = latLngToVector3(country.lat, country.lng, EARTH_RADIUS * 2.35);
  const start = camera.position.clone();
  const startTime = performance.now();
  const duration = 1100;
  controls.autoRotate = false;
  rotateToggle.checked = false;

  if (flyAnimation !== null) {
    cancelAnimationFrame(flyAnimation);
  }

  const step = (now: number): void => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    camera.position.lerpVectors(start, destination, eased);
    controls.target.set(0, 0, 0);
    if (progress < 1) {
      flyAnimation = requestAnimationFrame(step);
    } else {
      flyAnimation = null;
    }
  };

  flyAnimation = requestAnimationFrame(step);
}

function renderSuggestions(query: string): void {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    hideSuggestions();
    return;
  }

  const matches = visibleCountries()
    .filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.capital.toLowerCase().includes(needle),
    )
    .slice(0, 8);

  suggestions.innerHTML = "";
  if (matches.length === 0) {
    hideSuggestions();
    return;
  }

  matches.forEach((country, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${country.name} · ${country.capital}`;
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.addEventListener("click", () => showCountry(country));
    item.append(button);
    suggestions.append(item);
  });
  suggestions.hidden = false;
}

function pickCountry(clientX: number, clientY: number): Country | null {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(markers);
  const index = hits[0]?.instanceId;
  return index === undefined ? null : (markerIndex.get(index) ?? null);
}

function updateTooltip(event: PointerEvent): void {
  const country = pickCountry(event.clientX, event.clientY);
  if (!country) {
    tooltip.hidden = true;
    canvas.style.cursor = "grab";
    if (hoverIndex !== -1 && markerIndex.get(hoverIndex)?.id !== selected?.id) {
      setInstanceColor(hoverIndex, 0x7dd3fc);
    }
    hoverIndex = -1;
    return;
  }

  const nextIndex = [...markerIndex.entries()].find(([, item]) => item.id === country.id)?.[0];
  if (nextIndex !== undefined && nextIndex !== hoverIndex) {
    if (hoverIndex !== -1 && markerIndex.get(hoverIndex)?.id !== selected?.id) {
      setInstanceColor(hoverIndex, 0x7dd3fc);
    }
    hoverIndex = nextIndex;
    setInstanceColor(nextIndex, country.id === selected?.id ? 0xfbbf24 : 0xffffff);
  }

  tooltip.hidden = false;
  tooltip.textContent = `${country.name} · ${country.capital}`;
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
  canvas.style.cursor = "pointer";
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function start(): Promise<void> {
  const textures = createImmediateTextures();
  const earth = createEarth(textures.day, textures.night);
  clouds = earth.clouds;
  earthMaterial = earth.earthMaterial;
  scene.add(earth.group);
  scene.add(createStarfield());

  const markerGeometry = new SphereGeometry(0.95, 12, 12);
  const markerMaterial = new MeshBasicMaterial();
  markers = new InstancedMesh(markerGeometry, markerMaterial, COUNTRIES.length);
  markers.instanceMatrix.setUsage(DynamicDrawUsage);
  scene.add(markers);

  markerHalo = new Mesh(
    new RingGeometry(1.7, 2.4, 32),
    new MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 }),
  );
  markerHalo.visible = false;
  scene.add(markerHalo);

  ready = true;
  refreshMarkers();
  loader.classList.add("hide");

  renderer.setAnimationLoop((time) => {
    clouds.rotation.y = time * 0.000018;
    markerHalo.scale.setScalar(1 + Math.sin(time * 0.004) * 0.12);
    earthMaterial.uniforms.sunDirection.value = sun.position.clone().normalize();
    controls.update();
    renderer.render(scene, camera);
  });

  const satellite = await loadRemoteTextures();
  if (satellite) {
    earthMaterial.uniforms.dayMap.value = satellite.day;
    earthMaterial.uniforms.nightMap.value = satellite.night;
    earthMaterial.uniformsNeedUpdate = true;
  }
}

searchInput.addEventListener("input", () => renderSuggestions(searchInput.value));
searchInput.addEventListener("focus", () => renderSuggestions(searchInput.value));
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const first = suggestions.querySelector("button");
    first?.click();
  }
  if (event.key === "Escape") {
    hideSuggestions();
    searchInput.blur();
  }
});

document.addEventListener("click", (event) => {
  if (!searchInput.contains(event.target as Node) && !suggestions.contains(event.target as Node)) {
    hideSuggestions();
  }
});

filters.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-continent]");
  if (!button) {
    return;
  }
  filterContinent = button.dataset.continent as Continent | "Tutti";
  filters.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");
  if (selected && filterContinent !== "Tutti" && selected.continent !== filterContinent) {
    clearSelection();
  } else {
    refreshMarkers(selected);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (pointerStart.distanceTo(new Vector2(event.clientX, event.clientY)) > 6) {
    dragged = true;
  }
  updateTooltip(event);
});
canvas.addEventListener("pointerdown", (event) => {
  pointerStart.set(event.clientX, event.clientY);
  dragged = false;
  canvas.style.cursor = "grabbing";
});
canvas.addEventListener("pointerup", (event) => {
  if (!dragged) {
    const country = pickCountry(event.clientX, event.clientY);
    if (country) {
      showCountry(country);
    }
  }
  canvas.style.cursor = "grab";
});

elements["close-panel"].addEventListener("click", clearSelection);
elements["fly-again"].addEventListener("click", () => {
  if (selected) {
    flyTo(selected);
  }
});
rotateToggle.addEventListener("change", () => {
  controls.autoRotate = rotateToggle.checked;
});
cloudsToggle.addEventListener("change", () => {
  clouds.visible = cloudsToggle.checked;
});
nightToggle.addEventListener("change", () => {
  earthMaterial.uniforms.nightMix.value = nightToggle.checked ? 1 : 0;
});
window.addEventListener("resize", onResize);

void start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "errore sconosciuto";
  loader.classList.remove("hide");
  const text = loader.querySelector("p");
  if (text) {
    text.textContent = `Impossibile avviare il globo: ${message}`;
  }
});
