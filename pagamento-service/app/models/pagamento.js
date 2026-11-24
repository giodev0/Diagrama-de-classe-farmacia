class Pagamento {
  constructor({
    id = null,
    vendaId,
    valor,
    formaPagamento,
    status,
    data
  }) {
    this.id = id;
    this.vendaId = vendaId;
    this.valor = valor;
    this.formaPagamento = formaPagamento;
    this.status = status;
    this.data = data;
  }
}

module.exports = Pagamento;