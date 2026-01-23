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
    // SEMPRE criar uma nova instância para pegar a API_KEY mais recente do ambiente/diálogo
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
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
          { text: "Virtual Try-On: Place the garment from image 1 onto the person in image 2. Match lighting and pose. Realistic fit. Return ONLY the edited image." }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("SEGURANÇA: Foto recusada pelos filtros automáticos. Tente outra pose ou iluminação.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("LIMITE: Resposta vazia da IA.");
    }

    // Itera pelas partes para encontrar a imagem, conforme as boas práticas
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Erro: Nenhuma imagem foi gerada pela IA.");
  } catch (error: any) {
    const msg = error.message || "";
    console.error("Gemini Detail:", error);
    
    // Tratamento robusto para cota e erros de IP compartilhado
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error("LIMITE: O servidor gratuito está sobrecarregado. Aguarde ou use sua própria chave.");
    }

    if (msg.includes("API Key") || msg.includes("INVALID_ARGUMENT")) {
      throw new Error("CONFIGURAÇÃO: Chave de API inválida.");
    }
    
    throw error;
  }
};