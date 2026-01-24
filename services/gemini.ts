
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
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  // Criamos a instância aqui para garantir o uso da chave mais recente do seletor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const [compCloth, compSelfie] = await Promise.all([
      compressImage(clothingBase64, 1024),
      compressImage(selfieBase64, 1024)
    ]);

    const dataCloth = compCloth.split(',')[1];
    const dataSelfie = compSelfie.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: dataCloth, mimeType: 'image/jpeg' } },
          { inlineData: { data: dataSelfie, mimeType: 'image/jpeg' } },
          { text: "Professional Fashion Try-On: Take the exact garment from the first image and realistically composite it onto the person in the second image. Pay extreme attention to fabric texture, shadows, and body contours. The final output must look like a professional studio photograph. Return the image only." }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        }
      }
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("O filtro de segurança da IA barrou esta imagem. Tente uma foto mais formal.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("Não foi possível processar a imagem. Tente novamente.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Falha ao gerar o preview visual.");
  } catch (error: any) {
    const msg = error.message || String(error);
    console.error("Erro na Demo:", msg);
    
    if (msg.includes("429") || msg.includes("Requested entity was not found")) {
      throw new Error("Erro de Licença: É necessário reconfigurar a chave de acesso para este dispositivo.");
    }

    throw error;
  }
};
