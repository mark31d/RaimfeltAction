import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');
const COLOR = '#6EA8FF'; // accent (CSS оригинал: #4387f4)

// ── Keyframe paths для morph ───────────────────────────────────────────────────
// 0% / 100% — rounded square + circle hole
const PATH_A =
  'M10,20 C10,17.24 11.12,14.74 12.93,12.93 L12.93,12.93 C14.74,11.12 17.24,10 20,10 L80,10 C82.76,10 85.26,11.12 87.07,12.93 L87.07,12.93 C88.88,14.74 90,17.24 90,20 L90,80 C90,82.76 88.88,85.26 87.07,87.07 L87.07,87.07 C85.26,88.88 82.76,90 80,90 L20,90 C17.24,90 14.74,88.88 12.93,87.07 L12.93,87.07 C11.12,85.26 10,82.76 10,80Z M68,50 C68,45.02 65.98,40.52 62.72,37.27 L62.72,37.27 C59.47,34.01 54.97,32 50,32 L50,32 C45.02,32 40.52,34.01 37.27,37.27 L37.27,37.27 C34.01,40.52 32,45.02 32,50 L32,50 C32,54.97 34.01,59.47 37.27,62.72 L37.27,62.72 C40.52,65.98 45.02,68 50,68 L50,68 C54.97,68 59.47,65.98 62.72,62.72 L62.72,62.72 C65.98,59.47 68,54.97 68,50Z';

// 33% — octagon + diamond hole
const PATH_B =
  'M10,37.57 C10,34.92 11.05,32.37 12.92,30.5 L30.5,12.92 C32.37,11.05 34.92,10 37.57,10 L62.42,10 C65.07,10 67.62,11.05 69.49,12.92 L87.07,30.5 C88.94,32.37 90,34.92 90,37.57 L90,62.42 C90,65.07 88.94,67.62 87.07,69.49 L69.49,87.07 C67.62,88.94 65.07,90 62.42,90 L37.57,90 C34.92,90 32.37,88.94 30.5,87.07 L12.92,69.49 C11.05,67.62 10,65.07 10,62.42Z M68,50 C68,49.12 67.66,48.24 66.99,47.57 L52.42,33 C51.75,32.33 50.87,32 50,32 L50,32 C49.12,32 48.24,32.33 47.57,33 L33,47.57 C32.33,48.24 32,49.12 32,50 L32,50 C32,50.87 32.33,51.75 33,52.42 L47.57,66.99 C48.24,67.66 49.12,68 50,68 L50,68 C50.87,68 51.75,67.66 52.42,66.99 L66.99,52.42 C67.66,51.75 68,50.87 68,50Z';

// 66% — circle + rounded square hole
const PATH_C =
  'M10,50 C10,38.95 14.48,28.95 21.72,21.72 L21.72,21.72 C28.95,14.48 38.95,10 50,10 L50,10 C61.05,10 71.05,14.48 78.28,21.72 L78.28,21.72 C85.52,28.95 90,38.95 90,50 L90,50 C90,61.05 85.52,71.05 78.28,78.28 L78.28,78.28 C71.05,85.52 61.05,90 50,90 L50,90 C38.95,90 28.95,85.52 21.72,78.28 L21.72,78.28 C14.48,71.05 10,61.05 10,50Z M63.72,39.7 C63.72,38.75 63.34,37.9 62.71,37.28 L62.71,37.28 C62.09,36.65 61.24,36.27 60.29,36.27 L39.7,36.27 C38.75,36.27 37.9,36.65 37.28,37.28 L37.28,37.28 C36.65,37.9 36.27,38.75 36.27,39.7 L36.27,60.29 C36.27,61.24 36.65,62.09 37.28,62.71 L37.28,62.71 C37.9,63.34 38.75,63.72 39.7,63.72 L60.29,63.72 C61.24,63.72 62.09,63.34 62.71,62.71 L62.71,62.71 C63.34,62.09 63.72,61.24 63.72,60.29Z';

// ── Wave paths (внешние контуры каждого кейфрейма, без дырки) ─────────────────
const WAVE_PATHS = [
  // path:nth-child(2) — delay 1.7s → offset 0.85
  'M10,20 C10,17.24 11.12,14.74 12.93,12.93 L12.93,12.93 C14.74,11.12 17.24,10 20,10 L80,10 C82.76,10 85.26,11.12 87.07,12.93 L87.07,12.93 C88.88,14.74 90,17.24 90,20 L90,80 C90,82.76 88.88,85.26 87.07,87.07 L87.07,87.07 C85.26,88.88 82.76,90 80,90 L20,90 C17.24,90 14.74,88.88 12.93,87.07 L12.93,87.07 C11.12,85.26 10,82.76 10,80Z',
  // path:nth-child(3) — delay 0.3s → offset 0.15
  'M10,37.57 C10,34.92 11.05,32.37 12.92,30.5 L30.5,12.92 C32.37,11.05 34.92,10 37.57,10 L62.42,10 C65.07,10 67.62,11.05 69.49,12.92 L87.07,30.5 C88.94,32.37 90,34.92 90,37.57 L90,62.42 C90,65.07 88.94,67.62 87.07,69.49 L69.49,87.07 C67.62,88.94 65.07,90 62.42,90 L37.57,90 C34.92,90 32.37,88.94 30.5,87.07 L12.92,69.49 C11.05,67.62 10,65.07 10,62.42Z',
  // path:nth-child(4) — delay 1.0s → offset 0.5
  'M10,50 C10,38.95 14.48,28.95 21.72,21.72 L21.72,21.72 C28.95,14.48 38.95,10 50,10 L50,10 C61.05,10 71.05,14.48 78.28,21.72 L78.28,21.72 C85.52,28.95 90,38.95 90,50 L90,50 C90,61.05 85.52,71.05 78.28,78.28 L78.28,78.28 C71.05,85.52 61.05,90 50,90 L50,90 C38.95,90 28.95,85.52 21.72,78.28 L21.72,78.28 C14.48,71.05 10,61.05 10,50Z',
];

