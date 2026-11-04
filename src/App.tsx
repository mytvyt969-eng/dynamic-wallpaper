import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  CloudRain,
  Snowflake,
  Wind,
  CloudFog,
  Play,
  Pause,
  Clock,
  RotateCcw,
  Download,
  Bird,
  Flame,
  Waves,
  Compass,
  BatteryCharging,
  ZapOff,
  Thermometer,
  Package,
  MapPin,
} from 'lucide-react';
import {
  WallpaperConfig,
  DiurnalPhaseId,
  BiomeId,
  WeatherId,
  MoonPhaseId,
  PowerModeId,
  CitySolarPreset,
  DIURNAL_PHASES,
  BIOME_CATALOG,
  CITY_SOLAR_PRESETS,
  getCelestialState,
  getSkyPalette,
  getMaterialYouTokens,
  getBatteryProfile,
  getAmbientTemperatureCelsius,
  getPrecipitationState,
  getWeatherVisualState,
  buildLocationSolarProfile,
  fetchLocationSolarProfileFromCoords,
  formatMinutes24h,
  clampMinutes,
} from './utils/diurnalEngine';
import { AndroidDevicePreview, AndroidScreenMode } from './components/AndroidDevicePreview';
import { ExportWallpaperModal } from './components/ExportWallpaperModal';
import { createAndroidProjectZipBytes } from './utils/androidProjectBuilder';

const PHASE_ORDER: DiurnalPhaseId[] = [
  'dawn',
  'morning',
  'afternoon',
  'dusk',
  'night',
  'midnight',
];

const WEATHER_OPTIONS: Array<{ id: WeatherId; label: string; summary: string }> = [
  { id: 'clear', label: 'Clear Canopy', summary: 'Unobstructed sun arc, crisp stars, and clear water' },
  { id: 'sunbeams', label: 'Solar Rays', summary: 'Enhanced crepuscular god-rays and golden pollen' },
  { id: 'rain', label: 'Adaptive Rain', summary: 'Temperature-scaled drizzle, shower, or heavy downpour' },
  { id: 'snow', label: 'Snowflakes', summary: 'Hexagonal 6-arm ice crystals, powder flurries, and frost crests' },
  { id: 'wind', label: 'Wind Streaks', summary: 'Aerodynamic air ribbons, spiral eddies, and wind-swept leaves' },
  { id: 'aurora', label: 'Aurora Ribbon', summary: 'Emerald and violet geomagnetic curtains in upper sky' },
  { id: 'mist', label: 'Valley Mist', summary: 'Atmospheric shoreline fog layer across water' },
];

const MOON_OPTIONS: Array<{ id: MoonPhaseId; label: string }> = [
  { id: 'crescent', label: 'Crescent' },
  { id: 'quarter', label: 'Half Moon' },
  { id: 'gibbous', label: 'Gibbous' },
  { id: 'full', label: 'Full Moon' },
];

