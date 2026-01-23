import { GoogleGenAI } from "@google/genai";

/**
 * Comprime a imagem para 512px - tamanho mínimo para qualidade aceitável da IA.
 * Isso reduz o tempo de transferência e ajuda a evitar o erro 429 por volume.
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
      // Qualidade 0.6 para ser o mais leve possível
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Processamento paralelo com compressão ultra-leve
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
          { text: "Virtual Try-On: Place the garment from image 1 onto the person in image 2. Match lighting and pose. Return ONLY the edited image." }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("SEGURANÇA: A foto foi bloqueada pelos filtros automáticos do Google. Tente uma pose diferente.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("429");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Erro na geração da imagem.");
  } catch (error: any) {
    const msg = error.message || "";
    console.error("Gemini Error:", msg);
    
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("LIMITE: O Google limitou o acesso gratuito. Aguarde 2 minutos para a próxima tentativa.");
    }
    
    if (msg.includes("SEGURANÇA")) throw error;
    
    throw new Error("Ocorreu um erro técnico. Verifique sua conexão e tente novamente.");
  }
};