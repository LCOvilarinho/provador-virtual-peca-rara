
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("API_KEY não configurada. Se estiver na Vercel, adicione a variável de ambiente API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    const ai = getAI();
    
    // Extração pura dos dados base64
    const cleanClothing = clothingBase64.split(',')[1] || clothingBase64;
    const cleanSelfie = selfieBase64.split(',')[1] || selfieBase64;

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
            Instruction: Take the garment from the first image and realistically overlay it onto the person in the second image.
            
            Technical Requirements:
            1. Maintain the exact fabric texture, patterns, and colors of the garment.
            2. Adjust the fit to the person's body posture and shape naturally.
            3. Keep the person's identity (face, hair, skin tone) exactly as in the selfie.
            4. Ensure realistic shadows and lighting consistency between the person and the new clothing.
            5. Output ONLY the resulting high-quality image. No text or explanation.`
          }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("A IA não conseguiu processar as imagens. Tente fotos com fundo mais simples.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("A IA processou, mas não retornou uma imagem válida.");
  } catch (error: any) {
    console.error("Erro detalhado na Gemini API:", error);
    
    // Tratamento de erros comuns para o usuário
    if (error.message?.includes("403")) return Promise.reject("Erro de Permissão: Verifique se sua API Key é válida.");
    if (error.message?.includes("429")) return Promise.reject("Limite excedido: Muitas pessoas usando ao mesmo tempo. Aguarde um minuto.");
    if (error.message?.includes("fetch")) return Promise.reject("Erro de Conexão: Verifique sua internet.");
    
    return Promise.reject(error.message || "Erro desconhecido ao processar o look.");
  }
};
