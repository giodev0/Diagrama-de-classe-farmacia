class RelatorioVenda {
  constructor({
    id = null,
    vendaId,
    valorTotal,
    data
  }) {
    this.id = id;
    this.vendaId = vendaId;
    this.valorTotal = valorTotal;
    this.data = data;
  }
}

module.exports = RelatorioVenda;