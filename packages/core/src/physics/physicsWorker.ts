// High-Performance Physics Worker using Typed Arrays
// This worker handles all physics simulation for all characters in a single thread.

let joints: Float32Array; // [x, y, vx, vy, initialX, initialY, restX, restY, maxOffset, pinned] - 10 values per joint
let bones: Int32Array;    // [indexA, indexB] - 2 values per bone
let boneLengths: Float32Array; // [restLength] - 1 value per bone
let charPhaseOffsets: Float32Array; // Random unique phase for each character to avoid synchronized robotic movement
let charWeights: Float32Array; // Physics weight based on complexity (stroke count/density)

let config = {
  gravity: { x: 0, y: 1.0 },
  friction: 0.5,
  rigidity: 0.9,
  restorationStrength: 0.4,
  suppleness: 0.3,
  motionIntensity: 1.0,
  coordination: 0.5,
  interactionStrength: 0.5,
  interactionMode: "Repulse" as "Attract" | "Repulse",
};

let mousePos: { x: number; y: number } | null = null;
let burstQueue: number[] = [];

let charRanges: { start: number; count: number }[] = [];
let hoverIdx: number | null = null;
let lastTime = Date.now();

self.onmessage = (e) => {
  const { type, data } = e.data;

  if (type === "init") {
    const { charData } = data;
    let totalJoints = 0;
    let totalBones = 0;
    charData.forEach((c: any) => {
      totalJoints += c.joints.length;
      totalBones += c.bones.length;
    });

    const newJoints = new Float32Array(totalJoints * 10);
    const newBones = new Int32Array(totalBones * 2);
    const newBoneLengths = new Float32Array(totalBones);
    const newCharPhaseOffsets = new Float32Array(charData.length);
    const newCharWeights = new Float32Array(charData.length);
    const newCharRanges: { start: number; count: number }[] = [];

    let jOffset = 0;
    let bOffset = 0;

    charData.forEach((c: any, cIdx: number) => {
      const start = jOffset;
      const count = c.joints.length;
      newCharRanges.push({ start, count });
      newCharPhaseOffsets[cIdx] = Math.random() * 1000;
      
      const avgJoints = totalJoints / charData.length;
      const weight = count / avgJoints;
      newCharWeights[cIdx] = Math.max(0.6, Math.min(1.8, weight));

      const idToIndex = new Map<string, number>();
      c.joints.forEach((j: any, i: number) => {
        idToIndex.set(j.id, start + i);
        const idx = (start + i) * 10;
        newJoints[idx + 0] = j.x;
        newJoints[idx + 1] = j.y;
        newJoints[idx + 2] = 0; // vx
        newJoints[idx + 3] = 0; // vy
        newJoints[idx + 4] = j.initialX;
        newJoints[idx + 5] = j.initialY;
        newJoints[idx + 6] = j.restX;
        newJoints[idx + 7] = j.restY;
        newJoints[idx + 8] = j.maxOffset;
        newJoints[idx + 9] = j.pinned ? 1 : 0;
      });

      c.bones.forEach((b: any) => {
        const idx = bOffset * 2;
        newBones[idx + 0] = idToIndex.get(b.jointAId)!;
        newBones[idx + 1] = idToIndex.get(b.jointBId)!;
        newBoneLengths[bOffset] = b.restLength;
        bOffset++;
      });

      jOffset += count;
    });

    // Atomic update to avoid race conditions with step()
    joints = newJoints;
    bones = newBones;
    boneLengths = newBoneLengths;
    charPhaseOffsets = newCharPhaseOffsets;
    charWeights = newCharWeights;
    charRanges = newCharRanges;
  } else if (type === "updateConfig") {
    config = { ...config, ...data };
  } else if (type === "updateHover") {
    hoverIdx = data; 
  } else if (type === "updateMousePos") {
    mousePos = data;
  } else if (type === "burst") {
    burstQueue.push(data);
  }
};

