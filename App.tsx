
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

  const [loadingMessage, setLoadingMessage] = useState("Preparando seu visual...");

  const updateStep = (step: AppStep) => setState(prev => ({ ...prev, step }));

  const startFitting = () => updateStep('capture-clothing');

  const handleClothingCapture = (base64: string) => {
    setState(prev => ({ ...prev, clothingImage: base64, step: 'capture-selfie' }));
  };

  const handleSelfieCapture = (base64: string) => {
    setState(prev => ({ ...prev, selfieImage: base64, step: 'processing' }));
  };

  const runFittingProcess = useCallback(() => {
    if (!state.clothingImage || !state.selfieImage) return;

    const messages = [
      "Analisando tecidos...",
      "Ajustando o caimento...",
      "Harmonizando iluminação...",
      "Quase pronto...",
      "Finalizando sua produção!"
    ];
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[msgIndex % messages.length]);
      msgIndex++;
    }, 3000);

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

  const retryProcessing = () => {
    setState(prev => ({ ...prev, step: 'processing', errorMessage: null }));
  };

  const reset = () => {
    setState({
      step: 'welcome',
      clothingImage: null,
      selfieImage: null,
      resultImage: null,
      errorMessage: null,
    });
  };

  const renderContent = () => {
    switch (state.step) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
            <div className="w-full aspect-square bg-stone-900 rounded-3xl overflow-hidden flex items-center justify-center p-4 relative border border-stone-800">
              <div className="w-64 h-64 bg-[#FFC20E] rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,194,14,0.2)] transform rotate-[-3deg]">
                <h1 className="text-black font-black text-5xl tracking-tighter leading-none mb-1">peça</h1>
                <h1 className="text-black font-black text-5xl tracking-tighter leading-none">rara</h1>
                <span className="text-black font-bold text-lg tracking-[0.3em] mt-2">BRECHÓ</span>
              </div>
            </div>
            
            <div className="space-y-4 px-2">
              <h2 className="text-3xl font-black text-white leading-[1.2] tracking-tighter uppercase">
                O seu provador<br /><span className="inline-block mt-4 text-black bg-[#FFC20E] px-2">inteligente</span>
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed font-medium">
                Sustentabilidade com tecnologia de ponta. Veja seu novo look instantaneamente em nosso ambiente digital.
              </p>
            </div>

            <div className="w-full space-y-3 pt-4">
              <button
                onClick={startFitting}
                className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-tight"
              >
                Iniciar Provador
              </button>
              <a 
                href="https://site.pecararabrecho.com.br/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full py-4 bg-transparent border-2 border-stone-800 text-stone-300 rounded-2xl font-black active:scale-[0.98] transition-all uppercase tracking-tight text-sm"
              >
                Conhecer a Peça Rara
              </a>
            </div>

            <div className="mt-8">
              <p className="text-[10px] text-stone-600 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FFC20E] rounded-full animate-pulse shadow-[0_0_8px_#FFC20E]"></span>
                IA Vision Ativa • Premium Experience
              </p>
            </div>
          </div>
        );

      case 'capture-clothing':
        return (
          <CameraCapture 
            label="Foto da Peça"
            description="Tire uma foto nítida da roupa. O segredo de um bom provador virtual é a claridade da foto da peça."
            onCapture={handleClothingCapture}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V21a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z"/><path d="M12 2v21"/>
              </svg>
            }
          />
        );

      case 'capture-selfie':
        return (
          <CameraCapture 
            label="Sua Selfie"
            description="Agora precisamos ver você. Uma foto frontal bem iluminada garante o melhor caimento da roupa."
            onCapture={handleSelfieCapture}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
          />
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-stone-900 border-t-[#FFC20E] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center animate-pulse border border-stone-800">
                  <span className="text-[#FFC20E] font-black text-xl tracking-tighter">PR IA</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Renderizando Look...</h2>
              <p className="text-[#FFC20E] text-xs font-bold uppercase tracking-widest animate-pulse">{loadingMessage}</p>
            </div>

            <div className="w-full bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">
                Nossa inteligência artificial está mesclando as texturas para criar uma visualização realista.
              </p>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="flex flex-col items-center space-y-8 animate-in zoom-in duration-500">
            <div className="w-full rounded-[2.5rem] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] border-4 border-[#FFC20E] relative bg-stone-900">
              <img 
                src={state.resultImage || ''} 
                alt="Provador Virtual Resultado" 
                className="w-full h-auto object-cover min-h-[400px]"
              />
              <div className="absolute bottom-6 left-6 bg-[#FFC20E] text-black px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl">
                LOOK PERSONALIZADO
              </div>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Look Finalizado</h2>
              <p className="text-stone-400 text-sm font-medium">As roupas do nosso brechó ganham vida em você.</p>
            </div>

            <div className="w-full pt-4">
              <button
                onClick={reset}
                className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-tight active:scale-95 transition-transform"
              >
                {/* Fixed incorrect xmlns typo: http://www.w3.org/2000/round -> http://www.w3.org/2000/svg */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                Tentar Outra Peça
              </button>
            </div>
          </div>
        );

      case 'error':
        const isAuthError = state.errorMessage?.toLowerCase().includes('chave') || state.errorMessage?.toLowerCase().includes('permissão');
        
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-12 px-4">
            <div className="w-24 h-24 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center border-4 border-red-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">
                {isAuthError ? 'Erro de Configuração' : 'Problema Técnico'}
              </h2>
              <div className="bg-stone-900 p-4 rounded-xl border border-red-900/20">
                <p className="text-red-400 text-xs font-mono break-all">{state.errorMessage}</p>
              </div>
              <p className="text-stone-500 text-xs mt-4 italic">
                {isAuthError 
                  ? 'Verifique se sua API_KEY está correta nas variáveis de ambiente da Vercel ou no arquivo .env local.' 
                  : 'Muitas pessoas estão usando a IA agora. Aguarde 30 segundos e tente o botão de reprocessar abaixo.'}
              </p>
            </div>
            
            <div className="w-full space-y-3">
              {!isAuthError && (
                <button
                  onClick={retryProcessing}
                  className="w-full py-5 bg-[#FFC20E] text-black rounded-2xl font-black uppercase tracking-tight shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  Reprocessar Agora
                </button>
              )}
              
              <button
                onClick={reset}
                className="w-full py-4 bg-transparent border-2 border-stone-800 text-stone-500 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform"
              >
                Reiniciar do Zero
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout title={state.step !== 'welcome' ? 'Fitting Room' : undefined}>
      {renderContent()}
    </Layout>
  );
};

export default App;
