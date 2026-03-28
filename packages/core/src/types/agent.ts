export type AgentState = "idle" | "move" | "react" | "rest";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Joint {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  restX: number;
  restY: number;
  initialX: number;
  initialY: number;
  pinned: boolean;
  maxOffset: number;
}

export interface Bone {
  id: string;
  jointAId: string;
  jointBId: string;
  restLength: number;
}

export interface KanjiSkeleton {
  name: string;
  joints: Joint[];
  bones: Bone[];
  contours: string[][];
}

export interface SimulationConfig {
  gravity: Vec2;
  friction: number;
  rigidity: number;
  restorationStrength: number;
  suppleness: number;
  motionIntensity: number;
  coordination: number;
  interactionStrength: number;
  interactionMode: "Attract" | "Repulse";
}

export interface ParameterHelp {
  id: string;
  name: string;
  descriptions: {
    en: string;
    jp: string;
    sc: string;
    kr: string;
  };
}
