const axios = require("axios");

const config = require("../core/config");

const RelatorioRepository =
  require("../repositories/relatorioRepository");

class RelatorioService {

  constructor(
    repository = new RelatorioRepository()
  ) {
    this.repository = repository;
  }

  async sincronizar() {

    try {
      const [
        respostaProdutos,
        respostaEstoque,
        respostaVendas
      ] = await Promise.all([
        axios.get(
          `${config.produtoServiceUrl}/produtos`
        ),

        axios.get(
          `${config.estoqueServiceUrl}/estoque`
        ),

        axios.get(
          `${config.vendaServiceUrl}/vendas`
        )
      ]);

      const produtos =
        respostaProdutos.data;

      const estoques =
        respostaEstoque.data;

      const vendas =
        respostaVendas.data;

      await this.sincronizarEstoque(
        estoques
      );

      await this.sincronizarProdutos(
        produtos,
        vendas
      );

      await this.sincronizarVendas(
        vendas
      );

      return {
        sincronizadoEm:
          new Date().toISOString(),

        produtos:
          produtos.length,

        estoques:
          estoques.length,

        vendas:
          vendas.length
      };

    } catch (erro) {

      console.error(
        "Erro durante sincronização:",
        erro.message
      );

      if (
        erro.code === "ECONNREFUSED"
      ) {
        throw {
          status: 503,
          mensagem:
            "Um dos serviços necessários está indisponível"
        };
      }

      throw {
        status: 500,
        mensagem:
          "Erro ao sincronizar relatórios"
      };
    }
  }

  async sincronizarEstoque(estoques) {

    for (const estoque of estoques) {

      await this.repository.salvarEstoque({
        produtoId:
          estoque.produtoId,

        quantidade:
          estoque.quantidade,

        estoqueMinimo:
          estoque.estoqueMinimo
      });
    }
  }

  async sincronizarProdutos(
    produtos,
    vendas
  ) {

    for (const produto of produtos) {

      let quantidadeVendida = 0;

      for (const venda of vendas) {

        if (
          venda.status !==
          "FINALIZADA"
        ) {
          continue;
        }

        const itens =
          venda.itens || [];

        for (const item of itens) {

          if (
            item.produtoId ===
            produto.id
          ) {
            quantidadeVendida +=
              item.quantidade;
          }
        }
      }

      await this.repository.salvarProduto({
        produtoId:
          produto.id,

        nome:
          produto.nome,

        quantidadeVendida
      });
    }
  }

  async sincronizarVendas(vendas) {

    for (const venda of vendas) {

      if (
        venda.status !==
        "FINALIZADA"
      ) {
        continue;
      }

      await this.repository.salvarVenda({
        vendaId:
          venda.id,

        valorTotal:
          venda.valorTotal,

        data:
          venda.finalizadaEm ||
          venda.criadaEm
      });
    }
  }

  async listarVendas() {

    try {

      return await this.repository.listarVendas();

    } catch (erro) {

      console.error(
        "Erro ao gerar relatório de vendas:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao gerar relatório de vendas"
      };
    }
  }

  async listarProdutos() {

    try {

      return await this.repository.listarProdutos();

    } catch (erro) {

      console.error(
        "Erro ao gerar relatório de produtos:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao gerar relatório de produtos"
      };
    }
  }

  async listarEstoque() {

    try {

      return await this.repository.listarEstoque();

    } catch (erro) {

      console.error(
        "Erro ao gerar relatório de estoque:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao gerar relatório de estoque"
      };
    }
  }
}

module.exports = RelatorioService;