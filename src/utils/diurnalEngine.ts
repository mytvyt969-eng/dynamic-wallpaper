export type DiurnalPhaseId =
  | 'midnight'
  | 'dawn'
  | 'morning'
  | 'afternoon'
  | 'dusk'
  | 'night';

export type BiomeId = 'alpine' | 'coastal' | 'kyoto' | 'metro';

export type WeatherId =
  | 'clear'
  | 'sunbeams'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'aurora'
  | 'mist';

export type MoonPhaseId = 'crescent' | 'quarter' | 'gibbous' | 'full';

export type PowerModeId = 'eco' | 'balanced' | 'smooth';

export type PrecipitationRegimeId =
  | 'none'
  | 'light_drizzle'
  | 'steady_shower'
  | 'heavy_downpour';

export interface WeatherVisualState {
  snowActive: boolean;
  snowflakeCount: number;
  crystalCount: number;
  snowFlutterAmplitude: number;
  snowWindDriftPx: number;
  frostHighlightOpacity: number;
  windActive: boolean;
  windStreakCount: number;
  windSpeedKmh: number;
  windRibbonLengthPx: number;
  windDebrisCount: number;
  mistActive: boolean;
  mistDensity: number;
  auroraActive: boolean;
  sunbeamsActive: boolean;
  rainActive: boolean;
  activeConditionLabels: string[];
  summaryLabel: string;
}

export interface PrecipitationState {
  active: boolean;
  adaptiveEnabled: boolean;
  temperatureCelsius: number;
  isAutoTemperature: boolean;
  regime: PrecipitationRegimeId;
  regimeLabel: string;
  densityRatio: number; // 0.0 to 1.0
  dropCount: number; // 0 to 120
  dropLength: number; // px
  dropSpeed: number; // normalized screen height per tick
  dropOpacity: number; // 0.0 to 1.0
  strokeWidth: number; // px
  windSlantPx: number; // horizontal slant in px
  splashRingCount: number; // active water surface impact rings
  rainfallRateMmPerHr: number; // quantitative mm/hr
}

export interface BatteryProfile {
  mode: PowerModeId;
  label: string;
  targetFps: number; // 0 means event-driven (1 redraw/min on clock tick)
  redrawStrategy: string;
  estimatedDrainPctPerHour: number;
  gpuWakeupsPerMin: number;
  oledPixelSavingsPct: number;
}

export interface DiurnalPhaseMetadata {
  id: DiurnalPhaseId;
  label: string;
  tagline: string;
  timeRange: string;
  presetMinutes: number;
  kelvin: number;
  ambientSummary: string;
}

export interface SkyPalette {
  zenith: string;
  midSky: string;
  horizon: string;
  groundTint: string;
  mountainFar: string;
  mountainMid: string;
  mountainNear: string;
  waterTop: string;
  waterBottom: string;
  cloudColor: string;
  cloudOpacity: number;
  sunColor: string;
  sunGlow: string;
}

export interface CelestialState {
  phase: DiurnalPhaseMetadata;
  minutes: number;
  formattedTime: string;
  formatted12h: string;
  isDaylight: boolean;
  isSunnyAfternoon: boolean;
  isGoldenHour: boolean;
  isNight: boolean;
  sunVisible: boolean;
  sunX: number; // 0.0 to 1.0 across screen
  sunY: number; // 0.0 (top) to 1.0 (horizon)
  sunAltitudeDeg: number;
  sunRayIntensity: number; // 0.0 to 1.0
  moonVisible: boolean;
  moonX: number;
  moonY: number;
  moonAltitudeDeg: number;
  starOpacity: number; // 0.0 to 1.0
  shootingStarChance: number; // 0.0 to 1.0
  birdActivity: number; // 0.0 to 1.0
  butterflyPollenActivity: number; // 0.0 to 1.0
  fireflyActivity: number; // 0.0 to 1.0
  windowGlow: number; // 0.0 to 1.0
  campfireIntensity: number; // 0.0 to 1.0
  lighthouseBeamOpacity: number; // 0.0 to 1.0
  mistOpacity: number; // 0.0 to 1.0
  kelvin: number;
  sunriseMinutes: number;
  sunsetMinutes: number;
  solarNoonMinutes: number;
  formattedSunrise: string;
  formattedSunset: string;
}

export interface LocationSolarProfile {
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
  sunriseMinutes: number;
  sunsetMinutes: number;
  solarNoonMinutes: number;
  dawnMinutes: number;
  duskMinutes: number;
  daylightDurationMinutes: number;
  source: 'geolocation' | 'city_preset' | 'timezone';
}

export interface MaterialYouPalette {
  clockText: string;
  widgetBg: string;
  widgetBorder: string;
  accentPrimary: string;
  accentSecondary: string;
  pillText: string;
}

export interface WallpaperConfig {
  minutes: number; // 0 to 1439
  biome: BiomeId;
  weather: WeatherId;
  moonPhase: MoonPhaseId;
  powerMode?: PowerModeId;
  oledDimming?: boolean;
  adaptivePrecipitation?: boolean;
  autoTemperature?: boolean;
  customTemperatureCelsius?: number; // 2 to 34 °C
  enableSnowflakes?: boolean;
  enableWindStreaks?: boolean;
  enableMistLayer?: boolean;
  enableAuroraLayer?: boolean;
  locationSolar?: LocationSolarProfile | null;
  autoAdaptElements: boolean;
  enableWildlife: boolean;
  enableCelestialRays: boolean;
  enableArtificialLights: boolean;
  enableTouchRipples: boolean;
  parallaxStrength: number; // 0 to 100
}

export const DIURNAL_PHASES: Record<DiurnalPhaseId, DiurnalPhaseMetadata> = {
  dawn: {
    id: 'dawn',
    label: 'Rosy Dawn',
    tagline: 'First light crests the horizon as valley mist lifts and night lights fade.',
    timeRange: '04:45 – 07:14',
    presetMinutes: 6 * 60, // 06:00
    kelvin: 3400,
    ambientSummary: 'Rising sun · Low valley mist · Early songbirds · Fading cabin lamps',
  },
  morning: {
    id: 'morning',
    label: 'Bright Morning',
    tagline: 'Crisp azure daylight illuminates the landscape with clear visibility.',
    timeRange: '07:15 – 11:29',
    presetMinutes: 9 * 60 + 30, // 09:30
    kelvin: 5400,
    ambientSummary: 'Bright sky · Soaring bird flocks · Crisp water reflections · Gentle breeze',
  },
  afternoon: {
    id: 'afternoon',
    label: 'Sunny Afternoon',
    tagline: 'High-altitude zenith sun casts warm golden rays, shimmering water, and floating pollen.',
    timeRange: '11:30 – 16:44',
    presetMinutes: 14 * 60 + 30, // 14:30
    kelvin: 6500,
    ambientSummary: 'Radiant solar corona · Sunbeams · Drifting pollen & butterflies · Sailboats',
  },
  dusk: {
    id: 'dusk',
    label: 'Golden Dusk',
    tagline: 'Amber and crimson twilight settles in as lanterns, beacons, and cabin windows ignite.',
    timeRange: '16:45 – 19:44',
    presetMinutes: 18 * 60 + 15, // 18:15
    kelvin: 2800,
    ambientSummary: 'Crimson horizon · Roosting birds · Warm cabin & city lights · Campfire ignition',
  },
  night: {
    id: 'night',
    label: 'Starry Night',
    tagline: 'Deep nocturnal canopy filled with twinkling constellations, moonlight, and fireflies.',
    timeRange: '19:45 – 23:59',
    presetMinutes: 22 * 60, // 22:00
    kelvin: 2200,
    ambientSummary: 'Luminous moon · 180+ twinkling stars · Glowing fireflies · Campfire embers',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight Stillness',
    tagline: 'Deepest astronomical night with meteor streaks, bioluminescent waters, and aurora ribbons.',
    timeRange: '00:00 – 04:44',
    presetMinutes: 1 * 60 + 30, // 01:30
    kelvin: 2000,
    ambientSummary: 'Deep cosmos · Shooting stars · Bioluminescent shore · Nocturnal serenity',
  },
};

