import React from "react";

type GaugeProps = {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
};

// Garante que o valor do gauge esteja sempre dentro do intervalo 0-100.
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

export default function Gauge({ value, size = 220, strokeWidth = 14, label }: GaugeProps) {
  // Normalize o valor e calcula as dimensões do mostrador.
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2 - 6;

  // Define o arco do mostrador de -120° a +120°.
  const startAngle = -120;
  const endAngle = 120;
  const angle = startAngle + (v / 100) * (endAngle - startAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 1.1} viewBox={`0 0 ${size} ${size / 1.1}`}>
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <radialGradient id="g2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.28)" />
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0)" />
          </radialGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0ea5e9" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Arco de fundo: desenha a base do gauge, mostrando todo o alcance do medidor. */}
        <g transform={`translate(${cx}, ${cy * 1.02})`}>
          <circle cx={0} cy={0} r={radius + 6} fill="url(#g2)" />
          <path
            d={describeArc(0, 0, radius, startAngle, endAngle)}
            fill="none"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Arco de valor: mostra a porcentagem atual do gauge. */}
          <path
            d={describeArc(0, 0, radius, startAngle, angle)}
            fill="none"
            stroke="url(#g1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: "url(#shadow)" }}
          />

          {/* Marcas do mostrador */}
          {Array.from({ length: 11 }).map((_, i) => {
            const tAngle = startAngle + (i / 10) * (endAngle - startAngle);
            const a = (tAngle * Math.PI) / 180;
            const x1 = Math.cos(a) * (radius - strokeWidth / 2 - 2);
            const y1 = Math.sin(a) * (radius - strokeWidth / 2 - 2);
            const x2 = Math.cos(a) * (radius + strokeWidth / 2 + 4);
            const y2 = Math.sin(a) * (radius + strokeWidth / 2 + 4);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth={i % 5 === 0 ? 2 : 1} />
            );
          })}

          {/* Agulha */}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "0px 0px" }}>
            <line x1={0} y1={-8} x2={radius - 18} y2={0} stroke="#0ea5e9" strokeWidth={3} />
            <line x1={0} y1={-6} x2={radius - 20} y2={0} stroke="#eff6ff" strokeWidth={2} opacity={0.95} />
          </g>

          {/* Tampa central */}
          <circle cx={0} cy={0} r={8} fill="#0f172a" stroke="#38bdf8" strokeWidth={1.5} />

          {/* Texto do valor */}
          <text x={0} y={radius / 2} textAnchor="middle" fill="#eff6ff" fontSize={30} fontWeight={700}>
            {v}%
          </text>
          <text x={0} y={radius / 2 + 24} textAnchor="middle" fill="rgba(226, 232, 255, 0.8)" fontSize={13}>
            {label || "Índice"}
          </text>
        </g>
      </svg>
    </div>
  );
}

// Auxiliar: descreve o caminho de um arco SVG (baseado nas fórmulas de MDN)
// Converte coordenadas polares para coordenadas cartesianas para traçar o arco SVG.
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Cria a string 'd' de um caminho SVG de arco a partir dos ângulos inicial e final.
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");

  return d;
}
