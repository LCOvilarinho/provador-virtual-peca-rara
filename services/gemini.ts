
import { GoogleGenAI } from "@google/genai";

/**
 * Process virtual fitting using Gemini 2.5 Flash Image model.
 * Always initializes a new instance of GoogleGenAI using process.env.API_KEY directly.
 */
export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  try {
    // ALWAYS initialize the AI client using this named parameter pattern with process.env.API_KEY.
    // Creating it right before use ensures the most up-to-date configuration is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extract base64 data by removing the data URL prefix if present.
    const cleanClothing = clothingBase64.includes(',') ? clothingBase64.split(',')[1] : clothingBase64;
    const cleanSelfie = selfieBase64.includes(',') ? selfieBase64.split(',')[1] : selfieBase64;

    // Detect mime types from the input strings to be more robust.
    const clothingMime = clothingBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    const selfieMime = selfieBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

    // Using gemini-2.5-flash-image for image editing tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanClothing,
              mimeType: clothingMime
            }
          },
          {
            inlineData: {
              data: cleanSelfie,
              mimeType: selfieMime
            }
          },
          {
            text: `Act as a high-end fashion AI editor for Peça Rara Brechó.
            Task: Virtual Try-On.
            Instruction: Take the garment from the first image and realistically overlay it onto the person in the second image.
            
            Technical Requirements:
            1. Maintain the exact fabric texture, patterns, and colors of the garment.
            2. Adjust the fit to the person's body posture and shape naturally.
            3. Keep the person's identity (face, hair, skin tone) exactly as in the selfie.
            4. Ensure realistic shadows and lighting consistency between the person and the new clothing.
            5. Output ONLY the resulting high-quality image. No text or explanation.`
          }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("A IA não retornou um resultado válido. Verifique se as imagens estão claras.");
    }

    // Iterate through all parts to find the image part as per guidelines.
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        // The output image is returned as raw base64 data.
        return `data:image/png;base64,${base64EncodeString}`;
      } else if (part.text) {
        // Log any text output for debugging purposes.
        console.log("AI feedback:", part.text);
      }
    }

    throw new Error("Nenhuma imagem gerada pela IA.");
  } catch (error: any) {
    console.error("Erro detalhado na Gemini API:", error);
    
    const errorMessage = error.message || "";
    
    // Handle specific API error codes gracefully.
    if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
      throw new Error("Chave API Inválida ou Sem Permissão. Acesse o Google AI Studio e verifique sua chave e o faturamento do projeto.");
    }
    
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Limite de uso atingido. Aguarde 60 segundos antes de tentar novamente.");
    }
    
    throw new Error(errorMessage || "Erro desconhecido ao processar o look.");
  }
};
