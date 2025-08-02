const { Buffer } = require('buffer');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('AssemblyAI transcription started');
    console.log('Content-Type:', event.headers['content-type']);
    
    let audioData;
    
    // Check if it's JSON (base64 audio) or multipart form data
    if (event.headers['content-type']?.includes('application/json')) {
      const body = JSON.parse(event.body);
      if (body.audio) {
        audioData = Buffer.from(body.audio, 'base64');
        console.log('Received base64 audio data, length:', audioData.length);
      } else {
        throw new Error('No audio data found in JSON request');
      }
    } else {
      // Parse the multipart form data
      const boundary = event.headers['content-type']?.split('boundary=')[1];
      if (!boundary) {
        console.error('No boundary found in content-type');
        throw new Error('No boundary found in content-type');
      }

      console.log('Boundary:', boundary);
      console.log('Body length:', event.body ? event.body.length : 'no body');

      const body = Buffer.from(event.body, 'base64');
      console.log('Decoded body length:', body.length);
      
      const parts = parseMultipartFormData(body, boundary);
      console.log('Parsed parts count:', parts.length);
      
      const audioFile = parts.find(part => part.name === 'audio');
      if (!audioFile) {
        console.error('No audio file found in request');
        throw new Error('No audio file found in request');
      }

      console.log('Audio file found:', audioFile.name, 'size:', audioFile.data.length);
      audioData = audioFile.data;
    }

    if (!audioData || audioData.length === 0) {
      throw new Error('No audio data provided');
    }

    // AssemblyAI API configuration
    const ASSEMBLYAI_API_KEY = '70f0f98ec1ec4a49afe581069224eba1';
    const ASSEMBLYAI_UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
    const ASSEMBLYAI_TRANSCRIPT_URL = 'https://api.assemblyai.com/v2/transcript';

    console.log('Uploading to AssemblyAI...');
    // Step 1: Upload audio to AssemblyAI
    const uploadResponse = await fetch(ASSEMBLYAI_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'audio/webm'
      },
      body: audioData
    });

    console.log('Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const uploadUrl = uploadResult.upload_url;
    console.log('Upload URL:', uploadUrl);

    // Step 2: Request transcription
    console.log('Requesting transcription...');
    const transcriptResponse = await fetch(ASSEMBLYAI_TRANSCRIPT_URL, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: uploadUrl,
        language_code: 'en_us',
        punctuate: true,
        format_text: true
      })
    });

    console.log('Transcription request status:', transcriptResponse.status);

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Transcription request failed:', errorText);
      throw new Error(`Transcription failed: ${transcriptResponse.status} - ${errorText}`);
    }

    const transcriptResult = await transcriptResponse.json();
    const transcriptId = transcriptResult.id;
    console.log('Transcript ID:', transcriptId);

    // Step 3: Poll for completion
    let transcript = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait

    console.log('Polling for completion...');
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`${ASSEMBLYAI_TRANSCRIPT_URL}/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Status check failed:', errorText);
        throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
      }

      transcript = await statusResponse.json();
      console.log(`Attempt ${attempts + 1}: Status = ${transcript.status}`);

      if (transcript.status === 'completed') {
        console.log('Transcription completed successfully');
        break;
      } else if (transcript.status === 'error') {
        console.error('Transcription error:', transcript.error);
        throw new Error(`Transcription error: ${transcript.error}`);
      }

      // Wait 1 second before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!transcript || transcript.status !== 'completed') {
      console.error('Transcription timed out');
      throw new Error('Transcription timed out');
    }

    console.log('Final transcript text:', transcript.text);
    console.log('Confidence:', transcript.confidence);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: transcript.text || '',
        confidence: transcript.confidence || 0,
        words: transcript.words || []
      })
    };

  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack
      })
    };
  }
};

// Helper function to parse multipart form data
function parseMultipartFormData(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
  
  let start = buffer.indexOf(boundaryBuffer);
  let end = buffer.indexOf(endBoundaryBuffer);
  
  if (start === -1 || end === -1) {
    throw new Error('Invalid multipart data');
  }
  
  // Find all parts
  let currentPos = start + boundaryBuffer.length;
  
  while (currentPos < end) {
    // Find next boundary
    const nextBoundary = buffer.indexOf(boundaryBuffer, currentPos);
    if (nextBoundary === -1) break;
    
    // Extract part data
    const partData = buffer.slice(currentPos, nextBoundary);
    const part = parsePart(partData);
    if (part) {
      parts.push(part);
    }
    
    currentPos = nextBoundary + boundaryBuffer.length;
  }
  
  return parts;
}

function parsePart(partBuffer) {
  // Find the header/body separator (double CRLF)
  const separator = Buffer.from('\r\n\r\n');
  const separatorIndex = partBuffer.indexOf(separator);
  
  if (separatorIndex === -1) return null;
  
  const headerBuffer = partBuffer.slice(0, separatorIndex);
  const bodyBuffer = partBuffer.slice(separatorIndex + separator.length);
  
  // Parse headers
  const headers = {};
  const headerLines = headerBuffer.toString().split('\r\n');
  
  for (const line of headerLines) {
    if (line.startsWith('Content-Disposition:')) {
      const contentDisposition = line;
      const nameMatch = contentDisposition.match(/name="([^"]+)"/);
      if (nameMatch) {
        headers.name = nameMatch[1];
      }
    }
  }
  
  return {
    name: headers.name,
    data: bodyBuffer
  };
} 