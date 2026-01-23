export const processVirtualFitting = async (clothingBase64: string, selfieBase64: string): Promise<string> => {
  const FAL_API_KEY = process.env.API_KEY;

  if (!FAL_API_KEY) {
    throw new Error("FAL_API_KEY não configurada");
  }

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      prompt: `Virtual try-on: take ONLY the clothing item from the first image (the jacket) and place it realistically on the person in the second image (the selfie). Keep the exact pose, body proportions, face, hair, background, lighting and all other details from the selfie identical. Do not change the person's appearance or add anything extra. Make it look like a real fashion photo with natural fit, folds and shadows. Output ONLY the final edited image, no text or extra elements.`       
        image_urls: [
          `data:image/jpeg;base64,${clothingBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '')}`,
          `data:image/jpeg;base64,${selfieBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '')}`
        ]
      }),
    });

    const data = await response.json();
    return data.images[0].url;  // ou data.image.base64 se retornar base64
  } catch (err) {
    console.error(err);
    throw new Error("Oops! Não conseguimos processar agora.");
  }
};
