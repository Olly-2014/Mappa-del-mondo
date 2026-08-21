import { CanvasTexture, SRGBColorSpace, Texture, TextureLoader } from "three";

const TEXTURE_BASE = "https://unpkg.com/three-globe@2.44.1/example/img";

export const TEXTURE_URLS = {
  day: `${TEXTURE_BASE}/earth-blue-marble.jpg`,
  night: `${TEXTURE_BASE}/earth-night.jpg`,
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

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * 1024,
    y: ((90 - lat) / 180) * 512,
  };
}

function drawLand(
  ctx: CanvasRenderingContext2D,
  lat: number,
  lng: number,
  rx: number,
  ry: number,
  color: string,
): void {
  const { x, y } = project(lat, lng);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function createFallbackDayTexture(): CanvasTexture {
  const ctx = makeCanvas(1024, 512);
  const ocean = ctx.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, "#7dd3fc");
  ocean.addColorStop(0.5, "#1d4ed8");
  ocean.addColorStop(1, "#7dd3fc");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 1024, 512);

  const land = "#3f7d4e";
  const desert = "#c4a574";
  drawLand(ctx, 55, -105, 130, 55, land);
  drawLand(ctx, 20, -100, 55, 28, land);
  drawLand(ctx, -15, -60, 55, 80, land);
  drawLand(ctx, 10, 20, 55, 70, land);
  drawLand(ctx, 22, 10, 40, 22, desert);
  drawLand(ctx, 55, 15, 45, 28, land);
  drawLand(ctx, 55, 90, 160, 50, land);
  drawLand(ctx, 25, 80, 70, 35, land);
  drawLand(ctx, -5, 115, 70, 22, land);
  drawLand(ctx, -25, 135, 40, 22, land);
  drawLand(ctx, 75, 40, 180, 22, "#e2e8f0");

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

export function createImmediateTextures(): { day: Texture; night: Texture } {
  return {
    day: createFallbackDayTexture(),
    night: createFallbackNightTexture(),
  };
}

export async function loadRemoteTextures(): Promise<{ day: Texture; night: Texture } | null> {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error("timeout texture")), 8000);
  });

  try {
    return await Promise.race([
      Promise.all([loadTexture(TEXTURE_URLS.day), loadTexture(TEXTURE_URLS.night)]).then(
        ([day, night]) => ({ day, night }),
      ),
      timeout,
    ]);
  } catch {
    return null;
  }
}
