class RelatorioProduto {
  constructor({
    id = null,
    produtoId,
    nome,
    quantidadeVendida
  }) {
    this.id = id;
    this.produtoId = produtoId;
    this.nome = nome;
    this.quantidadeVendida = quantidadeVendida;
  }
}

module.exports = RelatorioProduto;