package br.edu.unifor.farmacia.estoque.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** Atualizacao do nivel minimo de estoque de um produto. */
public record EstoqueMinimoRequest(

        @NotNull(message = "estoqueMinimo e obrigatorio")
        @PositiveOrZero(message = "estoqueMinimo nao pode ser negativo")
        Integer estoqueMinimo
) {
}
