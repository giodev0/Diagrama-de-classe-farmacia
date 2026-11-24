const FORMAS_PAGAMENTO = [
  "PIX",
  "CARTAO",
  "DINHEIRO"
];

function validarCriacaoPagamento(dados) {

  const {
    vendaId,
    valor,
    formaPagamento
  } = dados;

  if (
    vendaId === undefined ||
    valor === undefined ||
    !formaPagamento
  ) {
    return {
      valido: false,
      mensagem:
        "vendaId, valor e formaPagamento são obrigatórios"
    };
  }

  if (
    !Number.isInteger(vendaId) ||
    vendaId <= 0
  ) {
    return {
      valido: false,
      mensagem:
        "vendaId deve ser um número inteiro maior que zero"
    };
  }

  if (
    typeof valor !== "number" ||
    valor <= 0
  ) {
    return {
      valido: false,
      mensagem:
        "O valor do pagamento deve ser maior que zero"
    };
  }

  if (
    !FORMAS_PAGAMENTO.includes(
      formaPagamento
    )
  ) {
    return {
      valido: false,
      mensagem:
        "Forma de pagamento inválida"
    };
  }

  return {
    valido: true
  };
}

module.exports = {
  validarCriacaoPagamento,
  FORMAS_PAGAMENTO
};