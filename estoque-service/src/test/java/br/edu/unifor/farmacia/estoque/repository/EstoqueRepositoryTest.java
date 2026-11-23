package br.edu.unifor.farmacia.estoque.repository;

import br.edu.unifor.farmacia.estoque.domain.Estoque;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testa as consultas do repositorio contra um banco de verdade (H2),
 * em especial a JPQL de estoque baixo, que compara duas colunas e nao
 * teria como ser validada sem executar.
 */
@DataJpaTest
@ActiveProfiles("test")
class EstoqueRepositoryTest {

    @Autowired
    private EstoqueRepository repositorio;

    @BeforeEach
    void preparar() {
        repositorio.deleteAll();

        repositorio.save(new Estoque(10L, 50, 5));   // confortavel
        repositorio.save(new Estoque(20L, 5, 5));    // exatamente no minimo
        repositorio.save(new Estoque(30L, 2, 10));   // abaixo do minimo
        repositorio.save(new Estoque(40L, 0, 0));    // zerado, minimo zero
    }

    @Test
    @DisplayName("estoque baixo inclui quem esta no minimo e quem esta abaixo")
    void deveListarEstoqueBaixo() {
        List<Long> baixos = repositorio.buscarComEstoqueBaixo().stream()
                .map(Estoque::getProdutoId)
                .toList();

        assertEquals(List.of(20L, 30L, 40L), baixos);
        assertFalse(baixos.contains(10L));
    }

    @Test
    @DisplayName("busca por produtoId encontra o estoque certo")
    void deveBuscarPorProdutoId() {
        assertTrue(repositorio.findByProdutoId(30L).isPresent());
        assertEquals(2, repositorio.findByProdutoId(30L).get().getQuantidade());
        assertTrue(repositorio.findByProdutoId(999L).isEmpty());
    }

    @Test
    @DisplayName("existsByProdutoId impede cadastro duplicado")
    void deveDetectarEstoqueJaCadastrado() {
        assertTrue(repositorio.existsByProdutoId(10L));
        assertFalse(repositorio.existsByProdutoId(999L));
    }

    @Test
    @DisplayName("listagem vem ordenada por produtoId")
    void deveListarOrdenado() {
        List<Long> ids = repositorio.findAllByOrderByProdutoIdAsc().stream()
                .map(Estoque::getProdutoId)
                .toList();

        assertEquals(List.of(10L, 20L, 30L, 40L), ids);
    }
}
