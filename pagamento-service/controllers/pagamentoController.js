const pagamentoService = require("../services/pagamentoService");

function criarPagamento(req, res) {
  const { vendaId, valor, formaPagamento } = req.body;

  pagamentoService.criarPagamento(
    vendaId,
    valor,
    formaPagamento,
    (erro, pagamento) => {
      if (erro) {
        return res.status(erro.status).json({
          erro: erro.mensagem
        });
      }

      res.status(201).json(pagamento);
    }
  );
}

function buscarPagamentoPorId(req, res) {
  const { id } = req.params;

  pagamentoService.buscarPagamentoPorId(
    id,
    (erro, pagamento) => {
      if (erro) {
        return res.status(erro.status).json({
          erro: erro.mensagem
        });
      }

      res.json(pagamento);
    }
  );
}

function listarPagamentos(req, res) {
  pagamentoService.listarPagamentos(
    (erro, pagamentos) => {
      if (erro) {
        return res.status(erro.status).json({
          erro: erro.mensagem
        });
      }

      res.json(pagamentos);
    }
  );
}

module.exports = {
  criarPagamento,
  buscarPagamentoPorId,
  listarPagamentos
};