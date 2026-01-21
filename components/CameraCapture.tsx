
import React, { useRef } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label, description, icon }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-32 h-32 bg-[#FFC20E] rounded-[2.5rem] flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,194,14,0.15)] transform rotate-3">
        <div className="transform -rotate-3 scale-110">
          {icon}
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{label}</h2>
        <p className="text-stone-400 text-sm leading-relaxed px-4 font-medium italic">{description}</p>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      <div className="w-full space-y-6">
        <button
          onClick={triggerCamera}
          className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-tight"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          Abrir Câmera
        </button>

        <p className="text-[10px] text-stone-600 font-bold uppercase tracking-[0.2em] bg-stone-900 py-3 px-6 rounded-full border border-stone-800">
          A luz é tudo: Prefira ambientes claros.
        </p>
      </div>
    </div>
  );
};
