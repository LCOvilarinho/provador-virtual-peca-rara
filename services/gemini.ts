import { GoogleGenAI } from "@google/genai";

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
  // Tenta pegar a chave do ambiente de forma dinâmica
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("CONFIGURAÇÃO: Chave de API não encontrada.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const [compCloth, compSelfie] = await Promise.all([
      compressImage(clothingBase64),
      compressImage(selfieBase64)
    ]);

    const dataCloth = compCloth.split(',')[1];
    const dataSelfie = compSelfie.split(',')[1];

    // Se estivermos usando uma chave personalizada (mais provável se deu 429),
    // podemos tentar o modelo pro que tem cotas melhores para chaves pagas.
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
      throw new Error("SEGURANÇA: Foto recusada pelos filtros. Tente outra pose.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("ERRO: Resposta inválida da IA.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("ERRO: Nenhuma imagem gerada.");
  } catch (error: any) {
    console.error("Gemini Details:", error);
    const msg = error.message || "";
    
    if (msg.includes("429") || msg.includes("quota") || msg.includes("limit")) {
      throw new Error("LIMITE: O servidor gratuito está exausto. Por favor, use sua própria chave do Google Cloud.");
    }

    throw error;
  }
};