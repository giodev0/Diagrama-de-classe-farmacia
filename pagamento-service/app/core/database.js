const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const config = require("./config");

const pastaBanco = path.dirname(config.databasePath);

if (!fs.existsSync(pastaBanco)) {
  fs.mkdirSync(pastaBanco, {
    recursive: true
  });
}

const db = new sqlite3.Database(
  config.databasePath,
  (erro) => {
    if (erro) {
      console.error(
        "Erro ao conectar ao banco de pagamentos:",
        erro.message
      );
      return;
    }

    console.log("Banco de pagamentos conectado.");
  }
);

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