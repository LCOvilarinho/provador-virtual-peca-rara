import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { CameraCapture } from './components/CameraCapture';
import { processVirtualFitting } from './services/gemini';
import { AppStep, AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'welcome',
    clothingImage: null,
    selfieImage: null,
    resultImage: null,
    errorMessage: null,
  });

  const [loadingMessage, setLoadingMessage] = useState("Preparando visual...");
  const [retryCountdown, setRetryCountdown] = useState(0);

  const updateStep = (step: AppStep) => setState(prev => ({ ...prev, step }));

  const handleClothingCapture = (base64: string) => {
    setState(prev => ({ ...prev, clothingImage: base64, step: 'capture-selfie' }));
  };

  const handleSelfieCapture = (base64: string) => {
    setState(prev => ({ ...prev, selfieImage: base64, step: 'processing' }));
  };

  const runFittingProcess = useCallback(() => {
    if (!state.clothingImage || !state.selfieImage) return;

    const messages = ["Otimizando...", "Ajustando caimento...", "Renderizando...", "Finalizando!"];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[i % messages.length]);
      i++;
    }, 4000);

    processVirtualFitting(state.clothingImage, state.selfieImage)
      .then(result => {
        setState(prev => ({ ...prev, resultImage: result, step: 'result', errorMessage: null }));
      })
      .catch(err => {
        const errorStr = String(err);
        setState(prev => ({ ...prev, step: 'error', errorMessage: errorStr }));
        
        // Na Vercel, o limite 429 exige mais tempo. Usamos 120s para garantir.
        if (errorStr.includes('LIMITE') || errorStr.includes('429')) {
          setRetryCountdown(120);
        }
      })
      .finally(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [state.clothingImage, state.selfieImage]);

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
    setRetryCountdown(0);
  };

  const renderContent = () => {
    switch (state.step) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
            <div className="w-full aspect-square bg-stone-900 rounded-3xl overflow-hidden flex items-center justify-center p-4 border border-stone-800">
              <div className="w-64 h-64 bg-[#FFC20E] rounded-full flex flex-col items-center justify-center shadow-2xl transform rotate-[-3deg]">
                <h1 className="text-black font-black text-5xl tracking-tighter leading-none mb-1">peça</h1>
                <h1 className="text-black font-black text-5xl tracking-tighter leading-none">rara</h1>
                <span className="text-black font-bold text-lg tracking-[0.3em] mt-2">BRECHÓ</span>
              </div>
            </div>
            <div className="space-y-4 px-2">
              <h2 className="text-3xl font-black text-white uppercase leading-tight">O seu provador<br /><span className="text-black bg-[#FFC20E] px-2">inteligente</span></h2>
              <p className="text-stone-400 text-sm font-medium">Veja looks do nosso brechó em você instantaneamente.</p>
            </div>
            <button onClick={() => updateStep('capture-clothing')} className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl uppercase active:scale-[0.98] transition-all">Iniciar Provador</button>
          </div>
        );

      case 'capture-clothing':
        return <CameraCapture label="Foto da Peça" description="Tire uma foto nítida da peça no cabide ou arara." onCapture={handleClothingCapture} icon={<svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V21a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z"/><path d="M12 2v21"/></svg>} />;

      case 'capture-selfie':
        return <CameraCapture label="Sua Selfie" description="Uma foto frontal bem iluminada para vestir a peça." onCapture={handleSelfieCapture} icon={<svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />;

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
            <div className="w-32 h-32 border-4 border-stone-900 border-t-[#FFC20E] rounded-full animate-spin"></div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase">Criando Look...</h2>
              <p className="text-[#FFC20E] text-xs font-bold uppercase tracking-widest animate-pulse">{loadingMessage}</p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full rounded-[2.5rem] overflow-hidden border-4 border-[#FFC20E] bg-stone-900">
              <img src={state.resultImage || ''} alt="Resultado" className="w-full h-auto object-cover" />
            </div>
            <button onClick={reset} className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl uppercase shadow-xl active:scale-95 transition-transform">Tentar Outra Peça</button>
          </div>
        );

      case 'error':
        const isLimit = state.errorMessage?.includes('LIMITE');
        const isSafety = state.errorMessage?.includes('SEGURANÇA');
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 px-4">
            <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center border-2 border-red-900/30 animate-pulse-ring">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white uppercase">{isLimit ? 'Cota Esgotada' : isSafety ? 'Foto Recusada' : 'Erro no App'}</h2>
              <p className="text-stone-500 text-xs font-medium leading-relaxed">{state.errorMessage}</p>
              {isLimit && <p className="text-[#FFC20E] text-[10px] font-bold uppercase">A cota gratuita do Google é compartilhada. Aguarde a renovação.</p>}
            </div>
            <div className="w-full space-y-3">
              {isLimit ? (
                <div className="w-full py-5 bg-stone-900 text-stone-500 rounded-2xl font-black uppercase text-center border border-stone-800">
                  Liberando em {retryCountdown}s
                </div>
              ) : (
                <button onClick={() => updateStep('processing')} className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black uppercase">Tentar Novamente</button>
              )}
              <button onClick={reset} className="w-full py-4 text-stone-500 font-black uppercase text-[10px]">Voltar ao Início</button>
            </div>
          </div>
        );
    }
  };

  return <Layout title={state.step !== 'welcome' ? 'Fitting Room' : undefined}>{renderContent()}</Layout>;
};

export default App;