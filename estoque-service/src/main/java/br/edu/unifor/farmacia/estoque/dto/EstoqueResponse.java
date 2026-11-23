package br.edu.unifor.farmacia.estoque.dto;

import java.time.LocalDateTime;

/**
 * Contrato de saida do estoque.
 * Nao repete nome, preco nem descricao: esses dados sao do servico de Produtos.
 */
public record EstoqueResponse(
        Long id,
        Long produtoId,
        Integer quantidade,
        Integer estoqueMinimo,
        boolean estoqueBaixo,
        LocalDateTime atualizadoEm
) {
}
