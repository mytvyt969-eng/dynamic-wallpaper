import {
  WallpaperConfig,
  generateAndroidWallpaperKotlin,
  getCelestialState,
  getBatteryProfile,
  getWeatherVisualState,
} from './diurnalEngine';

export interface AndroidProjectFile {
  path: string;
  description: string;
  content: string;
}

export function generateAndroidManifestXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.solstice.livewallpaper">

    <!-- Required feature for Android Live Wallpapers -->
    <uses-feature
        android:name="android.software.live_wallpaper"
        android:required="true" />

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">

        <!-- Launcher Activity: 1-Tap "Apply Live Wallpaper" Installer -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Native Android Live Wallpaper Engine Service -->
        <service
            android:name=".SolsticeWallpaperService"
            android:enabled="true"
            android:exported="true"
            android:label="@string/wallpaper_label"
            android:permission="android.permission.BIND_WALLPAPER">
            <intent-filter>
                <action android:name="android.service.wallpaper.WallpaperService" />
            </intent-filter>
            <meta-data
                android:name="android.service.wallpaper"
                android:resource="@xml/wallpaper" />
        </service>
    </application>
</manifest>
`;
}

export function generateMainActivityKotlin(config: WallpaperConfig): string {
  const celestial = getCelestialState(config.minutes);
  const battery = getBatteryProfile(config);
  const visuals = getWeatherVisualState(config);

  return `package com.solstice.livewallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Launcher Activity that opens the Android system Live Wallpaper preview
 * directly targeting SolsticeWallpaperService.
 */
class MainActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(72, 96, 72, 96)
            setBackgroundColor(Color.parseColor("#020617"))
        }

        val badge = TextView(this).apply {
            text = "SOLSTICE ANDROID 15 LIVE WALLPAPER"
            textSize = 11f
            setTextColor(Color.parseColor("#FBBF24"))
            typeface = Typeface.MONOSPACE
            gravity = Gravity.CENTER
        }

        val title = TextView(this).apply {
            text = "Time-Adaptive Diurnal Wallpaper"
            textSize = 24f
            setTextColor(Color.WHITE)
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 16)
        }

        val summary = TextView(this).apply {
            text = "Biome: ${config.biome.toUpperCase()} · ${celestial.phase.label}\\n" +
                   "Weather: ${visuals.summaryLabel}\\n" +
                   "Power Governor: ${battery.label} (~${battery.estimatedDrainPctPerHour}%/hr)"
            textSize = 14f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 64)
        }

        val applyButton = Button(this).apply {
            text = "Apply Solstice Live Wallpaper"
            textSize = 15f
            isAllCaps = false
            setTextColor(Color.parseColor("#020617"))
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            background = GradientDrawable().apply {
                cornerRadius = 32f
                setColor(Color.parseColor("#FBBF24"))
            }
            setPadding(56, 36, 56, 36)
            setOnClickListener {
                openLiveWallpaperPicker()
            }
        }

        root.addView(badge)
        root.addView(title)
        root.addView(summary)
        root.addView(applyButton)
        setContentView(root)
    }

    private fun openLiveWallpaperPicker() {
        try {
            val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
                putExtra(
                    WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                    ComponentName(this@MainActivity, SolsticeWallpaperService::class.java)
                )
            }
            startActivity(intent)
        } catch (_: Exception) {
            startActivity(Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER))
        }
    }
}
`;
}

export function generateAndroidProjectFiles(config: WallpaperConfig): AndroidProjectFile[] {
  const battery = getBatteryProfile(config);
  const visuals = getWeatherVisualState(config);

  const wallpaperXml = `<?xml version="1.0" encoding="utf-8"?>
<wallpaper xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/wallpaper_description"
    android:settingsActivity="com.solstice.livewallpaper.MainActivity" />
