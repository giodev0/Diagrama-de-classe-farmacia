const express = require("express");

const config =
  require("./core/config");

require("./core/database");

const relatorioRoutes =
  require("./routes/relatorioRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    servico: "relatorio-service",
    status: "online"
  });
});

app.use(
  "/relatorios",
  relatorioRoutes
);

app.listen(
  config.port,
  "0.0.0.0",
  () => {
    console.log(
      `Relatorio Service rodando na porta ${config.port}`
    );
  }
);