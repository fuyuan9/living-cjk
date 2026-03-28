import { ParameterHelp } from "@living-cjk/core";

export const PARAMETER_HELP: ParameterHelp[] = [
  {
    id: "strokeWeight",
    name: "Stroke Weight",
    descriptions: {
      en: "Adjusts line thickness. Higher values make the strokes bolder and more solid.",
      jp: "線の太さを調整します。値を大きくすると力強く存在感のある文字になります。",
      sc: "调整线条粗细。值越大，笔画越粗，视觉冲击力越强。",
      kr: "획의 두께를 조절합니다. 값이 클수록 획이 굵어지고 묵직한 느낌을 줍니다."
    }
  },
  {
    id: "motion",
    name: "Motion",
    descriptions: {
      en: "Overall movement intensity. Higher values increase the speed and jitter of the characters.",
      jp: "全体的な躍動感を制御します。値を上げると文字がより速く、激しく動き出します。",
      sc: "控制整体跃动感。提高数值会使文字运动得更快、更剧烈。",
      kr: "전체적인 생동감을 제어합니다. 값을 높이면 글자가 더 빠르고 격렬하게 움직입니다."
    }
  },
  {
    id: "suppleness",
    name: "Suppleness",
    descriptions: {
      en: "Organic elasticity and sway. High values create a soft, wave-like trailing effect.",
      jp: "有機的な「しなり」。値を上げると、水の中を泳ぐような柔らかい余韻が生まれます。",
      sc: "有机的「柔韧性」。提高数值会产生像在水中游动一样的柔软余韵。",
      kr: "유기적인 「유연함」. 값을 높이면 물속을 헤엄치는 듯한 부드러운 여운이 생깁니다."
    }
  },
  {
    id: "coordination",
    name: "Coordination",
    descriptions: {
      en: "Sync between characters. 0 makes movements random; 1 creates a beautiful sequential wave.",
      jp: "文字間の連携。0でバラバラに独立し、1に近づくほど優雅な連動ウェーブを描きます。",
      sc: "文字间的协调。0为随机独立运动，1则会呈现出优雅的连动波浪效果。",
      kr: "글자 간의 협응성. 0이면 각자 독립적으로 움직이고, 1에 가까울수록 우아한 연동 파동을 그립니다."
    }
  },
  {
    id: "rigidity",
    name: "Rigidity",
    descriptions: {
      en: "Bone stiffness. High values maintain the original glyph shape more strictly against forces.",
      jp: "骨格の硬度。値を上げると、外部の力に抗って本来の字形を強固に保とうとします。",
      sc: "骨架硬度。值越高，文字越能抵抗外力，保持原本的字形。",
      kr: "골격의 강도. 값을 높이면 외부의 힘에 저항하여 원래의 글자 모양을 견고하게 유지합니다."
    }
  },
  {
    id: "restoration",
    name: "Restoration",
    descriptions: {
      en: "Pull-back strength. High values make characters snap back to their center faster.",
      jp: "元の形に戻る力。値を上げると、キビキビとしたレスポンスで中心に戻ります。",
      sc: "恢复力。提高数值会使文字以更灵敏的反应回到中心位置。",
      kr: "복원력. 값을 높이면 더 기민한 반응으로 원래 위치로 돌아옵니다."
    }
  },
  {
    id: "friction",
    name: "Friction",
    descriptions: {
      en: "Air resistance. High values make movement feel heavy or submerged in dense liquid.",
      jp: "空気抵抗（摩擦）。値を上げると、重々しくねっとりとした動きに変化します。",
      sc: "空气阻力（摩擦）。提高数值会使运动变得沉重、粘稠。",
      kr: "공기 저항(마찰). 값을 높이면 묵직하고 끈적이는 움직임으로 변합니다."
    }
  },
  {
    id: "gravity",
    name: "Gravity",
    descriptions: {
      en: "Vertical force. Positive values sink characters; negative values make them float upward.",
      jp: "垂直方向の重力。プラスで下に沈み込み、マイナスで無重力のように浮き上がります。",
      sc: "垂直方向的重力。正值向下沉入，负值则像无重力一样飘起。",
      kr: "수직 방향의 중력. 플러스면 아래로 가라앉고, 마이너스면 떠오릅니다."
    }
  },
  {
    id: "touchInteraction",
    name: "Touch Interaction",
    descriptions: {
      en: "Reaction to the cursor. Controls the attract/repulse strength and sensitivity.",
      jp: "カーソルへの反応強度。吸い寄せたり弾いたりと、インタラクションの鋭さを調整します。",
      sc: "对光标的反应强度。调整吸引或排斥等交互作用的灵敏度。",
      kr: "커서에 대한 반응 강도. 끌어당기거나 밀어내는 상호작용의 예리함을 조절합니다."
    }
  }
];
