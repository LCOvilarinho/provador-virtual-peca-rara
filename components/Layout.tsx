
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-black text-white relative">
      {/* Header idêntico ao screenshot */}
      <header className="px-6 py-6 flex items-center gap-3">
        <div className="w-[42px] h-[42px] bg-[#FFC20E] rounded-full flex flex-col items-center justify-center p-1 shadow-sm">
          <span className="text-[7px] font-black text-black leading-[0.9] uppercase text-center tracking-tighter">PEÇA<br/>RARA</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-[17px] font-black tracking-tighter text-[#FFC20E] uppercase leading-none">PEÇA RARA</h1>
          <span className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase leading-none mt-1">BRECHÓ</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6">
        {children}
      </main>

      {/* Footer idêntico ao screenshot */}
      <footer className="py-8 px-6 text-center space-y-1 opacity-50">
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          FOTOS PROCESSADAS LOCALMENTE E DESCARTADAS.
        </p>
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          © 2024 PEÇA RARA BRECHÓ
        </p>
      </footer>
    </div>
  );
};
