const express = require('express');
const bcrypt = require('bcrypt');
const databaseService = require('../services/database.cjs');
const router = express.Router();

// Security configuration
const SALT_ROUNDS = 10;

// In-memory verification codes (temporary until email service is implemented)
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
    
    // Check for secret admin user
    if (email.toLowerCase() === 'smt@neuraplay.biz' && password === 'GH2300!') {
      const adminUser = {
        id: 'admin_2025',
        username: 'NeuraPlay Admin',
        email: 'smt@neuraplay.biz',
        role: 'admin',
        isVerified: true,
        subscription: { tier: 'unlimited', status: 'active' },
        profile: { avatar: '/assets/images/Mascot.png', rank: 'System Admin', xp: 999999, stars: 999 }
      };
      
      return res.json({ 
        success: true, 
        user: adminUser,
        message: 'Admin login successful' 
      });
    }
    
    // Find user by email in PostgreSQL
    const queryBuilder = databaseService.queryBuilder();
    if (!queryBuilder) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database not available' 
      });
    }
    
    const users = await queryBuilder('users')
      .where('email', email.toLowerCase())
      .select('*')
      .first();
    
    if (!users) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Compare password hash using bcrypt
    const passwordMatch = await bcrypt.compare(password, users.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Remove password from response and format for frontend
    const { password: _, ...userWithoutPassword } = users;
    const formattedUser = {
      ...userWithoutPassword,
      isVerified: users.is_verified,
      profile: typeof users.profile === 'string' ? JSON.parse(users.profile) : users.profile,
      subscription: typeof users.subscription === 'string' ? JSON.parse(users.subscription) : users.subscription,
      usage: typeof users.usage === 'string' ? JSON.parse(users.usage) : users.usage
    };
    
    res.json({ 
      success: true, 
      user: formattedUser,
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
    
    // Check if user already exists in PostgreSQL
    const queryBuilder = databaseService.queryBuilder();
    if (!queryBuilder) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database not available' 
      });
    }
    
    const existingUser = await queryBuilder('users')
      .where('email', userData.email.toLowerCase())
      .orWhere('username', userData.username)
      .first();
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    
    // Prepare user data for database
    const userId = userData.id || Date.now().toString();
    const defaultProfile = userData.profile || {
      avatar: '/assets/images/Mascot.png',
      rank: 'New Learner',
      xp: 0,
      xpToNextLevel: 100,
      stars: 0,
      about: '',
      gameProgress: {}
    };
    
    // Insert user into PostgreSQL
    const [newUser] = await queryBuilder('users')
      .insert({
        id: userId,
        username: userData.username,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'learner',
        is_verified: false,
        profile: JSON.stringify(defaultProfile),
        subscription: JSON.stringify({ tier: 'free', status: 'active' }),
        usage: JSON.stringify({
          aiPrompts: { count: 0, lastReset: new Date().toISOString(), history: [] },
          imageGeneration: { count: 0, lastReset: new Date().toISOString(), history: [] }
        })
      })
      .returning('*');
    
    // Format user for response
    const { password: _, ...userWithoutPassword } = newUser;
    const formattedUser = {
      ...userWithoutPassword,
      isVerified: newUser.is_verified,
      profile: typeof newUser.profile === 'string' ? JSON.parse(newUser.profile) : newUser.profile,
      subscription: typeof newUser.subscription === 'string' ? JSON.parse(newUser.subscription) : newUser.subscription,
      usage: typeof newUser.usage === 'string' ? JSON.parse(newUser.usage) : newUser.usage
    };
    
    res.json({ 
      success: true, 
      user: formattedUser,
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

// Export router and verification codes (users now stored in PostgreSQL)
module.exports = {
  router,
  verificationCodes
};
