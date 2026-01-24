
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

  const [loadingMsg, setLoadingMsg] = useState("Iniciando...");

  const updateStep = (step: AppStep) => setState(prev => ({ ...prev, step }));

  const handleStart = () => {
    updateStep('capture-clothing');
  };

  const startNewFitting = () => {
    setState({
      step: 'capture-clothing',
      clothingImage: null,
      selfieImage: null,
      resultImage: null,
      errorMessage: null,
    });
  };

  const resetToWelcome = () => {
    setState({
      step: 'welcome',
      clothingImage: null,
      selfieImage: null,
      resultImage: null,
      errorMessage: null,
    });
  };

  const runFittingProcess = useCallback(() => {
    if (!state.clothingImage || !state.selfieImage) return;

    const messages = ["Escaneando a peça...", "Analisando caimento...", "Costurando digitalmente...", "Finalizando o look..."];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingMsg(messages[i % messages.length]);
      i++;
    }, 2000);

    processVirtualFitting(state.clothingImage, state.selfieImage)
      .then(result => {
        setState(prev => ({ ...prev, resultImage: result, step: 'result', errorMessage: null }));
      })
      .catch(err => {
        setState(prev => ({ ...prev, step: 'error', errorMessage: String(err) }));
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

  const renderContent = () => {
    switch (state.step) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-between flex-1 py-2 fade-in">
            <div className="w-full bg-[#151515] aspect-[4/5] rounded-[2.5rem] flex items-center justify-center relative overflow-hidden">
               <div className="w-64 h-64 bg-[#FFC20E] rounded-full flex flex-col items-center justify-center p-6 text-center shadow-[0_0_50px_rgba(255,194,14,0.15)]">
                  <span className="text-[44px] font-black text-black uppercase leading-[0.8] tracking-tighter">peça<br/>rara</span>
                  <span className="text-[14px] font-bold text-black uppercase tracking-[0.4em] mt-3">brechó</span>
               </div>
            </div>

            <div className="w-full flex flex-col items-center text-center mt-10 space-y-2">
              <h2 className="text-[26px] font-black uppercase tracking-tight leading-tight">
                O SEU PROVADOR<br/>
                <span className="bg-[#FFC20E] text-black px-4 py-0.5 inline-block mt-1">INTELIGENTE</span>
              </h2>
              <p className="text-gray-500 text-[13px] font-medium pt-3 px-6">
                Experimente qualquer peça do nosso acervo em segundos.
              </p>
            </div>

            <button 
              onClick={handleStart} 
              className="w-full py-5 bg-[#FFC20E] text-black rounded-[1.5rem] font-black text-[18px] uppercase tracking-tight mt-10 shadow-[0_10px_30px_rgba(255,194,14,0.3)] hover:brightness-105 active:scale-95 transition-all"
            >
              INICIAR PROVADOR
            </button>
          </div>
        );

      case 'capture-clothing':
        return (
          <CameraCapture 
            label="Foto da Peça" 
            description="Tire uma foto nítida da roupa, preferencialmente em um cabide ou fundo liso." 
            onCapture={(img) => setState(prev => ({ ...prev, clothingImage: img, step: 'capture-selfie' }))} 
            icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7h-3V5c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2ZM9 5h6v2H9V5Zm11 15H4V9h3c.55 0 1-.45 1-1V6h8v2c0 .55.45 1 1 1h3v11Z"/><circle cx="12" cy="13" r="3"/></svg>}
            tips={["Fundo neutro", "Sem dobras", "Boa iluminação"]}
          />
        );

      case 'capture-selfie':
        return (
          <CameraCapture 
            label="Sua Foto" 
            description="Tire uma foto de corpo inteiro ou meio corpo, de frente para a câmera." 
            onCapture={(img) => setState(prev => ({ ...prev, selfieImage: img, step: 'processing' }))} 
            icon={<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
            tips={["Cabelo preso", "Roupa justa", "Ambiente claro"]}
          />
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center flex-1 space-y-8 fade-in">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 border-[#FFC20E]/20 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-[#FFC20E] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Criando seu look</h2>
              <p className="text-[#FFC20E] text-[11px] font-black uppercase tracking-[0.3em] animate-pulse">{loadingMsg}</p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="flex flex-col items-center space-y-6 fade-in py-2">
            <div className="w-full rounded-[2.5rem] overflow-hidden border-2 border-[#151515] bg-[#151515] shadow-2xl relative">
              <img src={state.resultImage || ''} alt="Resultado" className="w-full h-auto" />
              <div className="absolute top-4 right-4 bg-[#FFC20E] text-black text-[9px] font-black px-3 py-1 rounded-full uppercase">Look Gerado</div>
            </div>
            <div className="w-full pt-4">
              <button onClick={startNewFitting} className="w-full py-5 bg-[#FFC20E] text-black rounded-[1.5rem] font-black text-lg uppercase tracking-tight shadow-[0_10px_30px_rgba(255,194,14,0.3)] hover:scale-[1.02] transition-transform">NOVA PEÇA</button>
              <button onClick={resetToWelcome} className="w-full py-3 mt-2 text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] text-center">Voltar ao Início</button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center flex-1 text-center space-y-8 fade-in">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase">Ops! Algo falhou</h3>
              <p className="text-gray-400 font-medium px-8 text-sm">{state.errorMessage}</p>
            </div>
            <button onClick={startNewFitting} className="w-full py-4 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-tight">Tentar Novamente</button>
          </div>
        );
    }
  };

  return <Layout>{renderContent()}</Layout>;
};

export default App;
