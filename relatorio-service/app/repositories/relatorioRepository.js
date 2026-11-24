const db = require("../core/database");

class RelatorioRepository {

  salvarVenda(venda) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO vendas_relatorio
        (vendaId, valorTotal, data)
        VALUES (?, ?, ?)
        ON CONFLICT(vendaId)
        DO UPDATE SET
          valorTotal = excluded.valorTotal,
          data = excluded.data
        `,
        [
          venda.vendaId,
          venda.valorTotal,
          venda.data
        ],
        (erro) => {
          if (erro) {
            return reject(erro);
          }

          resolve();
        }
      );
    });
  }

  salvarProduto(produto) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO produtos_relatorio
        (produtoId, nome, quantidadeVendida)
        VALUES (?, ?, ?)
        ON CONFLICT(produtoId)
        DO UPDATE SET
          nome = excluded.nome,
          quantidadeVendida = excluded.quantidadeVendida
        `,
        [
          produto.produtoId,
          produto.nome,
          produto.quantidadeVendida
        ],
        (erro) => {
          if (erro) {
            return reject(erro);
          }

          resolve();
        }
      );
    });
  }

  salvarEstoque(estoque) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO estoque_relatorio
        (produtoId, quantidade, estoqueMinimo)
        VALUES (?, ?, ?)
        ON CONFLICT(produtoId)
        DO UPDATE SET
          quantidade = excluded.quantidade,
          estoqueMinimo = excluded.estoqueMinimo
        `,
        [
          estoque.produtoId,
          estoque.quantidade,
          estoque.estoqueMinimo
        ],
        (erro) => {
          if (erro) {
            return reject(erro);
          }

          resolve();
        }
      );
    });
  }

  listarVendas() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT *
        FROM vendas_relatorio
        ORDER BY data DESC
        `,
        [],
        (erro, vendas) => {
          if (erro) {
            return reject(erro);
          }

          resolve(vendas);
        }
      );
    });
  }

  listarProdutos() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT *
        FROM produtos_relatorio
        ORDER BY quantidadeVendida DESC
        `,
        [],
        (erro, produtos) => {
          if (erro) {
            return reject(erro);
          }

          resolve(produtos);
        }
      );
    });
  }

  listarEstoque() {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT *
        FROM estoque_relatorio
        ORDER BY quantidade ASC
        `,
        [],
        (erro, estoque) => {
          if (erro) {
            return reject(erro);
          }

          resolve(estoque);
        }
      );
    });
  }
}

module.exports = RelatorioRepository;