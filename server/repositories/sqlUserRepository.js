const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getSQLClient } = require('../config/sqlDb');

class SqlUserRepository {
  normalizeUser(row, includePassword = false) {
    if (!row) return null;
    const user = {
      _id: String(row.id),
      email: row.email,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
    if (includePassword) {
      user.password = row.password;
    }
    return user;
  }

  async findByEmail(email) {
    const client = getSQLClient();
    const rows = await client.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [
      email.toLowerCase().trim()
    ]);
    return rows.length > 0 ? this.normalizeUser(rows[0], true) : null;
  }

  async findById(id) {
    const client = getSQLClient();
    const rows = await client.query('SELECT id, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [
      String(id)
    ]);
    return rows.length > 0 ? this.normalizeUser(rows[0], false) : null;
  }

  async createUser({ email, password }) {
    const client = getSQLClient();
    const id = crypto.randomUUID().replace(/-/g, '').substring(0, 24);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    await client.query(
      'INSERT INTO users (id, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, email.toLowerCase().trim(), hashedPassword, now, now]
    );

    return {
      _id: id,
      email: email.toLowerCase().trim(),
      createdAt: now
    };
  }

  async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
}

module.exports = SqlUserRepository;
