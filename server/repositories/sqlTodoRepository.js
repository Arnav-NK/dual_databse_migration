const crypto = require('crypto');
const { getSQLClient, getSQLEngine } = require('../config/sqlDb');

class SqlTodoRepository {
  // Helper to normalize SQL row to JSON matching the standard format
  normalizeRow(row) {
    if (!row) return null;
    return {
      _id: String(row.id),
      text: row.text,
      completed: Boolean(row.completed === true || row.completed === 1),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }

  async getAll({ status } = {}) {
    const client = getSQLClient();
    let sql = 'SELECT * FROM todos';
    const params = [];

    if (status === 'active') {
      sql += ' WHERE completed = FALSE OR completed = 0';
    } else if (status === 'completed') {
      sql += ' WHERE completed = TRUE OR completed = 1';
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await client.query(sql, params);
    return rows.map((r) => this.normalizeRow(r));
  }

  async getById(id) {
    const client = getSQLClient();
    const rows = await client.query('SELECT * FROM todos WHERE id = ? LIMIT 1', [String(id)]);
    return rows.length > 0 ? this.normalizeRow(rows[0]) : null;
  }

  async create({ text }) {
    const client = getSQLClient();
    const id = crypto.randomUUID().replace(/-/g, '').substring(0, 24); // 24 hex char ID
    const now = new Date().toISOString();

    await client.query(
      'INSERT INTO todos (id, text, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, text.trim(), 0, now, now]
    );

    return {
      _id: id,
      text: text.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now
    };
  }

  async update(id, { text, completed }) {
    const client = getSQLClient();
    const existing = await this.getById(id);
    if (!existing) return null;

    const newText = typeof text === 'string' ? text.trim() : existing.text;
    const newCompleted = typeof completed === 'boolean' ? (completed ? 1 : 0) : (existing.completed ? 1 : 0);
    const now = new Date().toISOString();

    await client.query(
      'UPDATE todos SET text = ?, completed = ?, updated_at = ? WHERE id = ?',
      [newText, newCompleted, now, String(id)]
    );

    return this.getById(id);
  }

  async toggle(id) {
    const client = getSQLClient();
    const existing = await this.getById(id);
    if (!existing) return null;

    const newCompleted = existing.completed ? 0 : 1;
    const now = new Date().toISOString();

    await client.query(
      'UPDATE todos SET completed = ?, updated_at = ? WHERE id = ?',
      [newCompleted, now, String(id)]
    );

    return this.getById(id);
  }

  async delete(id) {
    const client = getSQLClient();
    const existing = await this.getById(id);
    if (!existing) return null;

    await client.query('DELETE FROM todos WHERE id = ?', [String(id)]);
    return { id: String(id) };
  }

  async clearCompleted() {
    const client = getSQLClient();
    const completedRows = await client.query('SELECT id FROM todos WHERE completed = TRUE OR completed = 1');
    const count = completedRows.length;

    await client.query('DELETE FROM todos WHERE completed = TRUE OR completed = 1');
    return { deletedCount: count };
  }

  async toggleAll(completed = true) {
    const client = getSQLClient();
    const targetStatus = completed ? 1 : 0;
    const now = new Date().toISOString();

    await client.query('UPDATE todos SET completed = ?, updated_at = ?', [targetStatus, now]);
    return this.getAll();
  }

  getHealth() {
    const engine = getSQLEngine();
    const client = getSQLClient();
    const isPostgres = engine === 'postgres' || engine === 'neon-postgres';
    const isNeon = client?.isNeon;

    let dbHost = 'Local File';
    if (isPostgres && process.env.DATABASE_URL) {
      try {
        dbHost = process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || (isNeon ? 'Neon Serverless' : 'PostgreSQL');
      } catch {
        dbHost = isNeon ? 'Neon Serverless' : 'PostgreSQL';
      }
    }

    return {
      dbType: isNeon ? 'SQL (Neon PostgreSQL)' : (isPostgres ? 'SQL (PostgreSQL)' : 'SQL (SQLite)'),
      driver: isPostgres ? 'pg (node-postgres)' : 'sqlite3',
      status: client ? 'Connected' : 'Disconnected',
      dbHost: dbHost,
      dbName: isNeon ? 'Neon DB' : (isPostgres ? 'PostgreSQL' : 'todos.sqlite')
    };
  }
}

module.exports = SqlTodoRepository;