function step() {
  if (!joints) {
    if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(step);
    else setTimeout(step, 1000 / 60);
    return;
  }

  const now = Date.now();
  const dt = 1; // fixed time step for stability
  const phase = now * 0.002;
  
  const numJoints = joints.length / 10;
  const numBones = bones.length / 2;

  // 1. Integration & Synchronized Procedural Motion
  for (let i = 0; i < numJoints; i++) {
    const idx = i * 10;
    if (joints[idx + 9] === 1) continue; // Pinned

    // Which character does this joint belong to?
    let charIdx = -1;
    for (let r = 0; r < charRanges.length; r++) {
       if (i >= charRanges[r].start && i < charRanges[r].start + charRanges[r].count) {
           charIdx = r;
           break;
       }
    }

    if (charIdx === -1) continue;

    const motion = config.motionIntensity;
    const initialX = joints[idx + 4];
    const initialY = joints[idx + 5];
    const weight = charWeights[charIdx];
    
    // Blended Phase Offset based on Coordination parameter
    const randomOffset = charPhaseOffsets[charIdx];
    const sequentialOffset = charIdx * 0.8; // Wave factor
    const finalCharOffset = randomOffset * (1 - config.coordination) + (sequentialOffset * 10) * config.coordination;

    // Neighbor Influence
    let intensity = motion;
    if (charIdx === hoverIdx) {
      intensity = motion * 2.5;
    } else if (hoverIdx !== null && Math.abs(charIdx - hoverIdx) === 1) {
      intensity = motion * 1.5;
    } 

    const charSpeed = 1 / weight;
    const charAmp = 1 / weight;
    const localSwayPhase = (phase * charSpeed) * 0.7 * intensity + finalCharOffset + (initialX + initialY) * 0.005;
    
    const swayX = Math.sin(localSwayPhase) * (15 * intensity * charAmp * (1 + config.suppleness * 0.5));
    const swayY = Math.cos(localSwayPhase * 0.8) * (10 * intensity * charAmp * (1 + config.suppleness * 0.5));

    const twitchAmplitude = 1.2 * (1 - config.suppleness * 0.8);
    const twitchX = Math.sin(phase * 3 * charSpeed + initialX * 0.02) * (twitchAmplitude * motion * charAmp);
    const twitchY = Math.cos(phase * 2.5 * charSpeed + initialY * 0.02) * (twitchAmplitude * motion * charAmp);

    joints[idx + 6] = initialX + swayX + twitchX;
    joints[idx + 7] = initialY + swayY + twitchY;
    
    const isInteracting = charIdx === hoverIdx || (hoverIdx !== null && Math.abs(charIdx - hoverIdx) === 1);
    const jitterMag = (isInteracting ? 0.8 : 0.05) * (1 / weight) * (1 - config.suppleness * 0.9);
    joints[idx + 2] += (Math.random() - 0.5) * jitterMag * motion;
    joints[idx + 3] += (Math.random() - 0.5) * jitterMag * motion;

    // Interaction: Mouse Influence
    const mouseRadius = 150;
    const interactionPower = (config.interactionStrength || 0) * 1.5;
    if (mousePos) {
      const dx = joints[idx + 0] - mousePos.x;
      const dy = joints[idx + 1] - mousePos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < mouseRadius * mouseRadius && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / mouseRadius) * interactionPower * 1.0;
        const factor = config.interactionMode === "Repulse" ? 1 : -1;
        joints[idx + 2] += (dx / dist) * force * factor;
        joints[idx + 3] += (dy / dist) * force * factor;
      }
    }

    // Apply forces
    const actualRestoration = config.restorationStrength * (1 - config.suppleness * 0.5);
    const gravityForce = config.gravity.y * weight;
    const fx = (joints[idx + 6] - joints[idx + 0]) * actualRestoration;
    const fy = (joints[idx + 7] - joints[idx + 1]) * actualRestoration + gravityForce;
    
    joints[idx + 2] = (joints[idx + 2] + fx) * config.friction;
    joints[idx + 3] = (joints[idx + 3] + fy) * config.friction;
    
    joints[idx + 0] += joints[idx + 2] * dt;
    joints[idx + 1] += joints[idx + 3] * dt;
  }

  // 1.5 process Burst
  while (burstQueue.length > 0) {
    const cIdx = burstQueue.shift()!;
    const range = charRanges[cIdx];
    if (range) {
      for (let i = range.start; i < range.start + range.count; i++) {
        const idx = i * 10;
        joints[idx + 3] -= 15 + Math.random() * 8;
        joints[idx + 2] += (Math.random() - 0.5) * 6;
      }
    }
  }

  // 2. Constraints (Bones)
  const iterations = 10;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < numBones; i++) {
      const idx = i * 2;
      const idA = bones[idx + 0] * 10;
      const idB = bones[idx + 1] * 10;
      
      const dx = joints[idB + 0] - joints[idA + 0];
      const dy = joints[idB + 1] - joints[idA + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;
      const diff = (dist - boneLengths[i]) / dist;
      
      const actualRigidity = config.rigidity * (1 - config.suppleness * 0.7);
      const offsetX = dx * diff * 0.5 * actualRigidity;
      const offsetY = dy * diff * 0.5 * actualRigidity;
      
      if (joints[idA + 9] === 0) {
        joints[idA + 0] += offsetX;
        joints[idA + 1] += offsetY;
      }
      if (joints[idB + 9] === 0) {
        joints[idB + 0] -= offsetX;
        joints[idB + 1] -= offsetY;
      }
    }
  }

  // 3. Offset Boundary
  for (let i = 0; i < numJoints; i++) {
    const idx = i * 10;
    const initialX = joints[idx + 4];
    const initialY = joints[idx + 5];
    const maxOffset = joints[idx + 8] * (1.0 + config.motionIntensity * 0.5);
    
    const dx = joints[idx + 0] - initialX;
    const dy = joints[idx + 1] - initialY;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > maxOffset && d > 0) {
      joints[idx + 0] = initialX + (dx / d) * maxOffset;
      joints[idx + 1] = initialY + (dy / d) * maxOffset;
    }
  }

  // Final positions buffer
  const positions = new Float32Array(numJoints * 2);
  for (let i = 0; i < numJoints; i++) {
    positions[i * 2 + 0] = joints[i * 10 + 0];
    positions[i * 2 + 1] = joints[i * 10 + 1];
  }

  (self as any).postMessage({ type: "frame", data: positions }, [positions.buffer]);
  
  setTimeout(step, 1000 / 60);
}

step();
