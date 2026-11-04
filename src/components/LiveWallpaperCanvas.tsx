import React, { useEffect, useRef } from 'react';
import {
  WallpaperConfig,
  getSkyPalette,
  getCelestialState,
  getPrecipitationState,
  getWeatherVisualState,
  hexToRgb,
} from '../utils/diurnalEngine';

interface TouchRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface StarPoint {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
}

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface BirdEntity {
  x: number;
  y: number;
  speed: number;
  wingPhase: number;
  scale: number;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
}

interface SnowflakeEntity {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  flutterPhase: number;
  rotation: number;
  isCrystal: boolean;
  opacity: number;
}

interface WindStreakEntity {
  x: number;
  y: number;
  length: number;
  amplitude: number;
  speed: number;
  phase: number;
  hasCurl: boolean;
  opacity: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface LiveWallpaperCanvasProps {
  config: WallpaperConfig;
  parallaxX: number; // -1 to 1
  parallaxY: number; // -1 to 1
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onCanvasTap?: (normalizedX: number, normalizedY: number) => void;
}

export const LiveWallpaperCanvas: React.FC<LiveWallpaperCanvasProps> = ({
  config,
  parallaxX,
  parallaxY,
  canvasRef: externalCanvasRef,
  onCanvasTap,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;

  const configRef = useRef<WallpaperConfig>(config);
  configRef.current = config;

  const parallaxRef = useRef({ x: parallaxX, y: parallaxY });
  parallaxRef.current = { x: parallaxX, y: parallaxY };

  const ripplesRef = useRef<TouchRipple[]>([]);
  const renderFrameRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deterministic starfield & particles (reduced count for battery efficiency)
    const stars: StarPoint[] = Array.from({ length: 90 }, (_, i) => ({
      x: ((i * 73 + 19) % 1000) / 1000,
      y: ((i * 41 + 7) % 580) / 1000,
      size: (i % 3 === 0 ? 1.8 : i % 2 === 0 ? 1.3 : 0.9),
      phase: (i * 0.7) % (Math.PI * 2),
      speed: 1.0 + (i % 5) * 0.3,
    }));

    const particles: FloatingParticle[] = Array.from({ length: 24 }, (_, i) => ({
      x: ((i * 97 + 13) % 1000) / 1000,
      y: 0.25 + ((i * 53) % 700) / 1000,
      vx: ((i % 2 === 0 ? 1 : -1) * (0.00012 + (i % 4) * 0.00004)),
      vy: -0.00008 - (i % 3) * 0.00004,
      size: 1.8 + (i % 4) * 0.6,
      phase: i * 0.9,
    }));

    const birds: BirdEntity[] = Array.from({ length: 6 }, (_, i) => ({
      x: ((i * 150 + 80) % 900) / 1000,
      y: 0.16 + (i % 3) * 0.045 + Math.floor(i / 3) * 0.05,
      speed: 0.00035 + (i % 3) * 0.00008,
      wingPhase: i * 0.8,
      scale: 0.75 + (i % 3) * 0.2,
    }));

    const raindrops: RainDrop[] = Array.from({ length: 120 }, (_, i) => ({
      x: ((i * 173 + i * i * 29 + 41) % 997) / 997,
      y: ((i * 281 + i * i * 53 + 17) % 991) / 991,
      length: 0.8 + ((i * 37) % 5) * 0.1, // relative multiplier
      speed: 0.85 + ((i * 23) % 4) * 0.1,
    }));

    const snowflakes: SnowflakeEntity[] = Array.from({ length: 48 }, (_, i) => ({
      x: ((i * 197 + i * i * 31 + 59) % 997) / 997,
      y: ((i * 263 + i * i * 43 + 29) % 991) / 991,
      radius: i < 14 ? 5.2 + (i % 4) * 0.85 : 1.8 + (i % 4) * 0.6,
      speedY: 0.0025 + (i % 5) * 0.0006,
      flutterPhase: (i * 1.13) % (Math.PI * 2),
      rotation: (i * 0.45) % (Math.PI * 2),
      isCrystal: i < 14,
      opacity: i < 14 ? 0.88 : 0.48 + (i % 5) * 0.09,
    }));

    const windStreaks: WindStreakEntity[] = Array.from({ length: 16 }, (_, i) => ({
      x: ((i * 223 + i * i * 19 + 71) % 997) / 997,
      y: 0.09 + ((i * 61 + 11) % 78) / 100,
      length: 68 + (i % 4) * 22,
      amplitude: 4.5 + (i % 3) * 3.0,
      speed: 0.006 + (i % 4) * 0.0018,
      phase: i * 0.75,
      hasCurl: i % 2 === 0,
      opacity: 0.36 + (i % 4) * 0.11,
    }));

    const shootingStar: ShootingStar = {
      x: 0.2,
      y: 0.12,
      vx: 0.009,
      vy: 0.0045,
      life: 0,
      maxLife: 55,
      active: false,
    };

    let animId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let frameCount = 0;

    const drawSingleFrame = (advanceMotion: boolean) => {
      if (advanceMotion) {
        frameCount++;
      }
      const cfg = configRef.current;
      const isEco = (cfg.powerMode || 'eco') === 'eco';
      const timeSec = isEco ? cfg.minutes * 0.05 : frameCount / 60;
      const sky = getSkyPalette(
        cfg.minutes,
        cfg.biome,
        cfg.weather,
        cfg.oledDimming,
        cfg.locationSolar
      );
      const cel = getCelestialState(cfg.minutes, cfg.locationSolar);
      const weatherVisuals = getWeatherVisualState(cfg);

      const w = canvas.width;
      const h = canvas.height;
      const waterLineY = h * 0.73;

      const pStrength = cfg.parallaxStrength / 100;
      const px = parallaxRef.current.x * 28 * pStrength;
      const py = parallaxRef.current.y * 14 * pStrength;

      // 1. Draw Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, waterLineY);
      skyGrad.addColorStop(0, sky.zenith);
      skyGrad.addColorStop(0.52, sky.midSky);
      skyGrad.addColorStop(1, sky.horizon);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, waterLineY + 2);

      // 2. Stars & Constellations (Night / Dusk / Dawn)
      if (cel.starOpacity > 0.01) {
        ctx.save();
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const twinkle = 0.45 + 0.55 * Math.sin(timeSec * s.speed + s.phase);
          const alpha = cel.starOpacity * twinkle * (cfg.weather === 'rain' ? 0.25 : 1);
          if (alpha <= 0.02) continue;
          const sx = ((s.x * w - px * 0.15) % w + w) % w;
          const sy = s.y * h - py * 0.1;
          ctx.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle constellation lines at deep night
        if (cel.starOpacity > 0.6 && cfg.weather !== 'rain') {
          ctx.strokeStyle = `rgba(186, 230, 253, ${(cel.starOpacity * 0.16).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const s1 = stars[i * 5];
            const s2 = stars[i * 5 + 1];
            ctx.moveTo(s1.x * w - px * 0.15, s1.y * h);
            ctx.lineTo(s2.x * w - px * 0.15, s2.y * h);
          }
          ctx.stroke();
        }

        // Periodic Shooting Star at night
        if (cel.shootingStarChance > 0 && cfg.weather !== 'rain') {
          if (!shootingStar.active && frameCount % 240 === 60) {
            shootingStar.active = true;
            shootingStar.life = 0;
            shootingStar.x = 0.15 + ((frameCount * 17) % 50) / 100;
            shootingStar.y = 0.08 + ((frameCount * 13) % 20) / 100;
          }
          if (shootingStar.active) {
            shootingStar.x += shootingStar.vx;
            shootingStar.y += shootingStar.vy;
            shootingStar.life++;
            const progress = shootingStar.life / shootingStar.maxLife;
            const alpha = Math.sin(progress * Math.PI) * cel.starOpacity;
            const headX = shootingStar.x * w;
            const headY = shootingStar.y * h;
            const tailX = headX - shootingStar.vx * w * 7;
            const tailY = headY - shootingStar.vy * h * 7;

            const streakGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
            streakGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
            streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = streakGrad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(headX, headY);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            if (shootingStar.life >= shootingStar.maxLife) {
              shootingStar.active = false;
            }
          }
        }
        ctx.restore();
      }

      // 3. Aurora Borealis (when weather === 'aurora', enableAuroraLayer, or midnight phase with autoAdapt)
      if (weatherVisuals.auroraActive) {
        ctx.save();
        const auroraAlpha = Math.max(0.42, cel.starOpacity * 0.72);
        for (let band = 0; band < 2; band++) {
          ctx.beginPath();
          const baseY = h * (0.16 + band * 0.08);
          ctx.moveTo(0, baseY);
          for (let x = 0; x <= w; x += 16) {
            const wave =
              Math.sin(x * 0.012 + timeSec * (0.8 + band * 0.3) + band) * 22 +
              Math.cos(x * 0.006 - timeSec * 0.5) * 14;
            ctx.lineTo(x, baseY + wave);
          }
          ctx.lineTo(w, baseY + 95);
          ctx.lineTo(0, baseY + 95);
          ctx.closePath();

          const aurGrad = ctx.createLinearGradient(0, baseY - 25, 0, baseY + 95);
          if (band === 0) {
            aurGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
            aurGrad.addColorStop(0.4, `rgba(52, 211, 153, ${(auroraAlpha * 0.48).toFixed(3)})`);
            aurGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          } else {
            aurGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
            aurGrad.addColorStop(0.45, `rgba(192, 132, 252, ${(auroraAlpha * 0.38).toFixed(3)})`);
            aurGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
          }
          ctx.fillStyle = aurGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Sun & Crepuscular Rays (Daytime / Sunny Afternoon / Golden Hour)
      if (cel.sunVisible) {
        const sunX = cel.sunX * w - px * 0.25;
        const sunY = cel.sunY * h - py * 0.2;
        const baseRadius = cel.isSunnyAfternoon ? w * 0.095 : w * 0.075;

        // Outer solar atmospheric glow
        const [sr, sg, sb] = hexToRgb(sky.sunGlow);
        const haloRadius = cel.isSunnyAfternoon ? baseRadius * 5.2 : baseRadius * 3.8;
        const haloGrad = ctx.createRadialGradient(sunX, sunY, baseRadius * 0.2, sunX, sunY, haloRadius);
        haloGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, 0.65)`);
        haloGrad.addColorStop(0.45, `rgba(${sr}, ${sg}, ${sb}, 0.22)`);
        haloGrad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`);
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Crepuscular Sunbeams / God Rays (especially prominent in Sunny Afternoon or when weather === 'sunbeams')
        if (weatherVisuals.sunbeamsActive) {
          ctx.save();
          ctx.translate(sunX, sunY);
          const rayCount = 12;
          const rayAlpha =
            (cfg.weather === 'sunbeams' ? 0.22 : 0.14) * cel.sunRayIntensity;
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + timeSec * 0.08;
            ctx.save();
            ctx.rotate(angle);
            const rayGrad = ctx.createLinearGradient(0, 0, w * 0.85, 0);
            rayGrad.addColorStop(0, `rgba(254, 249, 195, ${rayAlpha.toFixed(3)})`);
            rayGrad.addColorStop(1, 'rgba(254, 249, 195, 0)');
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(0, -baseRadius * 0.18);
            ctx.lineTo(w * 0.85, -baseRadius * 1.35);
            ctx.lineTo(w * 0.85, baseRadius * 1.35);
            ctx.lineTo(0, baseRadius * 0.18);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        }

        // Core Sun Disc
        ctx.fillStyle = sky.sunColor;
        ctx.beginPath();
        ctx.arc(sunX, sunY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Moon & Lunar Phase (Night / Dusk / Dawn)
      if (cel.moonVisible) {
        const moonX = cel.moonX * w - px * 0.25;
        const moonY = cel.moonY * h - py * 0.2;
        const moonR = w * 0.068;

        // Lunar outer glow
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.3, moonX, moonY, moonR * 3.4);
        moonGlow.addColorStop(0, 'rgba(224, 242, 254, 0.42)');
        moonGlow.addColorStop(0.5, 'rgba(186, 230, 253, 0.12)');
        moonGlow.addColorStop(1, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 3.4, 0, Math.PI * 2);
        ctx.fill();

        // Moon disc
        ctx.save();
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);

        // Subtle lunar craters
        ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.beginPath();
        ctx.arc(moonX - moonR * 0.28, moonY - moonR * 0.18, moonR * 0.22, 0, Math.PI * 2);
        ctx.arc(moonX + moonR * 0.32, moonY + moonR * 0.24, moonR * 0.16, 0, Math.PI * 2);
        ctx.arc(moonX + moonR * 0.1, moonY - moonR * 0.38, moonR * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Phase shadow overlay
        if (cfg.moonPhase !== 'full') {
          ctx.fillStyle = sky.zenith;
          const shadowOffset =
            cfg.moonPhase === 'crescent'
              ? moonR * 0.42
              : cfg.moonPhase === 'quarter'
              ? moonR * 0.85
              : moonR * 1.3;
          ctx.beginPath();
          ctx.arc(moonX + shadowOffset, moonY - moonR * 0.08, moonR * 0.98, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 6. Animated Clouds (drift faster when Wind Streaks are active)
      ctx.save();
      const [cr, cg, cb] = hexToRgb(sky.cloudColor);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${(sky.cloudOpacity * 0.65).toFixed(3)})`;
      const cloudSpeedBoost = weatherVisuals.windActive ? 2.4 : 1.0;
      for (let i = 0; i < 4; i++) {
        const cloudDrift = ((timeSec * (4 + i * 1.5) * cloudSpeedBoost + i * 130) % (w + 220)) - 110;
        const cy = h * (0.17 + i * 0.075) - py * 0.25;
        const cw = 85 + (i % 2) * 35;
        const ch = 22 + (i % 2) * 8;
        ctx.beginPath();
        ctx.roundRect(cloudDrift - px * 0.35, cy, cw, ch, 14);
        ctx.roundRect(cloudDrift + cw * 0.22 - px * 0.35, cy - ch * 0.45, cw * 0.58, ch * 0.9, 14);
        ctx.fill();
      }
      ctx.restore();

      // 7. Distant & Midground Mountain / Terrain Layers (Parallax)
      const drawRidge = (
        points: Array<[number, number]>,
        color: string,
        offsetX: number,
        offsetY: number,
        drawFrostCrest: boolean = false
      ) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-40, waterLineY + 4);
        for (const [nx, ny] of points) {
          ctx.lineTo(nx * w + offsetX, ny * h + offsetY);
        }
        ctx.lineTo(w + 40, waterLineY + 4);
        ctx.closePath();
        ctx.fill();

        if (drawFrostCrest && weatherVisuals.snowActive) {
          ctx.save();
          ctx.strokeStyle = `rgba(241, 245, 249, ${weatherVisuals.frostHighlightOpacity.toFixed(2)})`;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let idx = 0; idx < points.length; idx++) {
            const [nx, ny] = points[idx];
            const rx = nx * w + offsetX;
            const ry = ny * h + offsetY;
            if (idx === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.stroke();
          ctx.restore();
        }
      };

      // Far ridge
      drawRidge(
        [
          [-0.08, 0.54],
          [0.18, 0.39],
          [0.38, 0.48],
          [0.64, 0.36],
          [0.86, 0.46],
          [1.08, 0.41],
        ],
        sky.mountainFar,
        -px * 0.45,
        -py * 0.35,
        true
      );

      // Midground ridge
      drawRidge(
        [
          [-0.08, 0.60],
          [0.12, 0.49],
          [0.34, 0.57],
          [0.54, 0.47],
          [0.78, 0.56],
          [1.08, 0.50],
        ],
        sky.mountainMid,
        -px * 0.75,
        -py * 0.55,
        true
      );

      // Foreground Silhouette & Biome-Specific Architecture
      drawRidge(
        [
          [-0.08, 0.67],
          [0.22, 0.59],
          [0.48, 0.65],
          [0.76, 0.58],
          [1.08, 0.64],
        ],
        sky.mountainNear,
        -px * 1.05,
        -py * 0.75,
        false
      );

      const fgOffsetX = -px * 1.1;
      const fgOffsetY = -py * 0.8;
      const lightRatio = cfg.enableArtificialLights ? cel.windowGlow : 0;

      if (cfg.biome === 'alpine') {
        // Pine trees along foreground ridge (sway slightly when Wind Streaks are active)
        ctx.fillStyle = sky.groundTint;
        const treePositions = [0.08, 0.14, 0.19, 0.78, 0.85, 0.91];
        const windTreeBend = weatherVisuals.windActive ? 4.5 : 0;
        for (const tx of treePositions) {
          const baseX = tx * w + fgOffsetX;
          const baseY = waterLineY;
          for (let tier = 0; tier < 3; tier++) {
            ctx.beginPath();
            ctx.moveTo(baseX + windTreeBend * (tier + 1) * 0.4, baseY - 46 - tier * 14);
            ctx.lineTo(baseX - 16 + tier * 3, baseY - 18 - tier * 12);
            ctx.lineTo(baseX + 16 - tier * 3, baseY - 18 - tier * 12);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Cozy Alpine A-Frame Cabin on right shore
        const cabinX = w * 0.66 + fgOffsetX;
        const cabinY = waterLineY + fgOffsetY * 0.2;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cabinX, cabinY - 54);
        ctx.lineTo(cabinX - 34, cabinY);
        ctx.lineTo(cabinX + 34, cabinY);
        ctx.closePath();
        ctx.fill();

        // Snow-covered roof cap when snowflakes are active
        if (weatherVisuals.snowActive) {
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cabinX - 34, cabinY);
          ctx.lineTo(cabinX, cabinY - 54);
          ctx.lineTo(cabinX + 34, cabinY);
          ctx.stroke();
        }

        // Cabin Warm Glowing Windows at Dusk/Night
        if (lightRatio > 0.05) {
          const glowGrad = ctx.createRadialGradient(
            cabinX,
            cabinY - 20,
            2,
            cabinX,
            cabinY - 20,
            46
          );
          glowGrad.addColorStop(0, `rgba(251, 191, 36, ${(0.55 * lightRatio).toFixed(3)})`);
          glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cabinX, cabinY - 20, 46, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle =
          lightRatio > 0.05
            ? `rgba(254, 240, 138, ${(0.3 + 0.7 * lightRatio).toFixed(3)})`
            : 'rgba(148, 163, 184, 0.35)';
        ctx.fillRect(cabinX - 10, cabinY - 26, 8, 10);
        ctx.fillRect(cabinX + 2, cabinY - 26, 8, 10);
        ctx.fillRect(cabinX - 5, cabinY - 40, 10, 8);

        // Campfire on left shore at Dusk / Night
        if (lightRatio > 0.1) {
          const fireX = w * 0.28 + fgOffsetX;
          const fireY = waterLineY - 4;
          const flicker = 0.85 + 0.15 * Math.sin(timeSec * 14);
          const fireGlow = ctx.createRadialGradient(
            fireX,
            fireY - 6,
            2,
            fireX,
            fireY - 6,
            38 * flicker
          );
          fireGlow.addColorStop(0, `rgba(249, 115, 22, ${(0.75 * lightRatio).toFixed(3)})`);
          fireGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = fireGlow;
          ctx.beginPath();
          ctx.arc(fireX, fireY - 6, 38 * flicker, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(fireX - 6, fireY);
          ctx.lineTo(fireX + (weatherVisuals.windActive ? 4 : 0), fireY - 14 * flicker);
          ctx.lineTo(fireX + 6, fireY);
          ctx.closePath();
          ctx.fill();
        }
      } else if (cfg.biome === 'coastal') {
        // Coastal Cliff & Lighthouse on left headland
        const lhX = w * 0.24 + fgOffsetX;
        const lhBaseY = waterLineY - 18;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(lhX - 12, lhBaseY);
        ctx.lineTo(lhX - 8, lhBaseY - 76);
        ctx.lineTo(lhX + 8, lhBaseY - 76);
        ctx.lineTo(lhX + 12, lhBaseY);
        ctx.closePath();
        ctx.fill();

        // Red lighthouse stripes
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(lhX - 10, lhBaseY - 52, 20, 14);
        ctx.fillRect(lhX - 11, lhBaseY - 24, 22, 14);

        // Lantern room
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lhX - 9, lhBaseY - 88, 18, 12);

        // Sweeping Lighthouse Beam at Dusk / Night
        if (lightRatio > 0.05) {
          const beamAngle = Math.sin(timeSec * 0.9) * 0.35;
          ctx.save();
          ctx.translate(lhX, lhBaseY - 82);
          ctx.rotate(beamAngle);
          const beamGrad = ctx.createLinearGradient(0, 0, w * 0.75, 0);
          beamGrad.addColorStop(0, `rgba(254, 249, 195, ${(0.65 * lightRatio).toFixed(3)})`);
          beamGrad.addColorStop(1, 'rgba(254, 249, 195, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(w * 0.75, -48);
          ctx.lineTo(w * 0.75, 48);
          ctx.lineTo(0, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Daytime / Sunny Afternoon Sailboat on the horizon
        if (cel.isDaylight) {
          const boatX = ((w * 0.62 + timeSec * 8) % (w * 0.5)) + w * 0.42;
          const boatY = waterLineY - 2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(boatX, boatY - 28);
          ctx.lineTo(boatX - 12, boatY - 4);
          ctx.lineTo(boatX + 10, boatY - 4);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(boatX - 14, boatY - 4, 26, 4);
        }
      } else if (cfg.biome === 'kyoto') {
        // Vermilion Torii Gate in shallow water
        const toriiX = w * 0.5 + fgOffsetX * 0.8;
        const toriiBaseY = waterLineY + 8;
        ctx.fillStyle = cel.isNight ? '#991b1b' : '#ef4444';
        // Pillars
        ctx.fillRect(toriiX - 32, toriiBaseY - 78, 8, 78);
        ctx.fillRect(toriiX + 24, toriiBaseY - 78, 8, 78);
        // Top Kasagi beam
        ctx.beginPath();
        ctx.roundRect(toriiX - 50, toriiBaseY - 86, 100, 10, 4);
        ctx.fill();
        // Secondary Nuki beam
        ctx.fillRect(toriiX - 40, toriiBaseY - 64, 80, 6);

        // Glowing Stone Lanterns on shore at Dusk/Night
        if (lightRatio > 0.05) {
          const lanternPositions = [w * 0.22 + fgOffsetX, w * 0.78 + fgOffsetX];
          for (const lx of lanternPositions) {
            const ly = waterLineY - 12;
            const lGlow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 28);
            lGlow.addColorStop(0, `rgba(251, 191, 36, ${(0.75 * lightRatio).toFixed(3)})`);
            lGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = lGlow;
            ctx.beginPath();
            ctx.arc(lx, ly, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(lx - 4, ly - 4, 8, 8);
          }
        }
      } else if (cfg.biome === 'metro') {
        // Architectural Skyline Towers
        const towers = [
          { x: 0.14, tw: 34, th: 110 },
          { x: 0.27, tw: 42, th: 148 },
          { x: 0.44, tw: 38, th: 96 },
          { x: 0.62, tw: 46, th: 162 },
          { x: 0.79, tw: 36, th: 124 },
        ];
        for (let idx = 0; idx < towers.length; idx++) {
          const t = towers[idx];
          const tx = t.x * w + fgOffsetX * 0.7;
          const ty = waterLineY - t.th;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(tx, ty, t.tw, t.th);

          // Solar glint in sunny afternoon vs Illuminated apartment windows at night
          if (lightRatio > 0.05) {
            ctx.fillStyle = `rgba(253, 224, 71, ${(0.75 * lightRatio).toFixed(3)})`;
            for (let row = 10; row < t.th - 12; row += 12) {
              for (let col = 6; col < t.tw - 8; col += 10) {
                if ((row + col + idx * 7) % 3 !== 0) {
                  ctx.fillRect(tx + col, ty + row, 5, 6);
                }
              }
            }
            // Rooftop beacon
            ctx.fillStyle = `rgba(244, 63, 94, ${(0.85 * lightRatio).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(tx + t.tw / 2, ty - 3, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (cel.isSunnyAfternoon) {
            ctx.fillStyle = 'rgba(254, 249, 195, 0.28)';
            ctx.fillRect(tx + 2, ty + 2, 6, t.th - 4);
          }
        }
      }

      // 8. Reflective Water Body (Bottom 27% of screen)
      const waterGrad = ctx.createLinearGradient(0, waterLineY, 0, h);
      waterGrad.addColorStop(0, sky.waterTop);
      waterGrad.addColorStop(1, sky.waterBottom);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterLineY, w, h - waterLineY);

      // Solar / Lunar Shimmer Path on Water
      const shimmerCenterX = cel.sunVisible
        ? cel.sunX * w - px * 0.25
        : cel.moonVisible
        ? cel.moonX * w - px * 0.25
        : w * 0.5;
      const shimmerColor = cel.sunVisible ? sky.sunGlow : '#bae6fd';
      const [shr, shg, shb] = hexToRgb(shimmerColor);

      for (let i = 0; i < 18; i++) {
        const wy = waterLineY + 6 + i * ((h - waterLineY - 10) / 18);
        const spread = (14 + i * 4.2) * (cel.isSunnyAfternoon ? 1.35 : 1);
        const waveShift = Math.sin(timeSec * 3.2 + i * 0.9) * (6 + i * 0.6);
        ctx.fillStyle = `rgba(${shr}, ${shg}, ${shb}, ${(0.48 - i * 0.02).toFixed(3)})`;
        ctx.fillRect(shimmerCenterX - spread / 2 + waveShift, wy, spread, 2.5);
      }

      // Wind-driven whitecaps on water surface when Wind Streaks are active
      if (weatherVisuals.windActive) {
        ctx.strokeStyle = 'rgba(241, 245, 249, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let wc = 0; wc < 10; wc++) {
          const wcx = (((wc * 113 + Math.floor(timeSec * 45)) % 900) + 30) / 1000 * w;
          const wcy = waterLineY + 10 + ((wc * 37) % Math.max(16, Math.floor(h - waterLineY - 18)));
          ctx.moveTo(wcx, wcy);
          ctx.quadraticCurveTo(wcx + 12, wcy - 2.5, wcx + 24, wcy);
        }
        ctx.stroke();
      }

      // Bioluminescent coastal tide at night
      if (cfg.biome === 'coastal' && cel.isNight) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const y = waterLineY + 4 + Math.sin(x * 0.03 + timeSec * 2.5) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 9. Valley Mist / Fog Layer (toggleable or active in mist weather)
      const mistAlpha = weatherVisuals.mistDensity;
      if (mistAlpha > 0.02) {
        const mistGrad = ctx.createLinearGradient(0, waterLineY - 58, 0, waterLineY + 28);
        mistGrad.addColorStop(0, 'rgba(241, 245, 249, 0)');
        mistGrad.addColorStop(0.5, `rgba(241, 245, 249, ${mistAlpha.toFixed(3)})`);
        mistGrad.addColorStop(1, 'rgba(241, 245, 249, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, waterLineY - 58, w, 86);
      }

      // 10. Time-Adaptive Wildlife: Birds by Day/Dusk, Pollen/Sakura in Afternoon, Fireflies at Night
      if (cfg.enableWildlife) {
        // Birds in Morning / Sunny Afternoon / Golden Dusk
        if (cel.birdActivity > 0.05 && cfg.weather !== 'rain') {
          ctx.strokeStyle = cel.isNight ? '#cbd5e1' : '#1e293b';
          ctx.lineWidth = 1.6;
          const activeBirdCount = Math.ceil(birds.length * cel.birdActivity);
          for (let i = 0; i < activeBirdCount; i++) {
            const b = birds[i];
            b.x = (b.x + b.speed) % 1.15;
            const bx = (b.x - 0.07) * w - px * 0.4;
            const by = b.y * h + Math.sin(timeSec * 2 + i) * 4;
            const wingY = Math.sin(timeSec * 7.5 + b.wingPhase) * 5 * b.scale;

            ctx.beginPath();
            ctx.moveTo(bx - 7 * b.scale, by - wingY);
            ctx.quadraticCurveTo(bx - 3 * b.scale, by - 4 * b.scale, bx, by);
            ctx.quadraticCurveTo(bx + 3 * b.scale, by - 4 * b.scale, bx + 7 * b.scale, by - wingY);
            ctx.stroke();
          }
        }

        // Fireflies at Night OR Sunlit Pollen / Sakura Petals in Sunny Afternoon
        const isFireflyMode = cel.fireflyActivity > 0.1;
        const isPollenMode = !isFireflyMode && cel.butterflyPollenActivity > 0.1;

        if ((isFireflyMode || isPollenMode) && cfg.weather !== 'rain') {
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x = (p.x + p.vx + 1) % 1;
            p.y = p.y + p.vy + Math.sin(timeSec * 1.5 + p.phase) * 0.0003;
            if (p.y < 0.18) p.y = 0.88;

            const pxScreen = p.x * w;
            const pyScreen = p.y * h;
            const pulse = 0.35 + 0.65 * Math.sin(timeSec * 3.2 + p.phase);

            if (isFireflyMode) {
              // Glowing firefly
              const ffRadius = p.size * 3.2;
              const ffGrad = ctx.createRadialGradient(
                pxScreen,
                pyScreen,
                0.5,
                pxScreen,
                pyScreen,
                ffRadius
              );
              ffGrad.addColorStop(0, `rgba(250, 204, 21, ${(pulse * cel.fireflyActivity).toFixed(3)})`);
              ffGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
              ctx.fillStyle = ffGrad;
              ctx.beginPath();
              ctx.arc(pxScreen, pyScreen, ffRadius, 0, Math.PI * 2);
              ctx.fill();
            } else if (isPollenMode) {
              // Sakura petals in Kyoto or golden sunlit pollen in Alpine/Coastal/Metro
              ctx.fillStyle =
                cfg.biome === 'kyoto'
                  ? `rgba(251, 207, 232, ${(0.75 * pulse).toFixed(3)})`
                  : `rgba(254, 249, 195, ${(0.65 * pulse).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(pxScreen, pyScreen, p.size * 0.9, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 11. Weather: Adaptive Precipitation Density (Light Drizzle -> Moderate Shower -> Heavy Downpour)
      if (cfg.weather === 'rain') {
        const precip = getPrecipitationState(cfg);

        // Extra storm canopy darkening during Heavy Downpours
        if (precip.regime === 'heavy_downpour') {
          ctx.fillStyle = `rgba(15, 23, 42, ${((precip.densityRatio - 0.5) * 0.35).toFixed(3)})`;
          ctx.fillRect(0, 0, w, h);
        }

        // Raindrop streaks scaled by temperature-driven density, length, speed, and wind slant
        ctx.strokeStyle = `rgba(186, 230, 253, ${precip.dropOpacity.toFixed(2)})`;
        ctx.lineWidth = precip.strokeWidth;
        ctx.beginPath();
        const activeDrops = Math.min(raindrops.length, precip.dropCount);
        for (let i = 0; i < activeDrops; i++) {
          const r = raindrops[i];
          if (advanceMotion) {
            r.y = (r.y + precip.dropSpeed * r.speed) % 1;
            r.x = (r.x - precip.dropSpeed * 0.18 + 1) % 1;
          }
          const rx = r.x * w;
          const ry = r.y * h;
          const len = precip.dropLength * r.length;
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - precip.windSlantPx, ry + len);
        }
        ctx.stroke();

        // Surface water impact splash rings scaled by precipitation density
        ctx.strokeStyle = `rgba(224, 242, 254, ${(precip.dropOpacity * 0.75).toFixed(2)})`;
        ctx.lineWidth = 1;
        for (let s = 0; s < precip.splashRingCount; s++) {
          const sx = (((s * 97 + Math.floor(timeSec * 30)) % 920) + 40) / 1000 * w;
          const sy = waterLineY + 12 + ((s * 43) % Math.max(20, Math.floor(h - waterLineY - 24)));
          const ringPhase = (timeSec * 2.2 + s * 0.37) % 1;
          const rxRadius = 3 + ringPhase * (precip.regime === 'heavy_downpour' ? 14 : 8);
          const ryRadius = rxRadius * 0.32;
          ctx.beginPath();
          ctx.ellipse(sx, sy, rxRadius, ryRadius, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 12. Toggleable Weather Condition: Crystalline Snowflakes & Powder Flurries
      if (weatherVisuals.snowActive) {
        ctx.save();
        for (let i = 0; i < snowflakes.length; i++) {
          const sf = snowflakes[i];
          if (advanceMotion) {
            sf.y = (sf.y + sf.speedY) % 1;
            const windDriftNorm = weatherVisuals.snowWindDriftPx / w;
            sf.x = (sf.x + windDriftNorm * 0.08 + 1) % 1;
            sf.rotation = (sf.rotation + 0.015) % (Math.PI * 2);
          }

          const flutterOffset =
            Math.sin(timeSec * 1.8 + sf.flutterPhase) * weatherVisuals.snowFlutterAmplitude;
          const sx = ((sf.x * w + flutterOffset) % w + w) % w;
          const sy = sf.y * h;

          if (sf.isCrystal) {
            // Detailed 6-pointed hexagonal ice crystal with chevron tips
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(sf.rotation + timeSec * 0.25);
            ctx.strokeStyle = `rgba(241, 245, 249, ${sf.opacity.toFixed(2)})`;
            ctx.lineWidth = 1.35;
            const r = sf.radius;

            ctx.beginPath();
            for (let arm = 0; arm < 6; arm++) {
              const angle = (arm * Math.PI) / 3;
              const ax = Math.cos(angle) * r;
              const ay = Math.sin(angle) * r;
              ctx.moveTo(0, 0);
              ctx.lineTo(ax, ay);

              // Delicate chevron crystal branches at 62% of arm length
              const bx = Math.cos(angle) * (r * 0.62);
              const by = Math.sin(angle) * (r * 0.62);
              const leftBranchAngle = angle - Math.PI / 5;
              const rightBranchAngle = angle + Math.PI / 5;
              const branchLen = r * 0.36;

              ctx.moveTo(bx, by);
              ctx.lineTo(
                bx + Math.cos(leftBranchAngle) * branchLen,
                by + Math.sin(leftBranchAngle) * branchLen
              );
              ctx.moveTo(bx, by);
              ctx.lineTo(
                bx + Math.cos(rightBranchAngle) * branchLen,
                by + Math.sin(rightBranchAngle) * branchLen
              );
            }
            ctx.stroke();

            // Glowing crystalline center core
            ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
            ctx.beginPath();
            ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            // Soft powder snowflake particle
            ctx.fillStyle = `rgba(248, 250, 252, ${sf.opacity.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, sf.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 13. Toggleable Weather Condition: Aerodynamic Wind Streaks & Swirling Eddies
      if (weatherVisuals.windActive) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < windStreaks.length; i++) {
          const ws = windStreaks[i];
          if (advanceMotion) {
            ws.x = (ws.x + ws.speed) % 1.25;
          }
          const startX = ((ws.x * w + timeSec * 22 * (1 + (i % 3) * 0.25)) % (w + 140)) - 90;
          const baseY = ws.y * h;
          const len = ws.length;

          const grad = ctx.createLinearGradient(startX, baseY, startX + len, baseY);
          grad.addColorStop(0, 'rgba(226, 232, 240, 0)');
          grad.addColorStop(0.35, `rgba(241, 245, 249, ${ws.opacity.toFixed(2)})`);
          grad.addColorStop(0.8, `rgba(186, 230, 253, ${(ws.opacity * 0.85).toFixed(2)})`);
          grad.addColorStop(1, 'rgba(226, 232, 240, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = i % 3 === 0 ? 2.1 : 1.4;
          ctx.beginPath();
          const midX1 = startX + len * 0.35;
          const midY1 = baseY - Math.sin(timeSec * 2.4 + ws.phase) * ws.amplitude;
          const midX2 = startX + len * 0.7;
          const midY2 = baseY + Math.cos(timeSec * 2.4 + ws.phase) * ws.amplitude;
          const endX = startX + len;
          const endY = baseY - 2;

          ctx.moveTo(startX, baseY);
          ctx.bezierCurveTo(midX1, midY1, midX2, midY2, endX, endY);

          // Aerodynamic spiral eddy curl at the leading tip of alternate wind ribbons
          if (ws.hasCurl) {
            ctx.arc(endX - 4, endY - 5, 5, Math.PI * 0.5, Math.PI * 2.1, true);
          }
          ctx.stroke();
        }

        // Wind-swept leaves / sakura petals / coastal spray carried by the gusts
        for (let d = 0; d < weatherVisuals.windDebrisCount; d++) {
          const dx = (((d * 139 + Math.floor(timeSec * 95)) % 1050) - 25) / 1000 * w;
          const dy =
            (0.18 + ((d * 67) % 64) / 100) * h + Math.sin(timeSec * 4 + d) * 6;
          const leafAngle = timeSec * 3.5 + d * 0.9;

          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(leafAngle);
          ctx.fillStyle =
            cfg.biome === 'kyoto'
              ? 'rgba(251, 207, 232, 0.82)'
              : cfg.biome === 'alpine'
              ? 'rgba(167, 243, 208, 0.75)'
              : 'rgba(224, 242, 254, 0.78)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.2, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // 14. Interactive Touch Ripples
      if (ripplesRef.current.length > 0) {
        for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
          const rip = ripplesRef.current[i];
          rip.radius += 3.2;
          rip.alpha *= 0.92;
          ctx.strokeStyle = rip.color.replace('ALPHA', rip.alpha.toFixed(3));
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.stroke();

          if (rip.alpha < 0.04 || rip.radius > rip.maxRadius) {
            ripplesRef.current.splice(i, 1);
          }
        }
      }
    };

    const scheduleNext = () => {
      if (animId) cancelAnimationFrame(animId);
      if (timerId) clearTimeout(timerId);

      const mode = configRef.current.powerMode || 'eco';
      const hasActiveRipples = ripplesRef.current.length > 0;

      if (document.hidden) return;

      if (mode === 'eco' && !hasActiveRipples) {
        // Zero continuous animation loop in Eco mode!
        return;
      }

      if (mode === 'balanced' && !hasActiveRipples) {
        // Throttled 15 FPS (66ms) to save battery
        timerId = setTimeout(() => {
          drawSingleFrame(true);
          scheduleNext();
        }, 66);
      } else {
        animId = requestAnimationFrame(() => {
          drawSingleFrame(true);
          scheduleNext();
        });
      }
    };

    renderFrameRef.current = () => {
      drawSingleFrame(false);
      scheduleNext();
    };

    // Initial paint
    drawSingleFrame(false);
    scheduleNext();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        drawSingleFrame(false);
        scheduleNext();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canvasRef]);

  // Trigger on-demand single-frame redraw whenever config or parallax changes
  useEffect(() => {
    renderFrameRef.current();
  }, [config, parallaxX, parallaxY]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (config.enableTouchRipples) {
      const cel = getCelestialState(config.minutes);
      const color = cel.isNight
        ? 'rgba(129, 140, 248, ALPHA)'
        : cel.isSunnyAfternoon
        ? 'rgba(250, 204, 21, ALPHA)'
        : 'rgba(56, 189, 248, ALPHA)';

      ripplesRef.current.push({
        x,
        y,
        radius: 6,
        maxRadius: 95,
        alpha: 0.85,
        color,
      });
      renderFrameRef.current();
    }

    if (onCanvasTap) {
      onCanvasTap((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    }
  };

  const currentPrecip = getPrecipitationState(config);
  const currentVisuals = getWeatherVisualState(config);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={840}
      data-testid="live-wallpaper-canvas"
      data-power-mode={config.powerMode || 'eco'}
      data-weather={config.weather}
      data-rain-regime={currentPrecip.regime}
      data-rain-drops={currentPrecip.dropCount}
      data-snowflakes-active={String(currentVisuals.snowActive)}
      data-wind-streaks-active={String(currentVisuals.windActive)}
      data-active-weather-layers={currentVisuals.activeConditionLabels.join(',')}
      onPointerDown={handlePointerDown}
      className="w-full h-full block cursor-pointer select-none touch-manipulation"
      aria-label="Interactive Android Live Wallpaper Canvas"
    />
  );
};