export const BIOME_CATALOG: Array<{
  id: BiomeId;
  name: string;
  subtitle: string;
  dayFeatures: string;
  nightFeatures: string;
}> = [
  {
    id: 'alpine',
    name: 'Alpine Valley',
    subtitle: 'Glacial lake, layered pine ridges, and lakeside timber cabin',
    dayFeatures: 'Soaring eagles, chimney wisp, sunlit turquoise lake, floating pollen',
    nightFeatures: 'Warm cabin windows, crackling lakeside campfire, fireflies, starry mirror lake',
  },
  {
    id: 'coastal',
    name: 'Coastal Beacon',
    subtitle: 'Headland cliff lighthouse overlooking open ocean swells',
    dayFeatures: 'Gliding gulls, whitecap waves, drifting sailboats, dazzling solar sea sparkle',
    nightFeatures: 'Sweeping lighthouse beam, bioluminescent shoreline tide, lunar ocean path',
  },
  {
    id: 'kyoto',
    name: 'Kyoto Sanctuary',
    subtitle: 'Misty mountain shrine with vermilion Torii gate and cherry blossoms',
    dayFeatures: 'Drifting sakura petals, sunlit Torii reflection, mountain swallows',
    nightFeatures: 'Glowing stone Toro lanterns, floating river lanterns, emerald fireflies',
  },
  {
    id: 'metro',
    name: 'Solarpunk Skyline',
    subtitle: 'Terraced architectural towers, sky-bridges, and waterfront transit',
    dayFeatures: 'Solar glass glints, elevated monorail, rooftop gardens, sunlit haze',
    nightFeatures: 'Hundreds of dynamic apartment windows, aircraft warning beacons, neon reflections',
  },
];

export function clampMinutes(minutes: number): number {
  const mod = Math.round(minutes) % 1440;
  return mod < 0 ? mod + 1440 : mod;
}

export function formatMinutes24h(minutes: number): string {
  const m = clampMinutes(minutes);
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatMinutes12h(minutes: number): { time: string; period: 'AM' | 'PM' } {
  const m = clampMinutes(minutes);
  const hrs24 = Math.floor(m / 60);
  const mins = m % 60;
  const period: 'AM' | 'PM' = hrs24 >= 12 ? 'PM' : 'AM';
  const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
  return {
    time: `${hrs12}:${String(mins).padStart(2, '0')}`,
    period,
  };
}

export interface CitySolarPreset {
  id: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  tzOffsetHours: number;
}

export const CITY_SOLAR_PRESETS: CitySolarPreset[] = [
  {
    id: 'sf',
    city: 'San Francisco',
    region: 'California, US',
    latitude: 37.7749,
    longitude: -122.4194,
    tzOffsetHours: -8,
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    region: 'Kanto, JP',
    latitude: 35.6762,
    longitude: 139.6503,
    tzOffsetHours: 9,
  },
  {
    id: 'reykjavik',
    city: 'Reykjavik',
    region: 'Capital Region, IS',
    latitude: 64.1466,
    longitude: -21.9426,
    tzOffsetHours: 0,
  },
  {
    id: 'singapore',
    city: 'Singapore',
    region: 'Equatorial Strait, SG',
    latitude: 1.3521,
    longitude: 103.8198,
    tzOffsetHours: 8,
  },
  {
    id: 'sydney',
    city: 'Sydney',
    region: 'New South Wales, AU',
    latitude: -33.8688,
    longitude: 151.2093,
    tzOffsetHours: 11,
  },
];

/**
 * Computes NOAA astronomical sunrise, sunset, solar noon, civil dawn, and civil dusk
 * in local minutes (0..1439) for any latitude, longitude, and date.
 */
export function computeAstronomicalSunTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  tzOffsetHours?: number
): {
  sunriseMinutes: number;
  sunsetMinutes: number;
  solarNoonMinutes: number;
  dawnMinutes: number;
  duskMinutes: number;
  daylightDurationMinutes: number;
} {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear =
    Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;

  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Fractional year gamma in radians
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);

  // Equation of time (in minutes)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination angle (in radians)
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const clampedLat = Math.max(-65, Math.min(65, latitude));
  const latRad = clampedLat * rad;
  const zenithRad = 90.833 * rad; // standard atmospheric refraction zenith

  const cosHourAngle =
    (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));

  const safeCos = Math.max(-0.98, Math.min(0.98, cosHourAngle));
  const hourAngleDeg = Math.acos(safeCos) * deg;

  // Local timezone offset in hours (positive East of UTC, negative West)
  const browserTzHours = -date.getTimezoneOffset() / 60;
  const solarMeridianTzHours = Math.round(longitude / 15);
  const effectiveTzHours =
    typeof tzOffsetHours === 'number'
      ? tzOffsetHours
      : Math.abs(browserTzHours - solarMeridianTzHours) <= 2
      ? browserTzHours
      : solarMeridianTzHours;

  const solarNoonUtcMin = 720 - 4 * longitude - eqTime;
  const solarNoonLocal = Math.round(solarNoonUtcMin + effectiveTzHours * 60);
  const halfDayMin = Math.round(hourAngleDeg * 4);

  const sunriseMinutes = Math.max(120, Math.min(600, solarNoonLocal - halfDayMin));
  const sunsetMinutes = Math.max(840, Math.min(1340, solarNoonLocal + halfDayMin));
  const solarNoonMinutes = Math.round((sunriseMinutes + sunsetMinutes) / 2);
  const dawnMinutes = Math.max(0, sunriseMinutes - 30);
  const duskMinutes = Math.min(1439, sunsetMinutes + 30);
  const daylightDurationMinutes = Math.max(60, sunsetMinutes - sunriseMinutes);

  return {
    sunriseMinutes,
    sunsetMinutes,
    solarNoonMinutes,
    dawnMinutes,
    duskMinutes,
    daylightDurationMinutes,
  };
}

