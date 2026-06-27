// Importação do React para criar componentes funcionais
import React from "react";

/**
 * Interface das props do componente Gauge
 * value: valor a ser exibido no gauge (0-100)
 * size: tamanho do SVG em pixels (padrão: 220)
 * strokeWidth: espessura da linha do arco (padrão: 14)
 * label: texto descritivo exibido abaixo do valor (opcional)
 */
type GaugeProps = {
  value: number; // Valor percentual de 0 a 100
  size?: number; // Tamanho do gauge em pixels
  strokeWidth?: number; // Espessura da linha do arco
  label?: string; // Texto descritivo opcional
};

/**
 * Função utilitária para limitar um valor dentro de um intervalo
 * Garante que o valor do gauge esteja sempre entre 0 e 100
 * 
 * @param v - valor a ser limitado
 * @param a - limite inferior (padrão: 0)
 * @param b - limite superior (padrão: 100)
 * @returns valor limitado dentro do intervalo especificado
 */
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

/**
 * Gauge é um componente que renderiza um medidor circular (gauge) elegante
 * Usado para exibir métricas percentuais como eficiência, progresso, etc.
 * 
 * Características visuais:
 * - Arco de 240° (de -120° a +120°)
 * - Gradiente azul-ciano no arco de valor
 * - Efeito de sombra/glow no arco
 * - Marcas de escala (ticks) ao redor do gauge
 * - Agulha indicadora rotativa
 * - Texto central mostrando o valor percentual
 * - Label descritivo opcional abaixo do valor
 * 
 * @param value - valor percentual a ser exibido (0-100)
 * @param size - tamanho do gauge em pixels (padrão: 220)
 * @param strokeWidth - espessura da linha do arco (padrão: 14)
 * @param label - texto descritivo opcional
 */
export default function Gauge({ value, size = 220, strokeWidth = 14, label }: GaugeProps) {
  // Normaliza o valor para garantir que esteja entre 0 e 100
  // Se o valor não for um número finito, usa 0 como fallback
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 100);
  
  // Calcula o centro do SVG
  const cx = size / 2;
  const cy = size / 2;
  
  // Calcula o raio do arco considerando a espessura da linha e margem
  const radius = (size - strokeWidth) / 2 - 6;

  // Define os ângulos do arco do gauge
  // startAngle: -120° (esquerda superior)
  // endAngle: +120° (direita superior)
  // Isso cria um arco de 240° total
  const startAngle = -120;
  const endAngle = 120;
  
  // Calcula o ângulo atual baseado no valor percentual
  // Interpola entre startAngle e endAngle baseado em v/100
  const angle = startAngle + (v / 100) * (endAngle - startAngle);

  return (
    <div className="flex flex-col items-center">
      {/* Container SVG do gauge */}
      <svg width={size} height={size / 1.1} viewBox={`0 0 ${size} ${size / 1.1}`}>
        {/* Definições de gradientes e filtros SVG */}
        <defs>
          {/* Gradiente linear para o arco de valor (azul → ciano) */}
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          
          {/* Gradiente radial para o brilho de fundo */}
          <radialGradient id="g2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.28)" />
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0)" />
          </radialGradient>
          
          {/* Filtro de sombra para efeito de glow no arco */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0ea5e9" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Grupo principal do gauge, transladado para o centro */}
        <g transform={`translate(${cx}, ${cy * 1.02})`}>
          {/* Círculo de fundo com gradiente radial para efeito de brilho */}
          <circle cx={0} cy={0} r={radius + 6} fill="url(#g2)" />
          
          {/* Arco de fundo: desenha a base do gauge mostrando todo o alcance */}
          <path
            d={describeArc(0, 0, radius, startAngle, endAngle)}
            fill="none"
            stroke="rgba(56, 189, 248, 0.18)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Arco de valor: mostra a porcentagem atual com gradiente e sombra */}
          <path
            d={describeArc(0, 0, radius, startAngle, angle)}
            fill="none"
            stroke="url(#g1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ filter: "url(#shadow)" }}
          />

          {/* Marcas do mostrador (ticks) - 11 marcas distribuídas ao longo do arco */}
          {Array.from({ length: 11 }).map((_, i) => {
            // Calcula o ângulo de cada marca
            const tAngle = startAngle + (i / 10) * (endAngle - startAngle);
            const a = (tAngle * Math.PI) / 180;
            
            // Calcula as coordenadas inicial e final da linha da marca
            const x1 = Math.cos(a) * (radius - strokeWidth / 2 - 2);
            const y1 = Math.sin(a) * (radius - strokeWidth / 2 - 2);
            const x2 = Math.cos(a) * (radius + strokeWidth / 2 + 4);
            const y2 = Math.sin(a) * (radius + strokeWidth / 2 + 4);
            
            // Marcas principais (a cada 5) são mais grossas
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth={i % 5 === 0 ? 2 : 1} />
            );
          })}

          {/* Agulha indicadora rotativa */}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "0px 0px" }}>
            {/* Linha principal da agulha (azul) */}
            <line x1={0} y1={-8} x2={radius - 18} y2={0} stroke="#0ea5e9" strokeWidth={3} />
            {/* Linha secundária da agulha (branco, mais fina) */}
            <line x1={0} y1={-6} x2={radius - 20} y2={0} stroke="#eff6ff" strokeWidth={2} opacity={0.95} />
          </g>

          {/* Tampa central do gauge (círculo no centro) */}
          <circle cx={0} cy={0} r={8} fill="#0f172a" stroke="#38bdf8" strokeWidth={1.5} />

          {/* Texto do valor percentual */}
          <text x={0} y={radius / 2} textAnchor="middle" fill="#eff6ff" fontSize={30} fontWeight={700}>
            {v}%
          </text>
          
          {/* Texto do label descritivo */}
          <text x={0} y={radius / 2 + 24} textAnchor="middle" fill="rgba(226, 232, 255, 0.8)" fontSize={13}>
            {label || "Índice"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Função auxiliar que converte coordenadas polares para cartesianas
 * Usada para calcular os pontos de início e fim dos arcos SVG
 * 
 * Baseado nas fórmulas do MDN para arcos SVG:
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
 * 
 * @param centerX - coordenada X do centro
 * @param centerY - coordenada Y do centro
 * @param radius - raio do arco
 * @param angleInDegrees - ângulo em graus
 * @returns objeto com coordenadas x e y cartesianas
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  // Converte graus para radianos e ajusta para o sistema de coordenadas SVG
  // Subtrai 90° porque o SVG começa em 0° no eixo X positivo (direita)
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Função auxiliar que cria a string 'd' de um caminho SVG de arco
 * A string 'd' descreve o caminho a ser desenhado pelo elemento <path>
 * 
 * @param x - coordenada X do centro
 * @param y - coordenada Y do centro
 * @param radius - raio do arco
 * @param startAngle - ângulo inicial em graus
 * @param endAngle - ângulo final em graus
 * @returns string de caminho SVG para o atributo 'd'
 */
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  // Calcula os pontos de início e fim do arco
  // Nota: endAngle é usado para o ponto inicial e vice-versa
  // Isso é porque o arco SVG é desenhado no sentido horário
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  // Determina se o arco deve ser desenhado como arco maior (>180°) ou menor
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  // Constrói a string de caminho SVG
  // M: Move to (ponto inicial)
  // A: Arc (raioX, raioY, rotação, arcoGrande, varredura, pontoFinal)
  const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");

  return d;
}
