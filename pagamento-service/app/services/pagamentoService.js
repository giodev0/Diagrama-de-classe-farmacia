const Pagamento =
  require("../models/pagamento");

const PagamentoRepository =
  require("../repositories/pagamentoRepository");

const {
  validarCriacaoPagamento
} = require("../schemas/pagamentoSchema");

class PagamentoService {

  constructor(
    repository = new PagamentoRepository()
  ) {
    this.repository = repository;
  }

  async criarPagamento(dados) {

    const validacao =
      validarCriacaoPagamento(dados);

    if (!validacao.valido) {
      throw {
        status: 400,
        mensagem: validacao.mensagem
      };
    }

    const pagamento = new Pagamento({
      vendaId: dados.vendaId,
      valor: dados.valor,
      formaPagamento:
        dados.formaPagamento,
      status: "APROVADO",
      data: new Date().toISOString()
    });

    try {

      return await this.repository.salvar(
        pagamento
      );

    } catch (erro) {

      console.error(
        "Erro ao salvar pagamento:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao salvar pagamento"
      };
    }
  }

  async buscarPagamentoPorId(id) {

    const pagamentoId = Number(id);

    if (
      !Number.isInteger(pagamentoId) ||
      pagamentoId <= 0
    ) {
      throw {
        status: 400,
        mensagem:
          "ID do pagamento inválido"
      };
    }

    try {

      const pagamento =
        await this.repository.buscarPorId(
          pagamentoId
        );

      if (!pagamento) {
        throw {
          status: 404,
          mensagem:
            "Pagamento não encontrado"
        };
      }

      return pagamento;

    } catch (erro) {

      if (erro.status) {
        throw erro;
      }

      console.error(
        "Erro ao consultar pagamento:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao consultar pagamento"
      };
    }
  }

  async listarPagamentos() {

    try {

      return await this.repository.listar();

    } catch (erro) {

      console.error(
        "Erro ao listar pagamentos:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao listar pagamentos"
      };
    }
  }
}

module.exports = PagamentoService;