const WORLD_GAZETTEER: Array<{
  city: string;
  region: string;
  lat: number;
  lon: number;
  tz: number;
}> = [
  { city: 'San Francisco', region: 'California, US', lat: 37.7749, lon: -122.4194, tz: -8 },
  { city: 'Los Angeles', region: 'California, US', lat: 34.0522, lon: -118.2437, tz: -8 },
  { city: 'Seattle', region: 'Washington, US', lat: 47.6062, lon: -122.3321, tz: -8 },
  { city: 'New York', region: 'New York, US', lat: 40.7128, lon: -74.006, tz: -5 },
  { city: 'Chicago', region: 'Illinois, US', lat: 41.8781, lon: -87.6298, tz: -6 },
  { city: 'London', region: 'United Kingdom', lat: 51.5074, lon: -0.1278, tz: 0 },
  { city: 'Paris', region: 'France', lat: 48.8566, lon: 2.3522, tz: 1 },
  { city: 'Berlin', region: 'Germany', lat: 52.52, lon: 13.405, tz: 1 },
  { city: 'Reykjavik', region: 'Capital Region, IS', lat: 64.1466, lon: -21.9426, tz: 0 },
  { city: 'Tokyo', region: 'Kanto, JP', lat: 35.6762, lon: 139.6503, tz: 9 },
  { city: 'Seoul', region: 'South Korea', lat: 37.5665, lon: 126.978, tz: 9 },
  { city: 'Singapore', region: 'Equatorial Strait, SG', lat: 1.3521, lon: 103.8198, tz: 8 },
  { city: 'Mumbai', region: 'Maharashtra, IN', lat: 19.076, lon: 72.8777, tz: 5.5 },
  { city: 'Dubai', region: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, tz: 4 },
  { city: 'Sydney', region: 'New South Wales, AU', lat: -33.8688, lon: 151.2093, tz: 11 },
];

export function resolveNearestCityFromGazetteer(
  latitude: number,
  longitude: number
): { city: string; region: string; tzOffsetHours: number } | null {
  let best: (typeof WORLD_GAZETTEER)[0] | null = null;
  let bestDist = Infinity;
  for (const entry of WORLD_GAZETTEER) {
    const dLat = entry.lat - latitude;
    const dLon = entry.lon - longitude;
    const dist = Math.hypot(dLat, dLon);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  if (best && bestDist <= 3.5) {
    return { city: best.city, region: best.region, tzOffsetHours: best.tz };
  }
  return null;
}

/**
 * Creates a complete LocationSolarProfile for a given latitude/longitude and city name.
 */
export function buildLocationSolarProfile(
  params: {
    city: string;
    region?: string;
    latitude: number;
    longitude: number;
    source: 'geolocation' | 'city_preset' | 'timezone';
    tzOffsetHours?: number;
    sunriseMinutesOverride?: number;
    sunsetMinutesOverride?: number;
  },
  date: Date = new Date()
): LocationSolarProfile {
  const nearest = resolveNearestCityFromGazetteer(params.latitude, params.longitude);
  const resolvedCity =
    params.city === 'Current Location' && nearest ? nearest.city : params.city;
  const resolvedRegion =
    !params.region || params.region.includes('°')
      ? nearest?.region || params.region
      : params.region;
  const effectiveTz =
    typeof params.tzOffsetHours === 'number'
      ? params.tzOffsetHours
      : nearest?.tzOffsetHours;

  const astro = computeAstronomicalSunTimes(
    params.latitude,
    params.longitude,
    date,
    effectiveTz
  );
  const sunriseMinutes =
    typeof params.sunriseMinutesOverride === 'number'
      ? params.sunriseMinutesOverride
      : astro.sunriseMinutes;
  const sunsetMinutes =
    typeof params.sunsetMinutesOverride === 'number'
      ? params.sunsetMinutesOverride
      : astro.sunsetMinutes;
  const solarNoonMinutes = Math.round((sunriseMinutes + sunsetMinutes) / 2);
  const dawnMinutes = Math.max(0, sunriseMinutes - 30);
  const duskMinutes = Math.min(1439, sunsetMinutes + 30);
  const daylightDurationMinutes = Math.max(60, sunsetMinutes - sunriseMinutes);

  return {
    city: resolvedCity,
    region: resolvedRegion,
    latitude: Number(params.latitude.toFixed(4)),
    longitude: Number(params.longitude.toFixed(4)),
    sunriseMinutes,
    sunsetMinutes,
    solarNoonMinutes,
    dawnMinutes,
    duskMinutes,
    daylightDurationMinutes,
    source: params.source,
  };
}

/**
 * Fetches official sunrise/sunset times from api.sunrise-sunset.org and resolves
 * the user's current city, with automatic NOAA astronomical fallback.
 */
export async function fetchLocationSolarProfileFromCoords(
  latitude: number,
  longitude: number,
  source: 'geolocation' | 'city_preset' | 'timezone' = 'geolocation',
  fallbackCity?: string,
  fallbackRegion?: string
): Promise<LocationSolarProfile> {
  const nearest = resolveNearestCityFromGazetteer(latitude, longitude);
  const city = fallbackCity || nearest?.city || 'Local Coordinates';
  const region =
    fallbackRegion ||
    nearest?.region ||
    `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
  const tzOffsetHours = nearest?.tzOffsetHours ?? Math.round(longitude / 15);

  let sunriseMinutesOverride: number | undefined;
  let sunsetMinutesOverride: number | undefined;

  try {
    const sunResponse = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${encodeURIComponent(
        latitude
      )}&lng=${encodeURIComponent(longitude)}&formatted=0`
    );
    if (sunResponse.ok) {
      const sunData = await sunResponse.json();
      if (sunData && sunData.status === 'OK' && sunData.results) {
        const { sunrise, sunset } = sunData.results;
        const srDate = new Date(sunrise);
        const ssDate = new Date(sunset);
        if (!Number.isNaN(srDate.getTime()) && !Number.isNaN(ssDate.getTime())) {
          const srUtcMin = srDate.getUTCHours() * 60 + srDate.getUTCMinutes();
          const ssUtcMin = ssDate.getUTCHours() * 60 + ssDate.getUTCMinutes();
          const srLocalMin = Math.round(
            (srUtcMin + tzOffsetHours * 60 + 1440) % 1440
          );
          const ssLocalMin = Math.round(
            (ssUtcMin + tzOffsetHours * 60 + 1440) % 1440
          );
          if (
            srLocalMin >= 120 &&
            srLocalMin <= 660 &&
            ssLocalMin >= 840 &&
            ssLocalMin <= 1380 &&
            srLocalMin < ssLocalMin
          ) {
            sunriseMinutesOverride = srLocalMin;
            sunsetMinutesOverride = ssLocalMin;
          }
        }
      }
    }
  } catch {
    // Use NOAA astronomical calculation when offline
  }

  return buildLocationSolarProfile({
    city,
    region,
    latitude,
    longitude,
    source,
    tzOffsetHours,
    sunriseMinutesOverride,
    sunsetMinutesOverride,
  });
}

/**
 * Piecewise solar-time remapping:
 * Maps the user's local clock minutes (0..1439) to canonical diurnal engine minutes (0..1439)
 * so that:
 * - Local Sunrise -> 315 (05:15 canonical horizon sunrise)
 * - Local Solar Noon -> 742.5 (12:22 canonical solar zenith)
 * - Local Sunset -> 1170 (19:30 canonical horizon sunset)
 */
