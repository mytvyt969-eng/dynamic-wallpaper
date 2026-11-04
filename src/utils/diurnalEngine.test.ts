import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampMinutes,
  formatMinutes24h,
  formatMinutes12h,
  getDiurnalPhase,
  getSkyPalette,
  getCelestialState,
  getMaterialYouTokens,
  getBatteryProfile,
  getAmbientTemperatureCelsius,
  getPrecipitationState,
  getWeatherVisualState,
  generateAndroidWallpaperKotlin,
} from './diurnalEngine';

test('time formatting and minute clamping work across 24-hour boundaries', () => {
  assert.equal(clampMinutes(1440), 0);
  assert.equal(clampMinutes(-15), 1425);
  assert.equal(formatMinutes24h(9 * 60 + 5), '09:05');
  assert.equal(formatMinutes24h(14 * 60 + 30), '14:30');
  assert.deepEqual(formatMinutes12h(0), { time: '12:00', period: 'AM' });
  assert.deepEqual(formatMinutes12h(14 * 60 + 30), { time: '2:30', period: 'PM' });
});

test('diurnal phase classification distinguishes dawn, morning, sunny afternoon, dusk, night, and midnight', () => {
  assert.equal(getDiurnalPhase(6 * 60).id, 'dawn');
  assert.equal(getDiurnalPhase(9 * 60 + 30).id, 'morning');
  assert.equal(getDiurnalPhase(14 * 60 + 30).id, 'afternoon');
  assert.equal(getDiurnalPhase(18 * 60 + 15).id, 'dusk');
  assert.equal(getDiurnalPhase(22 * 60).id, 'night');
  assert.equal(getDiurnalPhase(2 * 60).id, 'midnight');
});

test('celestial state updates sun, moon, stars, wildlife, and artificial lights accurately for day vs afternoon vs night', () => {
  const morning = getCelestialState(9 * 60 + 30); // 09:30
  assert.equal(morning.isDaylight, true);
  assert.equal(morning.sunVisible, true);
  assert.equal(morning.starOpacity, 0);
  assert.equal(morning.windowGlow, 0);
  assert.ok(morning.birdActivity > 0.5);

  const afternoon = getCelestialState(14 * 60); // 14:00 Sunny Afternoon
  assert.equal(afternoon.isSunnyAfternoon, true);
  assert.equal(afternoon.sunVisible, true);
  assert.equal(afternoon.sunRayIntensity, 1.0);
  assert.equal(afternoon.butterflyPollenActivity, 1.0);
  assert.equal(afternoon.windowGlow, 0);

  const night = getCelestialState(22 * 60 + 30); // 22:30 Night
  assert.equal(night.isNight, true);
  assert.equal(night.sunVisible, false);
  assert.equal(night.moonVisible, true);
  assert.equal(night.starOpacity, 1);
  assert.equal(night.windowGlow, 1);
  assert.equal(night.campfireIntensity, 1);
  assert.ok(night.fireflyActivity > 0.8);
});

test('sky palette supports OLED true-black night dimming and Material You tokens interpolate cleanly', () => {
  const afternoonSky = getSkyPalette(14 * 60, 'alpine', 'clear', false);
  const nightSkyStandard = getSkyPalette(23 * 60, 'alpine', 'clear', false);
  const nightSkyOled = getSkyPalette(23 * 60, 'alpine', 'clear', true);
  assert.notEqual(afternoonSky.zenith, nightSkyStandard.zenith);
  assert.equal(nightSkyOled.zenith, '#000000');
  assert.equal(nightSkyOled.groundTint, '#000000');

  const afternoonTokens = getMaterialYouTokens(14 * 60, 'alpine');
  const nightTokens = getMaterialYouTokens(23 * 60, 'alpine');
  assert.notEqual(afternoonTokens.accentPrimary, nightTokens.accentPrimary);
});

test('battery profile and Android Kotlin generator enforce low-power ACTION_TIME_TICK in eco mode', () => {
  const ecoConfig = {
    minutes: 22 * 60 + 30,
    biome: 'coastal' as const,
    weather: 'clear' as const,
    moonPhase: 'full' as const,
    powerMode: 'eco' as const,
    oledDimming: true,
    autoAdaptElements: true,
    enableWildlife: false,
    enableCelestialRays: false,
    enableArtificialLights: true,
    enableTouchRipples: false,
    parallaxStrength: 0,
  };

  const ecoBattery = getBatteryProfile(ecoConfig);
  assert.equal(ecoBattery.targetFps, 0);
  assert.equal(ecoBattery.gpuWakeupsPerMin, 1);
  assert.ok(ecoBattery.estimatedDrainPctPerHour <= 0.2);

  const code = generateAndroidWallpaperKotlin(ecoConfig);
  assert.ok(code.includes('Intent.ACTION_TIME_TICK'));
  assert.ok(code.includes('private val isEcoMode = true'));
});

