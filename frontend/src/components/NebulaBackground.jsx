"use client";

import { useEffect, useRef } from "react";

export default function NebulaBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let pointer = { x: -1000, y: -1000 };
    let sparks = [];
    let stars = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.max(55, Math.floor((width * height) / 18000)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() > 0.9 ? 2 : 1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.4,
      }));
      paint(0);
    };

    const paint = (time) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#050309";
      ctx.fillRect(0, 0, width, height);

      const haze = ctx.createRadialGradient(width * 0.25, height * 0.72, 0, width * 0.25, height * 0.72, Math.max(width, height) * 0.72);
      haze.addColorStop(0, "rgba(192, 18, 69, .23)");
      haze.addColorStop(0.38, "rgba(92, 13, 49, .13)");
      haze.addColorStop(1, "rgba(5, 3, 9, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      const blueHaze = ctx.createRadialGradient(width * 0.78, height * 0.24, 0, width * 0.78, height * 0.24, Math.max(width, height) * 0.55);
      blueHaze.addColorStop(0, "rgba(39, 28, 82, .18)");
      blueHaze.addColorStop(1, "rgba(5, 3, 9, 0)");
      ctx.fillStyle = blueHaze;
      ctx.fillRect(0, 0, width, height);

      const step = 9;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const nx = x / width;
          const ny = y / height;
          const wave = Math.sin(nx * 8 + ny * 4 + time * 0.00012) * 0.5
            + Math.cos(nx * 5 - ny * 7 - time * 0.00009) * 0.35
            + Math.sin((nx + ny) * 11) * 0.15;
          const band = Math.exp(-Math.pow((ny - (0.68 - nx * 0.42)) * 3.2, 2));
          const density = Math.max(0, Math.min(1, (wave + band * 0.7 + 0.15) * 0.68));
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          const lamp = Math.max(0, 1 - distance / 190);
          const radius = 0.5 + density * 2.8 + lamp * 2.2;
          const alpha = 0.05 + density * 0.52 + lamp * 0.25;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = density > 0.55 ? `rgba(255, 31, 90, ${alpha})` : `rgba(106, 52, 104, ${alpha * 0.7})`;
          ctx.fill();
        }
      }

      stars.forEach((star) => {
        const twinkle = reducedMotion ? 0.65 : 0.35 + (Math.sin(time * 0.001 * star.speed + star.phase) + 1) * 0.3;
        ctx.fillStyle = `rgba(246, 226, 232, ${twinkle})`;
        ctx.fillRect(Math.round(star.x), Math.round(star.y), star.size, star.size);
      });

      sparks = sparks.filter((spark) => time - spark.born < 1500);
      sparks.forEach((spark) => {
        const age = (time - spark.born) / 1500;
        const radius = 8 + age * 95;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 31, 90, ${(1 - age) * 0.55})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 225, 235, ${1 - age})`;
        ctx.fillRect(spark.x - 1, spark.y - 1, 3, 3);
      });
    };

    const onMove = (event) => { pointer = { x: event.clientX, y: event.clientY }; };
    const onLeave = () => { pointer = { x: -1000, y: -1000 }; };
    const onClick = (event) => {
      sparks.push({ x: event.clientX, y: event.clientY, born: performance.now() });
      if (sparks.length > 8) sparks.shift();
    };

    let last = 0;
    const animate = (time) => {
      if (time - last > 40) {
        paint(time);
        last = time;
      }
      if (!reducedMotion) frame = requestAnimationFrame(animate);
    };

    resize();
    if (!reducedMotion) frame = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="nebula-background" aria-hidden="true" />;
}
