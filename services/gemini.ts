import { GoogleGenAI } from "@google/genai";

/**
 * Comprime a imagem agressivamente para 640px para garantir sucesso na Vercel.
 */
const compressImage = async (base64: string, maxWidth = 640): Promise<string> => {
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
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Compressão ultra-leve para evitar erros de banda/cota
    const [compCloth, compSelfie] = await Promise.all([
      compressImage(clothingBase64),
      compressImage(selfieBase64)
    ]);

    const dataCloth = compCloth.split(',')[1];
    const dataSelfie = compSelfie.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: dataCloth, mimeType: 'image/jpeg' } },
          { inlineData: { data: dataSelfie, mimeType: 'image/jpeg' } },
          { text: "Virtual Try-On: Place the garment from image 1 onto the person in image 2. Maintain face and realistic fit. Return image only." }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    
    // Verifica se foi bloqueado por segurança (comum em fotos de pessoas)
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("SEGURANÇA: A foto foi considerada sensível pela IA. Tente uma foto com roupas mais discretas ou melhor iluminação.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("429");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Não foi possível gerar a imagem.");
  } catch (error: any) {
    const msg = error.message || "";
    console.error("Erro API:", msg);
    
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("LIMITE: O Google limitou o acesso gratuito temporariamente. Aguarde a liberação do cronômetro.");
    }
    
    if (msg.includes("SEGURANÇA")) throw error;
    
    throw new Error("Ocorreu um problema técnico. Tente novamente em instantes.");
  }
};