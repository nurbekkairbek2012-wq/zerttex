import { useId } from 'react';
import type { Trip } from '../lib/kb';

/**
 * Hand-drawn flat landscape for each route. Original vector art (no photos, no licensing),
 * light enough to inline anywhere, and it keeps the brand palette consistent.
 */
export function TripArt({ scene, className, title }: { scene: Trip['scene']; className?: string; title?: string }) {
  const common = { viewBox: '0 0 400 260', preserveAspectRatio: 'xMidYMid slice', className, role: 'img' as const, 'aria-label': title };
  switch (scene) {
    case 'lake':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="lk-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#BFE3E6" />
              <stop offset="1" stopColor="#EAF5F3" />
            </linearGradient>
            <linearGradient id="lk-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1A9EA6" />
              <stop offset="1" stopColor="#0B6E78" />
            </linearGradient>
          </defs>
          <rect width="400" height="260" fill="url(#lk-sky)" />
          <circle cx="318" cy="58" r="20" fill="#F4B400" opacity=".9" />
          <path d="M0 150 L70 70 L120 118 L175 48 L238 128 L290 76 L345 132 L400 92 L400 170 L0 170Z" fill="#2B3F63" />
          <path d="M175 48 L196 72 L184 70 L175 80 L165 68 L156 72Z M70 70 L86 88 L72 84 L62 92Z M290 76 L306 94 L292 90 L282 98Z" fill="#F4F8FA" />
          <path d="M0 168 L60 128 L110 152 L170 118 L230 156 L300 124 L400 160 L400 180 L0 180Z" fill="#1F5C57" />
          <rect y="176" width="400" height="84" fill="url(#lk-water)" />
          <g fill="#0F3D3A">
            {[12, 34, 58, 352, 374, 392].map((x, i) => (
              <path key={i} d={`M${x} ${150 + (i % 2) * 6} l12 30 h-24z M${x} ${138 + (i % 2) * 6} l9 22 h-18z`} />
            ))}
          </g>
          <g stroke="#BFE9EA" strokeWidth="2" strokeLinecap="round" opacity=".7">
            <path d="M90 200 h60 M230 214 h90 M60 232 h40 M260 240 h50" />
          </g>
          <g fill="#6B5B45">
            <rect x="196" y="186" width="3" height="40" />
            <rect x="214" y="190" width="2.5" height="34" />
            <rect x="180" y="192" width="2" height="28" />
          </g>
        </svg>
      );
    case 'canyon':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="cn-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F7D58A" />
              <stop offset="1" stopColor="#FBEBD0" />
            </linearGradient>
          </defs>
          <rect width="400" height="260" fill="url(#cn-sky)" />
          <circle cx="86" cy="64" r="24" fill="#F4B400" />
          <path d="M0 120 h40 v-28 h22 v18 h26 v-40 h18 v30 h30 v20 h40 v-46 h20 v26 h34 v-12 h28 v34 h36 v-22 h30 v30 h56 V260 H0Z" fill="#C25B3A" />
          <path d="M0 150 h54 v-20 h30 v34 h44 v-26 h26 v14 h50 v-34 h24 v28 h40 v-12 h36 v30 h40 v-20 h56 V260 H0Z" fill="#9E3F2A" />
          <path d="M0 196 h80 v-16 h60 v12 h70 v-20 h50 v18 h70 v-10 h70 V260 H0Z" fill="#6F2B22" />
          <path d="M0 236 C80 222 140 248 220 232 S340 226 400 238 V260 H0Z" fill="#2F8C8C" />
          <g fill="#E7A26B" opacity=".5">
            <rect x="106" y="70" width="4" height="40" />
            <rect x="214" y="78" width="4" height="40" />
            <rect x="318" y="96" width="4" height="30" />
          </g>
        </svg>
      );
    case 'heritage':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="hr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F2C27B" />
              <stop offset="1" stopColor="#F9E6C6" />
            </linearGradient>
          </defs>
          <rect width="400" height="260" fill="url(#hr-sky)" />
          <circle cx="330" cy="70" r="22" fill="#FFF4D6" opacity=".9" />
          <rect y="206" width="400" height="54" fill="#D8B17A" />
          <g fill="#B98A55">
            <rect x="60" y="120" width="250" height="90" />
            <rect x="40" y="92" width="96" height="118" />
          </g>
          <path d="M66 210 v-70 a22 22 0 0 1 44 0 v70z" fill="#7A532C" />
          <path d="M150 120 c0 -44 30 -66 52 -66 s52 22 52 66z" fill="#1A8D9A" />
          <g stroke="#0E6670" strokeWidth="2.5">
            <path d="M176 120 c0 -40 12 -58 26 -64 M228 120 c0 -40 -12 -58 -26 -64 M202 56 v64" fill="none" />
          </g>
          <path d="M262 120 c0 -26 16 -40 30 -40 s30 14 30 40z" fill="#1A8D9A" />
          <g fill="#F4E2BE">
            {[150, 176, 202, 228, 254, 280].map((x) => (
              <rect key={x} x={x} y="150" width="10" height="26" rx="5" />
            ))}
          </g>
          <rect x="40" y="92" width="96" height="10" fill="#1A8D9A" />
          <path d="M0 230 C120 214 280 246 400 228 V260 H0Z" fill="#C79C62" />
        </svg>
      );
    case 'forest':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="fr-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#CFE4EE" />
              <stop offset="1" stopColor="#EEF5F7" />
            </linearGradient>
          </defs>
          <rect width="400" height="260" fill="url(#fr-sky)" />
          <path d="M150 170 C150 110 176 70 210 70 C246 70 262 116 268 170Z" fill="#8C93A0" />
          <path d="M176 170 C178 128 196 96 216 92 C234 100 246 132 248 170Z" fill="#A6ADB8" />
          <rect y="168" width="400" height="92" fill="#2F7FB0" />
          <path d="M300 186 c10 -14 30 -14 40 0z" fill="#8C93A0" />
          <g fill="#1F4E3D">
            {[10, 40, 70, 100, 290, 330, 360, 390].map((x, i) => (
              <path key={x} d={`M${x} ${172 - (i % 3) * 8} l16 -60 l16 60z`} />
            ))}
          </g>
          <g fill="#2F6B4F">
            {[25, 55, 85, 315, 345, 375].map((x, i) => (
              <path key={x} d={`M${x} ${176 - (i % 2) * 6} l12 -44 l12 44z`} />
            ))}
          </g>
          <g stroke="#D7ECF6" strokeWidth="2" strokeLinecap="round" opacity=".8">
            <path d="M120 200 h70 M240 214 h60 M90 236 h50 M260 244 h70" />
          </g>
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <defs>
            <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9FD3DD" />
              <stop offset="1" stopColor="#E6F2F1" />
            </linearGradient>
          </defs>
          <rect width="400" height="260" fill="url(#st-sky)" />
          <circle cx="200" cy="120" r="34" fill="#F4B400" />
          <g stroke="#F4B400" strokeWidth="3" strokeLinecap="round" opacity=".55">
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return <line key={i} x1={200 + Math.cos(a) * 44} y1={120 + Math.sin(a) * 44} x2={200 + Math.cos(a) * 56} y2={120 + Math.sin(a) * 56} />;
            })}
          </g>
          <path d="M0 160 L60 128 L120 150 L190 118 L260 150 L330 124 L400 148 V180 H0Z" fill="#6E8FA8" opacity=".6" />
          <rect y="172" width="400" height="88" fill="#D9B04F" />
          <path d="M0 196 C100 182 300 206 400 190 V260 H0Z" fill="#C79A35" />
          <path d="M268 200 c0 -18 14 -30 30 -30 s30 12 30 30z" fill="#F7F3EA" />
          <rect x="268" y="198" width="60" height="22" fill="#F7F3EA" />
          <path d="M268 200 c0 -18 14 -30 30 -30 s30 12 30 30" fill="none" stroke="#B5482E" strokeWidth="3" />
          <rect x="292" y="204" width="12" height="16" fill="#B5482E" />
        </svg>
      );
  }
}

/** Koshkar-muiz (ram's horn), the classic Kazakh ornament, as a repeating band. */
export function OrnamentBand({ className, color = 'currentColor' }: { className?: string; color?: string }) {
  const pid = `km${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} width="100%" height="16" aria-hidden="true">
      <defs>
        <pattern id={pid} width="40" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M20 15 C20 7 14 3 9.5 5.5 C6 7.5 7.5 12 11 11 C13 10.4 12.6 8 11 8.2 M20 15 C20 7 26 3 30.5 5.5 C34 7.5 32.5 12 29 11 C27 10.4 27.4 8 29 8.2"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="M0 15 H40" stroke={color} strokeWidth="1" opacity=".5" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${pid})`} />
    </svg>
  );
}

/** Shanyrak (the crown of a yurt) — used as the logo mark. */
export function Shanyrak({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="5" fill="#F4B400" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 2 V11 M16 21 V30 M2 16 H11 M21 16 H30" />
        <path d="M7.5 7.5 C11 11 11 11 12.5 12.5 M24.5 7.5 L19.5 12.5 M7.5 24.5 L12.5 19.5 M24.5 24.5 L19.5 19.5" />
      </g>
    </svg>
  );
}
