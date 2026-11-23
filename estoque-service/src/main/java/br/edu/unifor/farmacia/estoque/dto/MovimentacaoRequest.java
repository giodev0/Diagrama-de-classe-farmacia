package br.edu.unifor.farmacia.estoque.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Corpo das operacoes de entrada e de saida de unidades. */
public record MovimentacaoRequest(

        @NotNull(message = "quantidade e obrigatoria")
        @Positive(message = "quantidade deve ser maior que zero")
        Integer quantidade,

        @Size(max = 255, message = "observacao deve ter no maximo 255 caracteres")
        String observacao
) {
}
