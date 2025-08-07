const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Security configuration
const SALT_ROUNDS = 10;

// In-memory user storage (will be replaced with database service)
const users = new Map();
const verificationCodes = new Map();

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Compare password hash using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Login successful' 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Send verification code endpoint
router.post('/send-verification', async (req, res) => {
  try {
    const { userId, email, method } = req.body;
    
    if (!userId || !email || !method) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, email, and method are required' 
      });
    }
    
    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const verificationCode = generateVerificationCode();
    const token = `${userId}_${Date.now()}`;
    
    // Store verification code (expires in 10 minutes)
    verificationCodes.set(token, {
      code: verificationCode,
      userId,
      email,
      method,
      expiresAt: Date.now() + (10 * 60 * 1000)
    });
    
    // In production, send actual email/SMS
    console.log(`📧 Verification code for ${email}: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      token,
      message: `Verification code sent to your ${method}`,
      // For development only - remove in production
      devCode: verificationCode
    });
    
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Verify code endpoint
router.post('/verify', async (req, res) => {
  try {
    const { userId, token, code } = req.body;
    
    if (!userId || !token || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, token, and code are required' 
      });
    }
    
    const verification = verificationCodes.get(token);
    
    if (!verification || verification.userId !== userId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid verification token' 
      });
    }
    
    if (Date.now() > verification.expiresAt) {
      verificationCodes.delete(token);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired' 
      });
    }
    
    if (verification.code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }
    
    // Mark user as verified
    const user = users.get(userId);
    if (user) {
      user.isVerified = true;
      user.verifiedAt = new Date().toISOString();
      user.verificationMethod = verification.method;
      users.set(userId, user);
    }
    
    // Clean up verification code
    verificationCodes.delete(token);
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully!' 
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.email || !userData.username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and username are required' 
      });
    }
    
    if (!userData.password || userData.password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required and must be at least 6 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      u => u.email === userData.email.toLowerCase() || u.username === userData.username
    );
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    
    // Store user with hashed password
    const userId = userData.id || Date.now().toString();
    const user = {
      ...userData,
      id: userId,
      email: userData.email.toLowerCase(),
      password: hashedPassword, // Store the hash, not the password
      createdAt: new Date().toISOString()
    };
    
    users.set(userId, user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'User registered successfully' 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Export both the router and the data stores (for now)
module.exports = {
  router,
  users,
  verificationCodes
};
