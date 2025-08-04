import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine the deployment platform
const platform = process.env.NETLIFY ? 'netlify' : 
                 process.env.RENDER ? 'render' : 
                 process.env.VITE_PLATFORM || 'local';

console.log(`🚀 Post-build script running for platform: ${platform}`);

// Create platform-specific configuration
const createPlatformConfig = () => {
  const config = {
    platform,
    apiBase: platform === 'netlify' ? '/.netlify/functions' : '/api',
    wsEnabled: platform === 'render', // WebSocket only on Render
    functionsEnabled: platform === 'netlify' // Netlify Functions only on Netlify
  };

  // Write platform config to dist for client-side use
  const configPath = path.join(__dirname, '..', 'dist', 'platform-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Platform config written: ${configPath}`);
};

// Copy necessary files for each platform
const copyPlatformFiles = () => {
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (platform === 'netlify') {
    // Ensure Netlify Functions are accessible
    console.log('📁 Netlify: Functions directory preserved');
  } else if (platform === 'render') {
    // Copy server file for Render
    const serverPath = path.join(__dirname, '..', 'server-static.js');
    const serverDest = path.join(distPath, 'server-static.js');
    fs.copyFileSync(serverPath, serverDest);
    console.log('📁 Render: Server file copied to dist');
  }
};

// Update environment variables for the platform
const updateEnvironmentConfig = () => {
  const envConfig = {
    VITE_PLATFORM: platform,
    VITE_API_BASE: platform === 'netlify' ? '/.netlify/functions' : '/api',
    VITE_WS_ENABLED: platform === 'render' ? 'true' : 'false'
  };

  // Create .env file for client-side use
  const envPath = path.join(__dirname, '..', 'dist', '.env');
  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Environment config written: ${envPath}`);
};

// Main execution
try {
  createPlatformConfig();
  copyPlatformFiles();
  updateEnvironmentConfig();
  console.log(`✅ Post-build completed successfully for ${platform}`);
} catch (error) {
  console.error('❌ Post-build error:', error);
  process.exit(1);
} 