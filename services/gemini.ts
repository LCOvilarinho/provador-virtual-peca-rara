
import { GoogleGenAI } from "@google/genai";

/**
 * Comprime a imagem para 512px para minimizar consumo de banda e cota de API.
 */
const compressImage = async (base64: string, maxWidth = 512): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    // FIX: Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance.
    // The apiKey must be obtained exclusively from the environment variable.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const [compCloth, compSelfie] = await Promise.all([
      compressImage(clothingBase64),
      compressImage(selfieBase64)
    ]);

    const dataCloth = compCloth.split(',')[1];
    const dataSelfie = compSelfie.split(',')[1];

    // FIX: Using gemini-2.5-flash-image for image editing task as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: dataCloth, mimeType: 'image/jpeg' } },
          { inlineData: { data: dataSelfie, mimeType: 'image/jpeg' } },
          { text: "Virtual Try-On: Place the garment from image 1 onto the person in image 2. Realistic fit. Return image only." }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("SEGURANÇA: Foto recusada pelos filtros automáticos. Tente outra pose ou iluminação.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("LIMITE: Ocorreu um erro ao processar a resposta do modelo.");
    }

    // FIX: Iterate through all parts to find the image part, as recommended by the guidelines.
    // Do not assume the first part is an image part.
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Erro na geração da imagem: nenhum dado de imagem retornado.");
  } catch (error: any) {
    const msg = error.message || "";
    console.error("Gemini Detail:", error);
    
    // FIX: Robust handling for API errors and quota issues.
    if (msg.includes("API Key") || msg.includes("INVALID_ARGUMENT")) {
      throw new Error("CONFIGURAÇÃO: Erro de autenticação na API.");
    }

    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("LIMITE: Cota gratuita esgotada. Aguarde o cronômetro para tentar novamente.");
    }
    
    throw error;
  }
};
