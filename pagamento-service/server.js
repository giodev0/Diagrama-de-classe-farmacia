const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "Serviço de Pagamentos funcionando"
  });
});

app.listen(3005, () => {
  console.log("Pagamento Service rodando na porta 3005");
});