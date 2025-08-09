const { Pool } = require('pg');
const knex = require('knex');

let pool = null;
let databaseAvailable = false;
let queryBuilder = null;

// Initialize PostgreSQL connection
const initializeDatabase = () => {
  pool = new Pool({
    connectionString: process.env.RENDER_POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Initialize Knex query builder
  queryBuilder = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.RENDER_POSTGRES_URL || process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10
    }
  });

  console.log('🔗 Connecting to Render PostgreSQL database with Knex query builder...');
  
  return initDatabase();
};

// Initialize database tables (non-blocking to prevent server crashes)
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Create users table with authentication fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'learner',
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verified_at TIMESTAMP,
        subscription JSONB DEFAULT '{"tier": "free", "status": "active"}',
        usage JSONB DEFAULT '{"aiPrompts": {"count": 0, "history": []}, "imageGeneration": {"count": 0, "history": []}}',
        profile JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255),
        user_agent TEXT,
        platform VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        channel VARCHAR(100) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        votes INTEGER DEFAULT 0,
        replies JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        messages JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create ai_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        interaction_type VARCHAR(100) NOT NULL,
        input TEXT,
        output TEXT,
        tools_used JSONB DEFAULT '[]',
        response_time INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Enhanced Scribble boards with comprehensive feature support
    await client.query(`
      CREATE TABLE IF NOT EXISTS scribble_boards (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        mode VARCHAR(50) DEFAULT 'fullscreen',
        data JSONB NOT NULL DEFAULT '{
          "hypotheses": [],
          "suggestions": [],
          "parallel": null,
          "mutating": [],
          "graph": {"nodes": [], "edges": []},
          "charts": [],
          "scenarios": [],
          "dualView": false,
          "insights": []
        }',
        version INTEGER DEFAULT 1,
        is_shared BOOLEAN DEFAULT FALSE,
        share_token VARCHAR(255),
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Enhanced Tool and board events log with comprehensive tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS scribble_events (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        board_id VARCHAR(255),
        event_name VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) DEFAULT 'action',
        detail JSONB DEFAULT '{}',
        tool_result JSONB,
        confidence DECIMAL(3,2),
        processing_time INTEGER,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (board_id) REFERENCES scribble_boards(id) ON DELETE CASCADE
      )
    `);

    // Scribble insights for AI-generated suggestions and analysis
    await client.query(`
      CREATE TABLE IF NOT EXISTS scribble_insights (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        board_id VARCHAR(255) NOT NULL,
        insight_type VARCHAR(50) DEFAULT 'suggestion',
        text TEXT NOT NULL,
        confidence DECIMAL(3,2) DEFAULT 0.75,
        metadata JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (board_id) REFERENCES scribble_boards(id) ON DELETE CASCADE
      )
    `);

    // Scribble evolution tracking for concept development
    await client.query(`
      CREATE TABLE IF NOT EXISTS scribble_evolution (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        board_id VARCHAR(255) NOT NULL,
        concept_id VARCHAR(255) NOT NULL,
        version_number INTEGER NOT NULL,
        evolution_type VARCHAR(50) DEFAULT 'manual',
        previous_content TEXT,
        new_content TEXT,
        changes_summary TEXT,
        confidence_delta DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (board_id) REFERENCES scribble_boards(id) ON DELETE CASCADE
      )
    `);

    // Scribble collaboration for future team features
    await client.query(`
      CREATE TABLE IF NOT EXISTS scribble_collaboration (
        id VARCHAR(255) PRIMARY KEY,
        board_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer',
        permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}',
        invited_by VARCHAR(255),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES scribble_boards(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (invited_by) REFERENCES users(id)
      )
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_boards_user_id ON scribble_boards(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_boards_updated_at ON scribble_boards(updated_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_events_board_id ON scribble_events(board_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_events_event_name ON scribble_events(event_name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_insights_board_id ON scribble_insights(board_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_insights_active ON scribble_insights(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_evolution_board_id ON scribble_evolution(board_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scribble_collaboration_board_id ON scribble_collaboration(board_id)');

    client.release();
    databaseAvailable = true;
    console.log('✅ Enhanced database tables with scribbleboard support initialized successfully');
    console.log('🔬 Scribbleboard features: Hypothesis testing, Evolution tracking, AI insights, Collaboration ready');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('📝 Continuing with in-memory storage...');
    databaseAvailable = false;
    return false;
  }
}

// Database helper functions
async function saveToDatabase(client, collection, data) {
  const timestamp = new Date().toISOString();
  
  switch (collection) {
    case 'users':
      await client.query(`
        INSERT INTO users (id, username, email, profile, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          profile = EXCLUDED.profile,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.username, data.email, JSON.stringify(data.profile), timestamp]);
      break;

    case 'analytics':
      // Guard anonymous events: if no user_id, store with a synthetic 'anonymous' user
      await client.query(`
        INSERT INTO analytics (id, user_id, event_type, event_data, session_id, user_agent, platform)
        VALUES ($1, COALESCE($2, 'anonymous'), $3, $4, $5, $6, $7)
      `, [data.id, data.userId || null, data.eventType, JSON.stringify(data.eventData), data.sessionId, data.userAgent, data.platform]);
      break;

    case 'posts':
      await client.query(`
        INSERT INTO posts (id, user_id, channel, title, content, votes, replies, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          votes = EXCLUDED.votes,
          replies = EXCLUDED.replies,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.userId, data.channel, data.title, data.content, data.votes, JSON.stringify(data.replies), timestamp]);
      break;

    case 'conversations':
      await client.query(`
        INSERT INTO conversations (id, user_id, messages, metadata, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          messages = EXCLUDED.messages,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.userId, JSON.stringify(data.messages), JSON.stringify(data.metadata), timestamp]);
      break;

    case 'ai_logs':
      await client.query(`
        INSERT INTO ai_logs (id, user_id, interaction_type, input, output, tools_used, response_time, session_id)
        VALUES ($1, COALESCE($2, 'anonymous'), $3, $4, $5, $6, $7, $8)
      `, [data.id, data.userId || null, data.interactionType, data.input, data.output, JSON.stringify(data.toolsUsed), data.responseTime, data.sessionId]);
      break;

    case 'scribble_boards':
      await client.query(`
        INSERT INTO scribble_boards (id, user_id, name, data, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = EXCLUDED.updated_at
      `, [data.id, data.userId, data.name, JSON.stringify(data.data || {}), timestamp]);
      break;

    case 'scribble_events':
      await client.query(`
        INSERT INTO scribble_events (id, user_id, board_id, event_name, detail)
        VALUES ($1, COALESCE($2, 'anonymous'), $3, $4, $5)
      `, [data.id, data.userId || null, data.boardId || null, data.eventName, JSON.stringify(data.detail || {})]);
      break;

    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

