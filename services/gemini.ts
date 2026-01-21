
import { GoogleGenAI } from "@google/genai";

// The API Key is expected to be in process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const ai = getAI();
  
  // Clean base64 strings (remove metadata prefix if present)
  const cleanClothing = clothingBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
  const cleanSelfie = selfieBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  try {
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
            text: `Aja como um editor de moda profissional da Peça Rara Brechó.
            Tarefa: Realize um "virtual try-on" realista.
            Instrução: Pegue a roupa da primeira imagem e transfira-a para a pessoa na segunda imagem.
            Regras Críticas:
            1. Preserve as texturas originais, estampas e cores da peça de roupa.
            2. Ajuste o caimento da roupa ao corpo da pessoa de forma natural, respeitando dobras e sombras.
            3. Mantenha o rosto e as características físicas da pessoa idênticas à imagem original da selfie.
            4. O fundo deve permanecer coerente com a foto da selfie.
            5. O resultado final deve parecer uma fotografia profissional de estúdio de moda.
            Gere APENAS a imagem final resultante, sem texto, legendas ou explicações.`
          }
        ]
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("Não foi possível gerar a imagem.");
    }

    // Iterate through parts to find the image data
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Nenhuma imagem retornada pela IA.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
