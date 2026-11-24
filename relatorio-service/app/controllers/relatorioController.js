const RelatorioService =
  require("../services/relatorioService");

const relatorioService =
  new RelatorioService();

async function sincronizar(req, res) {

  try {

    const resultado =
      await relatorioService.sincronizar();

    return res.json(resultado);

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

async function listarVendas(req, res) {

  try {

    const vendas =
      await relatorioService.listarVendas();

    return res.json(vendas);

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

async function listarProdutos(req, res) {

  try {

    const produtos =
      await relatorioService.listarProdutos();

    return res.json(produtos);

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

async function listarEstoque(req, res) {

  try {

    const estoque =
      await relatorioService.listarEstoque();

    return res.json(estoque);

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
  sincronizar,
  listarVendas,
  listarProdutos,
  listarEstoque
};