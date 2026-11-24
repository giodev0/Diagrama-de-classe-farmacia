const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath =
  process.env.DATABASE_PATH ||
  path.resolve(
    process.cwd(),
    "database",
    "relatorios.db"
  );

const pastaBanco = path.dirname(databasePath);

if (!fs.existsSync(pastaBanco)) {
  fs.mkdirSync(pastaBanco, {
    recursive: true
  });
}

const db = new sqlite3.Database(
  databasePath,
  (erro) => {
    if (erro) {
      console.error(
        "Erro ao conectar ao banco de relatórios:",
        erro.message
      );
      return;
    }

    console.log("Banco de relatórios conectado.");
  }
);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas_relatorio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendaId INTEGER NOT NULL UNIQUE,
      valorTotal REAL NOT NULL,
      data TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS produtos_relatorio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produtoId INTEGER NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      quantidadeVendida INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS estoque_relatorio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produtoId INTEGER NOT NULL UNIQUE,
      quantidade INTEGER NOT NULL,
      estoqueMinimo INTEGER NOT NULL
    )
  `);
});

module.exports = db;