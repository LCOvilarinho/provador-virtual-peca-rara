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
  // CRÍTICO: Não cachear a chave fora da função. 
  // O process.env.API_KEY pode ser atualizado dinamicamente pelo diálogo do AI Studio.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "") {
    throw new Error("API_KEY_MISSING: Por favor, selecione uma chave de API válida.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
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
          { text: "Virtual Try-On: Transfer the clothing from image 1 to the person in image 2. Maintain realistic pose and lighting. Return the result image ONLY." }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("SEGURANÇA: Foto recusada pelos filtros automáticos. Tente uma pose diferente.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("ERRO: Resposta incompleta da IA.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("ERRO: Nenhuma imagem foi gerada. Tente novamente.");
  } catch (error: any) {
    console.error("Gemini Details:", error);
    const msg = error.message || String(error);
    
    // Tratamento unificado de cota
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error("LIMITE: O servidor está sobrecarregado. Para uso profissional sem esperas, configure sua própria chave.");
    }

    if (msg.includes("API Key") || msg.includes("Requested entity was not found")) {
      throw new Error("API_KEY_INVALID: Sua chave de API é inválida ou expirou.");
    }

    throw error;
  }
};