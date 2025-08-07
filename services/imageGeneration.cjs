// For Node.js versions without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Core image generation function (used by both direct calls and tool calls)
async function handleImageGeneration(input_data, token) {
  try {
    const { prompt, size = '512x512' } = input_data;
    
    if (!prompt) {
      throw new Error('No prompt provided for image generation');
    }

    console.log('Starting image generation with Fireworks AI token:', !!token);
    console.log('Extracted prompt for image generation:', prompt);
    
    // ⚠️ IMPORTANT: Uses Fireworks accounts/fireworks/models/flux-1-schnell-fp8 
    // This requires Render environment with Neuraplay API key - local testing will fail

    if (!token) {
      throw new Error('No Fireworks AI token provided for image generation');
    }

    // Enhanced prompt for better image generation
    const enhancedPrompt = `Create a beautiful, high-quality image: ${prompt}. Style: vibrant colors, detailed, professional, child-friendly, educational.`;

    console.log('Image generation prompt:', enhancedPrompt);
    console.log('Generating image with FLUX model via Fireworks AI...');

    const response = await fetch('https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'image/jpeg',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: enhancedPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fireworks image generation failed:', errorText);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    // Handle binary image response from Fireworks (not JSON)
    const imageBuffer = await response.buffer();
    console.log('✅ Fireworks image generation response received, size:', imageBuffer.length, 'bytes');
    
    // Convert to base64 and create data URL
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('✅ Image generation successful');
    
    return {
      image_url: dataUrl,
      contentType: 'image/jpeg',
      data: base64Image || (dataUrl ? dataUrl.split(',')[1] : null)
    };

  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

module.exports = {
  handleImageGeneration
};
