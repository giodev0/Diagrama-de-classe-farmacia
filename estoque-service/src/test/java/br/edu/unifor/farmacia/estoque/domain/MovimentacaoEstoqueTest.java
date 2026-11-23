package br.edu.unifor.farmacia.estoque.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class MovimentacaoEstoqueTest {

    @Test
    @DisplayName("entrada guarda a quantidade resultante depois da movimentacao")
    void entradaGuardaSaldoResultante() {
        Estoque estoque = new Estoque(15L, 10, 3);
        estoque.adicionar(5);

        MovimentacaoEstoque movimentacao =
                MovimentacaoEstoque.entrada(estoque, 5, "Reposicao");

        assertEquals(TipoMovimentacao.ENTRADA, movimentacao.getTipo());
        assertEquals(15L, movimentacao.getProdutoId());
        assertEquals(5, movimentacao.getQuantidade());
        assertEquals(15, movimentacao.getQuantidadeResultante());
        assertEquals("Reposicao", movimentacao.getObservacao());
        assertNotNull(movimentacao.getData());
    }

    @Test
    @DisplayName("saida guarda a quantidade resultante depois da movimentacao")
    void saidaGuardaSaldoResultante() {
        Estoque estoque = new Estoque(15L, 10, 3);
        estoque.retirar(4);

        MovimentacaoEstoque movimentacao =
                MovimentacaoEstoque.saida(estoque, 4, "Venda 1042");

        assertEquals(TipoMovimentacao.SAIDA, movimentacao.getTipo());
        assertEquals(4, movimentacao.getQuantidade());
        assertEquals(6, movimentacao.getQuantidadeResultante());
    }

    @Test
    @DisplayName("observacao e opcional")
    void observacaoPodeSerNula() {
        Estoque estoque = new Estoque(15L, 10, 3);

        MovimentacaoEstoque movimentacao = MovimentacaoEstoque.entrada(estoque, 1, null);

        assertNull(movimentacao.getObservacao());
    }
}
