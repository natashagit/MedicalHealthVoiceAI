'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      life: number;
      maxLife: number;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 2 + 0.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: 0,
      life: 0,
      maxLife: Math.random() * 600 + 400,
    });

    const initParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 25000);
      for (let i = 0; i < count; i++) {
        const p = createParticle();
        p.y = Math.random() * canvas.height;
        p.life = Math.random() * p.maxLife;
        particles.push(p);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;

        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.1) {
          p.opacity = lifeRatio * 10;
        } else if (lifeRatio > 0.9) {
          p.opacity = (1 - lifeRatio) * 10;
        } else {
          p.opacity = 1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(189, 203, 246, ${p.opacity * 0.3})`;
        ctx.fill();

        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = createParticle();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* White base */}
      <div className="absolute inset-0 bg-white" />

      {/* Soft gradient blobs */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vh] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, #BDCBF6 0%, transparent 70%)',
          animation: 'mesh-shift 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/3 -right-1/4 w-[60vw] h-[60vh] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(ellipse at center, #BDCBF6 0%, transparent 70%)',
          animation: 'mesh-shift-reverse 25s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-1/4 left-1/3 w-[50vw] h-[50vh] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(ellipse at center, #1E4ED8 0%, transparent 70%)',
          animation: 'mesh-shift 30s ease-in-out infinite 5s',
        }}
      />

      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
