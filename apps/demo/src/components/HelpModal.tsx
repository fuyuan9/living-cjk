import { LucideX, LucideHelpCircle } from "lucide-react";
import { PARAMETER_HELP } from "../data/parameterHelp";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const HelpModal = ({ isOpen, onClose, isDarkMode }: HelpModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/20 overflow-hidden">
      <div 
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border transition-all duration-500 animate-in zoom-in-95 ${
          isDarkMode ? "bg-slate-950/90 border-white/10 text-white" : "bg-white/95 border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-white/5 text-left">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
              <LucideHelpCircle className={isDarkMode ? "text-emerald-400" : "text-emerald-600"} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Parameter Guide</h2>
              <p className={`text-[10px] font-bold uppercase tracking-widest opacity-50`}>How to tune your Kinetic Typography</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-all hover:rotate-90 ${isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"}`}
          >
            <LucideX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar text-left">
          {PARAMETER_HELP.map((param) => (
            <div 
              key={param.id}
              className={`p-6 rounded-3xl border transition-all ${
                isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-transparent hover:bg-slate-100"
              }`}
            >
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-emerald-400" : "bg-emerald-600"}`} />
                {param.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className={`text-[8px] font-bold uppercase tracking-widest opacity-40`}>English</span>
                  <p className="text-xs leading-relaxed font-medium">{param.descriptions.en}</p>
                </div>
                <div className="space-y-1">
                  <span className={`text-[8px] font-bold uppercase tracking-widest opacity-40`}>日本語</span>
                  <p className="text-xs leading-relaxed font-medium">{param.descriptions.jp}</p>
                </div>
                <div className="space-y-1 border-t md:border-t-0 md:pt-0 pt-3 border-white/5">
                  <span className={`text-[8px] font-bold uppercase tracking-widest opacity-40`}>简体中文</span>
                  <p className="text-xs leading-relaxed font-medium">{param.descriptions.sc}</p>
                </div>
                <div className="space-y-1 border-t md:border-t-0 md:pt-0 pt-3 border-white/5">
                  <span className={`text-[8px] font-bold uppercase tracking-widest opacity-40`}>한국어</span>
                  <p className="text-xs leading-relaxed font-medium">{param.descriptions.kr}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`p-6 text-center border-t border-white/5 ${isDarkMode ? "bg-white/[0.02]" : "bg-slate-50/50"}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30">Living CJK - Interactive Kinetic Typography Engine</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: ${isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}; 
        }
      `}} />
    </div>
  );
};
