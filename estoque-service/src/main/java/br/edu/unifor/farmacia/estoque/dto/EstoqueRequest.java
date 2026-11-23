package br.edu.unifor.farmacia.estoque.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** Criacao do registro de estoque de um produto que ja existe no produto-service. */
public record EstoqueRequest(

        @NotNull(message = "produtoId e obrigatorio")
        Long produtoId,

        @NotNull(message = "quantidade e obrigatoria")
        @PositiveOrZero(message = "quantidade nao pode ser negativa")
        Integer quantidade,

        @NotNull(message = "estoqueMinimo e obrigatorio")
        @PositiveOrZero(message = "estoqueMinimo nao pode ser negativo")
        Integer estoqueMinimo
) {
}
