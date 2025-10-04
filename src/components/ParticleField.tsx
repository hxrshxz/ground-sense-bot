import React, { useEffect, useRef } from "react";

interface ParticleFieldProps {
  count?: number;
  color?: string;
  className?: string;
  animate?: boolean;
  opacity?: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 26,
  color = "rgba(56,189,248,0.55)",
  className = "",
  animate = true,
  opacity = 0.35,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    // init particles
    particles.current = Array.from({ length: count }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: (Math.random() * 2 + 0.6) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
      life: 0,
      maxLife: 600 + Math.random() * 800,
    }));

    const step = () => {
      if (
        !animate ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        if (p.life > p.maxLife) {
          p.life = 0;
        }
        const lifeRatio = p.life / p.maxLife;
        const alpha = Math.sin(Math.PI * lifeRatio) * opacity;
        ctx.beginPath();
        ctx.fillStyle = color.replace(/rgba?\([^)]*\)/, color) || color;
        ctx.fillStyle = color.replace(/(0?\.\d+|\d?\.\d+)\)$/, "");
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(step);
    };
    step();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current!);
    };
  }, [animate, count, color, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};

export default ParticleField;
