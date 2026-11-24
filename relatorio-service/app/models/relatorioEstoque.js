class RelatorioEstoque {
  constructor({
    id = null,
    produtoId,
    quantidade,
    estoqueMinimo
  }) {
    this.id = id;
    this.produtoId = produtoId;
    this.quantidade = quantidade;
    this.estoqueMinimo = estoqueMinimo;
  }
}

module.exports = RelatorioEstoque;