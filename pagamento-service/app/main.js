const express = require("express");

const config =
  require("./core/config");

const pagamentoRoutes =
  require("./routes/pagamentoRoutes");

require("./core/database");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    servico: "pagamento-service",
    status: "online"
  });
});

app.use(
  "/pagamentos",
  pagamentoRoutes
);

app.listen(
  config.port,
  "0.0.0.0",
  () => {

    console.log(
      `Pagamento Service rodando na porta ${config.port}`
    );
  }
);