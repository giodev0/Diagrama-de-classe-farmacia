const db = require("./database/database");

const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "Serviço de Pagamentos funcionando"
  });
});

app.post("/pagamentos", (req, res) => {
  const { vendaId, valor, formaPagamento } = req.body;

  if (!vendaId || !valor || !formaPagamento) {
    return res.status(400).json({
      erro: "vendaId, valor e formaPagamento são obrigatórios"
    });
  }

  const formasPermitidas = ["PIX", "CARTAO", "DINHEIRO"];

  if (!formasPermitidas.includes(formaPagamento)) {
    return res.status(400).json({
      erro: "Forma de pagamento inválida"
    });
  }

  const status = "APROVADO";
  const data = new Date().toISOString();

  db.run(
    `
      INSERT INTO pagamentos
      (vendaId, valor, formaPagamento, status, data)
      VALUES (?, ?, ?, ?, ?)
    `,
    [vendaId, valor, formaPagamento, status, data],
    function (erro) {
      if (erro) {
        return res.status(500).json({
          erro: "Erro ao salvar pagamento"
        });
      }

      res.status(201).json({
        id: this.lastID,
        vendaId,
        valor,
        formaPagamento,
        status,
        data
      });
    }
  );
});

app.get("/pagamentos/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    "SELECT * FROM pagamentos WHERE id = ?",
    [id],
    (erro, pagamento) => {
      if (erro) {
        return res.status(500).json({
          erro: "Erro ao consultar pagamento"
        });
      }

      if (!pagamento) {
        return res.status(404).json({
          erro: "Pagamento não encontrado"
        });
      }

      res.json(pagamento);
    }
  );
});

app.listen(3005, () => {
  console.log("Pagamento Service rodando na porta 3005");
});