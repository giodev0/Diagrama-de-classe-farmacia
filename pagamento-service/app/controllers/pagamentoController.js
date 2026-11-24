const PagamentoService =
  require("../services/pagamentoService");

const pagamentoService =
  new PagamentoService();

async function criarPagamento(
  req,
  res
) {

  try {

    const pagamento =
      await pagamentoService.criarPagamento(
        req.body
      );

    return res
      .status(201)
      .json(pagamento);

  } catch (erro) {

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.mensagem ||
          "Erro interno do servidor"
      });
  }
}

async function listarPagamentos(
  req,
  res
) {

  try {

    const pagamentos =
      await pagamentoService.listarPagamentos();

    return res.json(pagamentos);

  } catch (erro) {

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.mensagem ||
          "Erro interno do servidor"
      });
  }
}

async function buscarPagamentoPorId(
  req,
  res
) {

  try {

    const pagamento =
      await pagamentoService
        .buscarPagamentoPorId(
          req.params.id
        );

    return res.json(pagamento);

  } catch (erro) {

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.mensagem ||
          "Erro interno do servidor"
      });
  }
}

module.exports = {
  criarPagamento,
  listarPagamentos,
  buscarPagamentoPorId
};