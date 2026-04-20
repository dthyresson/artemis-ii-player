// Scale: 1 scene unit = 1000 km
export const KM_PER_UNIT = 1000

// Physical radii in scene units
export const EARTH_RADIUS = 6371 / KM_PER_UNIT   // 6.371 units
export const MOON_RADIUS = 1737 / KM_PER_UNIT     // 1.737 units
export const SPACECRAFT_RADIUS = 0.8              // visual only — much larger than real

// Atmosphere glow radius
export const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.025

// Moon orbital parameters (for drawing full orbit ellipse)
export const MOON_SEMI_MAJOR_KM = 384_400
export const MOON_ECCENTRICITY = 0.0549

// Convert km to scene units
export function kmToUnits(km: number): number {
  return km / KM_PER_UNIT
}

// Convert state vector position (km) to Three.js scene coordinates
// JPL Horizons J2000 equatorial: X=vernal equinox, Y=90° east, Z=north pole
// Three.js: Y-up, so we map Z→Y, Y→-Z
export function toSceneCoords(x: number, y: number, z: number): [number, number, number] {
  return [x / KM_PER_UNIT, z / KM_PER_UNIT, -y / KM_PER_UNIT]
}

// NASA color palette
export const NASA_BLUE = 0x0B3D91
export const NASA_RED = 0xFC3D21

// Trajectory phase colors (hex numbers for Three.js)
export const PHASE_COLOR_HEX = {
  earth: 0x00BFFF,
  translunar: 0xFF8C00,
  flyby: 0xDA70D6,
  return: 0x00FF7F,
} as const

export const MOON_ORBIT_COLOR = 0xC0C0C0

// Sun direction for April 2026 (approximate ecliptic longitude ~11°)
// In J2000 equatorial frame, Sun is roughly in +X direction in April
export const SUN_DIRECTION = { x: 0.97, y: 0.0, z: 0.24 }
