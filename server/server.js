const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { connectSQL } = require('./config/sqlDb');
const { getTodoRepository, isSQLMode } = require('./repositories/todoRepositoryFactory');
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/authRoutes');
const migrationRoutes = require('./routes/migrationRoutes');

const app = express();

// 1. Universal CORS Middleware - Allow all origins, headers, and methods
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// 2. Immediate Database Initialization (non-blocking server start)
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
    console.error('⚠️ Database connection warning during startup:', err.message);
  }
};

initDatabase();

// 3. Health Check Endpoints (both /api/health and /health)
const handleHealthCheck = (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const repository = getTodoRepository();
    const dbHealth = repository.getHealth();

    res.json({
      status: 'Connected',
      server: 'Running',
      useSQL: isSQLMode(),
      lastMigrationTime: global.lastMigrationTime || null,
      ...dbHealth
    });
  } catch (error) {
    res.status(200).json({
      status: 'Connecting',
      server: 'Running',
      useSQL: isSQLMode(),
      lastMigrationTime: global.lastMigrationTime || null,
      error: error.message
    });
  }
};

app.get('/api/health', handleHealthCheck);
app.get('/health', handleHealthCheck);

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/migrate', migrationRoutes);

// 5. Root Info Route
app.get('/api', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({
    message: 'Dual-Database (MERN & SQL) API with JWT Auth & Data Migration is running',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      todos: 'GET /api/todos (Protected)',
      migration: {
        sqlToMongo: 'POST /api/migrate/to-mongo',
        mongoToSql: 'POST /api/migrate/to-sql',
        syncBoth: 'POST /api/migrate/sync'
      },
      health: 'GET /api/health'
    },
    useSQL: isSQLMode()
  });
});

// 6. Serve static client build if present, otherwise return API info
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const indexPath = path.join(clientDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'Dual-Database Backend API Server is active.',
      healthCheck: '/api/health',
      authEndpoint: '/api/auth',
      todosEndpoint: '/api/todos',
      migrateEndpoint: '/api/migrate'
    });
  }
});

// 7. Global Error Handler with CORS
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
