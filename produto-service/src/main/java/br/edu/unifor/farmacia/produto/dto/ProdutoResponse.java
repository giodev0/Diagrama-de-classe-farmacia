package br.edu.unifor.farmacia.produto.dto;

import br.edu.unifor.farmacia.produto.domain.TipoProduto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Contrato de saida da API de produtos (JSON em camelCase).
 * E o formato que os servicos de Vendas e Relatorios consomem.
 */
public record ProdutoResponse(
        Long id,
        String nome,
        String descricao,
        BigDecimal preco,
        String codigoBarras,
        TipoProduto tipo,
        boolean ativo,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
