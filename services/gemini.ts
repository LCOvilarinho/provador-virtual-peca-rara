import { GoogleGenerativeAI } from "@google/generative-ai";

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    throw new Error("API_KEY não configurada no ambiente");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);

  // Limpa o prefixo data:image/...;base64, se houver
  const cleanClothing = clothingBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
  const cleanSelfie = selfieBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",  // Modelo gratuito atual (confirme na lista se for 'gemini-2.5-flash-latest')
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanClothing
        }
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanSelfie
        }
      },
      {
        text: `Aja como um editor de moda profissional da Peça Rara Brechó.
Tarefa: Realize um "virtual try-on" realista.
Instrução: Pegue a roupa da primeira imagem e transfira-a para a pessoa na segunda imagem.
Regras Críticas:
1. Preserve as texturas originais, estampas e cores da peça de roupa.
2. Ajuste o caimento da roupa ao corpo da pessoa de forma natural, respeitando dobras e sombras.
3. Mantenha o rosto e as características físicas da pessoa idênticas à imagem original da selfie.
4. O fundo deve permanecer coerente com a foto da selfie.
5. O resultado final deve parecer uma fotografia profissional de estúdio de moda.
Gere APENAS a imagem final resultante em base64, sem texto, legendas ou explicações.`
      }
    ]);

    // O Gemini retorna a imagem gerada em inlineData (base64)
    const generatedImage = result.response.candidates[0].content.parts[0].inlineData.data;

    return `data:image/jpeg;base64,${generatedImage}`;
  } catch (err) {
    console.error("Erro na API Gemini:", err);
    throw new Error("Oops! Não conseguimos processar agora. Tente novamente.");
  }
};
