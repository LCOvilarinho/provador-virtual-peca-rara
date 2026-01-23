export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const GROQ_API_KEY = process.env.API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não configurada no ambiente");
  }

  // Limpe base64 (remova prefixo se houver)
  const cleanClothing = clothingBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
  const cleanSelfie = selfieBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview', // ou 'llama-3.2-11b-vision-preview' para mais rápido
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${cleanClothing}` }
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${cleanSelfie}` }
              },
              {
                type: 'text',
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
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Supondo que o Groq retorne base64 direto da imagem gerada
    return generatedContent;
  } catch (err) {
    console.error(err);
    throw new Error("Oops! Não conseguimos processar agora. Tente novamente.");
  }
};
