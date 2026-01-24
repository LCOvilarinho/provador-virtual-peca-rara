
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
  // Create a new GoogleGenAI instance right before the call to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // FIX: Removed 'compSelfie' reference inside its own declaration's promise array (line 39 in original).
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
          { text: `TASK: HIGH-QUALITY VIRTUAL CLOTHING TRY-ON.
          1. Analyze the clothing item in IMAGE 1 (color, texture, fabric, style).
          2. Identify the person, their pose, and body shape in IMAGE 2.
          3. Generate a NEW IMAGE where the person from IMAGE 2 is wearing the EXACT clothing from IMAGE 1.
          4. Ensure:
             - The clothing fits the body contours naturally with realistic shadows and folds.
             - Keep the person's face, hair, and the background from IMAGE 2 identical.
             - Match the lighting of the environment.
             - The transition between skin and clothing must be seamless.
          Return the resulting image only.` }
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
      throw new Error("O filtro de segurança da IA barrou esta imagem. Tente uma foto mais nítida ou com roupas menos reveladoras.");
    }

    if (!candidate || !candidate.content?.parts) {
      throw new Error("Não foi possível processar a imagem. Tente novamente com outra foto.");
    }

    // Iterate through all parts to find the image part as recommended.
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Falha ao gerar o look. Tente novamente.");
  } catch (error: any) {
    console.error("Erro no processamento:", error);
    throw new Error(error.message || "Erro de conexão. Tente novamente em alguns segundos.");
  }
};
