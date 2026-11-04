import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Code2,
  Image as ImageIcon,
  Package,
  Smartphone,
  FileCode,
} from 'lucide-react';
import {
  WallpaperConfig,
  getCelestialState,
  getBatteryProfile,
  getWeatherVisualState,
  BIOME_CATALOG,
} from '../utils/diurnalEngine';
import {
  generateAndroidProjectFiles,
  createAndroidProjectZipBytes,
} from '../utils/androidProjectBuilder';

interface ExportWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WallpaperConfig;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ExportWallpaperModal: React.FC<ExportWallpaperModalProps> = ({
  isOpen,
  onClose,
  config,
  canvasRef,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadPngSuccess, setDownloadPngSuccess] = useState(false);
  const [downloadZipSuccess, setDownloadZipSuccess] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  if (!isOpen) return null;

  const projectFiles = generateAndroidProjectFiles(config);
  const activeFile = projectFiles[selectedFileIndex] || projectFiles[0];
  const celestial = getCelestialState(config.minutes);
  const battery = getBatteryProfile(config);
  const visuals = getWeatherVisualState(config);
  const biomeInfo = BIOME_CATALOG.find((b) => b.id === config.biome) || BIOME_CATALOG[0];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadApkProjectZip = () => {
    const zipBytes = createAndroidProjectZipBytes(config);
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `solstice-android-apk-project-${config.biome}.zip`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setDownloadZipSuccess(true);
    setTimeout(() => setDownloadZipSuccess(false), 3000);
  };

  const handleDownloadSingleFile = () => {
    const fileName = activeFile.path.split('/').pop() || 'SolsticeWallpaperService.kt';
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `solstice-${config.biome}-${celestial.formattedTime.replace(':', '')}.png`;
    link.href = dataUrl;
    link.click();
    setDownloadPngSuccess(true);
    setTimeout(() => setDownloadPngSuccess(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 id="export-modal-title" className="text-lg font-display font-bold text-white">
              Android APK Project & Live Wallpaper Export
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span>{biomeInfo.name}</span>
              <span aria-hidden="true"> · </span>
              <span>{visuals.summaryLabel}</span>
              <span aria-hidden="true"> · </span>
              <span>{battery.label} (~{battery.estimatedDrainPctPerHour}%/hr)</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Export Modal"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Primary Action: Download Complete Android APK Project (.zip) */}
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-display font-bold text-white">
                <Package className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Complete Android APK Project Bundle (.zip)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Includes <code className="font-mono text-amber-300">SolsticeWallpaperService.kt</code>,{' '}
                <code className="font-mono text-amber-300">MainActivity.kt</code> (1-tap wallpaper installer),{' '}
                <code className="font-mono text-amber-300">AndroidManifest.xml</code>, Gradle scripts, and an automated GitHub Actions cloud APK compiler (<code className="font-mono text-amber-300">app-debug.apk</code>).
              </p>
            </div>
            <button
              type="button"
              data-testid="download-apk-zip-btn"
              onClick={handleDownloadApkProjectZip}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
            >
              {downloadZipSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>APK Project Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download APK Project (.zip)</span>
                </>
              )}
            </button>
          </div>

          {/* How to Install APK on Your Phone (2 Fast Paths) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Path 1: 1-Click Cloud APK Build (No IDE needed)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upload the unzipped folder to a GitHub repo. The included{' '}
                <code className="font-mono text-slate-300">.github/workflows/build-apk.yml</code>{' '}
                automatically compiles and publishes <code className="font-mono text-emerald-300">app-debug.apk</code> in ~60 seconds.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Path 2: Android Studio / Gradle CLI</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Open the unzipped project in Android Studio and click{' '}
                <strong className="text-slate-200">Build &gt; Build APK(s)</strong>, or run{' '}
                <code className="font-mono text-sky-300">gradle assembleDebug</code> to output{' '}
                <code className="font-mono text-slate-300">app-debug.apk</code>.
              </p>
            </div>
          </div>

          {/* Secondary Action: Instant 9:16 PNG Wallpaper Frame Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Save 9:16 High-Resolution Wallpaper Frame (PNG)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Captures the current sky gradient, sun/moon arc, biome silhouette, and weather layers for immediate phone use.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
            >
              {downloadPngSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PNG Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 9:16 PNG</span>
                </>
              )}
            </button>
          </div>

          {/* Inspect & Copy Individual Android APK Source Files */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>Inspect Generated Android Project Files ({projectFiles.length} files in bundle)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSingleFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save {activeFile.path.split('/').pop()}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* File Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {projectFiles.slice(0, 6).map((file, idx) => {
                const shortName = file.path.split('/').pop() || file.path;
                const isSelected = idx === selectedFileIndex;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-amber-400/20 border border-amber-400 text-amber-300 font-semibold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <span className="text-slate-300 truncate">Path: {activeFile.path}</span>
              <span className="text-slate-400 shrink-0">{activeFile.description}</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[240px] leading-relaxed">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Android SDK 26–35 (Android 8.0 to Android 15) · Zero External Dependencies</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
