
export type AppStep = 'welcome' | 'capture-clothing' | 'capture-selfie' | 'processing' | 'result' | 'error';

export interface AppState {
  step: AppStep;
  clothingImage: string | null;
  selfieImage: string | null;
  resultImage: string | null;
  errorMessage: string | null;
}
