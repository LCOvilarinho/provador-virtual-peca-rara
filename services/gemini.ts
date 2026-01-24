
import { GoogleGenAI } from "@google/genai";

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
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const [compCloth, compSelfie] = await Promise.all([
      compressImage(clothingBase64, 1024),
      compressImage(selfieBase64, 1024)
    ]);

    const dataCloth = compCloth.split(',')[1];
    const dataSelfie = compSelfie.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: dataCloth, mimeType: 'image/jpeg' } },
          { inlineData: { data: dataSelfie, mimeType: 'image/jpeg' } },
          { text: "Task: Virtual try-on. Put the clothing from the first image onto the person in the second image. Keep the background and the person's identity identical. Realistic shadows and fit. Return only the image." }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("Filtro de segurança ativado. Tente fotos mais nítidas.");
    }

    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Erro ao gerar imagem.");
  } catch (error: any) {
    console.error("Erro no processamento:", error);
    throw new Error("Não foi possível gerar seu look agora. Tente novamente.");
  }
};
