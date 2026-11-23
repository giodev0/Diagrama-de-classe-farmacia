package br.edu.unifor.farmacia.produto.repository;

import br.edu.unifor.farmacia.produto.domain.Produto;
import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testa as consultas do repositorio contra um banco de verdade (H2).
 *
 * Consultas derivadas do nome do metodo so sao validadas quando o Spring Data
 * monta a query, ou seja, em tempo de execucao: um erro de digitacao em
 * "findAllByAtivoTrueAndNomeContainingIgnoreCase" compila e so quebra rodando.
 */
@DataJpaTest
@ActiveProfiles("test")
class ProdutoRepositoryTest {

    @Autowired
    private ProdutoRepository repositorio;

    private Produto dipirona;

    @BeforeEach
    void preparar() {
        repositorio.deleteAll();

        dipirona = repositorio.save(new Produto(
                "Dipirona 500mg", "Analgesico", new BigDecimal("8.50"),
                "7891111111111", TipoProduto.MEDICAMENTO));

        repositorio.save(new Produto(
                "Shampoo Anticaspa", "Uso diario", new BigDecimal("22.90"),
                "7892222222222", TipoProduto.HIGIENE_PESSOAL));

        Produto descontinuado = new Produto(
                "Xarope Antigo", "Fora de linha", new BigDecimal("15.00"),
                "7893333333333", TipoProduto.MEDICAMENTO);
        descontinuado.inativar();
        repositorio.save(descontinuado);
    }

    @Test
    @DisplayName("listar ativos ignora os produtos excluidos e ordena por nome")
    void deveListarSomenteAtivosOrdenados() {
        List<Produto> ativos = repositorio.findAllByAtivoTrueOrderByNomeAsc();

        assertEquals(2, ativos.size());
        assertEquals("Dipirona 500mg", ativos.get(0).getNome());
        assertEquals("Shampoo Anticaspa", ativos.get(1).getNome());
    }

    @Test
    @DisplayName("filtro por tipo nao traz produto excluido")
    void filtroPorTipoIgnoraExcluido() {
        List<Produto> medicamentos =
                repositorio.findAllByAtivoTrueAndTipoOrderByNomeAsc(TipoProduto.MEDICAMENTO);

        assertEquals(1, medicamentos.size());
        assertEquals("Dipirona 500mg", medicamentos.get(0).getNome());
    }

    @Test
    @DisplayName("busca por nome e parcial e ignora maiusculas")
    void buscaPorNomeIgnoraCaixa() {
        List<Produto> achados =
                repositorio.findAllByAtivoTrueAndNomeContainingIgnoreCaseOrderByNomeAsc("dipiro");

        assertEquals(1, achados.size());
        assertEquals(dipirona.getId(), achados.get(0).getId());
    }

    @Test
    @DisplayName("busca por id e por codigo de barras nao enxerga produto excluido")
    void consultasIgnoramExcluidos() {
        assertTrue(repositorio.findByCodigoBarrasAndAtivoTrue("7891111111111").isPresent());
        assertFalse(repositorio.findByCodigoBarrasAndAtivoTrue("7893333333333").isPresent());
    }

    @Test
    @DisplayName("codigo de barras continua ocupado depois da exclusao logica")
    void codigoDeBarrasDeExcluidoContinuaOcupado() {
        assertTrue(repositorio.existsByCodigoBarras("7893333333333"));
    }

    @Test
    @DisplayName("existsByCodigoBarrasAndIdNot ignora o proprio produto na edicao")
    void devePermitirManterOProprioCodigo() {
        assertFalse(repositorio.existsByCodigoBarrasAndIdNot("7891111111111", dipirona.getId()));
        assertTrue(repositorio.existsByCodigoBarrasAndIdNot("7892222222222", dipirona.getId()));
    }
}
