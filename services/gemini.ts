import { GoogleGenAI } from "@google/genai";

/**
 * Redimensiona e comprime a imagem em base64 para o menor tamanho viável.
 * Reduzir o tamanho ajuda a evitar erros 429 e timeout.
 */
const compressImage = async (base64: string, maxWidth = 800): Promise<string> => {
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
      // Usando interpolação de alta qualidade para não perder detalhes da roupa
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
  });
};

/**
 * Processa o provador virtual usando o modelo Gemini 2.5 Flash Image.
 */
export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    // Cria instância com a chave da variável de ambiente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Comprime as imagens agressivamente para produção
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
            text: `Fashion AI Editor. Virtual Try-On. Apply the garment from the 1st image onto the person in the 2nd image. Match lighting and pose. Return ONLY the final image.`
          }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("429"); // Simula erro de ocupado se não houver resposta
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Não foi possível gerar a imagem.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error.message || "";
    
    if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
      throw new Error("Erro de Chave: Verifique a API_KEY nas configurações da Vercel.");
    }
    
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("limit")) {
      throw new Error("Limite Atingido: A versão gratuita permite poucas imagens por minuto. Aguarde a liberação.");
    }
    
    throw new Error("Erro ao processar look. Tente novamente em instantes.");
  }
};