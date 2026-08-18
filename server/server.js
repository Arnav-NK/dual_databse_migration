const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { connectSQL } = require('./config/sqlDb');
const { getTodoRepository, isSQLMode } = require('./repositories/todoRepositoryFactory');
const todoRoutes = require('./routes/todoRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares with relaxed CORS for Vercel and third-party frontends
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.options('*', cors());
app.use(express.json());

// Initialize the active database based on USE_SQL flag
const initDatabase = async () => {
  const sqlMode = isSQLMode();
  console.log(`\n========================================`);
  console.log(`🔧 Database Mode: ${sqlMode ? 'SQL (PostgreSQL / SQLite)' : 'NoSQL (MongoDB)'}`);
  console.log(`🚩 USE_SQL flag: ${process.env.USE_SQL}`);
  console.log(`========================================\n`);

  try {
    if (sqlMode) {
      await connectSQL();
    } else {
      await connectDB();
    }
  } catch (err) {
    console.error('⚠️ Database connection error during startup:', err.message);
  }
};

// Initialize DB immediately
initDatabase();

// API Routes
app.use('/api/todos', todoRoutes);

// Health check route reporting active database type and status
app.get('/api/health', (req, res) => {
  try {
    const repository = getTodoRepository();
    const dbHealth = repository.getHealth();

    res.json({
      status: 'Connected',
      server: 'Running',
      useSQL: isSQLMode(),
      ...dbHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      server: 'Running',
      error: error.message
    });
  }
});

// Root welcome route
app.get('/api', (req, res) => {
  res.json({
    message: 'MERN & SQL Dual-Database API is running',
    health: '/api/health',
    todos: '/api/todos'
  });
});

// Serve frontend static build in production (if deployed as full-stack monolith)
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'Dual-Database API Server is active.',
      endpoints: ['/api/health', '/api/todos']
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
