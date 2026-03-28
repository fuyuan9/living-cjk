import { useState, useEffect, useRef } from "react";
import { LivingCJK } from "@living-cjk/react";
import { loadFont, createGlyphSkeleton } from "@living-cjk/core";
import { HelpModal } from "./components/HelpModal";
import { LucideHelpCircle } from "lucide-react";
import opentype from "opentype.js";

const DEFAULTS = {
  strokeWeight: 0.05,
  motionIntensity: 1.0,
  suppleness: 0.3,
  rigidity: 0.9,
  restoration: 0.4,
  friction: 0.5,
  gravityY: 1.0,
  coordination: 0.5,
  language: "JP",
  showLabels: true,
  isRainbowMode: true,
  interactionStrength: 0.5,
  interactionMode: "Repulse", // "Attract" | "Repulse"
};

const FONTS = {
  JP: "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf",
  SC: "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf",
  KR: "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf",
};

function App() {
  const [inputText, setInputText] = useState("你好世界 こんにちは 안녕하세요");
  const [font, setFont] = useState<opentype.Font | undefined>();
  const [loading, setLoading] = useState(true);

  // Parameter States
  const [strokeWeight, setStrokeWeight] = useState(DEFAULTS.strokeWeight);
  const [motionIntensity, setMotionIntensity] = useState(DEFAULTS.motionIntensity);
  const [suppleness, setSuppleness] = useState(DEFAULTS.suppleness);
  const [rigidity, setRigidity] = useState(DEFAULTS.rigidity);
  const [restoration, setRestoration] = useState(DEFAULTS.restoration);
  const [friction, setFriction] = useState(DEFAULTS.friction);
  const [gravityY, setGravityY] = useState(DEFAULTS.gravityY);
  const [coordination, setCoordination] = useState(DEFAULTS.coordination);
  const [language, setLanguage] = useState(DEFAULTS.language);
  const [showLabels, setShowLabels] = useState(DEFAULTS.showLabels);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRainbowMode, setIsRainbowMode] = useState(DEFAULTS.isRainbowMode);
  const [interactionStrength, setInteractionStrength] = useState(DEFAULTS.interactionStrength);
  const [interactionMode, setInteractionMode] = useState(DEFAULTS.interactionMode);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("living-cjk-theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Physics Worker & State Ref
  const workerRef = useRef<Worker | null>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const [charData, setCharData] = useState<any[]>([]);

  const handleReset = () => {
    setStrokeWeight(DEFAULTS.strokeWeight);
    setMotionIntensity(DEFAULTS.motionIntensity);
    setSuppleness(DEFAULTS.suppleness);
    setRigidity(DEFAULTS.rigidity);
    setRestoration(DEFAULTS.restoration);
    setFriction(DEFAULTS.friction);
    setGravityY(DEFAULTS.gravityY);
    setCoordination(DEFAULTS.coordination);
    setLanguage(DEFAULTS.language);
    setShowLabels(DEFAULTS.showLabels);
    setIsRainbowMode(DEFAULTS.isRainbowMode);
    setInteractionStrength(DEFAULTS.interactionStrength);
    setInteractionMode(DEFAULTS.interactionMode);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("living-cjk-theme")) {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const handleToggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("living-cjk-theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  useEffect(() => {
    setLoading(true);
    loadFont(FONTS[language as keyof typeof FONTS])
      .then((f) => {
        setFont(f);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Font loading failed for ${language}:`, err);
        setLoading(false);
      });
  }, [language]);

  useEffect(() => {
    // Initialize Worker from Core Package source for dev
    const worker = new Worker(new URL("../../../packages/core/src/physics/physicsWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      if (e.data.type === "frame") {
        positionsRef.current = e.data.data;
      }
    };
    workerRef.current = worker;

    return () => worker.terminate();
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({
      type: "updateConfig",
      data: {
        gravity: { x: 0, y: gravityY },
        friction,
        rigidity,
        restorationStrength: restoration,
        suppleness,
        motionIntensity,
        coordination,
        interactionStrength,
        interactionMode,
      }
    });
  }, [gravityY, friction, rigidity, restoration, suppleness, motionIntensity, coordination, interactionStrength, interactionMode]);

  const kanjiList = inputText.split("");
  const svgWidth = 1000;
  const svgHeight = 600;
  const padding = 60;
  const availableWidth = svgWidth - padding * 2;
  const numChars = kanjiList.length || 1;
  const charWidthLimit = availableWidth / numChars;
  const size = Math.min(charWidthLimit * 0.85, svgHeight * 0.5, 250);
  const spacing = Math.min(size * 1.1, charWidthLimit);
  const totalContentWidth = (numChars - 1) * spacing;
  const startX = (svgWidth - totalContentWidth) / 2;

  useEffect(() => {
    if (!font || !workerRef.current) return;
    positionsRef.current = null;
    let totalJ = 0;
    const newCharData = kanjiList.map((char, index) => {
        const x = startX + index * spacing;
        const y = svgHeight / 2;
        const skel = createGlyphSkeleton(font, char, x, y, size);
        const data = { char, ...skel, startIndex: totalJ };
        totalJ += skel.joints.length;
        return data;
    });
    setCharData(newCharData);
    workerRef.current.postMessage({ type: "init", data: { charData: newCharData } });
  }, [inputText, font, size, spacing, startX]);

  const SliderField = ({ label, value, min, max, step, onChange }: any) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter transition-colors">
        <span>{label}</span>
        <span>{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100 transition-all"
      />
    </div>
  );
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    workerRef.current?.postMessage({ type: "updateMousePos", data: { x: svgPoint.x, y: svgPoint.y } });
  };

  return (
    <div 
      className={`w-screen h-screen flex flex-col items-center justify-center font-sans overflow-hidden transition-all duration-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${isDarkMode ? "dark" : ""}`}
      style={{ backgroundColor: isDarkMode ? "#020617" : "#ffffff", color: isDarkMode ? "#ffffff" : "#0f172a" }}
    >
      <div className="absolute inset-0 bg-white dark:bg-slate-950 transition-colors duration-500 pointer-events-none" style={{ backgroundColor: isDarkMode ? "#020617" : "#ffffff" }} />
      <header className="absolute top-8 left-8 text-left z-10 pointer-events-none">
        <h1 className="text-3xl font-black leading-none tracking-tight transition-colors duration-500 uppercase">Living CJK</h1>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1 transition-colors duration-500">Kinetic Typography Engine</p>
      </header>

      <div className={`absolute top-8 right-8 z-30 w-64 ${isDarkMode ? "bg-slate-950/90 border-white/10" : "bg-white/95 border-slate-200/60"} backdrop-blur-2xl border p-5 rounded-3xl shadow-2xl transition-all duration-300 ${isSettingsOpen ? "max-h-[1000px]" : "h-[72px] overflow-hidden"}`}>
        <div className="flex justify-between items-center h-[32px] cursor-pointer select-none" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
          <div className="flex items-center gap-2">
            <h2 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/90" : "text-slate-900"}`}>Control Panel</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsHelpOpen(true); }}
              className={`p-1 rounded-md transition-all ${isDarkMode ? "hover:bg-white/10 text-white/40" : "hover:bg-black/5 text-slate-400"} hover:text-emerald-400`}
              title="Parameter Guide"
            >
              <LucideHelpCircle size={14} />
            </button>
            <div className={`w-2 h-2 rounded-full ${isSettingsOpen ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : (isDarkMode ? "bg-slate-800" : "bg-slate-300")}`} />
          </div>
          <button className="text-slate-400 hover:text-slate-900 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform duration-300 ${isSettingsOpen ? "rotate-180" : "rotate-0"}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        
        {isSettingsOpen && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`grid grid-cols-3 gap-1 p-1 ${isDarkMode ? "bg-black/40 shadow-inner" : "bg-slate-100/50"} rounded-xl`}>
              {["JP", "SC", "KR"].map((l) => (
                <button
                  key={l}
                  onClick={(e) => { e.stopPropagation(); setLanguage(l); }}
                  className={`py-1.5 text-[8px] font-black rounded-lg transition-all ${
                    language === l ? (isDarkMode ? "bg-slate-800 text-white shadow-lg" : "bg-white text-slate-800 shadow-sm") : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {l === "JP" ? "JPN" : l === "SC" ? "CHN" : "KOR"}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-left">
              <SliderField label="Stroke Weight" value={strokeWeight} min={0.005} max={0.1} step={0.005} onChange={setStrokeWeight} />
              <SliderField label="Motion" value={motionIntensity} min={0} max={3} step={0.1} onChange={setMotionIntensity} />
              <SliderField label="Suppleness" value={suppleness} min={0} max={1} step={0.05} onChange={setSuppleness} />
              <SliderField label="Coordination" value={coordination} min={0} max={1} step={0.05} onChange={setCoordination} />
              <hr className="border-slate-200/50 dark:border-slate-700/50 my-1 transition-colors" />
              <SliderField label="Rigidity" value={rigidity} min={0} max={1} step={0.05} onChange={setRigidity} />
              <SliderField label="Restoration" value={restoration} min={0} max={1} step={0.05} onChange={setRestoration} />
              <SliderField label="Friction" value={friction} min={0.5} max={0.99} step={0.01} onChange={setFriction} />
              <SliderField label="Gravity" value={gravityY} min={-1} max={2} step={0.1} onChange={setGravityY} />
            </div>

            <div className={`space-y-2 p-3 ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-slate-100/50"} rounded-2xl`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>Touch Interaction</span>
                <div className={`flex gap-1 p-0.5 ${isDarkMode ? "bg-black/40" : "bg-white"} rounded-lg shadow-sm border ${isDarkMode ? "border-white/5" : "border-transparent"}`}>
                  {["Attract", "Repulse"].map(m => (
                    <button
                      key={m}
                      onClick={(e) => { e.stopPropagation(); setInteractionMode(m); }}
                      className={`px-2 py-0.5 text-[8px] font-black rounded-md transition-all ${interactionMode === m ? (isDarkMode ? "bg-white text-slate-900 shadow-lg" : "bg-slate-800 text-white shadow-sm") : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase"}`}
                    >
                      {m === "Attract" ? "吸" : "弾"}
                    </button>
                  ))}
                </div>
              </div>
              <SliderField label="Power" value={interactionStrength} min={0} max={1} step={0.05} onChange={setInteractionStrength} />
            </div>

            <div className="flex flex-col gap-2">
              <div className={`flex justify-between items-center p-3 ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-slate-50"} rounded-xl transition-colors`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>Show Labels</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowLabels(!showLabels); }}
                  className={`w-12 h-6 rounded-full transition-all relative ${showLabels ? (isDarkMode ? "bg-slate-700" : "bg-slate-800") : (isDarkMode ? "bg-slate-800 shadow-inner" : "bg-slate-200")}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${showLabels ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className={`flex justify-between items-center p-3 ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-slate-50"} rounded-xl transition-colors`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>Rainbow Mode</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsRainbowMode(!isRainbowMode); }}
                  className={`w-12 h-6 rounded-full transition-all relative ${isRainbowMode ? "bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400" : (isDarkMode ? "bg-slate-800 shadow-inner" : "bg-slate-200")}`}
                >
                  <div className={`absolute top-1 w-4 h-4 ${isDarkMode ? "bg-white" : "bg-white"} rounded-full shadow-md transition-all ${isRainbowMode ? "left-7" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className={`flex items-center gap-2 flex-1 p-2 ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-slate-100/50"} rounded-xl`}>
                <span className={`text-[10px] font-black uppercase tracking-widest flex-1 ${isDarkMode ? "text-white/40" : "text-slate-500"}`}>Theme</span>
                <button
                  onClick={handleToggleTheme}
                  className={`flex items-center justify-center p-1.5 ${isDarkMode ? "bg-white text-slate-900 shadow-lg" : "bg-white text-slate-800"} rounded-lg shadow-sm transition-all hover:scale-110 active:scale-95`}
                >
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  )}
                </button>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className={`flex-1 py-3 ${isDarkMode ? "bg-white text-slate-900 shadow-lg" : "bg-slate-800 text-white hover:bg-slate-900"} rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]`}>Reset</button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <div className={`${isDarkMode ? "bg-slate-950/90 border-white/10" : "bg-white/95 border-slate-200/50"} backdrop-blur-xl p-5 h-[72px] rounded-3xl shadow-2xl border flex items-center gap-2 transition-colors`}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, 40))}
            placeholder="漢字を入力..."
            className={`flex-1 ${isDarkMode ? "bg-white/5 text-white placeholder:text-white/20 focus:ring-white/20" : "bg-slate-50 text-slate-900 focus:ring-slate-900"} border-none rounded-xl px-4 py-2 focus:ring-2 outline-none font-bold transition-all`}
          />
          <div className={`px-4 flex flex-col justify-center items-end border-l ${isDarkMode ? "border-white/10" : "border-slate-200/60"}`}>
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>Count</span>
            <div className={`text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"} tabular-nums`}>
              {loading ? "..." : kanjiList.length}<span className="opacity-30 text-[10px] font-bold">/40</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="w-full h-full bg-transparent relative">
        <svg onMouseMove={handleMouseMove} onMouseLeave={() => workerRef.current?.postMessage({ type: "updateMousePos", data: null })} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)"} strokeWidth="1" className="transition-colors duration-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {!loading && font && charData.map((c, index) => (
            <LivingCJK 
              key={`${c.char}-${index}`} 
              char={c.char}
              data={c}
              positionsRef={positionsRef}
              startIndex={c.startIndex}
              x={startX + index * spacing} 
              y={svgHeight / 2} 
              index={index}
              size={size}
              strokeWeight={strokeWeight}
              isRainbowMode={isRainbowMode}
              showLabels={showLabels}
              isDarkMode={isDarkMode}
              onHoverChange={(isHovering) => workerRef.current?.postMessage({ type: "updateHover", data: isHovering ? index : null })}
              onBurst={() => workerRef.current?.postMessage({ type: "burst", data: index })}
            />
          ))}
        </svg>
      </main>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;
