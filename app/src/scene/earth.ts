import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SphereGeometry,
  Texture,
} from "three";
import { EARTH_RADIUS } from "../geo";
import { createCloudTexture, createStarTexture } from "./textures";

const atmosphereVertex = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
    gl_FragColor = vec4(0.25, 0.55, 1.0, 1.0) * intensity;
  }
`;

const earthVertex = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragment = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;
  uniform float nightMix;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb * 1.35;
    float lambert = dot(normalize(vWorldNormal), normalize(sunDirection));
    float terminator = smoothstep(-0.08, 0.22, lambert);
    vec3 color = mix(night, day, mix(1.0, terminator, nightMix));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createEarth(
  day: Texture,
  night: Texture,
): {
  group: Group;
  clouds: Mesh;
  earthMaterial: ShaderMaterial;
} {
  const group = new Group();
  const geometry = new SphereGeometry(EARTH_RADIUS, 96, 96);

  const earthMaterial = new ShaderMaterial({
    uniforms: {
      dayMap: { value: day },
      nightMap: { value: night },
      sunDirection: { value: [1.2, 0.25, 0.4] },
      nightMix: { value: 1 },
    },
    vertexShader: earthVertex,
    fragmentShader: earthFragment,
  });

  const earth = new Mesh(geometry, earthMaterial);
  group.add(earth);

  const clouds = new Mesh(
    new SphereGeometry(EARTH_RADIUS * 1.018, 64, 64),
    new MeshPhongMaterial({
      map: createCloudTexture(),
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
  group.add(clouds);

  const atmosphere = new Mesh(
    new SphereGeometry(EARTH_RADIUS * 1.12, 64, 64),
    new ShaderMaterial({
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true,
      depthWrite: false,
    }),
  );
  group.add(atmosphere);

  return { group, clouds, earthMaterial };
}

export function createStarfield(count = 4000): Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 700 + Math.random() * 900;
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  return new Points(
    geometry,
    new PointsMaterial({
      map: createStarTexture(),
      size: 4.5,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
}
