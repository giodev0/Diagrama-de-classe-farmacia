package br.edu.unifor.farmacia.estoque.domain;

import br.edu.unifor.farmacia.estoque.exception.EstoqueInsuficienteException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EstoqueTest {

    @Test
    @DisplayName("adicionar soma unidades ao estoque")
    void deveAdicionarUnidades() {
        Estoque estoque = new Estoque(1L, 10, 5);

        estoque.adicionar(5);

        assertEquals(15, estoque.getQuantidade());
    }

    @Test
    @DisplayName("retirar subtrai unidades quando ha saldo")
    void deveRetirarUnidades() {
        Estoque estoque = new Estoque(1L, 10, 5);

        estoque.retirar(4);

        assertEquals(6, estoque.getQuantidade());
    }

    @Test
    @DisplayName("nao permite retirar mais do que existe")
    void naoDeveRetirarAlemDoSaldo() {
        Estoque estoque = new Estoque(1L, 3, 1);

        EstoqueInsuficienteException erro =
                assertThrows(EstoqueInsuficienteException.class, () -> estoque.retirar(4));

        assertEquals(3, erro.getQuantidadeDisponivel());
        assertEquals(4, erro.getQuantidadeSolicitada());
        assertEquals(3, estoque.getQuantidade());
    }

    @Test
    @DisplayName("movimentacao precisa ser maior que zero")
    void naoDeveAceitarMovimentacaoInvalida() {
        Estoque estoque = new Estoque(1L, 10, 5);

        assertThrows(IllegalArgumentException.class, () -> estoque.adicionar(0));
        assertThrows(IllegalArgumentException.class, () -> estoque.retirar(-2));
    }

    @Test
    @DisplayName("estoque baixo quando a quantidade chega ao minimo")
    void deveSinalizarEstoqueBaixo() {
        Estoque estoque = new Estoque(1L, 6, 5);

        assertFalse(estoque.isEstoqueBaixo());

        estoque.retirar(1);

        assertTrue(estoque.isEstoqueBaixo());
    }

    @Test
    @DisplayName("nao aceita quantidade inicial negativa nem produtoId nulo")
    void naoDeveCriarEstoqueInvalido() {
        assertThrows(IllegalArgumentException.class, () -> new Estoque(null, 10, 5));
        assertThrows(IllegalArgumentException.class, () -> new Estoque(1L, -1, 5));
        assertThrows(IllegalArgumentException.class, () -> new Estoque(1L, 10, -5));
    }
}
