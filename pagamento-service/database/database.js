const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/pagamentos.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendaId INTEGER NOT NULL,
      valor REAL NOT NULL,
      formaPagamento TEXT NOT NULL,
      status TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);
});

module.exports = db;