test('adaptive precipitation density transitions from light drizzle at cool temperatures to heavy downpour at warm temperatures', () => {
  const baseRainConfig = {
    minutes: 14 * 60,
    biome: 'alpine' as const,
    weather: 'rain' as const,
    moonPhase: 'full' as const,
    powerMode: 'balanced' as const,
    oledDimming: true,
    adaptivePrecipitation: true,
    autoTemperature: false,
    customTemperatureCelsius: 7,
    autoAdaptElements: true,
    enableWildlife: true,
    enableCelestialRays: true,
    enableArtificialLights: true,
    enableTouchRipples: false,
    parallaxStrength: 0,
  };

  const drizzle = getPrecipitationState({ ...baseRainConfig, customTemperatureCelsius: 7 });
  const shower = getPrecipitationState({ ...baseRainConfig, customTemperatureCelsius: 17 });
  const downpour = getPrecipitationState({ ...baseRainConfig, customTemperatureCelsius: 29 });

  assert.equal(drizzle.active, true);
  assert.equal(drizzle.regime, 'light_drizzle');
  assert.equal(shower.regime, 'steady_shower');
  assert.equal(downpour.regime, 'heavy_downpour');

  assert.ok(drizzle.dropCount < shower.dropCount);
  assert.ok(shower.dropCount < downpour.dropCount);
  assert.ok(drizzle.dropLength < downpour.dropLength);
  assert.ok(drizzle.windSlantPx < downpour.windSlantPx);
  assert.ok(drizzle.rainfallRateMmPerHr < downpour.rainfallRateMmPerHr);

  // Also verify diurnal auto-temperature increases from pre-dawn (04:30) to afternoon (14:30)
  const dawnTemp = getAmbientTemperatureCelsius({
    ...baseRainConfig,
    autoTemperature: true,
    minutes: 4 * 60 + 30,
  });
  const afternoonTemp = getAmbientTemperatureCelsius({
    ...baseRainConfig,
    autoTemperature: true,
    minutes: 14 * 60 + 30,
  });
  assert.ok(afternoonTemp > dawnTemp);
});

test('toggleable weather conditions activate snowflakes, wind streaks, and combined blizzard drift physics', () => {
  const baseConfig = {
    minutes: 14 * 60 + 30,
    biome: 'alpine' as const,
    weather: 'clear' as const,
    moonPhase: 'full' as const,
    powerMode: 'eco' as const,
    oledDimming: true,
    enableSnowflakes: false,
    enableWindStreaks: false,
    enableMistLayer: false,
    enableAuroraLayer: false,
    autoAdaptElements: true,
    enableWildlife: true,
    enableCelestialRays: true,
    enableArtificialLights: true,
    enableTouchRipples: false,
    parallaxStrength: 0,
  };

  const clearState = getWeatherVisualState(baseConfig);
  assert.equal(clearState.snowActive, false);
  assert.equal(clearState.windActive, false);
  assert.equal(clearState.snowflakeCount, 0);
  assert.equal(clearState.windStreakCount, 0);

  const snowState = getWeatherVisualState({ ...baseConfig, enableSnowflakes: true });
  assert.equal(snowState.snowActive, true);
  assert.equal(snowState.snowflakeCount, 48);
  assert.equal(snowState.crystalCount, 14);
  assert.ok(snowState.activeConditionLabels.includes('Crystalline Snowflakes'));

  const windState = getWeatherVisualState({ ...baseConfig, enableWindStreaks: true });
  assert.equal(windState.windActive, true);
  assert.equal(windState.windStreakCount, 16);
  assert.ok(windState.windSpeedKmh >= 36);
  assert.ok(windState.activeConditionLabels.includes('Wind Streaks'));

  const blizzardState = getWeatherVisualState({
    ...baseConfig,
    enableSnowflakes: true,
    enableWindStreaks: true,
  });
  assert.equal(blizzardState.snowActive, true);
  assert.equal(blizzardState.windActive, true);
  assert.ok(blizzardState.snowWindDriftPx > snowState.snowWindDriftPx);
  assert.ok(blizzardState.snowFlutterAmplitude > snowState.snowFlutterAmplitude);
});

