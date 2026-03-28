import React, { useState, useMemo, useEffect, useRef } from "react";
import { Joint, Bone } from "@living-cjk/core";

interface LivingCJKProps {
  char: string;
  data: any; // Full skeleton data from createGlyphSkeleton
  positionsRef: React.RefObject<Float32Array | null>;
  startIndex: number;
  x: number;
  y: number;
  index: number;
  size: number;
  strokeWeight?: number;
  isRainbowMode?: boolean;
  onHoverChange?: (isHovering: boolean) => void;
  onBurst?: () => void;
  showLabels?: boolean;
  isDarkMode?: boolean;
}

export const LivingCJK: React.FC<LivingCJKProps> = ({
  char,
  data,
  positionsRef,
  startIndex,
  x,
  y,
  index,
  size,
  strokeWeight = 0.03,
  isRainbowMode = false,
  onHoverChange,
  onBurst,
  showLabels = true,
  isDarkMode = false,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const boneRefs = useRef<(SVGLineElement | null)[]>([]);

  // 1. Pre-calculate all joint indices for performance
  const contourIndices = useMemo(() => {
    if (!data || !data.contours) return [];
    return data.contours.map((contour: string[]) => 
      contour.map(id => data.joints.findIndex((j: Joint) => j.id === id))
    );
  }, [data]);

  const boneIndices = useMemo(() => {
    if (!data || !data.bones) return [];
    return data.bones
      .filter((b: Bone) => !b.id.startsWith("strut"))
      .map((b: Bone) => ({
        id: b.id,
        idxA: data.joints.findIndex((j: Joint) => j.id === b.jointAId),
        idxB: data.joints.findIndex((j: Joint) => j.id === b.jointBId)
      }));
  }, [data]);

  // 2. High-Performance direct DOM update loop (Bypassing React re-renders)
  useEffect(() => {
    let rafId: number;
    const update = () => {
      const pos = positionsRef.current;
      // Safety guard: Ensure positions buffer exists and matches the expected size for the current data
      const maxJointIndex = startIndex + data.joints.length;
      if (pos && pos.length >= maxJointIndex * 2 && pathRef.current) {
        // Update Main Path
        let d = "";
        for (let i = 0; i < contourIndices.length; i++) {
          const indices = contourIndices[i];
          for (let j = 0; j < indices.length; j++) {
            const idx = (startIndex + indices[j]) * 2;
            const px = pos[idx];
            const py = pos[idx + 1];
            if (j === 0) d += `M ${px},${py}`;
            else d += ` L ${px},${py}`;
          }
          d += " Z ";
        }
        pathRef.current.setAttribute("d", d);

        // Update Outline Bones
        for (let i = 0; i < boneIndices.length; i++) {
          const b = boneIndices[i];
          const line = boneRefs.current[i];
          if (line) {
            const idxA = (startIndex + b.idxA) * 2;
            const idxB = (startIndex + b.idxB) * 2;
            line.setAttribute("x1", pos[idxA].toString());
            line.setAttribute("y1", pos[idxA + 1].toString());
            line.setAttribute("x2", pos[idxB].toString());
            line.setAttribute("y2", pos[idxB + 1].toString());
          }
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [contourIndices, boneIndices, startIndex, positionsRef, data.joints.length]);

  if (!data || !data.joints || !data.bones) return null;

  const handleMouseEnter = () => onHoverChange?.(true);
  const handleMouseLeave = () => onHoverChange?.(false);

  return (
    <g 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="cursor-none"
      onClick={() => {
        setShowSkeleton(!showSkeleton);
        onBurst?.();
      }}
    >
      {/* High-Speed Path Rendering (Managed via Ref) */}
      <path
        ref={pathRef}
        fill={isRainbowMode ? "none" : (isDarkMode ? "#ffffff" : "#0f172a")}
        fillRule="evenodd"
        className={isRainbowMode ? "rainbow-mode" : ""}
        style={{ animationDelay: `-${index * 0.2}s` }}
      />

      {/* High-Speed Bone Rendering (Managed via Refs) */}
      {boneIndices.map((b: any, i: number) => (
        <line
          key={b.id}
          ref={(el) => (boneRefs.current[i] = el)}
          stroke={isRainbowMode ? "none" : (isDarkMode ? "#ffffff" : "#0f172a")}
          strokeWidth={size * strokeWeight}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isRainbowMode ? "rainbow-mode" : ""}
          style={{ animationDelay: `-${index * 0.2}s` }}
        />
      ))}

      {showLabels && (
        <text
          x={x}
          y={y + size * 0.6 + 20}
          textAnchor="middle"
          fontSize={12}
          className="fill-slate-400 dark:fill-slate-500 select-none pointer-events-none uppercase tracking-widest opacity-50 font-bold transition-colors duration-500"
        >
          {char}
        </text>
      )}

      {/* Debug Skeleton */}
      {showSkeleton && (
        <g opacity={0.5} pointerEvents="none">
          {data.bones.map((b: Bone) => {
            const idxA = data.joints.findIndex((j: any) => j.id === b.jointAId);
            const idxB = data.joints.findIndex((j: any) => j.id === b.jointBId);
            const a = data.joints[idxA];
            const bP = data.joints[idxB];
            return (
              <line
                key={`dbg-${b.id}`}
                x1={a.initialX}
                y1={a.initialY}
                x2={bP.initialX}
                y2={bP.initialY}
                stroke="magenta"
                strokeWidth={1}
                opacity={0.3}
              />
            );
          })}
        </g>
      )}
    </g>
  );
};
