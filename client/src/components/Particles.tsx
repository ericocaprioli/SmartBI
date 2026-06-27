// Importações de hooks do React para gerenciar efeitos e referências
import { useEffect, useRef } from 'react';

/**
 * Particles é um componente que renderiza partículas animadas no fundo da tela
 * Cria um efeito visual sutil de partículas roxas flutuando
 * 
 * Características:
 * - Usa HTML5 Canvas para renderização performática
 * - Partículas se movem aleatoriamente em velocidades variadas
 * - Partículas reaparecem no lado oposto quando saem da tela (wrap-around)
 * - Número de partículas é calculado baseado no tamanho da tela
 * - Cor roxa (rgba(168, 85, 247)) com opacidade variável
 * - Opacidade geral do canvas é 30% para ser sutil
 * - Não interfere com interações do usuário (pointer-events-none)
 * 
 * Este componente é usado para adicionar profundidade visual ao background
 * sem distrair do conteúdo principal
 */
export default function Particles() {
  // Referência ao elemento canvas para acesso direto ao DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Obtém o elemento canvas do DOM
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Obtém o contexto 2D do canvas para desenho
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ID do frame de animação para cancelar no cleanup
    let animationFrameId: number;
    
    // Array para armazenar todas as partículas
    let particles: Particle[] = [];

    /**
     * Função para redimensionar o canvas para ocupar toda a tela
     * Chamada inicialmente e sempre que a janela for redimensionada
     */
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Redimensiona o canvas inicialmente
    resizeCanvas;
    
    // Adiciona listener para redimensionamento da janela
    window.addEventListener('resize', resizeCanvas);

    /**
     * Classe Particle representa uma única partícula animada
     * Cada partícula tem posição, tamanho, velocidade e opacidade
     */
    class Particle {
      x: number; // Posição X atual
      y: number; // Posição Y atual
      size: number; // Tamanho da partícula (raio)
      speedX: number; // Velocidade horizontal
      speedY: number; // Velocidade vertical
      opacity: number; // Opacidade da partícula (0.1 a 0.6)

      /**
       * Construtor inicializa a partícula com valores aleatórios
       * Posição: aleatória em toda a tela
       * Tamanho: entre 0.5 e 2.5 pixels
       * Velocidade: entre -0.25 e +0.25 pixels por frame
       * Opacidade: entre 0.1 e 0.6
       */
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      /**
       * Atualiza a posição da partícula baseado na velocidade
       * Implementa wrap-around: partícula reaparece no lado oposto
       * quando sai da tela, criando um efeito contínuo
       */
      update() {
        // Move a partícula
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap-around horizontal
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        
        // Wrap-around vertical
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      /**
       * Desenha a partícula no canvas
       * Desenha um círculo roxo com a opacidade da partícula
       */
      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /**
     * Inicializa o array de partículas
     * Calcula o número de partículas baseado na área da tela
     * Proporção: 1 partícula a cada 15000 pixels quadrados
     */
    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    /**
     * Loop de animação principal
     * Limpa o canvas, atualiza e desenha todas as partículas
     * Solicita o próximo frame usando requestAnimationFrame
     */
    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Limpa o canvas completamente
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Atualiza e desenha cada partícula
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Solicita o próximo frame de animação
      animationFrameId = requestAnimationFrame(animate);
    };

    // Inicializa as partículas e inicia a animação
    initParticles();
    animate();

    // Cleanup: remove listeners e cancela animação quando componente desmonta
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Array vazio significa que o efeito roda apenas na montagem

  // Renderiza o canvas fixo no fundo da tela
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.3 }}
    />
  );
}
