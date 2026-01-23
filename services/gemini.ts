import { GoogleGenerativeAI } from "@google/generative-ai";  // Mantenha se já tiver, mas não usaremos mais

// Substitua pela sua chave Groq (crie em https://console.groq.com/keys)
const GROQ_API_KEY = process.env.API_KEY || 'gsk_sua_chave_groq_aqui';  // Mantenha process.env.API_KEY

const getGroqClient = () => {
  return {
    generateContent: async ({ model, contents }) => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.2-90b-vision-preview',  // ou 'llama-3.2-11b-vision-preview' se quiser mais rápido
          messages: [
            {
              role: 'user',
              content: contents.parts.map(part => {
                if (part.inlineData) {
                  return {
                    type: 'image_url',
                    image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
                  };
                }
                return { type: 'text', text: part.text };
              }),
            }
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedImageBase64 = data.choices[0].message.content;  // Ajuste se retornar imagem base64

      // Se o Groq retornar texto com base64 da imagem gerada, extraia aqui
      // Caso contrário, ajuste o prompt para retornar base64 direto
      return generatedImageBase64;
    }
  };
};

export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const client = getGroqClient();

  // Limpe base64 (remova prefixo data:image/...;base64, se houver)
  const cleanClothing = clothingBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
  const cleanSelfie = selfieBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  try {
    const response = await client.generateContent({
      model: 'llama-3.2-90b-vision-preview',
      contents: {
        parts: [
          { inlineData: { data: cleanClothing, mimeType: 'image/jpeg' } },
          { inlineData: { data: cleanSelfie, mimeType: 'image/jpeg' } },
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
        ]
      }
    });

    return response;  // Retorna base64 da imagem gerada
  } catch (err) {
    console.error(err);
    throw new Error("Oops! Não conseguimos processar agora. Tente novamente.");
  }
};