// delay offset'ы из CSS animation-delay (делим на duration=2s)
const WAVE_DELAYS = [0.85, 0.15, 0.5];

// ── Утилиты ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Линейная интерполяция между двумя SVG path строками (числовые коэффициенты)
function lerpPaths(d1, d2, t) {
  const re1 = /(-?\d+(?:\.\d+)?)/g;
  const re2 = /(-?\d+(?:\.\d+)?)/g;
  const re3 = /(-?\d+(?:\.\d+)?)/g;
  const n1 = [...d1.matchAll(re1)].map(m => Number(m[0]));
  const n2 = [...d2.matchAll(re2)].map(m => Number(m[0]));
  let i = 0;
  return d1.replace(re3, () => {
    const val = n1[i] + (n2[i] - n1[i]) * t;
    i++;
    return val.toFixed(2);
  });
}

// Текущий morph path по t ∈ [0, 1)
function getMorphPath(t) {
  // 0.00–0.10 : hold A
  // 0.10–0.33 : A → B
  // 0.33–0.43 : hold B
  // 0.43–0.66 : B → C
  // 0.66–0.76 : hold C
  // 0.76–1.00 : C → A
  if (t <= 0.10) return PATH_A;
  if (t <= 0.33) return lerpPaths(PATH_A, PATH_B, easeInOut((t - 0.10) / 0.23));
  if (t <= 0.43) return PATH_B;
  if (t <= 0.66) return lerpPaths(PATH_B, PATH_C, easeInOut((t - 0.43) / 0.23));
  if (t <= 0.76) return PATH_C;
  return lerpPaths(PATH_C, PATH_A, easeInOut((t - 0.76) / 0.24));
}

// @keyframes wave: SW, opacity, scale по t ∈ [0, 1)
function getWaveValues(t) {
  if (t <= 0.10) {
    const p = t / 0.10;
    return { sw: lerp(0, 5, p), opacity: lerp(0, 0.3, p), scale: lerp(1, 1.05, p) };
  }
  if (t <= 0.30) {
    const p = (t - 0.10) / 0.20;
    return { sw: lerp(5, 10, p), opacity: lerp(0.3, 0, p), scale: lerp(1.05, 1.1, p) };
  }
  // 30–100%: плавно обратно к нулю
  const p = (t - 0.30) / 0.70;
  return { sw: lerp(10, 0, p), opacity: 0, scale: lerp(1.1, 1, p) };
}

// SVG transform: scale around center (50, 50) viewBox
function scaleAroundCenter(s) {
  return `translate(50 50) scale(${s.toFixed(4)}) translate(-50 -50)`;
}

// ── Компонент ─────────────────────────────────────────────────────────────────
const INIT_WAVES = WAVE_PATHS.map(() => ({ sw: 0, opacity: 0, scale: 1 }));

export default function Loader({ spinnerDuration = 2000 }) {
  const [morphPath,  setMorphPath]  = useState(PATH_A);
  const [waveStates, setWaveStates] = useState(INIT_WAVES);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = Date.now();

    const frame = () => {
      const elapsed = Date.now() - start;
      const t = (elapsed % spinnerDuration) / spinnerDuration;

      setMorphPath(getMorphPath(t));
      setWaveStates(
        WAVE_DELAYS.map(delay => {
          const wt = ((t - delay + 1) % 1);
          return getWaveValues(wt);
        }),
      );

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spinnerDuration]);

  return (
    <LinearGradient
      colors={['#0D0A1E', '#0B1021', '#0F1630', '#1A0D3B']}
      locations={[0, 0.35, 0.7, 1]}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.container}
    >
      <Svg width={160} height={160} viewBox="0 0 100 100">
        {/* Wave paths (paths 2-4 из оригинала) */}
        {WAVE_PATHS.map((d, i) => (
          <Path
            key={i}
            d={d}
            fill="none"
            stroke={COLOR}
            strokeWidth={waveStates[i].sw}
            opacity={waveStates[i].opacity}
            transform={scaleAroundCenter(waveStates[i].scale)}
          />
        ))}

        {/* Morphing main path (path:first-child из оригинала) */}
        <Path d={morphPath} fill={COLOR} />
      </Svg>

      <Text style={styles.name}>RaimfeltAction</Text>
      <Text style={styles.tagline}>Train. Track. Thrive.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 36,
    color: '#EAF0FF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 8,
    color: '#9AA6C3',
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '300',
  },
});
