import { Vector3 } from "three";

export const EARTH_RADIUS = 100;

export function latLngToVector3(lat: number, lng: number, radius = EARTH_RADIUS): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function formatPopulation(value: number): string {
  return new Intl.NumberFormat("it-IT").format(value);
}

export function formatCoords(lat: number, lng: number): string {
  const latHem = lat >= 0 ? "N" : "S";
  const lngHem = lng >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(2)}° ${latHem}, ${Math.abs(lng).toFixed(2)}° ${lngHem}`;
}
