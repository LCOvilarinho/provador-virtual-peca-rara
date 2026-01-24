import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { CameraCapture } from './components/CameraCapture';
import { processVirtualFitting } from './services/gemini';
import { AppStep, AppState } from './types';

// Define the AIStudio interface to match the environment's expected type
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    // Using the specific type name and optional modifier to match environment declarations
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'welcome',
    clothingImage: null,
    selfieImage: null,
    resultImage: null,
    errorMessage: null,
  });

  const [loadingMessage, setLoadingMessage] = useState("Iniciando...");
  const [retryCountdown, setRetryCountdown] = useState(0);

  const updateStep = (step: AppStep) => setState(prev => ({ ...prev, step }));

  const handleClothingCapture = (base64: string) => {
    setState(prev => ({ ...prev, clothingImage: base64, step: 'capture-selfie' }));
  };

  const handleSelfieCapture = (base64: string) => {
    setState(prev => ({ ...prev, selfieImage: base64, step: 'processing' }));
  };

  const handleSelectKey = useCallback(async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        updateStep('processing');
      } else {
        window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
      }
    } catch (e) {
      console.error("Erro ao abrir seletor", e);
    }
  }, []);

  const runFittingProcess = useCallback(() => {
    if (!state.clothingImage || !state.selfieImage) return;

    const messages = ["Vestindo peça...", "Ajustando look...", "Finalizando..."];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[i % messages.length]);
      i++;
    }, 3000);

    processVirtualFitting(state.clothingImage, state.selfieImage)
      .then(result => {
        setState(prev => ({ ...prev, resultImage: result, step: 'result', errorMessage: null }));
      })
      .catch(err => {
        const errorStr = String(err);
        // Handle "Requested entity was not found" or missing key by triggering the key selection dialog
        if (errorStr.includes("entity was not found") || errorStr.includes("API key")) {
          handleSelectKey();
          return;
        }
        setState(prev => ({ ...prev, step: 'error', errorMessage: errorStr }));
        setRetryCountdown(30);
      })
      .finally(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [state.clothingImage, state.selfieImage, handleSelectKey]);

  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  useEffect(() => {
    if (state.step === 'processing') {
      const cleanup = runFittingProcess();
      return cleanup;
    }
  }, [state.step, runFittingProcess]);

  const reset = () => {
    setState({ step: 'welcome', clothingImage: null, selfieImage: null, resultImage: null, errorMessage: null });
  };

  const renderContent = () => {
    switch (state.step) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
            <div className="w-full aspect-square bg-stone-900 rounded-3xl overflow-hidden flex items-center justify-center p-4 border border-stone-800 shadow-2xl">
              <div className="w-64 h-64 bg-[#FFC20E] rounded-full flex flex-col items-center justify-center shadow-2xl transform rotate-[-3deg]">
                <h1 className="text-black font-black text-5xl tracking-tighter leading-none mb-1">peça</h1>
                <h1 className="text-black font-black text-5xl tracking-tighter leading-none">rara</h1>
                <span className="text-black font-bold text-lg tracking-[0.3em] mt-2">BRECHÓ</span>
              </div>
            </div>
            <div className="space-y-4 px-2">
              <h2 className="text-3xl font-black text-white uppercase leading-tight">O seu provador<br /><span className="text-black bg-[#FFC20E] px-2">inteligente</span></h2>
              <p className="text-stone-400 text-sm font-medium">Evite filas e veja o look instantaneamente.</p>
            </div>
            <button onClick={() => updateStep('capture-clothing')} className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl uppercase active:scale-[0.98] transition-all">Iniciar Agora</button>
          </div>
        );

      case 'capture-clothing':
        return <CameraCapture label="Foto da Peça" description="Fotografe a roupa em um cabide ou esticada." onCapture={handleClothingCapture} icon={<svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V21a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z"/><path d="M12 2v21"/></svg>} />;

      case 'capture-selfie':
        return <CameraCapture label="Sua Selfie" description="Tire uma foto de corpo inteiro." onCapture={handleSelfieCapture} icon={<svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />;

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
            <div className="w-32 h-32 border-4 border-stone-900 border-t-[#FFC20E] rounded-full animate-spin"></div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Processando Look...</h2>
              <p className="text-[#FFC20E] text-xs font-bold uppercase animate-pulse tracking-widest">{loadingMessage}</p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="flex flex-col items-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-full rounded-[2.5rem] overflow-hidden border-4 border-[#FFC20E] bg-stone-900 shadow-2xl relative">
              <img src={state.resultImage || ''} alt="Resultado" className="w-full h-auto object-cover" />
            </div>
            <button onClick={reset} className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl uppercase shadow-xl active:scale-95 transition-transform">Provar Outra</button>
          </div>
        );

      case 'error':
        const isQuota = state.errorMessage?.includes('LIMITE') || state.errorMessage?.includes('429');
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 px-4 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center border-2 border-red-900/50">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase">{isQuota ? 'Servidor Lotado' : 'Erro na IA'}</h2>
              <p className="text-stone-500 text-xs font-medium max-w-[280px]">
                {isQuota 
                  ? "A Vercel atingiu o limite de requisições gratuitas. Tente novamente em alguns segundos ou use sua própria chave." 
                  : state.errorMessage}
              </p>
            </div>
            <div className="w-full space-y-3">
              <button 
                onClick={handleSelectKey}
                className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-lg uppercase shadow-lg active:scale-95 flex flex-col items-center justify-center leading-none"
              >
                Configurar Minha Chave
                <span className="text-[8px] mt-1 font-bold opacity-70 italic">Para uso ilimitado e estável</span>
              </button>
              <button onClick={() => updateStep('processing')} disabled={retryCountdown > 0} className={`w-full py-4 rounded-2xl font-black uppercase transition-all ${retryCountdown > 0 ? 'bg-stone-900 text-stone-600' : 'bg-white text-black'}`}>
                {retryCountdown > 0 ? `Aguarde ${retryCountdown}s` : 'Tentar Novamente'}
              </button>
              <button onClick={reset} className="text-stone-600 font-bold uppercase text-[10px] tracking-widest mt-4">Voltar ao Início</button>
            </div>
          </div>
        );
    }
  };

  return <Layout title={state.step !== 'welcome' ? 'Modo Provador' : undefined}>{renderContent()}</Layout>;
};

export default App;