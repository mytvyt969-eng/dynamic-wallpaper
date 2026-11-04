import React, { useState } from 'react';
import {
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Wind,
  Sparkles,
  Compass,
  Camera,
  Sliders,
  Maximize2,
  Minimize2,
  Wifi,
  BatteryCharging,
  Lock,
  Smartphone,
  Eye,
  Flashlight,
} from 'lucide-react';
import {
  WallpaperConfig,
  getCelestialState,
  getMaterialYouTokens,
  getBatteryProfile,
  getAmbientTemperatureCelsius,
  getPrecipitationState,
  getWeatherVisualState,
  BIOME_CATALOG,
} from '../utils/diurnalEngine';
import { LiveWallpaperCanvas } from './LiveWallpaperCanvas';

export type AndroidScreenMode = 'lock' | 'home' | 'clean';

interface AndroidDevicePreviewProps {
  config: WallpaperConfig;
  screenMode: AndroidScreenMode;
  onScreenModeChange: (mode: AndroidScreenMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onQuickPresetSelect: (minutes: number) => void;
}

export const AndroidDevicePreview: React.FC<AndroidDevicePreviewProps> = ({
  config,
  screenMode,
  onScreenModeChange,
  isFullscreen,
  onToggleFullscreen,
  canvasRef,
  onQuickPresetSelect,
}) => {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [torchActive, setTorchActive] = useState(false);
  const [activeAppToast, setActiveAppToast] = useState<string | null>(null);

  const celestial = getCelestialState(config.minutes, config.locationSolar);
  const tokens = getMaterialYouTokens(config.minutes, config.biome, config.locationSolar);
  const battery = getBatteryProfile(config);
  const tempCelsius = getAmbientTemperatureCelsius(config);
  const precip = getPrecipitationState(config);
  const weatherVisuals = getWeatherVisualState(config);
  const currentBiome = BIOME_CATALOG.find((b) => b.id === config.biome) || BIOME_CATALOG[0];

  const [hoursStr, minsStr] = celestial.formattedTime.split(':');

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((config.powerMode || 'eco') === 'eco' || config.parallaxStrength === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x: Number(nx.toFixed(2)), y: Number(ny.toFixed(2)) });
  };

  const handlePointerLeave = () => {
    if (parallax.x !== 0 || parallax.y !== 0) {
      setParallax({ x: 0, y: 0 });
    }
  };

  const triggerAppFeedback = (label: string) => {
    setActiveAppToast(label);
    setTimeout(() => {
      setActiveAppToast((prev) => (prev === label ? null : prev));
    }, 2200);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Device Mode Switcher Toolbar */}
      <div className="flex items-center justify-between gap-2 w-full max-w-[368px] mb-3">
        <div
          role="group"
          aria-label="Android Screen Overlay Mode"
          className="flex items-center gap-0.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl"
        >
          <button
            type="button"
            onClick={() => onScreenModeChange('lock')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              screenMode === 'lock'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
          <button
            type="button"
            onClick={() => onScreenModeChange('home')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              screenMode === 'home'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => onScreenModeChange('clean')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
              screenMode === 'clean'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit Expanded Preview' : 'Expand Device Preview'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Compact' : 'Expand'}</span>
        </button>
      </div>

      {/* Android 15 Hardware Bezel */}
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`relative bg-slate-950 rounded-[44px] p-3 border-[3px] border-slate-800 shadow-2xl transition-all duration-200 select-none ${
          isFullscreen ? 'w-full max-w-[420px] aspect-[9/18]' : 'w-full max-w-[356px] aspect-[9/18]'
        }`}
      >
        {/* Inner OLED Screen Viewport */}
        <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-slate-950">
          {/* Punch-hole Front Camera */}
          <div
            aria-hidden="true"
            className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black border border-slate-800/80 z-30 pointer-events-none"
          />

          {/* Torch / Flashlight Overlay Effect */}
          {torchActive && (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-amber-100/20 mix-blend-screen pointer-events-none z-10"
            />
          )}

          {/* Live 60FPS Diurnal Wallpaper Canvas */}
          <LiveWallpaperCanvas
            config={config}
            parallaxX={parallax.x}
            parallaxY={parallax.y}
            canvasRef={canvasRef}
          />

          {/* Android Status Bar (Shown in Lock & Home modes) */}
          {screenMode !== 'clean' && (
            <div className="absolute top-0 inset-x-0 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-medium text-white/95 drop-shadow z-20 pointer-events-none">
              <span className="font-mono tabular-nums">{celestial.formattedTime}</span>
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5" />
                <BatteryCharging className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* MODE 1: ANDROID 15 LOCK SCREEN */}
          {screenMode === 'lock' && (
            <div className="absolute inset-0 flex flex-col justify-between p-6 pt-12 pb-6 pointer-events-none z-20">
              {/* Top Material You Lock Clock & Diurnal Weather Summary */}
              <div className="flex flex-col items-center text-center mt-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] mb-2">
                  {precip.active ? (
                    <CloudRain className="w-4 h-4 text-sky-300" />
                  ) : weatherVisuals.snowActive ? (
                    <Snowflake className="w-4 h-4 text-sky-200" />
                  ) : weatherVisuals.windActive ? (
                    <Wind className="w-4 h-4 text-cyan-200" />
                  ) : celestial.isSunnyAfternoon ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : celestial.isDaylight ? (
                    <Sun className="w-4 h-4 text-sky-200" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-200" />
                  )}
                  <span>
                    {precip.active
                      ? precip.regimeLabel
                      : weatherVisuals.snowActive && weatherVisuals.windActive
                      ? 'Snow & Wind'
                      : weatherVisuals.snowActive
                      ? 'Snowflakes'
                      : weatherVisuals.windActive
                      ? 'Wind Streaks'
                      : weatherVisuals.activeConditionLabels.length > 0
                      ? weatherVisuals.activeConditionLabels[0]
                      : celestial.phase.label}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{tempCelsius}°C</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentBiome.name}</span>
                </div>

                {/* Expressive Material You Stacked Clock */}
                <div
                  style={{ color: tokens.clockText }}
                  className="font-display font-bold leading-[0.86] tracking-tight text-[74px] drop-shadow-[0_4px_20px_rgba(2,6,23,0.65)] font-mono tabular-nums select-none"
                >
                  <div>{hoursStr}</div>
                  <div>{minsStr}</div>
                </div>

                <p className="mt-3 text-xs font-medium text-white drop-shadow-[0_2px_8px_rgba(2,6,23,0.85)] max-w-[260px] leading-relaxed">
                  {precip.active
                    ? `${precip.regimeLabel} · ${precip.rainfallRateMmPerHr} mm/hr · ${precip.dropCount} active drops`
                    : weatherVisuals.snowActive && weatherVisuals.windActive
                    ? `Blizzard Flurries · ${weatherVisuals.crystalCount} hex crystals · ${weatherVisuals.windSpeedKmh} km/h wind streaks`
                    : weatherVisuals.snowActive
                    ? `Crystalline Snowflakes · ${weatherVisuals.crystalCount} hex crystals · ${weatherVisuals.snowflakeCount} flurries`
                    : weatherVisuals.windActive
                    ? `Aerodynamic Wind Streaks · ${weatherVisuals.windStreakCount} air ribbons · ${weatherVisuals.windSpeedKmh} km/h gusts`
                    : celestial.phase.ambientSummary}
                </p>
              </div>

              {/* Bottom Lock Screen Interactive Controls */}
              <div className="flex flex-col gap-3 pointer-events-auto">
                {/* Material You Live Diurnal Cycle Quick-Jump Strip */}
                <div
                  style={{
                    backgroundColor: tokens.widgetBg,
                    borderColor: tokens.widgetBorder,
                  }}
                  className="backdrop-blur-md border rounded-2xl p-3 text-left transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-white/80 mb-1.5">
                    <span className="font-semibold text-white truncate">
                      {config.locationSolar
                        ? `${config.locationSolar.city} (${celestial.formattedSunrise}–${celestial.formattedSunset})`
                        : battery.mode === 'eco'
                        ? 'Eco Static Mode'
                        : battery.label}
                    </span>
                    <span className="font-mono tabular-nums shrink-0">
                      ~{battery.estimatedDrainPctPerHour}%/hr · {celestial.kelvin}K
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      {
                        label: 'Dawn',
                        mins: config.locationSolar ? config.locationSolar.sunriseMinutes : 360,
                      },
                      {
                        label: 'Day',
                        mins: config.locationSolar
                          ? Math.round(
                              (config.locationSolar.sunriseMinutes +
                                config.locationSolar.solarNoonMinutes) /
                                2
                            )
                          : 570,
                      },
                      {
                        label: 'Sunny',
                        mins: config.locationSolar ? config.locationSolar.solarNoonMinutes : 870,
                      },
                      {
                        label: 'Night',
                        mins: config.locationSolar
                          ? Math.min(1410, config.locationSolar.sunsetMinutes + 90)
                          : 1320,
                      },
                    ].map((item) => {
                      const active = Math.abs(config.minutes - item.mins) < 75;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => onQuickPresetSelect(item.mins)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-white text-slate-950 font-semibold'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lock Screen Bottom Shortcuts */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setTorchActive((prev) => !prev)}
                    aria-label="Toggle Lock Screen Flashlight"
                    className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-colors ${
                      torchActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-950/50 text-white border-white/20 hover:bg-slate-900/70'
                    }`}
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onScreenModeChange('home')}
                    className="text-[11px] font-medium text-white/80 hover:text-white px-3 py-2 rounded-lg backdrop-blur-sm bg-black/20 transition-colors"
                  >
                    Tap to Unlock Home
                  </button>

                  <button
                    type="button"
                    onClick={() => onScreenModeChange('clean')}
                    aria-label="Inspect Clean Wallpaper Canvas"
                    className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md bg-slate-950/50 text-white border border-white/20 hover:bg-slate-900/70 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: ANDROID 15 HOME LAUNCHER */}
          {screenMode === 'home' && (
            <div className="absolute inset-0 flex flex-col justify-between p-5 pt-12 pb-5 pointer-events-none z-20">
              {/* Material You At-a-Glance & Diurnal Weather Widget */}
              <div
                style={{
                  backgroundColor: tokens.widgetBg,
                  borderColor: tokens.widgetBorder,
                }}
                className="backdrop-blur-md border rounded-3xl p-4 text-white pointer-events-auto shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white/80">{currentBiome.name}</div>
                    <div className="text-2xl font-display font-bold tracking-tight mt-0.5">
                      {celestial.phase.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold tabular-nums">{tempCelsius}°C</div>
                    <div className="text-[11px] text-white/75 font-mono tabular-nums">
                      Alt {celestial.sunVisible ? `${celestial.sunAltitudeDeg}° Sun` : `${celestial.moonAltitudeDeg}° Moon`}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/85">
                  <span>
                    {precip.active
                      ? `${precip.regimeLabel} (${precip.rainfallRateMmPerHr} mm/hr)`
                      : weatherVisuals.snowActive || weatherVisuals.windActive
                      ? weatherVisuals.summaryLabel
                      : celestial.isSunnyAfternoon
                      ? 'Peak UV & Solar Rays Active'
                      : celestial.isNight
                      ? 'Nocturnal Starfield & Fireflies'
                      : 'Dynamic Diurnal Sync Active'}
                  </span>
                  <span className="font-mono tabular-nums">{celestial.formatted12h}</span>
                </div>
              </div>

              {/* Toast notification when user taps an adaptive icon */}
              {activeAppToast && (
                <div className="mx-auto px-3.5 py-2 rounded-xl bg-slate-950/85 border border-white/15 text-xs text-white backdrop-blur-md shadow-lg">
                  {activeAppToast}
                </div>
              )}

              {/* Bottom Adaptive Material You App Grid & Dock */}
              <div className="flex flex-col gap-4 pointer-events-auto">
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    {
                      name: 'Dawn 6AM',
                      icon: Sun,
                      action: () => {
                        onQuickPresetSelect(360);
                        triggerAppFeedback('Switched wallpaper to Rosy Dawn (06:00)');
                      },
                    },
                    {
                      name: 'Sunny 2PM',
                      icon: Sparkles,
                      action: () => {
                        onQuickPresetSelect(870);
                        triggerAppFeedback('Switched wallpaper to Sunny Afternoon (14:30)');
                      },
                    },
                    {
                      name: 'Dusk 6PM',
                      icon: Compass,
                      action: () => {
                        onQuickPresetSelect(1095);
                        triggerAppFeedback('Switched wallpaper to Golden Dusk (18:15)');
                      },
                    },
                    {
                      name: 'Night 10PM',
                      icon: Moon,
                      action: () => {
                        onQuickPresetSelect(1320);
                        triggerAppFeedback('Switched wallpaper to Starry Night (22:00)');
                      },
                    },
                  ].map((app) => {
                    const IconComponent = app.icon;
                    return (
                      <button
                        key={app.name}
                        type="button"
                        onClick={app.action}
                        className="flex flex-col items-center gap-1.5 group focus:outline-none"
                      >
                        <div
                          style={{
                            backgroundColor: tokens.widgetBg,
                            borderColor: tokens.widgetBorder,
                          }}
                          className="w-13 h-13 rounded-2xl backdrop-blur-md border flex items-center justify-center text-white group-hover:scale-105 group-active:scale-95 transition-transform shadow-md"
                        >
                          <IconComponent
                            style={{ color: tokens.accentPrimary }}
                            className="w-5 h-5"
                          />
                        </div>
                        <span className="text-[11px] font-medium text-white drop-shadow whitespace-nowrap">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Android Launcher Dock Bar */}
                <div
                  style={{
                    backgroundColor: tokens.widgetBg,
                    borderColor: tokens.widgetBorder,
                  }}
                  className="backdrop-blur-md border rounded-full px-4 py-2.5 flex items-center justify-between text-xs text-white/90"
                >
                  <span className="truncate">Tap wallpaper for interactive ripples</span>
                  <Sliders className="w-3.5 h-3.5 shrink-0 text-white/75" />
                </div>

                {/* Android Gesture Navigation Pill */}
                <div className="w-28 h-1 bg-white/70 rounded-full mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Battery & Redraw Status Under Phone */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 text-center">
        <span>{battery.label}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono tabular-nums">~{battery.estimatedDrainPctPerHour}% battery/hr</span>
        <span aria-hidden="true">·</span>
        <span>{battery.targetFps === 0 ? '1 redraw/min' : `${battery.targetFps} FPS`}</span>
      </div>
    </div>
  );
};
