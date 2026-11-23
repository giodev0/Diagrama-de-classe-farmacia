package br.edu.unifor.farmacia.estoque.dto;

import br.edu.unifor.farmacia.estoque.domain.TipoMovimentacao;

import java.time.LocalDateTime;

/** Item do historico de movimentacoes de um produto. */
public record MovimentacaoResponse(
        Long id,
        Long produtoId,
        TipoMovimentacao tipo,
        Integer quantidade,
        Integer quantidadeResultante,
        String observacao,
        LocalDateTime data
) {
}
