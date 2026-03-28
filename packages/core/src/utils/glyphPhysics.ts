import opentype from "opentype.js";
import { Joint, Bone, Vec2 } from "../types/agent";

export async function loadFont(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    opentype.load(url, (err: any, font: any) => {
      if (err || !font) reject(err);
      else resolve(font);
    });
  });
}

// Reference size for consistent skeleton generation across different display sizes
const REFERENCE_SIZE = 400;

export function createGlyphSkeleton(
  font: any,
  char: string,
  baseX: number,
  baseY: number,
  size: number
): { joints: Joint[]; bones: Bone[]; contours: string[][] } {
  const joints: Joint[] = [];
  const bones: Bone[] = [];
  const contoursData: string[][] = [];
  
  // 1. Get Glyph and Path at a FIXED REFERENCE SIZE
  const glyph = font.charToGlyph(char);
  const path = glyph.getPath(0, 0, REFERENCE_SIZE);
  const scale = size / REFERENCE_SIZE;
  
  // 2. Extract Points from Commands with Ultra-High Curve Subdivision
  let currentContour: Vec2[] = [];
  const contours: Vec2[][] = [];
  let lastX = 0;
  let lastY = 0;

  for (const cmd of path.commands as any[]) {
    if (cmd.type === "M") {
      if (currentContour.length > 0) contours.push(currentContour);
      currentContour = [{ x: cmd.x, y: cmd.y }];
    } else if (cmd.type === "L") {
      currentContour.push({ x: cmd.x, y: cmd.y });
    } else if (cmd.type === "Q") {
      // High-resolution Quadratic Bezier (20 steps)
      for (let t = 0.05; t <= 1.0; t += 0.05) {
        const x = (1 - t) * (1 - t) * lastX + 2 * (1 - t) * t * cmd.x1 + t * t * cmd.x;
        const y = (1 - t) * (1 - t) * lastY + 2 * (1 - t) * t * cmd.y1 + t * t * cmd.y;
        currentContour.push({ x, y });
      }
    } else if (cmd.type === "C") {
      // Ultra-high-resolution Cubic Bezier (30 steps)
      for (let t = 0.033; t <= 1.0; t += 0.033) {
        const x = Math.pow(1 - t, 3) * lastX + 3 * Math.pow(1 - t, 2) * t * cmd.x1 + 3 * (1 - t) * Math.pow(t, 2) * cmd.x2 + Math.pow(t, 3) * cmd.x;
        const y = Math.pow(1 - t, 3) * lastY + 3 * Math.pow(1 - t, 2) * t * cmd.y1 + 3 * (1 - t) * Math.pow(t, 2) * cmd.y2 + Math.pow(t, 3) * cmd.y;
        currentContour.push({ x, y });
      }
    } else if (cmd.type === "Z") {
      if (currentContour.length > 0) contours.push(currentContour);
      currentContour = [];
    }
    lastX = cmd.x;
    lastY = cmd.y;
  }

  // 3. Calculate Glyph Center at REFERENCE SIZE
  const bbox = path.getBoundingBox();
  const glyphCenterX = (bbox.x1 + bbox.x2) / 2;
  const glyphCenterY = (bbox.y1 + bbox.y2) / 2;

  // 4. Convert Contours to Joints and Bones at REFERENCE SIZE
  let jointCount = 0;
  for (const contour of contours) {
    const currentContourJointIds: string[] = [];
    
    // Consistent sampling distance relative to the REFERENCE SIZE
    const targetDist = 6; 
    const sampled: Vec2[] = [];
    let lastP = contour[0];
    sampled.push(lastP);
    
    let accumulatedDist = 0;
    for (let i = 1; i < contour.length; i++) {
        const p = contour[i];
        const d = Math.sqrt(Math.pow(p.x - lastP.x, 2) + Math.pow(p.y - lastP.y, 2));
        accumulatedDist += d;
        if (accumulatedDist >= targetDist) {
            sampled.push(p);
            lastP = p;
            accumulatedDist = 0;
        }
    }

    for (const p of sampled) {
      const id = `j_${jointCount++}`;
      // Map to final display space
      const x = baseX + (p.x - glyphCenterX) * scale;
      const y = baseY + (p.y - glyphCenterY) * scale;
      joints.push({
        id,
        x,
        y,
        vx: 0,
        vy: 0,
        restX: x,
        restY: y,
        initialX: x,
        initialY: y,
        pinned: false,
        maxOffset: (REFERENCE_SIZE * 0.1) * scale, // scale offset accordingly
      });
      currentContourJointIds.push(id);
    }
    
    contoursData.push(currentContourJointIds);

    // Connect contour joints (Ring)
    for (let i = 0; i < currentContourJointIds.length; i++) {
      const idA = currentContourJointIds[i];
      const idB = currentContourJointIds[(i + 1) % currentContourJointIds.length];
      const a = joints.find(j => j.id === idA)!;
      const b = joints.find(j => j.id === idB)!;
      const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
      bones.push({
        id: `b_${idA}_${idB}`,
        jointAId: idA,
        jointBId: idB,
        restLength: dist,
      });
    }

    // Ultra-Fidelity Trussing: tuned for consistency
    for (let i = 0; i < currentContourJointIds.length; i++) {
      const n = currentContourJointIds.length;
      if (n < 4) continue;

      const targetIndices = [(i + 2) % n, (i + 4) % n, (i + 6) % n];
      if (n > 10) targetIndices.push((i + Math.floor(n * 0.25)) % n);
      if (n > 20) targetIndices.push((i + Math.floor(n * 0.5)) % n);
      
      targetIndices.forEach(targetIdx => {
        if (i === targetIdx) return;
        const idA = currentContourJointIds[i];
        const idB = currentContourJointIds[targetIdx];
        if (bones.some(b => (b.jointAId === idA && b.jointBId === idB) || (b.jointAId === idB && b.jointBId === idA))) return;
        
        const a = joints.find(j => j.id === idA)!;
        const b = joints.find(j => j.id === idB)!;
        const dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
        bones.push({
          id: `strut_${idA}_${idB}`,
          jointAId: idA,
          jointBId: idB,
          restLength: dist,
        });
      });
    }
  }

  return { joints, bones, contours: contoursData };
}
