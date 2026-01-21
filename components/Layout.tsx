
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-black shadow-2xl relative border-x border-stone-900">
      <header className="p-4 border-b border-stone-900 flex items-center justify-between sticky top-0 bg-black z-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#FFC20E] rounded-full flex items-center justify-center shadow-sm">
            <span className="text-black font-black text-[9px] leading-none text-center">PEÇA<br/>RARA</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-[#FFC20E] tracking-tighter text-lg leading-none">PEÇA RARA</h1>
            <span className="text-[10px] font-bold text-stone-500 tracking-[0.2em]">BRECHÓ</span>
          </div>
        </div>
        {title && <span className="text-[10px] font-bold text-[#FFC20E] uppercase tracking-widest bg-stone-900 px-3 py-1 rounded-full border border-stone-800">{title}</span>}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        {children}
      </main>

      <footer className="p-6 text-center border-t border-stone-900 bg-black">
        <p className="text-[10px] text-stone-500 leading-tight font-semibold uppercase tracking-widest">
          Fotos processadas localmente e descartadas. 
          <br /><span className="text-stone-700">© 2024 Peça Rara Brechó</span>
        </p>
      </footer>
    </div>
  );
};
