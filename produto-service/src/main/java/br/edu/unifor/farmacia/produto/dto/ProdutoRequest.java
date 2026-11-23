package br.edu.unifor.farmacia.produto.dto;

import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Dados de entrada de cadastro/edicao de produto.
 * Separado da entidade para que a API nao exponha o modelo de persistencia (SRP).
 */
public record ProdutoRequest(

        @NotBlank(message = "nome e obrigatorio")
        @Size(min = 2, max = 120, message = "nome deve ter entre 2 e 120 caracteres")
        String nome,

        @Size(max = 255, message = "descricao deve ter no maximo 255 caracteres")
        String descricao,

        @NotNull(message = "preco e obrigatorio")
        @DecimalMin(value = "0.01", message = "preco deve ser maior que zero")
        @Digits(integer = 8, fraction = 2, message = "preco deve ter no maximo 2 casas decimais")
        BigDecimal preco,

        @NotBlank(message = "codigoBarras e obrigatorio")
        @Size(min = 8, max = 50, message = "codigoBarras deve ter entre 8 e 50 caracteres")
        String codigoBarras,

        @NotNull(message = "tipo e obrigatorio")
        TipoProduto tipo
) {
}