export function mapLocalTimeToCanonicalSolarMinutes(
  minutes: number,
  locationSolar?: LocationSolarProfile | null
): number {
  const m = clampMinutes(minutes);
  if (!locationSolar) return m;

  const sr = Math.max(90, Math.min(660, locationSolar.sunriseMinutes));
  const ss = Math.max(sr + 120, Math.min(1380, locationSolar.sunsetMinutes));
  const noon = (sr + ss) / 2;

  const CANONICAL_SUNRISE = 315;
  const CANONICAL_NOON = 742.5;
  const CANONICAL_SUNSET = 1170;

  if (m <= sr) {
    return (m / Math.max(1, sr)) * CANONICAL_SUNRISE;
  }
  if (m <= noon) {
    const t = (m - sr) / Math.max(1, noon - sr);
    return CANONICAL_SUNRISE + t * (CANONICAL_NOON - CANONICAL_SUNRISE);
  }
  if (m <= ss) {
    const t = (m - noon) / Math.max(1, ss - noon);
    return CANONICAL_NOON + t * (CANONICAL_SUNSET - CANONICAL_NOON);
  }
  const t = (m - ss) / Math.max(1, 1440 - ss);
  return CANONICAL_SUNSET + t * (1440 - CANONICAL_SUNSET);
}

