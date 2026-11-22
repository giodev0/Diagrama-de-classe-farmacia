const express = require("express");

const pagamentoRoutes =
  require("./routes/pagamentoRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "Serviço de Pagamentos funcionando"
  });
});

app.use(
  "/pagamentos",
  pagamentoRoutes
);

const PORT = 3005;

app.listen(PORT, () => {
  console.log(
    `Pagamento Service rodando na porta ${PORT}`
  );
});