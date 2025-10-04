import React, { useRef } from "react";
import { motion } from "framer-motion";

interface ChartDepthWrapperProps {
  children: React.ReactNode;
  intensity?: number; // rotation intensity
  className?: string;
  glowColor?: string; // tailwind color or hex
  maxTiltDeg?: number;
  disableHover?: boolean;
}

// Utility: clamp value
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Provides an interactive pseudo-3D tilt, layered glow, and animated ambient gradient for charts.
 * Pure CSS + transforms (no WebGL) for performance while giving a depth illusion.
 */
export const ChartDepthWrapper: React.FC<ChartDepthWrapperProps> = ({
  children,
  intensity = 0.6,
  className = "",
  glowColor = "#38bdf8",
  maxTiltDeg = 14,
  disableHover = false,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!ref.current || disableHover) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx; // -1 .. 1
    const dy = (y - cy) / cy; // -1 .. 1
    const tiltX = clamp(-(dy * maxTiltDeg), -maxTiltDeg, maxTiltDeg);
    const tiltY = clamp(dx * maxTiltDeg, -maxTiltDeg, maxTiltDeg);
    ref.current.style.setProperty("--tilt-x", tiltX.toFixed(2) + "deg");
    ref.current.style.setProperty("--tilt-y", tiltY.toFixed(2) + "deg");
    ref.current.style.setProperty("--glow-x", (dx * 40).toFixed(1) + "%");
    ref.current.style.setProperty("--glow-y", (dy * 40).toFixed(1) + "%");
  };

  const reset = () => {
    if (!ref.current) return;
    ref.current.style.setProperty("--tilt-x", "0deg");
    ref.current.style.setProperty("--tilt-y", "0deg");
    ref.current.style.setProperty("--glow-x", "0%");
    ref.current.style.setProperty("--glow-y", "0%");
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative perspective-[1600px] will-change-transform ${className}`}
      style={
        {
          "--tilt-x": "0deg",
          "--tilt-y": "0deg",
          "--glow-x": "0%",
          "--glow-y": "0%",
        } as React.CSSProperties
      }
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-[0_4px_18px_-4px_rgba(0,0,0,0.18),0_10px_32px_-6px_rgba(0,0,0,0.22)] border border-white/10 bg-gradient-to-br from-white/70 via-white/40 to-white/10 backdrop-blur-xl"
        style={{
          transform: "rotateX(var(--tilt-x)) rotateY(var(--tilt-y))",
          transformStyle: "preserve-3d",
          transition: "transform 260ms ease",
        }}
      >
        {/* Ambient animated gradient */}
        <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay animate-[pulse_8s_ease-in-out_infinite] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_55%),radial-gradient(circle_at_70%_65%,rgba(255,255,255,0.35),transparent_60%)]" />

        {/* Interactive glow hotspot */}
        <div
          className="pointer-events-none absolute -inset-px"
          style={{
            background: `radial-gradient(circle at calc(50% + var(--glow-x)) calc(50% + var(--glow-y)), ${glowColor}55, transparent 55%)`,
            mixBlendMode: "screen",
            transition: "background 220ms linear",
          }}
        />

        <div
          className="relative p-4 md:p-6"
          style={{ transform: "translateZ(38px)" }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default ChartDepthWrapper;
