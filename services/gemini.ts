
import { GoogleGenAI } from "@google/genai";

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
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Chave de API não configurada. Verifique as configurações do projeto.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const [compCloth, compSelfie] = await Promise.all([
      compressImage(clothingBase64, 800),
      compressImage(selfieBase64, 800)
    ]);

    const dataCloth = compCloth.split(',')[1];
    const dataSelfie = compSelfie.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: dataCloth, mimeType: 'image/jpeg' } },
          { inlineData: { data: dataSelfie, mimeType: 'image/jpeg' } },
          { text: "ACT AS A FASHION AI EXPERT. TASK: VIRTUAL TRY-ON. TAKE THE CLOTHING FROM THE FIRST IMAGE AND PUT IT ON THE PERSON IN THE SECOND IMAGE. REPLACE THE PERSON'S TOP OR FULL OUTFIT WITH THE NEW PIECE. KEEP THE PERSON'S FACE, POSE, AND BACKGROUND IDENTICAL. ENSURE NATURAL FITTING AND SEAMLESS BLENDING. OUTPUT ONLY THE FINAL IMAGE." }
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
      throw new Error("A IA considerou a foto inadequada. Tente uma pose mais simples ou melhor iluminação.");
    }

    if (candidate?.finishReason === 'OTHER' || !candidate) {
      throw new Error("O servidor da IA está ocupado. Tente novamente em instantes.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Não foi possível gerar a imagem final. Tente tirar as fotos novamente.");
  } catch (error: any) {
    console.error("Erro no processamento:", error);
    if (error.message.includes('API_KEY')) {
      throw new Error("Erro de autenticação: Chave de API inválida.");
    }
    throw error;
  }
};
