const path = require("path");

const config = {
  port: process.env.PORT || 8005,

  databasePath:
    process.env.DATABASE_PATH ||
    path.resolve(process.cwd(), "database", "pagamentos.db")
};

module.exports = config;