
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

  const [loadingMessage, setLoadingMessage] = useState("Iniciando...");

  const updateStep = (step: AppStep) => setState(prev => ({ ...prev, step }));

  const handleStart = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Assumimos sucesso e prosseguimos
      }
    }
    updateStep('capture-clothing');
  };

  const handleConfig = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const runFittingProcess = useCallback(() => {
    if (!state.clothingImage || !state.selfieImage) return;

    const messages = [
      "Escaneando modelagem...",
      "Processando texturas...",
      "Renderizando alta definição...",
      "Finalizando composição..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[i % messages.length]);
      i++;
    }, 2500);

    processVirtualFitting(state.clothingImage, state.selfieImage)
      .then(result => {
        setState(prev => ({ ...prev, resultImage: result, step: 'result', errorMessage: null }));
      })
      .catch(err => {
        const errorStr = String(err);
        setState(prev => ({ ...prev, step: 'error', errorMessage: errorStr }));
      })
      .finally(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [state.clothingImage, state.selfieImage]);

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
          <div className="flex flex-col items-center justify-center text-center space-y-12 animate-fade-in py-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#FFC20E]/20 blur-3xl rounded-full"></div>
              <div className="relative w-72 h-72 bg-[#FFC20E] rounded-[4rem] flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(255,194,14,0.3)] transform -rotate-2 hover:rotate-0 transition-all duration-700">
                <h1 className="text-black font-black text-7xl tracking-tighter leading-none">peça</h1>
                <h1 className="text-black font-black text-7xl tracking-tighter leading-none">rara</h1>
                <div className="h-1.5 w-32 bg-black my-3 rounded-full"></div>
                <span className="text-black font-black text-xs tracking-[0.5em] uppercase">Showcase Edition</span>
              </div>
            </div>

            <div className="space-y-4 px-6 relative">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                Provador <span className="text-[#FFC20E]">Ultra IA</span>
              </h2>
              <p className="text-stone-500 text-sm font-medium italic">Alta costura encontra a inteligência artificial.</p>
            </div>

            <div className="w-full space-y-5">
              <button 
                onClick={handleStart} 
                className="w-full py-6 bg-white text-black rounded-3xl font-black text-2xl uppercase shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Entrar na Experiência
              </button>
              
              <button 
                onClick={handleConfig}
                className="text-stone-700 font-black text-[10px] uppercase tracking-[0.3em] hover:text-[#FFC20E] transition-colors"
              >
                Configurações de Unidade
              </button>
            </div>
          </div>
        );

      case 'capture-clothing':
        return <CameraCapture label="A Roupa" description="Fotografe a peça com clareza em um fundo sólido." onCapture={(img) => { setState(prev => ({ ...prev, clothingImage: img, step: 'capture-selfie' })) }} icon={<svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V21a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z"/><path d="M12 2v21"/></svg>} />;

      case 'capture-selfie':
        return <CameraCapture label="A Modelo" description="Foto de corpo inteiro para ajuste de silhueta." onCapture={(img) => { setState(prev => ({ ...prev, selfieImage: img, step: 'processing' })) }} icon={<svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />;

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-12 py-20">
            <div className="relative w-48 h-48">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-900" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#FFC20E] stroke-dasharray-[552] animate-[dash_3s_ease-in-out_infinite]" strokeDasharray="552" />
              </svg>
              <div className="absolute inset-8 bg-stone-950 rounded-full flex items-center justify-center border border-stone-800 shadow-inner">
                <span className="text-[#FFC20E] font-black text-3xl animate-pulse tracking-tighter">AI</span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gerando Preview</h2>
              <p className="text-[#FFC20E] text-xs font-bold uppercase tracking-[0.3em] animate-pulse">{loadingMessage}</p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="flex flex-col items-center space-y-10 animate-in zoom-in duration-1000">
            <div className="w-full rounded-[4rem] overflow-hidden border-2 border-stone-800 bg-stone-950 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative">
              <img src={state.resultImage || ''} alt="Resultado" className="w-full h-auto" />
              <div className="absolute top-8 right-8 flex gap-2">
                <div className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-white uppercase">Ultra HD</span>
                </div>
              </div>
            </div>
            <div className="w-full space-y-5">
              <button onClick={reset} className="w-full py-6 bg-[#FFC20E] text-black rounded-3xl font-black text-2xl uppercase shadow-2xl hover:brightness-110 active:scale-95 transition-all">Novo Look</button>
              <p className="text-center text-stone-600 font-bold uppercase text-[9px] tracking-[0.4em]">Experiência Peça Rara © 2025</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-10 py-16 px-8">
            <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center border border-red-500/20 shadow-2xl">
              <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white uppercase leading-none">Ajuste Necessário</h2>
              <p className="text-stone-500 text-sm font-medium leading-relaxed italic">
                {state.errorMessage}
              </p>
            </div>
            <div className="w-full space-y-4 pt-6">
              <button onClick={handleConfig} className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase shadow-xl">Reconfigurar Unidade</button>
              <button onClick={reset} className="text-stone-600 font-bold uppercase text-[10px] tracking-widest border-b border-stone-800 pb-1">Voltar ao Início</button>
            </div>
          </div>
        );
    }
  };

  return <Layout title={state.step !== 'welcome' ? 'Digital Fitting' : undefined}>{renderContent()}</Layout>;
};

export default App;
