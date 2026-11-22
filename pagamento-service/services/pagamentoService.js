const db = require("../database/database");

const formasPermitidas = ["PIX", "CARTAO", "DINHEIRO"];

function criarPagamento(vendaId, valor, formaPagamento, callback) {
  if (!vendaId || valor === undefined || !formaPagamento) {
    return callback({
      status: 400,
      mensagem: "vendaId, valor e formaPagamento são obrigatórios"
    });
  }

  if (valor <= 0) {
    return callback({
      status: 400,
      mensagem: "O valor do pagamento deve ser maior que zero"
    });
  }

  if (!formasPermitidas.includes(formaPagamento)) {
    return callback({
      status: 400,
      mensagem: "Forma de pagamento inválida"
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
        return callback({
          status: 500,
          mensagem: "Erro ao salvar pagamento"
        });
      }

      callback(null, {
        id: this.lastID,
        vendaId,
        valor,
        formaPagamento,
        status,
        data
      });
    }
  );
}

function buscarPagamentoPorId(id, callback) {
  db.get(
    "SELECT * FROM pagamentos WHERE id = ?",
    [id],
    (erro, pagamento) => {
      if (erro) {
        return callback({
          status: 500,
          mensagem: "Erro ao consultar pagamento"
        });
      }

      if (!pagamento) {
        return callback({
          status: 404,
          mensagem: "Pagamento não encontrado"
        });
      }

      callback(null, pagamento);
    }
  );
}

function listarPagamentos(callback) {
  db.all(
    "SELECT * FROM pagamentos ORDER BY id",
    [],
    (erro, pagamentos) => {
      if (erro) {
        return callback({
          status: 500,
          mensagem: "Erro ao listar pagamentos"
        });
      }

      callback(null, pagamentos);
    }
  );
}

module.exports = {
  criarPagamento,
  buscarPagamentoPorId,
  listarPagamentos
};