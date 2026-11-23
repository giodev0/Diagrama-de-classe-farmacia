package br.edu.unifor.farmacia.estoque.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * Projecao do produto usada pelo estoque.
 *
 * Lemos apenas os campos de que precisamos; os demais sao ignorados para que
 * o servico de Produtos possa evoluir seu JSON sem quebrar este servico.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProdutoResumo(Long id, String nome, BigDecimal preco) {
}
