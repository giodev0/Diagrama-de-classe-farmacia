package br.edu.unifor.farmacia.produto.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProdutoTest {

    private Produto dipirona() {
        return new Produto(
                "Dipirona 500mg",
                "Analgesico e antitermico",
                new BigDecimal("8.50"),
                "7891234567890",
                TipoProduto.MEDICAMENTO
        );
    }

    @Test
    @DisplayName("produto novo nasce ativo e com o preco informado")
    void deveCriarProdutoAtivo() {
        Produto produto = dipirona();

        assertTrue(produto.isAtivo());
        assertEquals(new BigDecimal("8.50"), produto.getPreco());
    }

    @Test
    @DisplayName("nao aceita preco zero ou negativo")
    void naoDeveAceitarPrecoInvalido() {
        Produto produto = dipirona();

        assertThrows(IllegalArgumentException.class, () -> produto.definirPreco(BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class, () -> produto.definirPreco(new BigDecimal("-1.00")));
        assertThrows(IllegalArgumentException.class, () -> produto.definirPreco(null));
    }

    @Test
    @DisplayName("inativar marca o produto como excluido logicamente")
    void deveInativarProduto() {
        Produto produto = dipirona();

        produto.inativar();

        assertFalse(produto.isAtivo());
    }

    @Test
    @DisplayName("atualizarDados troca os campos e revalida o preco")
    void deveAtualizarDados() {
        Produto produto = dipirona();

        produto.atualizarDados(
                "Dipirona 1g",
                "Analgesico",
                new BigDecimal("12.00"),
                "7890000000001",
                TipoProduto.GENERICO
        );

        assertEquals("Dipirona 1g", produto.getNome());
        assertEquals(new BigDecimal("12.00"), produto.getPreco());
        assertEquals(TipoProduto.GENERICO, produto.getTipo());
    }
}
