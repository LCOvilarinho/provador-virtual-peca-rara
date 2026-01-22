
import { GoogleGenAI } from "@google/genai";

/**
 * Processa o provador virtual usando o modelo Gemini 2.5 Flash Image.
 */
export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    // Inicializa sempre com a chave injetada no ambiente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const cleanClothing = clothingBase64.includes(',') ? clothingBase64.split(',')[1] : clothingBase64;
    const cleanSelfie = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

    const clothingMime = clothingBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    const selfieMime = selfieBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanClothing,
              mimeType: clothingMime
            }
          },
          {
            inlineData: {
              data: cleanSelfie,
              mimeType: selfieMime
            }
          },
          {
            text: `Act as a high-end fashion AI editor for Peça Rara Brechó.
            Task: Virtual Try-On.
            Instruction: Take the clothing item from the first image and realistically apply it to the person in the second image.
            
            Technical Requirements:
            1. Maintain the exact fabric texture, patterns, and colors of the garment.
            2. Adjust the fit to the person's body posture and shape naturally.
            3. Keep the person's face and hair exactly as in the selfie.
            4. Ensure realistic lighting and shadows.
            5. Return ONLY the resulting image. No text.`
          }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("A IA não conseguiu processar as imagens. Tente fotos com fundo mais simples.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("O look foi processado, mas a imagem não foi retornada.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const message = error.message || "";
    
    if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
      throw new Error("Erro de Permissão (403): Verifique se a API_KEY nas configurações da Vercel está correta e ativa.");
    }
    
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Limite de Uso (429): Muitas solicitações simultâneas na versão gratuita. Aguarde 1 minuto.");
    }

    if (message.includes("404") || message.includes("NOT_FOUND")) {
      throw new Error("Modelo não disponível (404): O modelo gemini-2.5-flash-image pode não estar disponível na sua região ou para sua chave.");
    }
    
    throw new Error(message || "Ocorreu um erro ao criar seu visual.");
  }
};