export function getDiurnalPhase(
  minutes: number,
  locationSolar?: LocationSolarProfile | null
): DiurnalPhaseMetadata {
  const m = clampMinutes(mapLocalTimeToCanonicalSolarMinutes(minutes, locationSolar));
  if (m >= 285 && m < 435) return DIURNAL_PHASES.dawn; // 04:45 - 07:14
  if (m >= 435 && m < 690) return DIURNAL_PHASES.morning; // 07:15 - 11:29
  if (m >= 690 && m < 1005) return DIURNAL_PHASES.afternoon; // 11:30 - 16:44
  if (m >= 1005 && m < 1185) return DIURNAL_PHASES.dusk; // 16:45 - 19:44
  if (m >= 1185) return DIURNAL_PHASES.night; // 19:45 - 23:59
  return DIURNAL_PHASES.midnight; // 00:00 - 04:44
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function interpolateHex(colorA: string, colorB: string, t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  return rgbToHex(
    r1 + (r2 - r1) * clampedT,
    g1 + (g2 - g1) * clampedT,
    b1 + (b2 - b1) * clampedT
  );
}

function lerp(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return a + (b - a) * clamped;
}

interface PaletteKeyframe {
  minute: number;
  palette: SkyPalette;
}

const KEYFRAMES: PaletteKeyframe[] = [
  // 00:00 Midnight
  {
    minute: 0,
    palette: {
      zenith: '#040716',
      midSky: '#0b132b',
      horizon: '#17254a',
      groundTint: '#050811',
      mountainFar: '#111b36',
      mountainMid: '#0b1226',
      mountainNear: '#060a17',
      waterTop: '#0e1938',
      waterBottom: '#040712',
      cloudColor: '#1e293b',
      cloudOpacity: 0.22,
      sunColor: '#fde68a',
      sunGlow: '#f59e0b',
    },
  },
  // 04:30 Pre-Dawn
  {
    minute: 270,
    palette: {
      zenith: '#090d24',
      midSky: '#1b1f47',
      horizon: '#4a2c56',
      groundTint: '#090c1a',
      mountainFar: '#242048',
      mountainMid: '#161633',
      mountainNear: '#0b0d1f',
      waterTop: '#2c2246',
      waterBottom: '#090d20',
      cloudColor: '#6b4c7b',
      cloudOpacity: 0.35,
      sunColor: '#fb7185',
      sunGlow: '#f43f5e',
    },
  },
  // 06:00 Rosy Dawn
  {
    minute: 360,
    palette: {
      zenith: '#1e3a6d',
      midSky: '#7c5285',
      horizon: '#f59e6c',
      groundTint: '#1b1e36',
      mountainFar: '#58436e',
      mountainMid: '#372c52',
      mountainNear: '#1e1b33',
      waterTop: '#c4756f',
      waterBottom: '#23274a',
      cloudColor: '#fed7aa',
      cloudOpacity: 0.65,
      sunColor: '#fff1f2',
      sunGlow: '#fb923c',
    },
  },
  // 08:30 Bright Morning
  {
    minute: 510,
    palette: {
      zenith: '#0284c7',
      midSky: '#38bdf8',
      horizon: '#bae6fd',
      groundTint: '#0f2942',
      mountainFar: '#4b7ea8',
      mountainMid: '#2d5a7b',
      mountainNear: '#173852',
      waterTop: '#38bdf8',
      waterBottom: '#0369a1',
      cloudColor: '#ffffff',
      cloudOpacity: 0.85,
      sunColor: '#fef9c3',
      sunGlow: '#fde047',
    },
  },
  // 13:30 Sunny Afternoon (Peak Bright & Warm Sun)
  {
    minute: 810,
    palette: {
      zenith: '#0369a1',
      midSky: '#0ea5e9',
      horizon: '#fef08a',
      groundTint: '#133447',
      mountainFar: '#3b7a9e',
      mountainMid: '#215775',
      mountainNear: '#11364c',
      waterTop: '#22d3ee',
      waterBottom: '#0284c7',
      cloudColor: '#fffbeb',
      cloudOpacity: 0.92,
      sunColor: '#ffffff',
      sunGlow: '#facc15',
    },
  },
  // 16:00 Late Sunny Afternoon
  {
    minute: 960,
    palette: {
      zenith: '#075985',
      midSky: '#38bdf8',
      horizon: '#fde68a',
      groundTint: '#1b2e3d',
      mountainFar: '#4c738f',
      mountainMid: '#2d4e68',
      mountainNear: '#182f42',
      waterTop: '#38bdf8',
      waterBottom: '#0369a1',
      cloudColor: '#fef3c7',
      cloudOpacity: 0.88,
      sunColor: '#fef08a',
      sunGlow: '#f59e0b',
    },
  },
  // 18:15 Golden Sunset / Dusk
  {
    minute: 1095,
    palette: {
      zenith: '#1e1b4b',
      midSky: '#9d174d',
      horizon: '#f97316',
      groundTint: '#1a1126',
      mountainFar: '#581c4a',
      mountainMid: '#361336',
      mountainNear: '#1b0b21',
      waterTop: '#ea580c',
      waterBottom: '#31103f',
      cloudColor: '#fdba74',
      cloudOpacity: 0.75,
      sunColor: '#ffedd5',
      sunGlow: '#ea580c',
    },
  },
  // 20:00 Early Night / Blue Hour End
  {
    minute: 1200,
    palette: {
      zenith: '#070b1e',
      midSky: '#111c3d',
      horizon: '#23315c',
      groundTint: '#070b17',
      mountainFar: '#182447',
      mountainMid: '#0f1730',
      mountainNear: '#080d1c',
      waterTop: '#17254e',
      waterBottom: '#060a18',
      cloudColor: '#334155',
      cloudOpacity: 0.3,
      sunColor: '#fde68a',
      sunGlow: '#f59e0b',
    },
  },
  // 24:00 Wrap to Midnight
  {
    minute: 1440,
    palette: {
      zenith: '#040716',
      midSky: '#0b132b',
      horizon: '#17254a',
      groundTint: '#050811',
      mountainFar: '#111b36',
      mountainMid: '#0b1226',
      mountainNear: '#060a17',
      waterTop: '#0e1938',
      waterBottom: '#040712',
      cloudColor: '#1e293b',
      cloudOpacity: 0.22,
      sunColor: '#fde68a',
      sunGlow: '#f59e0b',
    },
  },
];

export function getSkyPalette(
  minutes: number,
  biome: BiomeId = 'alpine',
  weather: WeatherId = 'clear',
  oledDimming: boolean = false,
  locationSolar?: LocationSolarProfile | null
): SkyPalette {
  const m = clampMinutes(mapLocalTimeToCanonicalSolarMinutes(minutes, locationSolar));
  let prev = KEYFRAMES[0];
  let next = KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (m >= KEYFRAMES[i].minute && m <= KEYFRAMES[i + 1].minute) {
      prev = KEYFRAMES[i];
      next = KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(1, next.minute - prev.minute);
  const t = (m - prev.minute) / span;

  let zenith = interpolateHex(prev.palette.zenith, next.palette.zenith, t);
  let midSky = interpolateHex(prev.palette.midSky, next.palette.midSky, t);
  let horizon = interpolateHex(prev.palette.horizon, next.palette.horizon, t);
  let groundTint = interpolateHex(prev.palette.groundTint, next.palette.groundTint, t);
  let mountainFar = interpolateHex(prev.palette.mountainFar, next.palette.mountainFar, t);
  let mountainMid = interpolateHex(prev.palette.mountainMid, next.palette.mountainMid, t);
  let mountainNear = interpolateHex(prev.palette.mountainNear, next.palette.mountainNear, t);
  let waterTop = interpolateHex(prev.palette.waterTop, next.palette.waterTop, t);
  let waterBottom = interpolateHex(prev.palette.waterBottom, next.palette.waterBottom, t);
  const cloudColor = interpolateHex(prev.palette.cloudColor, next.palette.cloudColor, t);
  const cloudOpacity = lerp(prev.palette.cloudOpacity, next.palette.cloudOpacity, t);
  const sunColor = interpolateHex(prev.palette.sunColor, next.palette.sunColor, t);
  const sunGlow = interpolateHex(prev.palette.sunGlow, next.palette.sunGlow, t);

  // Subtle biome tinting
  if (biome === 'kyoto') {
    horizon = interpolateHex(horizon, '#fda4af', 0.14);
    mountainFar = interpolateHex(mountainFar, '#4c1d95', 0.12);
  } else if (biome === 'coastal') {
    waterTop = interpolateHex(waterTop, '#06b6d4', 0.18);
  } else if (biome === 'metro') {
    mountainFar = interpolateHex(mountainFar, '#1e293b', 0.25);
    mountainMid = interpolateHex(mountainMid, '#0f172a', 0.25);
    mountainNear = interpolateHex(mountainNear, '#020617', 0.3);
  }

  // Weather modifiers
  if (weather === 'rain') {
    zenith = interpolateHex(zenith, '#334155', 0.45);
    midSky = interpolateHex(midSky, '#475569', 0.5);
    horizon = interpolateHex(horizon, '#64748b', 0.45);
  } else if (weather === 'snow') {
    zenith = interpolateHex(zenith, '#1e293b', 0.35);
    midSky = interpolateHex(midSky, '#64748b', 0.42);
    horizon = interpolateHex(horizon, '#cbd5e1', 0.48);
    mountainFar = interpolateHex(mountainFar, '#94a3b8', 0.35);
    mountainMid = interpolateHex(mountainMid, '#64748b', 0.28);
  } else if (weather === 'wind') {
    midSky = interpolateHex(midSky, '#38bdf8', 0.16);
    horizon = interpolateHex(horizon, '#bae6fd', 0.24);
  } else if (weather === 'mist') {
    horizon = interpolateHex(horizon, '#e2e8f0', 0.35);
  }

  // True-Black OLED Night Dimming to turn off subpixels at night & dusk
  const isNocturnal = m < 315 || m > 1155;
  if (oledDimming && isNocturnal) {
    zenith = '#000000';
    midSky = interpolateHex(midSky, '#000000', 0.65);
    mountainNear = '#000000';
    groundTint = '#000000';
    waterBottom = '#000000';
  }

  return {
    zenith,
    midSky,
    horizon,
    groundTint,
    mountainFar,
    mountainMid,
    mountainNear,
    waterTop,
    waterBottom,
    cloudColor,
    cloudOpacity,
    sunColor,
    sunGlow,
  };
}

export function getCelestialState(
  minutes: number,
  locationSolar?: LocationSolarProfile | null
): CelestialState {
  const clockM = clampMinutes(minutes);
  const m = clampMinutes(mapLocalTimeToCanonicalSolarMinutes(clockM, locationSolar));
  const phase = getDiurnalPhase(clockM, locationSolar);
  const formattedTime = formatMinutes24h(clockM);
  const { time, period } = formatMinutes12h(clockM);

  const actualSunriseMin = locationSolar ? locationSolar.sunriseMinutes : 315;
  const actualSunsetMin = locationSolar ? locationSolar.sunsetMinutes : 1170;
  const actualSolarNoonMin = locationSolar
    ? locationSolar.solarNoonMinutes
    : Math.round((actualSunriseMin + actualSunsetMin) / 2);

  // Sun rises at canonical 05:15 (315m), peaks at 12:22 (742.5m), sets at 19:30 (1170m)
  const sunriseMin = 315;
  const sunsetMin = 1170;
  const sunVisible = m >= sunriseMin && m <= sunsetMin;
  let sunX = 0.5;
  let sunY = 1.1;
  let sunAltitudeDeg = -15;

  if (sunVisible) {
    const sunProgress = (m - sunriseMin) / (sunsetMin - sunriseMin); // 0 to 1
    sunX = 0.12 + sunProgress * 0.76;
    const arc = Math.sin(sunProgress * Math.PI); // 0 at horizon, 1 at zenith
    sunY = 0.62 - arc * 0.46; // 0.62 at horizon, 0.16 at peak zenith
    sunAltitudeDeg = Math.round(arc * 78);
  }

  // Moon rises at 18:30 (1110m), wraps past midnight, sets at 06:15 (375m)
  const moonDuration = 1440 - 1110 + 375; // 705 minutes
  let moonElapsed = -1;
  if (m >= 1110) {
    moonElapsed = m - 1110;
  } else if (m <= 375) {
    moonElapsed = 1440 - 1110 + m;
  }
  const moonVisible = moonElapsed >= 0 && moonElapsed <= moonDuration;
  let moonX = 0.5;
  let moonY = 1.1;
  let moonAltitudeDeg = -15;

  if (moonVisible) {
    const moonProgress = moonElapsed / moonDuration;
    moonX = 0.15 + moonProgress * 0.7;
    const moonArc = Math.sin(moonProgress * Math.PI);
    moonY = 0.58 - moonArc * 0.4;
    moonAltitudeDeg = Math.round(moonArc * 68);
  }

  const isDaylight = m >= 420 && m < 1050;
  const isSunnyAfternoon = m >= 690 && m < 1005;
  const isGoldenHour = (m >= 315 && m < 435) || (m >= 1005 && m <= 1170);
  const isNight = m < 315 || m > 1170;

  // Star opacity: 1.0 deep night, fades out during dawn (285..390), fades in during dusk (1110..1215)
  let starOpacity = 0;
  if (m < 285 || m >= 1215) {
    starOpacity = 1;
  } else if (m >= 285 && m < 390) {
    starOpacity = 1 - (m - 285) / 105;
  } else if (m >= 1110 && m < 1215) {
    starOpacity = (m - 1110) / 105;
  }

  // Sun ray intensity peaks in sunny afternoon (11:30 - 16:30)
  let sunRayIntensity = 0;
  if (sunVisible) {
    if (m >= 690 && m <= 990) {
      sunRayIntensity = 1.0;
    } else if (m >= 480 && m < 690) {
      sunRayIntensity = 0.35 + ((m - 480) / 210) * 0.65;
    } else if (m > 990 && m <= 1140) {
      sunRayIntensity = Math.max(0.2, 1 - (m - 990) / 150);
    } else {
      sunRayIntensity = 0.25;
    }
  }

  // Bird activity: high in morning & dusk, moderate in afternoon, 0 at night
  let birdActivity = 0;
  if (m >= 345 && m <= 1140) {
    if (m >= 420 && m <= 660) birdActivity = 0.9;
    else if (m > 660 && m < 990) birdActivity = 0.65;
    else if (m >= 990 && m <= 1120) birdActivity = 1.0;
    else birdActivity = 0.4;
  }

  // Butterfly & floating pollen activity: peaks during bright morning & sunny afternoon
  let butterflyPollenActivity = 0;
  if (m >= 480 && m <= 1050) {
    butterflyPollenActivity = m >= 690 && m <= 990 ? 1.0 : 0.6;
  }

  // Firefly activity: active from dusk into night (18:30 to 04:30)
  const fireflyActivity = starOpacity > 0.3 ? Math.min(1, starOpacity * 1.1) : 0;

  // Artificial lights (cabin windows, city apartments, stone lanterns, lighthouse)
  let windowGlow = 0;
  if (m >= 1050 || m <= 375) {
    if (m >= 1050 && m < 1140) {
      windowGlow = (m - 1050) / 90;
    } else if (m > 315 && m <= 375) {
      windowGlow = 1 - (m - 315) / 60;
    } else {
      windowGlow = 1;
    }
  }

  const campfireIntensity = windowGlow;
  const lighthouseBeamOpacity = windowGlow;
  const shootingStarChance = isNight ? 0.85 : 0;

  // Morning / Dusk natural valley mist
  let mistOpacity = 0.1;
  if (m >= 285 && m <= 480) {
    mistOpacity = 0.65 * Math.sin(((m - 285) / 195) * Math.PI);
  } else if (m >= 1050 && m <= 1200) {
    mistOpacity = 0.35 * Math.sin(((m - 1050) / 150) * Math.PI);
  }

  return {
    phase,
    minutes: clockM,
    formattedTime,
    formatted12h: `${time} ${period}`,
    isDaylight,
    isSunnyAfternoon,
    isGoldenHour,
    isNight,
    sunVisible,
    sunX,
    sunY,
    sunAltitudeDeg,
    sunRayIntensity,
    moonVisible,
    moonX,
    moonY,
    moonAltitudeDeg,
    starOpacity: Number(starOpacity.toFixed(2)),
    shootingStarChance,
    birdActivity: Number(birdActivity.toFixed(2)),
    butterflyPollenActivity: Number(butterflyPollenActivity.toFixed(2)),
    fireflyActivity: Number(fireflyActivity.toFixed(2)),
    windowGlow: Number(windowGlow.toFixed(2)),
    campfireIntensity: Number(campfireIntensity.toFixed(2)),
    lighthouseBeamOpacity: Number(lighthouseBeamOpacity.toFixed(2)),
    mistOpacity: Number(mistOpacity.toFixed(2)),
    kelvin: phase.kelvin,
    sunriseMinutes: actualSunriseMin,
    sunsetMinutes: actualSunsetMin,
    solarNoonMinutes: actualSolarNoonMin,
    formattedSunrise: formatMinutes24h(actualSunriseMin),
    formattedSunset: formatMinutes24h(actualSunsetMin),
  };
}

export function getMaterialYouTokens(
  minutes: number,
  biome: BiomeId,
  locationSolar?: LocationSolarProfile | null
): MaterialYouPalette {
  const phase = getDiurnalPhase(minutes, locationSolar);
  switch (phase.id) {
    case 'dawn':
      return {
        clockText: '#ffe4e6',
        widgetBg: 'rgba(49, 16, 47, 0.55)',
        widgetBorder: 'rgba(251, 146, 60, 0.35)',
        accentPrimary: '#fb923c',
        accentSecondary: '#f43f5e',
        pillText: '#fed7aa',
      };
    case 'morning':
      return {
        clockText: '#f0f9ff',
        widgetBg: 'rgba(12, 74, 110, 0.45)',
        widgetBorder: 'rgba(186, 230, 253, 0.4)',
        accentPrimary: '#38bdf8',
        accentSecondary: '#0284c7',
        pillText: '#e0f2fe',
      };
    case 'afternoon':
      return {
        clockText: '#fefce8',
        widgetBg: 'rgba(7, 89, 133, 0.48)',
        widgetBorder: 'rgba(254, 240, 138, 0.45)',
        accentPrimary: '#facc15',
        accentSecondary: '#0ea5e9',
        pillText: '#fef08a',
      };
    case 'dusk':
      return {
        clockText: '#ffedd5',
        widgetBg: 'rgba(59, 7, 100, 0.55)',
        widgetBorder: 'rgba(249, 115, 22, 0.4)',
        accentPrimary: '#f97316',
        accentSecondary: '#ec4899',
        pillText: '#fed7aa',
      };
    case 'night':
    case 'midnight':
    default:
      return {
        clockText: biome === 'kyoto' ? '#fce7f3' : '#e0f2fe',
        widgetBg: 'rgba(15, 23, 42, 0.65)',
        widgetBorder: 'rgba(148, 163, 184, 0.28)',
        accentPrimary: '#818cf8',
        accentSecondary: '#38bdf8',
        pillText: '#cbd5e1',
      };
  }
}

export function getBatteryProfile(config: WallpaperConfig): BatteryProfile {
  const mode: PowerModeId = config.powerMode || 'eco';
  const cel = getCelestialState(config.minutes, config.locationSolar);
  const oledActive = Boolean(config.oledDimming);

  const baseOledSavings = cel.isNight ? (oledActive ? 68 : 34) : cel.isGoldenHour ? (oledActive ? 32 : 16) : 8;

  if (mode === 'eco') {
    return {
      mode: 'eco',
      label: 'Eco Static (Zero Loop)',
      targetFps: 0,
      redrawStrategy: 'On-Demand Clock Tick (1 redraw / min)',
      estimatedDrainPctPerHour: oledActive && cel.isNight ? 0.1 : 0.2,
      gpuWakeupsPerMin: 1,
      oledPixelSavingsPct: baseOledSavings,
    };
  }

  if (mode === 'balanced') {
    let drain = 0.8;
    if (config.enableWildlife) drain += 0.15;
    if (config.enableCelestialRays) drain += 0.15;
    if (oledActive && cel.isNight) drain -= 0.2;
    return {
      mode: 'balanced',
      label: 'Balanced Low-FPS (15 FPS)',
      targetFps: 15,
      redrawStrategy: 'Throttled 66ms Interval (Pauses on Screen Off)',
      estimatedDrainPctPerHour: Number(Math.max(0.4, drain).toFixed(1)),
      gpuWakeupsPerMin: 900,
      oledPixelSavingsPct: baseOledSavings,
    };
  }

  let smoothDrain = 2.8;
  if (config.enableWildlife) smoothDrain += 0.4;
  if (config.enableCelestialRays) smoothDrain += 0.3;
  if (config.parallaxStrength > 0) smoothDrain += 0.2;
  return {
    mode: 'smooth',
    label: 'Showcase 60 FPS',
    targetFps: 60,
    redrawStrategy: 'Continuous 16ms VSync Loop',
    estimatedDrainPctPerHour: Number(smoothDrain.toFixed(1)),
    gpuWakeupsPerMin: 3600,
    oledPixelSavingsPct: baseOledSavings,
  };
}

export function getAmbientTemperatureCelsius(config: WallpaperConfig): number {
  const isAuto = config.autoTemperature ?? true;
  if (!isAuto && typeof config.customTemperatureCelsius === 'number') {
    return Math.max(2, Math.min(34, Math.round(config.customTemperatureCelsius)));
  }

  const cel = getCelestialState(config.minutes);
  const baseBiomeTemp =
    config.biome === 'alpine'
      ? 12
      : config.biome === 'kyoto'
      ? 17
      : config.biome === 'coastal'
      ? 20
      : 23;

  // Smooth diurnal temperature curve peaking at 14:30 (870m) and coolest at 04:30 (270m)
  const rad = ((cel.minutes - 270) / 1440) * Math.PI * 2;
  const diurnalSwing = Math.round(-Math.cos(rad) * 6);
  return Math.max(2, Math.min(34, baseBiomeTemp + diurnalSwing));
}

export function getPrecipitationState(config: WallpaperConfig): PrecipitationState {
  const tempC = getAmbientTemperatureCelsius(config);
  const adaptiveEnabled = config.adaptivePrecipitation ?? true;
  const isAutoTemperature = config.autoTemperature ?? true;
  const windBoost = config.weather === 'wind' || Boolean(config.enableWindStreaks) ? 4.2 : 0;

  if (config.weather !== 'rain') {
    return {
      active: false,
      adaptiveEnabled,
      temperatureCelsius: tempC,
      isAutoTemperature,
      regime: 'none',
      regimeLabel: 'No Precipitation',
      densityRatio: 0,
      dropCount: 0,
      dropLength: 0,
      dropSpeed: 0,
      dropOpacity: 0,
      strokeWidth: 1,
      windSlantPx: 0,
      splashRingCount: 0,
      rainfallRateMmPerHr: 0,
    };
  }

  // If adaptive precipitation is disabled, use fixed moderate rain density
  if (!adaptiveEnabled) {
    return {
      active: true,
      adaptiveEnabled: false,
      temperatureCelsius: tempC,
      isAutoTemperature,
      regime: 'steady_shower',
      regimeLabel: 'Moderate Shower (Fixed)',
      densityRatio: 0.5,
      dropCount: 52,
      dropLength: 16,
      dropSpeed: 0.014,
      dropOpacity: 0.48,
      strokeWidth: 1.25,
      windSlantPx: Number((3.5 + windBoost).toFixed(1)),
      splashRingCount: 7,
      rainfallRateMmPerHr: 6.5,
    };
  }

  // Normalize temperature from [2°C .. 32°C] into [0.0 .. 1.0] convective moisture scale
  const normT = Math.max(0, Math.min(1, (tempC - 2) / 30));
  const densityRatio = Number((0.18 + normT * 0.82).toFixed(2));

  let regime: PrecipitationRegimeId = 'steady_shower';
  let regimeLabel = 'Moderate Shower';
  if (tempC <= 12) {
    regime = 'light_drizzle';
    regimeLabel = 'Light Drizzle';
  } else if (tempC >= 22) {
    regime = 'heavy_downpour';
    regimeLabel = 'Heavy Downpour';
  }

  const dropCount = Math.round(22 + normT * 98); // 22 drops in drizzle -> 120 drops in heavy downpour
  const dropLength = Math.round(10 + normT * 19); // 10px -> 29px
  const dropSpeed = Number((0.008 + normT * 0.018).toFixed(4)); // 0.008 -> 0.026
  const dropOpacity = Number((0.32 + normT * 0.42).toFixed(2)); // 0.32 -> 0.74
  const strokeWidth = Number((0.9 + normT * 1.1).toFixed(2)); // 0.9px -> 2.0px
  const windSlantPx = Number((1.2 + normT * 8.3 + windBoost).toFixed(1)); // 1.2px -> 9.5px+ slant
  const splashRingCount = Math.round(3 + normT * 13); // 3 -> 16 surface splash rings
  const rainfallRateMmPerHr = Number((0.8 + Math.pow(normT, 1.8) * 29.2).toFixed(1));

  return {
    active: true,
    adaptiveEnabled: true,
    temperatureCelsius: tempC,
    isAutoTemperature,
    regime,
    regimeLabel,
    densityRatio,
    dropCount,
    dropLength,
    dropSpeed,
    dropOpacity,
    strokeWidth,
    windSlantPx,
    splashRingCount,
    rainfallRateMmPerHr,
  };
}

export function getWeatherVisualState(config: WallpaperConfig): WeatherVisualState {
  const cel = getCelestialState(config.minutes, config.locationSolar);
  const precip = getPrecipitationState(config);

  const snowActive = config.weather === 'snow' || Boolean(config.enableSnowflakes);
  const windActive = config.weather === 'wind' || Boolean(config.enableWindStreaks);
  const mistActive =
    config.weather === 'mist' || Boolean(config.enableMistLayer) || cel.mistOpacity > 0.15;
  const auroraActive =
    config.weather === 'aurora' ||
    Boolean(config.enableAuroraLayer) ||
    (config.autoAdaptElements && cel.phase.id === 'midnight' && cel.starOpacity > 0.7);
  const sunbeamsActive =
    config.enableCelestialRays &&
    (cel.isSunnyAfternoon || config.weather === 'sunbeams' || cel.isGoldenHour) &&
    config.weather !== 'rain';

  const snowflakeCount = snowActive ? 48 : 0;
  const crystalCount = snowActive ? 14 : 0;
  const snowFlutterAmplitude = snowActive ? (windActive ? 9.5 : 4.5) : 0;
  const snowWindDriftPx = snowActive ? (windActive ? 14.0 : 3.2) : 0;
  const frostHighlightOpacity = snowActive ? 0.68 : 0;

  const windStreakCount = windActive ? 16 : 0;
  const windSpeedKmh = windActive ? (config.biome === 'coastal' ? 44 : 36) : 8;
  const windRibbonLengthPx = windActive ? 92 : 0;
  const windDebrisCount = windActive ? 12 : 0;

  const mistDensity =
    config.weather === 'mist' || config.enableMistLayer
      ? 0.58
      : Number(cel.mistOpacity.toFixed(2));

  const activeConditionLabels: string[] = [];
  if (precip.active) activeConditionLabels.push(precip.regimeLabel);
  if (snowActive) activeConditionLabels.push('Crystalline Snowflakes');
  if (windActive) activeConditionLabels.push('Wind Streaks');
  if (config.weather === 'mist' || config.enableMistLayer) {
    activeConditionLabels.push('Valley Mist');
  }
  if (config.weather === 'aurora' || config.enableAuroraLayer) {
    activeConditionLabels.push('Aurora Ribbons');
  }
  if (config.weather === 'sunbeams') {
    activeConditionLabels.push('Solar Rays');
  }

  const summaryLabel =
    activeConditionLabels.length > 0
      ? activeConditionLabels.join(' + ')
      : cel.phase.label;

  return {
    snowActive,
    snowflakeCount,
    crystalCount,
    snowFlutterAmplitude,
    snowWindDriftPx,
    frostHighlightOpacity,
    windActive,
    windStreakCount,
    windSpeedKmh,
    windRibbonLengthPx,
    windDebrisCount,
    mistActive,
    mistDensity,
    auroraActive,
    sunbeamsActive,
    rainActive: precip.active,
    activeConditionLabels,
    summaryLabel,
  };
}

export function generateAndroidWallpaperKotlin(config: WallpaperConfig): string {
  const sky = getSkyPalette(config.minutes, config.biome, config.weather, config.oledDimming);
  const celestial = getCelestialState(config.minutes);
  const battery = getBatteryProfile(config);
  const precip = getPrecipitationState(config);
  const visuals = getWeatherVisualState(config);
  const isEco = battery.mode === 'eco';
  const frameDelayMs = battery.mode === 'balanced' ? 66 : 16;

  return `package com.solstice.livewallpaper

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.*
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import java.util.Calendar
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Solstice Battery-Conscious Android Live Wallpaper Service
 * Power Mode: ${battery.label} (~${battery.estimatedDrainPctPerHour}% battery / hr)
 * Redraw Strategy: ${battery.redrawStrategy}
 * Active Weather Layers: ${visuals.summaryLabel}
 * Configured Biome: ${config.biome.toUpperCase()} | Snapshot Time: ${celestial.formattedTime} (${celestial.phase.label})
 */
class SolsticeWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine = SolsticeDiurnalEngine()

    inner class SolsticeDiurnalEngine : Engine() {
        private val handler = Handler(Looper.getMainLooper())
        private var visible = false
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        private val isEcoMode = ${isEco}

        // In Eco Mode, redraw ONLY once per minute on ACTION_TIME_TICK (Zero continuous CPU/GPU wakeups)
        private val timeTickReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (visible) drawFrame()
            }
        }

        private val drawRunner = object : Runnable {
            override fun run() {
                drawFrame()
                if (visible && !isEcoMode) {
                    handler.postDelayed(this, ${frameDelayMs}L)
                }
            }
        }

        override fun onVisibilityChanged(visible: Boolean) {
            this.visible = visible
            if (visible) {
                drawFrame()
                if (isEcoMode) {
                    registerReceiver(timeTickReceiver, IntentFilter(Intent.ACTION_TIME_TICK))
                } else {
                    handler.post(drawRunner)
                }
            } else {
                handler.removeCallbacks(drawRunner)
                if (isEcoMode) {
                    try { unregisterReceiver(timeTickReceiver) } catch (_: Exception) {}
                }
            }
        }

        private fun drawFrame() {
            val holder: SurfaceHolder = surfaceHolder
            var canvas: Canvas? = null
            try {
                canvas = holder.lockCanvas()
                if (canvas != null) renderScene(canvas)
            } finally {
                if (canvas != null) holder.unlockCanvasAndPost(canvas)
            }
        }

        private fun renderScene(canvas: Canvas) {
            val w = canvas.width.toFloat()
            val h = canvas.height.toFloat()
            val cal = Calendar.getInstance()
            val minutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

            // 1. Dynamic Diurnal Sky Gradient (True-Black OLED Night Support: ${Boolean(config.oledDimming)})
            val isSunnyAfternoon = minutes in 690..1004
            val isNight = minutes < 315 || minutes > 1170
            val skyColors = when {
                isSunnyAfternoon -> intArrayOf(
                    Color.parseColor("#0369a1"),
                    Color.parseColor("#0ea5e9"),
                    Color.parseColor("#fef08a")
                )
                isNight -> intArrayOf(
                    Color.parseColor("${Boolean(config.oledDimming) ? '#000000' : '#040716'}"),
                    Color.parseColor("#0b132b"),
                    Color.parseColor("#17254a")
                )
                else -> intArrayOf(
                    Color.parseColor("${sky.zenith}"),
                    Color.parseColor("${sky.midSky}"),
                    Color.parseColor("${sky.horizon}")
                )
            }

            paint.shader = LinearGradient(0f, 0f, 0f, h * 0.72f, skyColors, null, Shader.TileMode.CLAMP)
            canvas.drawRect(0f, 0f, w, h, paint)
            paint.shader = null

            // 2. Clean Celestial Position (Sun by day, Moon & Static Starfield at night)
            if (minutes in 315..1170) {
                val progress = (minutes - 315f) / (1170f - 315f)
                val sunX = w * (0.12f + progress * 0.76f)
                val sunY = h * (0.62f - sin(progress * PI).toFloat() * 0.46f)
                paint.color = Color.parseColor("${sky.sunColor}")
                canvas.drawCircle(sunX, sunY, if (isSunnyAfternoon) 72f else 56f, paint)
            }

            // 3. Adaptive Precipitation Density (${precip.regimeLabel} @ ${precip.temperatureCelsius}°C -> ${precip.dropCount} drops, ${precip.rainfallRateMmPerHr} mm/hr)
            if (${precip.active}) {
                paint.color = Color.argb(${Math.round(precip.dropOpacity * 255)}, 186, 230, 253)
                paint.strokeWidth = ${precip.strokeWidth}f
                val dropCount = ${precip.dropCount}
                for (i in 0 until dropCount) {
                    val rx = ((i * 173 + i * i * 29 + minutes * 13) % 997) / 997f * w
                    val ry = ((i * 281 + i * i * 53 + minutes * 29) % 991) / 991f * h
                    canvas.drawLine(rx, ry, rx - ${precip.windSlantPx}f, ry + ${precip.dropLength}f, paint)
                }
            }

            // 4. Toggleable Crystalline Snowflakes (${visuals.snowActive})
            if (${visuals.snowActive}) {
                paint.color = Color.argb(215, 241, 245, 249)
                paint.strokeWidth = 1.6f
                for (i in 0 until ${visuals.snowflakeCount}) {
                    val sx = ((i * 197 + i * i * 31 + minutes * 7) % 997) / 997f * w
                    val sy = ((i * 263 + i * i * 43 + minutes * 19) % 991) / 991f * h
                    val r = if (i < ${visuals.crystalCount}) 6.5f else 2.8f
                    if (i < ${visuals.crystalCount}) {
                        for (arm in 0..2) {
                            val angle = arm * (PI / 3.0)
                            val dx = (cos(angle) * r).toFloat()
                            val dy = (sin(angle) * r).toFloat()
                            canvas.drawLine(sx - dx, sy - dy, sx + dx, sy + dy, paint)
                        }
                    } else {
                        canvas.drawCircle(sx, sy, r, paint)
                    }
                }
            }

            // 5. Toggleable Aerodynamic Wind Streaks (${visuals.windActive})
            if (${visuals.windActive}) {
                paint.color = Color.argb(115, 226, 232, 240)
                paint.strokeWidth = 1.8f
                for (i in 0 until ${visuals.windStreakCount}) {
                    val wx = ((i * 223 + minutes * 37) % 900) / 1000f * w
                    val wy = (0.12f + (i * 47 % 62) / 100f) * h
                    canvas.drawLine(wx, wy, wx + ${visuals.windRibbonLengthPx}f, wy - 4f, paint)
                }
            }
        }
    }
}
`;
}
