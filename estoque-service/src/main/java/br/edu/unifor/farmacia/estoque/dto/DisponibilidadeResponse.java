package br.edu.unifor.farmacia.estoque.dto;

/**
 * Resposta usada pelo servico de Vendas antes de fechar a venda:
 * GET /estoques/{produtoId}/disponibilidade?quantidade=2
 */
public record DisponibilidadeResponse(
        Long produtoId,
        Integer quantidadeSolicitada,
        Integer quantidadeDisponivel,
        boolean disponivel
) {
}
