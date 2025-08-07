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

    console.log('🔍 FIREWORKS API CALL STARTING');
    console.log('🔍 Image generation prompt:', enhancedPrompt);
    console.log('🔍 API URL:', 'https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image');
    console.log('🔍 API token length:', token?.length || 0);
    console.log('🔍 Request body:', JSON.stringify({ prompt: enhancedPrompt }));
    
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

    console.log('🔍 FIREWORKS API RESPONSE RECEIVED');
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 FIREWORKS API ERROR - Response text:', errorText);
      console.error('🔍 FIREWORKS API ERROR - Status:', response.status);
      console.error('🔍 FIREWORKS API ERROR - Headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    console.log('🔍 PROCESSING BINARY IMAGE RESPONSE');
    // Handle binary image response from Fireworks (not JSON)
    const imageBuffer = await response.buffer();
    console.log('🔍 Image buffer received - size:', imageBuffer.length, 'bytes');
    console.log('🔍 Image buffer type:', typeof imageBuffer);
    console.log('🔍 Image buffer is Buffer:', Buffer.isBuffer(imageBuffer));
    
    if (imageBuffer.length === 0) {
      throw new Error('Received empty image buffer from Fireworks API');
    }
    
    console.log('🔍 CONVERTING TO BASE64');
    // Convert to base64 and create data URL
    const base64Image = imageBuffer.toString('base64');
    console.log('🔍 Base64 conversion - length:', base64Image.length);
    console.log('🔍 Base64 preview:', base64Image.substring(0, 100) + '...');
    
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    console.log('🔍 Data URL created - length:', dataUrl.length);
    console.log('🔍 Data URL starts with data:image:', dataUrl.startsWith('data:image/'));
    
    console.log('✅ Image generation successful - returning result object');
    
    const resultObject = {
      image_url: dataUrl,
      contentType: 'image/jpeg',
      data: base64Image || (dataUrl ? dataUrl.split(',')[1] : null)
    };
    
    console.log('🔍 RESULT OBJECT STRUCTURE:', {
      hasImageUrl: !!resultObject.image_url,
      imageUrlLength: resultObject.image_url?.length || 0,
      imageUrlStartsCorrectly: resultObject.image_url?.startsWith('data:image/jpeg;base64,'),
      hasContentType: !!resultObject.contentType,
      contentType: resultObject.contentType,
      hasData: !!resultObject.data,
      dataLength: resultObject.data?.length || 0
    });
    
    return resultObject;

  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

module.exports = {
  handleImageGeneration
};
