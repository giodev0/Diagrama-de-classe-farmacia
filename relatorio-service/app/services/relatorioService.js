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

  async buscarDados(url, nomeServico) {
    try {

      const resposta =
        await axios.get(url);

      return {
        disponivel: true,
        dados: resposta.data
      };

    } catch (erro) {

      console.error(
        `${nomeServico} indisponível:`,
        erro.message
      );

      return {
        disponivel: false,
        dados: []
      };
    }
  }

  async sincronizar() {

    const [
      resultadoProdutos,
      resultadoEstoque,
      resultadoVendas
    ] = await Promise.all([

      this.buscarDados(
        `${config.produtoServiceUrl}/produtos`,
        "produto-service"
      ),

      this.buscarDados(
        `${config.estoqueServiceUrl}/estoque`,
        "estoque-service"
      ),

      this.buscarDados(
        `${config.vendaServiceUrl}/vendas`,
        "venda-service"
      )
    ]);

    try {

      if (resultadoEstoque.disponivel) {
        await this.sincronizarEstoque(
          resultadoEstoque.dados
        );
      }

      if (resultadoProdutos.disponivel) {

        if (resultadoVendas.disponivel) {

          await this.sincronizarProdutos(
            resultadoProdutos.dados,
            resultadoVendas.dados
          );

        } else {

          await this.sincronizarProdutosSemVendas(
            resultadoProdutos.dados
          );
        }
      }

      if (resultadoVendas.disponivel) {

        await this.sincronizarVendas(
          resultadoVendas.dados
        );
      }

      return {
        sincronizadoEm:
          new Date().toISOString(),

        servicos: {
          produtos:
            resultadoProdutos.disponivel,

          estoque:
            resultadoEstoque.disponivel,

          vendas:
            resultadoVendas.disponivel
        },

        registros: {
          produtos:
            resultadoProdutos.disponivel
              ? resultadoProdutos.dados.length
              : 0,

          estoque:
            resultadoEstoque.disponivel
              ? resultadoEstoque.dados.length
              : 0,

          vendas:
            resultadoVendas.disponivel
              ? resultadoVendas.dados.length
              : 0
        }
      };

    } catch (erro) {

      console.error(
        "Erro ao salvar dados dos relatórios:",
        erro
      );

      throw {
        status: 500,
        mensagem:
          "Erro ao salvar dados dos relatórios"
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

  async sincronizarProdutosSemVendas(
    produtos
  ) {

    for (const produto of produtos) {

      await this.repository
        .salvarProdutoSemVendas({
          produtoId:
            produto.id,

          nome:
            produto.nome
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
            Number(item.produtoId) ===
            Number(produto.id)
          ) {
            quantidadeVendida +=
              Number(item.quantidade);
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

      return await this.repository
        .listarVendas();

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

      return await this.repository
        .listarProdutos();

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

      return await this.repository
        .listarEstoque();

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