test('Android APK project generator produces complete Gradle project and valid PKZIP archive bytes', async () => {
  const { generateAndroidProjectFiles, createAndroidProjectZipBytes } = await import(
    './androidProjectBuilder'
  );
  const sampleConfig = {
    minutes: 14 * 60 + 30,
    biome: 'alpine' as const,
    weather: 'snow' as const,
    moonPhase: 'full' as const,
    powerMode: 'eco' as const,
    oledDimming: true,
    enableSnowflakes: true,
    enableWindStreaks: true,
    autoAdaptElements: true,
    enableWildlife: true,
    enableCelestialRays: true,
    enableArtificialLights: true,
    enableTouchRipples: false,
    parallaxStrength: 0,
  };

  const files = generateAndroidProjectFiles(sampleConfig);
  assert.ok(files.length >= 10);
  const paths = files.map((f) => f.path);
  assert.ok(paths.includes('app/src/main/AndroidManifest.xml'));
  assert.ok(paths.includes('app/src/main/java/com/solstice/livewallpaper/SolsticeWallpaperService.kt'));
  assert.ok(paths.includes('app/src/main/java/com/solstice/livewallpaper/MainActivity.kt'));
  assert.ok(paths.includes('.github/workflows/build-apk.yml'));

  const zipBytes = createAndroidProjectZipBytes(sampleConfig);
  assert.ok(zipBytes.byteLength > 4000);
  // Verify PKZIP Local File Header signature (0x50, 0x4b, 0x03, 0x04 -> 'PK\x03\x04')
  assert.equal(zipBytes[0], 0x50);
  assert.equal(zipBytes[1], 0x4b);
  assert.equal(zipBytes[2], 0x03);
  assert.equal(zipBytes[3], 0x04);
});

test('Location Solar Ephemeris computes real-world sunrise/sunset and remaps the diurnal transition cycle accurately', async () => {
  const {
    computeAstronomicalSunTimes,
    buildLocationSolarProfile,
    mapLocalTimeToCanonicalSolarMinutes,
  } = await import('./diurnalEngine');

  const winterDate = new Date('2026-11-15T12:00:00Z');
  const sfSun = computeAstronomicalSunTimes(37.7749, -122.4194, winterDate, -8);
  const reykjavikSun = computeAstronomicalSunTimes(64.1466, -21.9426, winterDate, 0);

  // In November (Northern Hemisphere winter), Reykjavik (64°N) has later sunrise and shorter daylight than San Francisco (37.7°N)
  assert.ok(reykjavikSun.sunriseMinutes > sfSun.sunriseMinutes);
  assert.ok(reykjavikSun.daylightDurationMinutes < sfSun.daylightDurationMinutes);

  const customProfile = buildLocationSolarProfile(
    {
      city: 'Reykjavik',
      region: 'Capital Region, IS',
      latitude: 64.1466,
      longitude: -21.9426,
      source: 'geolocation',
      sunriseMinutesOverride: 600, // 10:00 AM winter sunrise
      sunsetMinutesOverride: 960, // 16:00 (4:00 PM) winter sunset
    },
    winterDate
  );

  assert.equal(customProfile.sunriseMinutes, 600);
  assert.equal(customProfile.sunsetMinutes, 960);
  assert.equal(customProfile.solarNoonMinutes, 780); // 13:00 solar noon

  // Verify piecewise remapping aligns local sunrise -> 315, solar noon -> 742.5, local sunset -> 1170
  assert.equal(mapLocalTimeToCanonicalSolarMinutes(600, customProfile), 315);
  assert.equal(mapLocalTimeToCanonicalSolarMinutes(780, customProfile), 742.5);
  assert.equal(mapLocalTimeToCanonicalSolarMinutes(960, customProfile), 1170);

  // Without locationSolar, 08:30 (510m) is Bright Morning with sun visible
  const standardAt830 = getCelestialState(510, null);
  assert.equal(standardAt830.sunVisible, true);
  assert.equal(standardAt830.phase.id, 'morning');

  // With Reykjavik winter profile (sunrise 10:00 / 600m), 08:30 (510m) is still pre-sunrise dark!
  const reykjavikAt830 = getCelestialState(510, customProfile);
  assert.equal(reykjavikAt830.sunVisible, false);

  // At 13:00 (780m, Reykjavik solar noon), sun reaches peak zenith (Sunny Afternoon)
  const reykjavikAtNoon = getCelestialState(780, customProfile);
  assert.equal(reykjavikAtNoon.sunVisible, true);
  assert.equal(reykjavikAtNoon.phase.id, 'afternoon');
  assert.equal(reykjavikAtNoon.formattedSunrise, '10:00');
  assert.equal(reykjavikAtNoon.formattedSunset, '16:00');
});



