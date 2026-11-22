import type { StatAxis } from "@/types/gamification";

interface StatRadarChartProps {
  stats: StatAxis[];
}

const CENTER = 110;
const MAX_RADIUS = 72;

// Axis direction order: top (theory), right (problem_solving), bottom (code_speed), left (consistency)
const AXIS_VECTORS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

function formatPolygon(values: number[]): string {
  return AXIS_VECTORS.map((vec, index) => {
    const raw = values[index] ?? 0;
    const clamped = Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0));
    const radius = (clamped / 100) * MAX_RADIUS;
    const x = (CENTER + vec.dx * radius).toFixed(1);
    const y = (CENTER + vec.dy * radius).toFixed(1);
    return `${x},${y}`;
  }).join(" ");
}

export function StatRadarChart({ stats }: StatRadarChartProps) {
  const orderedValues = [
    stats[0]?.value ?? 0,
    stats[1]?.value ?? 0,
    stats[2]?.value ?? 0,
    stats[3]?.value ?? 0,
  ];
  const dataPolygon = formatPolygon(orderedValues);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-obsidian/70 p-4 sm:flex-row">
      <div className="relative flex shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 220 220"
          className="h-44 w-44"
          role="img"
          aria-label="مخطط مهارات اللاعب"
        >
          <defs>
            <linearGradient id="codeverse-radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {[33, 66, 100].map((level) => (
            <polygon
              key={level}
              points={formatPolygon([level, level, level, level])}
              fill="none"
              stroke="rgba(156, 163, 196, 0.2)"
              strokeWidth="1"
            />
          ))}

          <line
            x1={CENTER}
            y1={CENTER - MAX_RADIUS}
            x2={CENTER}
            y2={CENTER + MAX_RADIUS}
            stroke="rgba(139, 92, 246, 0.25)"
            strokeWidth="1"
          />
          <line
            x1={CENTER - MAX_RADIUS}
            y1={CENTER}
            x2={CENTER + MAX_RADIUS}
            y2={CENTER}
            stroke="rgba(6, 182, 212, 0.25)"
            strokeWidth="1"
          />

          <polygon
            points={dataPolygon}
            fill="url(#codeverse-radar-fill)"
            stroke="#06B6D4"
            strokeWidth="2"
          />

          {AXIS_VECTORS.map((vec, index) => {
            const clamped = Math.min(100, Math.max(0, orderedValues[index] ?? 0));
            const r = (clamped / 100) * MAX_RADIUS;
            const cx = Number((CENTER + vec.dx * r).toFixed(1));
            const cy = Number((CENTER + vec.dy * r).toFixed(1));
            return (
              <circle
                key={stats[index]?.key ?? index}
                cx={cx}
                cy={cy}
                r="3.5"
                fill={stats[index]?.accentHex ?? "#06B6D4"}
                stroke="#09090B"
                strokeWidth="1.5"
              />
            );
          })}

          <text x="110" y="22" textAnchor="middle" fill="#F4F4F8" fontSize="11" fontWeight="700">
            النظري
          </text>
          <text x="190" y="114" textAnchor="middle" fill="#F4F4F8" fontSize="11" fontWeight="700">
            حل
          </text>
          <text x="110" y="204" textAnchor="middle" fill="#F4F4F8" fontSize="11" fontWeight="700">
            السرعة
          </text>
          <text x="26" y="114" textAnchor="middle" fill="#F4F4F8" fontSize="11" fontWeight="700">
            الالتزام
          </text>
        </svg>
      </div>

      {/* Numeric breakdown bars */}
      <div className="w-full flex-1 space-y-2.5">
        {stats.map((axis) => (
          <div key={axis.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-chalk">{axis.label}</span>
              <span className="tabular-nums-ltr font-mono font-bold text-cyan-200">
                {axis.value}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, axis.value))}%`,
                  backgroundColor: axis.accentHex,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
