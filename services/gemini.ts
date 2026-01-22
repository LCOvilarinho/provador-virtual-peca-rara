
import { GoogleGenAI } from "@google/genai";

/**
 * Redimensiona e comprime a imagem em base64 para evitar payloads muito grandes.
 */
const compressImage = async (base64: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

/**
 * Processa o provador virtual usando o modelo Gemini 2.5 Flash Image.
 */
export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    // Inicializa a API
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Comprime as imagens antes de enviar para economizar cota e banda
    const compressedClothing = await compressImage(clothingBase64);
    const compressedSelfie = await compressImage(selfieBase64);

    const cleanClothing = compressedClothing.split(',')[1];
    const cleanSelfie = compressedSelfie.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanClothing,
              mimeType: 'image/jpeg'
            }
          },
          {
            inlineData: {
              data: cleanSelfie,
              mimeType: 'image/jpeg'
            }
          },
          {
            text: `Act as a high-end fashion AI editor for Peça Rara Brechó.
            Task: Virtual Try-On.
            Instruction: Take the clothing item from the first image and realistically apply it to the person in the second image.
            
            Technical Requirements:
            1. Maintain patterns and colors of the garment.
            2. Adjust the fit to the person's body naturally.
            3. Keep the person's face exactly as in the selfie.
            4. Return ONLY the resulting image.`
          }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("A IA está ocupada processando outras solicitações. Tente novamente em instantes.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("O look foi processado, mas a imagem não foi retornada corretamente.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const message = error.message || "";
    
    if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
      throw new Error("Erro de Chave (403): Verifique se a variável API_KEY está correta no painel da Vercel.");
    }
    
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Sistema Ocupado (429): O Google limitou o acesso temporariamente. Aguarde 1 minuto.");
    }
    
    throw new Error("Ocorreu um erro ao criar seu visual. Verifique sua conexão ou tente fotos mais simples.");
  }
};
