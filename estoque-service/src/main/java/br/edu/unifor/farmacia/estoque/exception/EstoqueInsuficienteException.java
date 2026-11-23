package br.edu.unifor.farmacia.estoque.exception;

/**
 * Lancada quando a venda pede mais unidades do que existem no estoque.
 * E um caso especifico de regra de negocio, por isso vira HTTP 400.
 */
public class EstoqueInsuficienteException extends RegraDeNegocioException {

    private final Long produtoId;
    private final int quantidadeDisponivel;
    private final int quantidadeSolicitada;

    public EstoqueInsuficienteException(Long produtoId, int quantidadeDisponivel, int quantidadeSolicitada) {
        super("Estoque insuficiente para o produto " + produtoId
                + ": disponivel " + quantidadeDisponivel
                + ", solicitado " + quantidadeSolicitada);
        this.produtoId = produtoId;
        this.quantidadeDisponivel = quantidadeDisponivel;
        this.quantidadeSolicitada = quantidadeSolicitada;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public int getQuantidadeDisponivel() {
        return quantidadeDisponivel;
    }

    public int getQuantidadeSolicitada() {
        return quantidadeSolicitada;
    }
}
