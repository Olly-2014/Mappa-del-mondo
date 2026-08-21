import { CanvasTexture, SRGBColorSpace, Texture, TextureLoader } from "three";

const TEXTURE_BASE = "https://unpkg.com/three-globe@2.44.1/example/img";

export const TEXTURE_URLS = {
  day: `${TEXTURE_BASE}/earth-blue-marble.jpg`,
  night: `${TEXTURE_BASE}/earth-night.jpg`,
  bump: `${TEXTURE_BASE}/earth-topology.png`,
};

function makeCanvas(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D non disponibile");
  }
  return context;
}

export function createFallbackDayTexture(): CanvasTexture {
  const ctx = makeCanvas(1024, 512);
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#8ecae6");
  gradient.addColorStop(0.5, "#1d4ed8");
  gradient.addColorStop(1, "#8ecae6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = "#15803d";
  for (let i = 0; i < 90; i += 1) {
    ctx.globalAlpha = 0.18 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 1024,
      80 + Math.random() * 352,
      40 + Math.random() * 120,
      20 + Math.random() * 50,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  const texture = new CanvasTexture(ctx.canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createFallbackNightTexture(): CanvasTexture {
  const ctx = makeCanvas(1024, 512);
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1800; i += 1) {
    ctx.fillStyle = `rgba(255, 214, 140, ${0.15 + Math.random() * 0.7})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, 1, 1);
  }
  const texture = new CanvasTexture(ctx.canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createCloudTexture(): CanvasTexture {
  const ctx = makeCanvas(1024, 512);
  ctx.clearRect(0, 0, 1024, 512);
  for (let i = 0; i < 4200; i += 1) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const radius = 3 + Math.random() * 18;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 2.1, radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return new CanvasTexture(ctx.canvas);
}

export function createStarTexture(): CanvasTexture {
  const ctx = makeCanvas(64, 64);
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(226,232,240,0.6)");
  gradient.addColorStop(1, "rgba(226,232,240,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(ctx.canvas);
}

async function loadTexture(url: string): Promise<Texture> {
  const loader = new TextureLoader();
  loader.setCrossOrigin("anonymous");
  const texture = await loader.loadAsync(url);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export async function loadGlobeTextures(): Promise<{
  day: Texture;
  night: Texture;
  bump: Texture | null;
}> {
  try {
    const [day, night, bump] = await Promise.all([
      loadTexture(TEXTURE_URLS.day),
      loadTexture(TEXTURE_URLS.night),
      loadTexture(TEXTURE_URLS.bump),
    ]);
    return { day, night, bump };
  } catch {
    return {
      day: createFallbackDayTexture(),
      night: createFallbackNightTexture(),
      bump: null,
    };
  }
}