async function getFromDatabase(client, collection, key, filters = {}) {
  if (!queryBuilder) {
    throw new Error('Query builder not initialized');
  }

  let query;

  switch (collection) {
    case 'users':
      query = queryBuilder('users').select('*');
      if (key) {
        query = query.where('id', key);
      }
      query = query.orderBy('updated_at', 'desc');
      break;

    case 'analytics':
      query = queryBuilder('analytics').select('*');
      if (key) {
        query = query.where('user_id', key);
      }
      if (filters.eventType) {
        query = query.where('event_type', filters.eventType);
      }
      query = query.orderBy('timestamp', 'desc').limit(100);
      break;

    case 'posts':
      query = queryBuilder('posts').select('*');
      if (filters.channel) {
        query = query.where('channel', filters.channel);
      }
      query = query.orderBy('created_at', 'desc').limit(100);
      break;

    case 'conversations':
      query = queryBuilder('conversations').select('*');
      if (key) {
        query = query.where('user_id', key);
      }
      query = query.orderBy('updated_at', 'desc').limit(100);
      break;

    case 'ai_logs':
      query = queryBuilder('ai_logs').select('*');
      if (key) {
        query = query.where('user_id', key);
      }
      if (filters.interactionType) {
        query = query.where('interaction_type', filters.interactionType);
      }
      query = query.orderBy('timestamp', 'desc').limit(100);
      break;

    case 'scribble_boards':
      query = queryBuilder('scribble_boards').select('*');
      if (key) {
        query = query.where('user_id', key);
      }
      if (filters?.boardId) {
        query = query.where('id', filters.boardId);
      }
      query = query.orderBy('updated_at', 'desc').limit(100);
      break;

    case 'scribble_events':
      query = queryBuilder('scribble_events').select('*');
      if (key) {
        query = query.where('user_id', key);
      }
      if (filters?.boardId) {
        query = query.where('board_id', filters.boardId);
      }
      if (filters?.eventName) {
        query = query.where('event_name', filters.eventName);
      }
      query = query.orderBy('created_at', 'desc').limit(200);
      break;

    default:
      throw new Error(`Unknown collection: ${collection}`);
  }

  const result = await query;
  return result;
}

async function deleteFromDatabase(client, collection, key) {
  if (!key) {
    throw new Error('Key is required for delete operations');
  }

  if (!queryBuilder) {
    throw new Error('Query builder not initialized');
  }

  switch (collection) {
    case 'users':
      await queryBuilder('users').where('id', key).del();
      break;
    case 'analytics':
      await queryBuilder('analytics').where('id', key).del();
      break;
    case 'posts':
      await queryBuilder('posts').where('id', key).del();
      break;
    case 'conversations':
      await queryBuilder('conversations').where('id', key).del();
      break;
    case 'ai_logs':
      await queryBuilder('ai_logs').where('id', key).del();
      break;
    case 'scribble_boards':
      await queryBuilder('scribble_boards').where('id', key).del();
      break;
    case 'scribble_events':
      await queryBuilder('scribble_events').where('id', key).del();
      break;
    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

// Database API handler
async function handleDatabaseRequest(req, res) {
  try {
    const { action, collection, data, key, filters } = req.body;
    
    if (!action || !collection) {
      return res.status(400).json({ error: 'Missing action or collection' });
    }
    
    // If database is not available, return graceful error
    if (!databaseAvailable || !pool) {
      console.log('📝 Database request made but DB unavailable - using in-memory fallback');
      return res.json({ 
        success: true, 
        message: 'Database temporarily unavailable - using in-memory storage',
        data: null 
      });
    }

    const client = await pool.connect();

    try {
      switch (action) {
        case 'save':
          await saveToDatabase(client, collection, data);
          res.json({ success: true, message: 'Data saved successfully' });
          break;

        case 'get':
          const result = await getFromDatabase(client, collection, key, filters);
          res.json(result);
          break;

        case 'delete':
          await deleteFromDatabase(client, collection, key);
          res.json({ success: true, message: 'Data deleted successfully' });
          break;

        default:
          res.status(400).json({ error: 'Invalid action' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database API error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
}

module.exports = {
  initializeDatabase,
  handleDatabaseRequest,
  saveToDatabase,
  getFromDatabase,
  deleteFromDatabase,
  getDatabaseStatus: () => ({ available: databaseAvailable, pool, queryBuilder: !!queryBuilder }),
  pool: () => pool,
  queryBuilder: () => queryBuilder
};
