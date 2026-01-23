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
        prompt: `Realistic virtual try-on: take the clothing from the first image and put it on the person in the second image. Preserve textures, colors, patterns, natural fit, folds, shadows. Keep the person's face and body identical to the selfie. Background consistent with selfie. Professional fashion photo studio look. Output only the final image.`,
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