`;

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Solstice Wallpaper</string>
    <string name="wallpaper_label">Solstice Diurnal Live Wallpaper</string>
    <string name="wallpaper_description">Real-time diurnal sky (${config.biome}) with ${visuals.summaryLabel} and ${battery.label}</string>
</resources>
`;

  const appBuildGradle = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.solstice.livewallpaper"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.solstice.livewallpaper"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Pure zero-dependency Android Canvas & WallpaperService SDK
}
`;

  const rootBuildGradle = `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`;

  const settingsGradle = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SolsticeLiveWallpaper"
include(":app")
`;

  const gradleProperties = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

  const githubWorkflowYaml = `name: Build Solstice Android APK

on:
  push:
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.7'

      - name: Build Debug APK
        run: gradle assembleDebug

      - name: Upload Compiled APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Solstice-LiveWallpaper-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
`;

  const readmeMd = `# Solstice — Android Live Wallpaper APK Project

This bundle contains a complete, zero-dependency native Android Live Wallpaper project configured with your exact Solstice settings:
- **Biome**: \`${config.biome.toUpperCase()}\`
- **Active Weather Layers**: \`${visuals.summaryLabel}\`
- **Battery Governor**: \`${battery.label}\` (\`~${battery.estimatedDrainPctPerHour}% / hr\`)

## Option A: Build APK in 1 Click via GitHub Actions (No Android Studio Required)
1. Create a new repository on GitHub and upload the contents of this ZIP file.
2. Open the **Actions** tab in your GitHub repository and select **Build Solstice Android APK**.
3. Download \`Solstice-LiveWallpaper-debug-apk\` (\`app-debug.apk\`) from the workflow artifacts and install it on your Android phone.

## Option B: Build APK Locally with Android Studio or Gradle
1. Unzip \`solstice-android-apk-project.zip\` and open the folder in **Android Studio**.
2. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)** (or run \`gradle assembleDebug\`).
3. Install \`app/build/outputs/apk/debug/app-debug.apk\` onto your Android device via USB or file transfer.
`;

  return [
    {
      path: 'app/src/main/java/com/solstice/livewallpaper/SolsticeWallpaperService.kt',
      description: 'Native Android WallpaperService engine with diurnal sky & weather physics',
      content: generateAndroidWallpaperKotlin(config),
    },
    {
      path: 'app/src/main/java/com/solstice/livewallpaper/MainActivity.kt',
      description: 'Launcher activity with 1-tap "Apply Solstice Live Wallpaper" button',
      content: generateMainActivityKotlin(config),
    },
    {
      path: 'app/src/main/AndroidManifest.xml',
      description: 'Android manifest registering BIND_WALLPAPER service & launcher',
      content: generateAndroidManifestXml(),
    },
    {
      path: 'app/src/main/res/xml/wallpaper.xml',
      description: 'System Live Wallpaper picker metadata descriptor',
      content: wallpaperXml,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      description: 'Application and wallpaper display strings',
      content: stringsXml,
    },
    {
      path: 'app/build.gradle.kts',
      description: 'Android module Gradle configuration (SDK 26–35)',
      content: appBuildGradle,
    },
    {
      path: 'build.gradle.kts',
      description: 'Root project Gradle plugins',
      content: rootBuildGradle,
    },
    {
      path: 'settings.gradle.kts',
      description: 'Gradle repository & module settings',
      content: settingsGradle,
    },
    {
      path: 'gradle.properties',
      description: 'JVM & AndroidX build flags',
      content: gradleProperties,
    },
    {
      path: '.github/workflows/build-apk.yml',
      description: 'Automated cloud APK compiler workflow (outputs app-debug.apk)',
      content: githubWorkflowYaml,
    },
    {
      path: 'README.md',
      description: 'Step-by-step APK compilation & installation guide',
      content: readmeMd,
    },
  ];
}

// IEEE 802.3 CRC-32 implementation for PKZIP archive generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Generates a valid binary PKZIP archive (.zip) containing all Android APK project files.
 */
export function createAndroidProjectZipBytes(config: WallpaperConfig): Uint8Array {
  const files = generateAndroidProjectFiles(config);
  const encoder = new TextEncoder();

  interface ZipEntryMeta {
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }

  const entries: ZipEntryMeta[] = [];
  const localChunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);

    // Local file header (30 bytes + file name length)
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract (2.0)
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = STORE)
    view.setUint16(10, 0x6000, true); // Last mod file time
    view.setUint16(12, 0x5964, true); // Last mod file date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    header.set(nameBytes, 30);

    entries.push({
      nameBytes,
      dataBytes,
      crc,
      offset: currentOffset,
    });

    localChunks.push(header, dataBytes);
    currentOffset += header.length + dataBytes.length;
  }

  const centralDirectoryOffset = currentOffset;
  const centralChunks: Uint8Array[] = [];
  let centralDirectorySize = 0;

  for (const entry of entries) {
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method (0 = STORE)
    view.setUint16(12, 0x6000, true); // Last mod time
    view.setUint16(14, 0x5964, true); // Last mod date
    view.setUint32(16, entry.crc, true); // CRC-32
    view.setUint32(20, entry.dataBytes.length, true); // Compressed size
    view.setUint32(24, entry.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, entry.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header
    cdHeader.set(entry.nameBytes, 46);

    centralChunks.push(cdHeader);
    centralDirectorySize += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, entries.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, entries.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // Comment length

  const totalLength = currentOffset + centralDirectorySize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(eocd, pos);

  return output;
}
