
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-black text-white relative shadow-[0_0_100px_rgba(255,194,14,0.05)]">
      <header className="p-6 border-b border-stone-900 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFC20E] rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-[#FFC20E]/10">
            <span className="text-black font-black text-[10px] leading-tight text-center -rotate-3">PR</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-white tracking-tighter text-xl leading-none">PEÇA RARA</h1>
            <span className="text-[9px] font-bold text-[#FFC20E] tracking-[0.4em] uppercase opacity-80">Experiência Digital</span>
          </div>
        </div>
        {title && (
          <div className="px-4 py-1.5 bg-stone-900 rounded-full border border-stone-800">
            <span className="text-[10px] font-black text-[#FFC20E] uppercase tracking-widest">{title}</span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-10">
        {children}
      </main>

      <footer className="p-8 text-center border-t border-stone-900 bg-black/50">
        <div className="space-y-2 opacity-30">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Brechó de Luxo & Curadoria</p>
          <p className="text-[8px] font-medium italic">Tecnologia Gemini Vision v2.5</p>
        </div>
      </footer>
    </div>
  );
};
