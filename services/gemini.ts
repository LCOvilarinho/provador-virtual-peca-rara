
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
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64);
  });
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.includes('AIza') === false) {
    throw new Error("Configuração incompleta: API_KEY não encontrada no ambiente compartilhado.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Comprime ambas as imagens para evitar timeouts e excesso de tokens
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
          { text: "ACT AS A LUXURY VIRTUAL STYLIST. TASK: VIRTUAL TRY-ON. Instructions: 1. Identify the clothing item in the first image. 2. Synthesize this exact clothing item onto the person in the second image. 3. Maintain the person's face, hair, and body shape perfectly. 4. Ensure realistic lighting, shadows, and fabric draping. 5. The background must remain the same. 6. If the clothing is a top, replace the current top. If it's a dress, replace the whole outfit. OUTPUT ONLY THE RESULTING IMAGE." }
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
      throw new Error("A IA achou a imagem sensível. Tente tirar a foto com uma roupa básica por baixo e em um local mais iluminado.");
    }

    if (!candidate?.content?.parts) {
      throw new Error("A IA não conseguiu processar as imagens. Tente fotos mais nítidas da peça e do seu corpo.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Ocorreu um erro ao gerar o seu look. Por favor, tente novamente.");
  } catch (error: any) {
    console.error("Erro técnico:", error);
    throw new Error(error.message || "Falha na conexão com o servidor de inteligência artificial.");
  }
};
