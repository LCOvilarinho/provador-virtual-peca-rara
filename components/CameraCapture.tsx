
import React, { useRef } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
  tips?: string[];
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label, description, icon, tips }) => {
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

  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-8 fade-in py-4">
      <div className="w-32 h-32 bg-[#151515] rounded-[2.5rem] flex items-center justify-center text-[#FFC20E] border border-white/5 shadow-inner">
        {icon}
      </div>
      
      <div className="text-center space-y-3 px-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">{label}</h2>
        <p className="text-gray-400 text-sm font-medium leading-relaxed px-4">{description}</p>
      </div>

      {tips && (
        <div className="flex flex-wrap justify-center gap-2 px-6">
          {tips.map((tip, idx) => (
            <span key={idx} className="bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg tracking-wider">
              ✓ {tip}
            </span>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      <div className="w-full pt-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-5 bg-[#FFC20E] text-black rounded-[1.5rem] font-black text-lg uppercase tracking-tight shadow-[0_10px_30px_rgba(255,194,14,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Tirar Foto
        </button>
        <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-widest mt-4">Ou selecione da galeria</p>
      </div>
    </div>
  );
};