export default function App() {
  // Default to Eco Static (Zero Loop) battery-saver mode at Sunny Afternoon (14:30)
  const [config, setConfig] = useState<WallpaperConfig>({
    minutes: 14 * 60 + 30,
    biome: 'alpine',
    weather: 'clear',
    moonPhase: 'full',
    powerMode: 'eco',
    oledDimming: true,
    adaptivePrecipitation: true,
    autoTemperature: true,
    customTemperatureCelsius: 18,
    enableSnowflakes: false,
    enableWindStreaks: false,
    enableMistLayer: false,
    enableAuroraLayer: false,
    locationSolar: null,
    autoAdaptElements: true,
    enableWildlife: true,
    enableCelestialRays: true,
    enableArtificialLights: true,
    enableTouchRipples: false,
    parallaxStrength: 0,
  });

  const [screenMode, setScreenMode] = useState<AndroidScreenMode>('lock');
  const [isFullscreenDevice, setIsFullscreenDevice] = useState(false);
  const [isLiveClockSync, setIsLiveClockSync] = useState(false);
  const [locationSyncState, setLocationSyncState] = useState<
    'idle' | 'locating' | 'synced'
  >('idle');
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(
    null
  );
  const [timeLapseSpeed, setTimeLapseSpeed] = useState<0 | 1 | 4>(0); // 0 = paused, 1 = standard timelapse, 4 = fast
  const [isExportOpen, setIsExportOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with real system clock when enabled
  useEffect(() => {
    if (!isLiveClockSync) return;
    const syncNow = () => {
      const now = new Date();
      setConfig((prev) => ({
        ...prev,
        minutes: now.getHours() * 60 + now.getMinutes(),
      }));
    };
    syncNow();
    const interval = setInterval(syncNow, 15000);
    return () => clearInterval(interval);
  }, [isLiveClockSync]);

  // Smooth 24-hour time-lapse simulation loop when active
  useEffect(() => {
    if (timeLapseSpeed === 0 || isLiveClockSync) return;
    const interval = setInterval(() => {
      setConfig((prev) => ({
        ...prev,
        minutes: clampMinutes(prev.minutes + timeLapseSpeed * 2),
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [timeLapseSpeed, isLiveClockSync]);

  const celestial = getCelestialState(config.minutes, config.locationSolar);
  const skyPalette = getSkyPalette(
    config.minutes,
    config.biome,
    config.weather,
    config.oledDimming,
    config.locationSolar
  );
  const materialTokens = getMaterialYouTokens(
    config.minutes,
    config.biome,
    config.locationSolar
  );
  const batteryProfile = getBatteryProfile(config);
  const currentTempC = getAmbientTemperatureCelsius(config);
  const precipState = getPrecipitationState(config);
  const weatherVisuals = getWeatherVisualState(config);

  const handleTimeSelect = (minutes: number) => {
    setIsLiveClockSync(false);
    setTimeLapseSpeed(0);
    setConfig((prev) => ({ ...prev, minutes: clampMinutes(minutes) }));
  };

  const handleToggleLiveSync = () => {
    setTimeLapseSpeed(0);
    setIsLiveClockSync((prev) => !prev);
  };

  const applyFallbackTimezoneLocation = async (reasonNote: string) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let preset = CITY_SOLAR_PRESETS[0]; // default San Francisco
    if (tz.includes('Tokyo') || tz.includes('Asia/')) {
      preset = CITY_SOLAR_PRESETS[1];
    } else if (tz.includes('Reykjavik') || tz.includes('Europe/')) {
      preset = CITY_SOLAR_PRESETS[2];
    } else if (tz.includes('Singapore')) {
      preset = CITY_SOLAR_PRESETS[3];
    } else if (tz.includes('Sydney') || tz.includes('Australia/')) {
      preset = CITY_SOLAR_PRESETS[4];
    }
    const cityLabel = tz.includes('/')
      ? tz.split('/').pop()!.replace(/_/g, ' ')
      : preset.city;
    const immediateProfile = buildLocationSolarProfile({
      city: cityLabel,
      region: preset.region,
      latitude: preset.latitude,
      longitude: preset.longitude,
      source: 'timezone',
      tzOffsetHours: preset.tzOffsetHours,
    });
    setConfig((prev) => ({
      ...prev,
      locationSolar: immediateProfile,
    }));
    setLocationSyncState('synced');
    setLocationStatusMessage(
      `${reasonNote} — Synced solar cycle with ${immediateProfile.city} (${formatMinutes24h(
        immediateProfile.sunriseMinutes
      )} sunrise · ${formatMinutes24h(immediateProfile.sunsetMinutes)} sunset)`
    );
  };

  const handleSyncWithLocalLocation = () => {
    setLocationSyncState('locating');
    setLocationStatusMessage('Requesting browser Geolocation coordinates & solar ephemeris…');

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      void applyFallbackTimezoneLocation('Browser Geolocation unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // 1. Apply immediate astronomical sun times for zero-latency responsiveness
        const immediate = buildLocationSolarProfile({
          city: 'Current Location',
          region: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          latitude,
          longitude,
          source: 'geolocation',
        });
        setConfig((prev) => ({
          ...prev,
          locationSolar: immediate,
        }));
        setLocationSyncState('synced');
        setLocationStatusMessage(
          `Synced GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°) — Fetching city & official ephemeris…`
        );

        // 2. Refine with live reverse-geocoded city & sunrise-sunset API
        try {
          const enriched = await fetchLocationSolarProfileFromCoords(
            latitude,
            longitude,
            'geolocation'
          );
          setConfig((prev) => ({
            ...prev,
            locationSolar: enriched,
          }));
          setLocationStatusMessage(
            `Mirrored to ${enriched.city}${
              enriched.region ? `, ${enriched.region}` : ''
            } (${formatMinutes24h(enriched.sunriseMinutes)} sunrise · ${formatMinutes24h(
              enriched.sunsetMinutes
            )} sunset)`
          );
        } catch {
          // Keep astronomical profile if offline
        }
      },
      () => {
        void applyFallbackTimezoneLocation('Geolocation permission declined in preview');
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  };

  const handleSelectCityPreset = async (preset: CitySolarPreset) => {
    const profile = buildLocationSolarProfile({
      city: preset.city,
      region: preset.region,
      latitude: preset.latitude,
      longitude: preset.longitude,
      source: 'city_preset',
      tzOffsetHours: preset.tzOffsetHours,
    });
    setConfig((prev) => ({
      ...prev,
      locationSolar: profile,
    }));
    setLocationSyncState('synced');
    setLocationStatusMessage(
      `Mirrored to ${profile.city}, ${profile.region} (${formatMinutes24h(
        profile.sunriseMinutes
      )} sunrise · ${formatMinutes24h(profile.sunsetMinutes)} sunset)`
    );
  };

  const handleClearLocationSync = () => {
    setConfig((prev) => ({
      ...prev,
      locationSolar: null,
    }));
    setLocationSyncState('idle');
    setLocationStatusMessage(null);
  };

  const handleDownloadApkZip = () => {
    const zipBytes = createAndroidProjectZipBytes(config);
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solstice-android-apk-project-${config.biome}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPhaseIcon = (id: DiurnalPhaseId) => {
    switch (id) {
      case 'dawn':
        return Sunrise;
      case 'morning':
        return Sun;
      case 'afternoon':
        return Sparkles;
      case 'dusk':
        return Sunset;
      case 'night':
      case 'midnight':
        return Moon;
    }
  };

  return (
    <div
      data-phase={celestial.phase.id}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col"
    >
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
        <a
          href="#top"
          className="text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Solstice
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          <a
            href="#diurnal-engine"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Diurnal Cycle
          </a>
          <a
            href="#biomes"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            World Biomes
          </a>
          <a
            href="#atmosphere"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Atmosphere & Wildlife
          </a>
          <a
            href="#material-you"
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Material You Palette
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-testid="header-get-apk-btn"
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px] flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Get Android APK</span>
          </button>
        </div>
      </header>

      {/* Main Two-Zone Interactive Sandbox Workspace */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT / STICKY ZONE: Interactive Android 15 Live Wallpaper Preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col items-center">
            <AndroidDevicePreview
              config={config}
              screenMode={screenMode}
              onScreenModeChange={setScreenMode}
              isFullscreen={isFullscreenDevice}
              onToggleFullscreen={() => setIsFullscreenDevice((prev) => !prev)}
              canvasRef={canvasRef}
              onQuickPresetSelect={handleTimeSelect}
            />
          </div>

          {/* RIGHT ZONE: Diurnal Time Engine, Biomes & Living Ecosystem Controls */}
          <div className="lg:col-span-7 space-y-8">
            {/* Hero Intro & Live Diurnal Status Summary */}
            <section className="pb-6 border-b border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 font-medium mb-2">
                <span>Android 15 Live Wallpaper Engine</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{celestial.formattedTime} ({celestial.formatted12h})</span>
                <span aria-hidden="true">·</span>
                <span>{celestial.phase.label}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{celestial.kelvin}K Daylight Spectrum</span>
              </div>

              <h1
                style={{ textWrap: 'balance' }}
                className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-white"
              >
                Real-Time Diurnal Sky, Living Wildlife & Adaptive Horizons
              </h1>

              <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {celestial.phase.tagline}
              </p>
            </section>

            {/* SECTION 1: 24-HOUR DIURNAL CYCLE & SOLAR/LUNAR SCRUBBER */}
            <section
              id="diurnal-engine"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-white">
                    01. Diurnal Time & Celestial Progression
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scrub across 24 hours, jump to key solar phases, or sync directly with your device clock.
                  </p>
                </div>

                {/* Playback & Clock Sync Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleLiveSync}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                      isLiveClockSync
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isLiveClockSync ? 'Synced to Clock' : 'Sync Device Clock'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLiveClockSync(false);
                      setTimeLapseSpeed((prev) => (prev === 0 ? 1 : prev === 1 ? 4 : 0));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                      timeLapseSpeed > 0
                        ? 'bg-amber-400 text-slate-950 font-semibold'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {timeLapseSpeed > 0 ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{timeLapseSpeed === 4 ? 'Fast Lapse (4x)' : 'Time-Lapse Active'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Play 24h Cycle</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTimeSelect(14 * 60 + 30)}
                    aria-label="Reset to Sunny Afternoon 14:30"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors min-h-[38px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Real-World Location & Sunrise/Sunset Ephemeris Mirror Panel */}
              <div
                data-testid="location-solar-panel"
                className="p-4 rounded-xl bg-slate-950/85 border border-slate-800/90 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>
                        {config.locationSolar
                          ? `Local Solar Ephemeris Active — ${config.locationSolar.city}${
                              config.locationSolar.region
                                ? ` (${config.locationSolar.region})`
                                : ''
                            }`
                          : 'Sync with Local Location (Real-World Sunrise & Sunset Cycle)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {locationStatusMessage ||
                        'Uses browser Geolocation to fetch your city’s sunrise, solar noon, and sunset times so the live wallpaper mirrors your real-world horizon.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="sync-location-btn"
                      onClick={handleSyncWithLocalLocation}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                        config.locationSolar
                          ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                          : 'bg-sky-500/20 border border-sky-400/50 text-sky-200 hover:bg-sky-500/30'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {locationSyncState === 'locating'
                          ? 'Locating City…'
                          : config.locationSolar
                          ? `Synced: ${config.locationSolar.city}`
                          : 'Sync with Local Location'}
                      </span>
                    </button>

                    {config.locationSolar && (
                      <button
                        type="button"
                        data-testid="clear-location-sync-btn"
                        onClick={handleClearLocationSync}
                        className="px-2.5 py-2 rounded-lg text-[11px] font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
                      >
                        Standard Cycle
                      </button>
                    )}
                  </div>
                </div>

                {/* City Ephemeris Quick-Test Switcher + Live Sunrise/Noon/Sunset Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">City Ephemeris:</span>
                    {CITY_SOLAR_PRESETS.map((preset) => {
                      const isSelected =
                        config.locationSolar?.city.toLowerCase() ===
                        preset.city.toLowerCase();
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          data-testid={`city-preset-${preset.id}`}
                          onClick={() => void handleSelectCityPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                            isSelected
                              ? 'bg-sky-400/20 border border-sky-400 text-sky-300 font-semibold'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {preset.city}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tabular-nums">
                    <button
                      type="button"
                      data-testid="jump-local-sunrise-btn"
                      onClick={() => handleTimeSelect(celestial.sunriseMinutes)}
                      className="text-amber-300 hover:underline underline-offset-4"
                      title="Jump to Local Sunrise"
                    >
                      Sunrise {celestial.formattedSunrise}
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      data-testid="jump-local-noon-btn"
                      onClick={() => handleTimeSelect(celestial.solarNoonMinutes)}
                      className="text-sky-300 hover:underline underline-offset-4"
                      title="Jump to Local Solar Noon"
                    >
                      Noon {formatMinutes24h(celestial.solarNoonMinutes)}
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      data-testid="jump-local-sunset-btn"
                      onClick={() => handleTimeSelect(celestial.sunsetMinutes)}
                      className="text-orange-300 hover:underline underline-offset-4"
                      title="Jump to Local Sunset"
                    >
                      Sunset {celestial.formattedSunset}
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive 24-Hour Time Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="diurnal-time-slider" className="font-medium text-slate-200">
                    Time of Day Scrubber
                  </label>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-amber-300 font-semibold">
                    <span>{celestial.formattedTime}</span>
                    <span className="text-slate-500">·</span>
                    <span>{celestial.formatted12h}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-200">{celestial.phase.label}</span>
                  </div>
                </div>

                {/* Spectrum Gradient Track + Range Input */}
                <div className="relative flex items-center h-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 h-3 rounded-full pointer-events-none border border-white/10"
                    style={{
                      background:
                        'linear-gradient(90deg, #070b1e 0%, #1b1f47 18%, #f59e6c 26%, #38bdf8 40%, #fef08a 58%, #f97316 76%, #111c3d 86%, #040716 100%)',
                    }}
                  />
                  <input
                    id="diurnal-time-slider"
                    type="range"
                    min={0}
                    max={1439}
                    step={5}
                    value={config.minutes}
                    onChange={(e) => handleTimeSelect(Number(e.target.value))}
                    aria-label="Time of Day Scrubber in Minutes"
                    className="relative z-10 w-full h-3 appearance-none bg-transparent cursor-pointer accent-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                  <span>00:00 Midnight</span>
                  <span>{celestial.formattedSunrise} Sunrise</span>
                  <span>
                    {formatMinutes24h(
                      Math.round((celestial.sunriseMinutes + celestial.solarNoonMinutes) / 2)
                    )}{' '}
                    Day
                  </span>
                  <span>{formatMinutes24h(celestial.solarNoonMinutes)} Sunny</span>
                  <span>{celestial.formattedSunset} Sunset</span>
                  <span>22:00 Night</span>
                </div>
              </div>

              {/* 6 Key Diurnal Phase Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PHASE_ORDER.map((phaseId) => {
                  const p = DIURNAL_PHASES[phaseId];
                  const Icon = getPhaseIcon(phaseId);
                  const isActive = celestial.phase.id === phaseId;

                  const dynamicPresetMinutes = config.locationSolar
                    ? phaseId === 'dawn'
                      ? config.locationSolar.sunriseMinutes
                      : phaseId === 'morning'
                      ? Math.round(
                          (config.locationSolar.sunriseMinutes +
                            config.locationSolar.solarNoonMinutes) /
                            2
                        )
                      : phaseId === 'afternoon'
                      ? config.locationSolar.solarNoonMinutes
                      : phaseId === 'dusk'
                      ? config.locationSolar.sunsetMinutes
                      : phaseId === 'night'
                      ? Math.min(1410, config.locationSolar.sunsetMinutes + 90)
                      : Math.max(30, Math.round(config.locationSolar.sunriseMinutes / 3))
                    : p.presetMinutes;

                  return (
                    <button
                      key={phaseId}
                      type="button"
                      onClick={() => handleTimeSelect(dynamicPresetMinutes)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all min-h-[68px] ${
                        isActive
                          ? 'bg-amber-400/15 border-amber-400 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                          <Icon
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-amber-300' : 'text-slate-400'
                            }`}
                          />
                          <span>{p.label}</span>
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {config.locationSolar
                            ? formatMinutes24h(dynamicPresetMinutes)
                            : p.timeRange.split(' – ')[0]}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {p.ambientSummary.split(' · ').slice(0, 2).join(' · ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Live Celestial & Environmental State Readout */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Celestial Body</div>
                  <div className="text-sm font-semibold text-white mt-0.5 font-mono tabular-nums">
                    {celestial.sunVisible
                      ? `Sun · ${celestial.sunAltitudeDeg}° Alt`
                      : `Moon · ${celestial.moonAltitudeDeg}° Alt`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Solar Ray / Starfield</div>
                  <div className="text-sm font-semibold text-white mt-0.5 font-mono tabular-nums">
                    {celestial.sunVisible
                      ? `${Math.round(celestial.sunRayIntensity * 100)}% Sunbeams`
                      : `${Math.round(celestial.starOpacity * 100)}% Star Canopy`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Active Ecosystem</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {celestial.isSunnyAfternoon
                      ? 'Birds & Golden Pollen'
                      : celestial.isDaylight
                      ? 'Soaring Bird Flocks'
                      : celestial.isGoldenHour
                      ? 'Roosting Flocks & Mist'
                      : 'Fireflies & Crickets'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">World Illumination</div>
                  <div className="text-sm font-semibold text-white mt-0.5 font-mono tabular-nums">
                    {celestial.windowGlow > 0
                      ? `${Math.round(celestial.windowGlow * 100)}% Lamps & Fire`
                      : '100% Natural Daylight'}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: WORLD BIOMES & TIME-REACTIVE ARCHITECTURE */}
            <section
              id="biomes"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-display font-bold text-white">
                  02. Interactive World Biomes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each landscape features unique daytime activity, sunny afternoon reflections, and nocturnal illumination.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {BIOME_CATALOG.map((b) => {
                  const selected = config.biome === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, biome: b.id }))}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        selected
                          ? 'bg-amber-400/15 border-amber-400 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-display font-bold text-white">
                            {b.name}
                          </span>
                          <span className="text-xs text-amber-300 font-medium">
                            {selected ? 'Active Biome' : 'Select'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{b.subtitle}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-300">
                        <div>
                          <span className="text-amber-300 font-medium">Day & Sunny: </span>
                          <span>{b.dayFeatures}</span>
                        </div>
                        <div>
                          <span className="text-sky-300 font-medium">Dusk & Night: </span>
                          <span>{b.nightFeatures}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECTION 3: ATMOSPHERE & WILDLIFE (BATTERY GOVERNOR, WEATHER & LIVING DETAILS) */}
            <section
              id="atmosphere"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-display font-bold text-white">
                    03. Atmosphere & Wildlife
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle visual weather phenomena (snowflakes, wind streaks, mist, rain) and time-adaptive wildlife with low-power battery governance.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-emerald-400">
                  <BatteryCharging className="w-4 h-4" />
                  <span>~{batteryProfile.estimatedDrainPctPerHour}% / hr drain</span>
                </div>
              </div>

              {/* Battery-Saving Power Mode Selector */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ZapOff className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Frame-Rate & Battery Governor</span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {batteryProfile.redrawStrategy}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        id: 'eco' as PowerModeId,
                        title: 'Eco Static (0 FPS)',
                        subtitle: '1 redraw/min on clock tick · ~0.2%/hr',
                      },
                      {
                        id: 'balanced' as PowerModeId,
                        title: 'Balanced (15 FPS)',
                        subtitle: 'Throttled calm motion · ~0.8%/hr',
                      },
                      {
                        id: 'smooth' as PowerModeId,
                        title: 'Showcase (60 FPS)',
                        subtitle: 'Full continuous motion · ~3.2%/hr',
                      },
                    ] as const
                  ).map((modeItem) => {
                    const active = (config.powerMode || 'eco') === modeItem.id;
                    return (
                      <button
                        key={modeItem.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            powerMode: modeItem.id,
                            parallaxStrength: modeItem.id === 'eco' ? 0 : Math.max(40, prev.parallaxStrength),
                            enableTouchRipples: modeItem.id !== 'eco',
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-emerald-500/15 border-emerald-400 text-white'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold">{modeItem.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                          {modeItem.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* True-Black OLED Night Dimming Toggle & Power Readout */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, oledDimming: !prev.oledDimming }))
                    }
                    className="flex items-center justify-between sm:justify-start gap-3 text-left text-xs text-slate-200 hover:text-white"
                  >
                    <span>True-Black OLED Night Pixels (#000000 subpixel shutoff after dusk)</span>
                    <span
                      className={`font-mono font-semibold ${
                        config.oledDimming ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {config.oledDimming ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400">
                    <span>{batteryProfile.gpuWakeupsPerMin} GPU wakeup/min</span>
                    <span aria-hidden="true">·</span>
                    <span>{batteryProfile.oledPixelSavingsPct}% OLED saved</span>
                  </div>
                </div>
              </div>

              {/* Weather Preset Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Atmospheric & Weather Presets
                  </span>
                  <span className="font-mono tabular-nums text-sky-300">
                    Active: {weatherVisuals.summaryLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEATHER_OPTIONS.map((w) => {
                    const active = config.weather === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            weather: w.id,
                            enableSnowflakes: w.id === 'snow' ? true : w.id === 'clear' ? false : prev.enableSnowflakes,
                            enableWindStreaks: w.id === 'wind' ? true : w.id === 'clear' ? false : prev.enableWindStreaks,
                            enableMistLayer: w.id === 'mist' ? true : w.id === 'clear' ? false : prev.enableMistLayer,
                            enableAuroraLayer: w.id === 'aurora' ? true : w.id === 'clear' ? false : prev.enableAuroraLayer,
                          }))
                        }
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                          active
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggleable Weather Condition Visual Layers (Snowflakes, Wind Streaks, Mist, Aurora) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Toggleable Weather Conditions (Canvas Visual Layers)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Independently toggle or combine snowflakes, wind streaks, valley mist, and aurora ribbons on the live canvas.
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-sky-300">
                    {weatherVisuals.activeConditionLabels.length} active layer(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle 1: Crystalline Snowflakes */}
                  <button
                    type="button"
                    data-testid="toggle-snowflakes"
                    onClick={() =>
                      setConfig((prev) => {
                        const currentlyActive =
                          prev.weather === 'snow' || Boolean(prev.enableSnowflakes);
                        const nextActive = !currentlyActive;
                        return {
                          ...prev,
                          enableSnowflakes: nextActive,
                          weather:
                            !nextActive && prev.weather === 'snow'
                              ? 'clear'
                              : nextActive && prev.weather === 'clear'
                              ? 'snow'
                              : prev.weather,
                        };
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      weatherVisuals.snowActive
                        ? 'bg-sky-500/15 border-sky-400 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Snowflake
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          weatherVisuals.snowActive ? 'text-sky-300' : 'text-slate-500'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">Crystalline Snowflakes</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          14 6-pointed ice crystals, 34 powder flurries, and frost-rimmed mountain ridges
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold shrink-0 ${
                        weatherVisuals.snowActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {weatherVisuals.snowActive ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Toggle 2: Aerodynamic Wind Streaks */}
                  <button
                    type="button"
                    data-testid="toggle-wind-streaks"
                    onClick={() =>
                      setConfig((prev) => {
                        const currentlyActive =
                          prev.weather === 'wind' || Boolean(prev.enableWindStreaks);
                        const nextActive = !currentlyActive;
                        return {
                          ...prev,
                          enableWindStreaks: nextActive,
                          weather:
                            !nextActive && prev.weather === 'wind'
                              ? 'clear'
                              : nextActive && prev.weather === 'clear'
                              ? 'wind'
                              : prev.weather,
                        };
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      weatherVisuals.windActive
                        ? 'bg-cyan-500/15 border-cyan-400 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Wind
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          weatherVisuals.windActive ? 'text-cyan-300' : 'text-slate-500'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">Aerodynamic Wind Streaks</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          16 sweeping air ribbons with spiral eddies, wind-swept leaves, and water whitecaps
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold shrink-0 ${
                        weatherVisuals.windActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {weatherVisuals.windActive ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Toggle 3: Valley Mist & Shoreline Fog */}
                  <button
                    type="button"
                    data-testid="toggle-valley-mist"
                    onClick={() =>
                      setConfig((prev) => {
                        const currentlyActive =
                          prev.weather === 'mist' || Boolean(prev.enableMistLayer);
                        const nextActive = !currentlyActive;
                        return {
                          ...prev,
                          enableMistLayer: nextActive,
                          weather:
                            !nextActive && prev.weather === 'mist'
                              ? 'clear'
                              : nextActive && prev.weather === 'clear'
                              ? 'mist'
                              : prev.weather,
                        };
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      config.weather === 'mist' || config.enableMistLayer
                        ? 'bg-slate-800/90 border-slate-500 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <CloudFog
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          config.weather === 'mist' || config.enableMistLayer
                            ? 'text-slate-200'
                            : 'text-slate-500'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">Valley Mist & Shoreline Fog</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Atmospheric low-lying shoreline vapor band drifting over the reflective water
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold shrink-0 ${
                        config.weather === 'mist' || config.enableMistLayer
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {config.weather === 'mist' || config.enableMistLayer ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Toggle 4: Geomagnetic Aurora Ribbons */}
                  <button
                    type="button"
                    data-testid="toggle-aurora-ribbons"
                    onClick={() =>
                      setConfig((prev) => {
                        const currentlyActive =
                          prev.weather === 'aurora' || Boolean(prev.enableAuroraLayer);
                        const nextActive = !currentlyActive;
                        return {
                          ...prev,
                          enableAuroraLayer: nextActive,
                          weather:
                            !nextActive && prev.weather === 'aurora'
                              ? 'clear'
                              : nextActive && prev.weather === 'clear'
                              ? 'aurora'
                              : prev.weather,
                        };
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      config.weather === 'aurora' || config.enableAuroraLayer
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Compass
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          config.weather === 'aurora' || config.enableAuroraLayer
                            ? 'text-emerald-300'
                            : 'text-slate-500'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">Geomagnetic Aurora Ribbons</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Translucent emerald and violet geomagnetic curtains in the upper atmosphere
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold shrink-0 ${
                        config.weather === 'aurora' || config.enableAuroraLayer
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {config.weather === 'aurora' || config.enableAuroraLayer ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Adaptive Precipitation Density (Temperature-Driven Rain Control) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Adaptive Precipitation Density (Temperature-Driven Rain)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Transitions rainfall from light drizzle in cool air to heavy convective downpours in warm air.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        adaptivePrecipitation: !(prev.adaptivePrecipitation ?? true),
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                      config.adaptivePrecipitation ?? true
                        ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {config.adaptivePrecipitation ?? true ? 'Adaptive: ON' : 'Adaptive: OFF'}
                  </button>
                </div>

                {/* Temperature Slider & Auto Diurnal Temp Sync */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <label
                      htmlFor="ambient-temp-slider"
                      className="font-medium text-slate-200 flex items-center gap-1.5"
                    >
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Ambient Temperature: <strong className="font-mono tabular-nums text-white">{currentTempC}°C</strong>
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-sky-300 font-semibold">
                        {precipState.active
                          ? `${precipState.regimeLabel} (${precipState.rainfallRateMmPerHr} mm/hr · ${precipState.dropCount} drops)`
                          : `Select Adaptive Rain to preview (${
                              currentTempC <= 12
                                ? 'Light Drizzle'
                                : currentTempC >= 22
                                ? 'Heavy Downpour'
                                : 'Moderate Shower'
                            })`}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          autoTemperature: !(prev.autoTemperature ?? true),
                          customTemperatureCelsius: currentTempC,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        config.autoTemperature ?? true
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {config.autoTemperature ?? true ? 'Auto Diurnal Temp' : 'Manual Temp Override'}
                    </button>
                  </div>

                  <input
                    id="ambient-temp-slider"
                    type="range"
                    min={2}
                    max={34}
                    step={1}
                    value={currentTempC}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        weather: 'rain',
                        autoTemperature: false,
                        customTemperatureCelsius: Number(e.target.value),
                      }))
                    }
                    aria-label="Ambient Temperature in Celsius"
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                    <span>2°C Cold Drizzle</span>
                    <span>12°C Drizzle / Shower</span>
                    <span>22°C Warm Threshold</span>
                    <span>34°C Tropical Downpour</span>
                  </div>
                </div>

                {/* 3 One-Click Rain Regime Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    {
                      id: 'light_drizzle' as const,
                      title: 'Light Drizzle (8°C)',
                      subtitle: '42 drops · 10px streaks · 2.5 mm/hr',
                      temp: 8,
                    },
                    {
                      id: 'steady_shower' as const,
                      title: 'Moderate Shower (17°C)',
                      subtitle: '71 drops · 20px streaks · 8.1 mm/hr',
                      temp: 17,
                    },
                    {
                      id: 'heavy_downpour' as const,
                      title: 'Heavy Downpour (29°C)',
                      subtitle: '110 drops · 27px streaks · 25.0 mm/hr',
                      temp: 29,
                    },
                  ].map((preset) => {
                    const isSelected =
                      config.weather === 'rain' && precipState.regime === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            weather: 'rain',
                            adaptivePrecipitation: true,
                            autoTemperature: false,
                            customTemperatureCelsius: preset.temp,
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-400 text-white'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-semibold">{preset.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                          {preset.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lunar Phase & Parallax Depth Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Lunar Phase Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">Nocturnal Lunar Phase</span>
                    <span className="text-slate-400">Visible 18:30 – 06:15</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MOON_OPTIONS.map((m) => {
                      const active = config.moonPhase === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, moonPhase: m.id }))}
                          className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                            active
                              ? 'bg-sky-400/20 border-sky-400 text-white font-semibold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3D Gyro Parallax Depth Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="parallax-slider" className="font-medium text-slate-200">
                      Gyroscope Parallax Depth
                    </label>
                    <span className="font-mono tabular-nums text-amber-300 font-semibold">
                      {config.parallaxStrength}%
                    </span>
                  </div>
                  <input
                    id="parallax-slider"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={config.parallaxStrength}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        parallaxStrength: Number(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="text-[11px] text-slate-400">
                    Controls multi-layer ridge and celestial shift when tilting the Android device.
                  </div>
                </div>
              </div>

              {/* 4 Living Ecosystem & Wildlife Toggles */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-white">
                  Living Ecosystem & Celestial Toggles
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'enableWildlife' as const,
                      title: 'Time-Adaptive Wildlife & Flora',
                      desc: 'Bird flocks by day, sunlit pollen/petals in afternoon, glowing fireflies at night',
                      icon: Bird,
                    },
                    {
                      key: 'enableCelestialRays' as const,
                      title: 'Solar Corona & Crepuscular Rays',
                      desc: 'Volumetric sunbeams during sunny afternoon and golden hour',
                      icon: Sparkles,
                    },
                    {
                      key: 'enableArtificialLights' as const,
                      title: 'Nocturnal Lamps, Campfire & Beacons',
                      desc: 'Cabin windows, campfire sparks, lighthouse beam, and city lights after dusk',
                      icon: Flame,
                    },
                    {
                      key: 'enableTouchRipples' as const,
                      title: 'Interactive Touch Light Ripples',
                      desc: 'Spawns expanding water and light ripples when tapping the Android screen',
                      icon: Waves,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const enabled = config[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                          enabled
                            ? 'bg-slate-950/90 border-slate-700 text-white'
                            : 'bg-slate-950/40 border-slate-800/70 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              enabled ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-semibold">{item.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-mono font-semibold shrink-0 ${
                            enabled ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {enabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SECTION 4: ANDROID 15 MATERIAL YOU DYNAMIC COLOR EXTRACTION */}
            <section
              id="material-you"
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-display font-bold text-white">
                    04. Live Material You Palette Extraction (`WallpaperColors` API)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time color tokens supplied to Android 15 lock-screen clocks, widgets, and adaptive icons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Inspect Kotlin & APK</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Sky Zenith', hex: skyPalette.zenith },
                  { label: 'Mid Canopy', hex: skyPalette.midSky },
                  { label: 'Horizon Glow', hex: skyPalette.horizon },
                  { label: 'Water Surface', hex: skyPalette.waterTop },
                  { label: 'Material Accent', hex: materialTokens.accentPrimary },
                ].map((swatch) => (
                  <div
                    key={swatch.label}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-white/15 shrink-0 shadow-inner"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {swatch.label}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-400 uppercase">
                        {swatch.hex}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Android APK Project Download Banner */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold text-white">
                      Native Android 15 Live Wallpaper APK Package (`com.solstice.wallpaper`)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Includes `SolsticeWallpaperService.kt`, 1-tap `MainActivity.kt` launcher, `AndroidManifest.xml`, Gradle build scripts, and 1-click GitHub Actions Cloud APK compiler.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="direct-download-apk-zip-btn"
                    onClick={handleDownloadApkZip}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download APK Project (.zip)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(true)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
                  >
                    APK Guide & Source
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Solstice — Time-Adaptive Android Live Wallpaper Studio</span>
          <div className="flex items-center gap-3">
            <span>Dawn · Bright Day · Sunny Afternoon · Golden Dusk · Starry Night</span>
          </div>
        </div>
      </footer>

      {/* Export Wallpaper & Native Android Code Modal */}
      <ExportWallpaperModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        config={config}
        canvasRef={canvasRef}
      />
    </div>
  );
}
