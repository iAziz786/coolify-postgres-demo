const express = require('express');

let sql;

// Initialize database connection using async import for ESM compatibility with Bun
async function initDb() {
  const { default: postgres } = await import('postgres');
  sql = postgres({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

const app = express();
app.use(express.json());

// Deploy confirmation endpoint
app.get('/deploy', async (req, res) => {
  res.json({
    message: 'Auto-deploy works!',
    runtime: 'Bun',
    deployed_at: new Date().toISOString(),
    commit: process.env.SOURCE_COMMIT || 'unknown'
  });
});

// Health check
app.get('/', async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.json({
      status: 'connected',
      database: 'PostgreSQL',
      version: result[0].version,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize todos table
app.post('/init', async (req, res) => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    res.json({ message: 'Table created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await sql`SELECT * FROM todos ORDER BY created_at DESC`;
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a todo
app.post('/todos', async (req, res) => {
  try {
    const { title } = req.body;
    const result = await sql`
      INSERT INTO todos (title) VALUES (${title}) RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

// Initialize DB then start listening
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
