const path = require('path');
const fs = require('fs');

let db = null;
let useMemoryFallback = false;

// Determine appropriate DB directory (use /tmp on serverless environments like Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isServerless 
  ? '/tmp' 
  : path.join(__dirname, '..', '..', 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const Database = require('better-sqlite3');
  const dbPath = path.join(dataDir, 'thalsa.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      mode TEXT NOT NULL,
      final_answer TEXT,
      agreement_score INTEGER,
      agreement_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      model_name TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      response TEXT,
      response_time_ms INTEGER,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_responses_conv ON responses(conversation_id);
  `);
} catch (err) {
  console.warn('SQLite storage unavailable, activating in-memory session database:', err.message);
  useMemoryFallback = true;
}

// In-memory fallback store for serverless environments where native SQLite is restricted
const memConversations = new Map();
const memResponses = new Map();

module.exports = {
  db,
  saveConversation: (conv) => {
    if (useMemoryFallback || !db) {
      memConversations.set(conv.id, {
        ...conv,
        created_at: conv.created_at || new Date().toISOString()
      });
      return { changes: 1 };
    }
    const stmt = db.prepare(`
      INSERT INTO conversations (id, question, mode, final_answer, agreement_score, agreement_details, created_at)
      VALUES (@id, @question, @mode, @final_answer, @agreement_score, @agreement_details, COALESCE(@created_at, CURRENT_TIMESTAMP))
    `);
    return stmt.run(conv);
  },
  saveResponse: (resp) => {
    if (useMemoryFallback || !db) {
      memResponses.set(resp.id, {
        ...resp,
        created_at: resp.created_at || new Date().toISOString()
      });
      return { changes: 1 };
    }
    const stmt = db.prepare(`
      INSERT INTO responses (id, conversation_id, provider_id, model_name, provider_name, response, response_time_ms, status, error_message, created_at)
      VALUES (@id, @conversation_id, @provider_id, @model_name, @provider_name, @response, @response_time_ms, @status, @error_message, COALESCE(@created_at, CURRENT_TIMESTAMP))
    `);
    return stmt.run(resp);
  },
  getRecentConversations: (limit = 50) => {
    if (useMemoryFallback || !db) {
      const all = Array.from(memConversations.values());
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return all.slice(0, limit);
    }
    const stmt = db.prepare(`
      SELECT 
        c.*, 
        COUNT(r.id) as model_count,
        GROUP_CONCAT(r.model_name, ', ') as models_used
      FROM conversations c
      LEFT JOIN responses r ON c.id = r.conversation_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },
  getConversationWithResponses: (id) => {
    if (useMemoryFallback || !db) {
      const conv = memConversations.get(id);
      if (!conv) return null;
      const responses = Array.from(memResponses.values()).filter(r => r.conversation_id === id);
      return {
        ...conv,
        responses
      };
    }
    const convStmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
    const conv = convStmt.get(id);
    if (!conv) return null;

    const respStmt = db.prepare('SELECT * FROM responses WHERE conversation_id = ? ORDER BY created_at ASC');
    const responses = respStmt.all(id);

    return {
      ...conv,
      responses
    };
  },
  deleteConversation: (id) => {
    if (useMemoryFallback || !db) {
      memConversations.delete(id);
      return { changes: 1 };
    }
    const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
    return stmt.run(id);
  },
  clearAllHistory: () => {
    if (useMemoryFallback || !db) {
      memConversations.clear();
      memResponses.clear();
      return true;
    }
    db.exec('DELETE FROM responses; DELETE FROM conversations;');
    return true;
  }
};
