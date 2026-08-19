# 🚀 Dual-Database (SQL & NoSQL) MERN Todo Application

A modern, full-stack Todo application built with **React (Vite)** and an **Express backend** capable of dynamically switching between **SQL (Neon PostgreSQL / SQLite)** and **NoSQL (MongoDB Atlas)** with **JWT Authentication** and **Bidirectional Data Migration**.

---

## 🚩 Dynamic Database Switch Flag (`USE_SQL`)

The application checks the `USE_SQL` environment variable on startup:

| `USE_SQL` Value | Active Database | Driver / Engine | Typical Host / Service |
| :--- | :--- | :--- | :--- |
| `false` (default) | **NoSQL (MongoDB)** | Mongoose ODM | MongoDB Atlas / Local MongoDB |
| `true` | **SQL** | `pg` (PostgreSQL) / `sqlite3` | Neon Serverless PostgreSQL / Local SQLite |

---

## 🔄 Bidirectional Data Migration & Sync Scripts

When switching between databases, you can run the migration scripts to seamlessly transfer users (preserving password hashes) and tasks:

### 1. SQL (Neon PostgreSQL) &rarr; MongoDB Atlas (NoSQL)
```bash
npm run migrate:sql-to-mongo
```

### 2. MongoDB Atlas (NoSQL) &rarr; SQL (Neon PostgreSQL)
```bash
npm run migrate:mongo-to-sql
```

### 3. Bidirectional 2-Way Merge (Sync Both)
```bash
npm run sync:both
```

### 4. REST API Migration Endpoints
You can also trigger migrations on-demand over HTTP:
- `POST /api/migrate/to-mongo` (SQL &rarr; MongoDB)
- `POST /api/migrate/to-sql` (MongoDB &rarr; SQL)
- `POST /api/migrate/sync` (Two-way merge)

---

## 🔐 JWT Authentication Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user (`{ email, password }`) |
| `POST` | `/api/auth/login` | Log in and receive JWT token (`{ email, password }`) |
| `GET` | `/api/auth/me` | Verify active session (Protected) |

---

## 📡 Protected Todo Endpoints

All todo operations require the header `Authorization: Bearer <token>`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/todos` | Fetch user's tasks (optional `?status=active\|completed`) |
| `POST` | `/api/todos` | Create a new task (`{ text: "..." }`) |
| `PUT` | `/api/todos/:id` | Update task text or completion |
| `PATCH` | `/api/todos/:id/toggle` | Toggle task completion |
| `PATCH` | `/api/todos/batch/toggle-all` | Toggle all tasks active / completed |
| `DELETE` | `/api/todos/:id` | Delete a task |
| `DELETE` | `/api/todos/completed/all` | Delete all completed tasks |
| `GET` | `/api/health` | Check active database type and connection status |

---

## 🌐 Deploying to Render & Vercel

### Backend (Render)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `USE_SQL`: `false` *(or `true` for Neon DB)*
  - `JWT_SECRET`: `your_secure_jwt_secret`
  - `MONGODB_URI`: `mongodb+srv://...`
  - `DATABASE_URL`: `postgresql://...`
  - `NODE_ENV`: `production`

### Frontend (Vercel)
- **Root Directory**: `client`
- **Framework**: `Vite`
- **Environment Variable**: `VITE_API_URL` = `https://your-backend.onrender.com`