package br.edu.unifor.farmacia.produto.service;

import br.edu.unifor.farmacia.produto.domain.Produto;
import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import br.edu.unifor.farmacia.produto.dto.ProdutoRequest;
import br.edu.unifor.farmacia.produto.dto.ProdutoResponse;
import br.edu.unifor.farmacia.produto.exception.RecursoNaoEncontradoException;
import br.edu.unifor.farmacia.produto.exception.RegraDeNegocioException;
import br.edu.unifor.farmacia.produto.mapper.ProdutoMapper;
import br.edu.unifor.farmacia.produto.repository.ProdutoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Teste unitario do caso de uso, sem banco e sem subir o Spring.
 *
 * So e possivel porque ProdutoServiceImpl depende da interface
 * ProdutoRepository, e nao do JPA direto (Inversao de Dependencia).
 */
@ExtendWith(MockitoExtension.class)
class ProdutoServiceImplTest {

    @Mock
    private ProdutoRepository repositorio;

    private ProdutoServiceImpl service;

    @BeforeEach
    void preparar() {
        service = new ProdutoServiceImpl(repositorio, new ProdutoMapper());
    }

    private ProdutoRequest dadosDipirona() {
        return new ProdutoRequest(
                "Dipirona 500mg",
                "Analgesico",
                new BigDecimal("8.50"),
                "7891234567890",
                TipoProduto.MEDICAMENTO
        );
    }

    private Produto dipirona() {
        return new Produto(
                "Dipirona 500mg",
                "Analgesico",
                new BigDecimal("8.50"),
                "7891234567890",
                TipoProduto.MEDICAMENTO
        );
    }

    @Test
    @DisplayName("cadastrar salva o produto e devolve o contrato de resposta")
    void deveCadastrarProduto() {
        when(repositorio.existsByCodigoBarras("7891234567890")).thenReturn(false);
        when(repositorio.save(any(Produto.class))).thenReturn(dipirona());

        ProdutoResponse resposta = service.cadastrar(dadosDipirona());

        assertEquals("Dipirona 500mg", resposta.nome());
        assertEquals(new BigDecimal("8.50"), resposta.preco());
        verify(repositorio).save(any(Produto.class));
    }

    @Test
    @DisplayName("nao cadastra produto com codigo de barras ja usado")
    void naoDeveCadastrarCodigoDuplicado() {
        when(repositorio.existsByCodigoBarras("7891234567890")).thenReturn(true);

        assertThrows(RegraDeNegocioException.class, () -> service.cadastrar(dadosDipirona()));

        verify(repositorio, never()).save(any(Produto.class));
    }

    @Test
    @DisplayName("buscar produto inexistente lanca RecursoNaoEncontradoException")
    void deveFalharAoBuscarInexistente() {
        when(repositorio.findByIdAndAtivoTrue(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.buscarPorId(99L));
    }

    @Test
    @DisplayName("excluir inativa o produto em vez de apagar do banco")
    void deveExcluirLogicamente() {
        Produto produto = dipirona();
        when(repositorio.findByIdAndAtivoTrue(1L)).thenReturn(Optional.of(produto));
        when(repositorio.save(any(Produto.class))).thenReturn(produto);

        service.excluir(1L);

        ArgumentCaptor<Produto> capturado = ArgumentCaptor.forClass(Produto.class);
        verify(repositorio).save(capturado.capture());
        assertFalse(capturado.getValue().isAtivo());
        verify(repositorio, never()).delete(any(Produto.class));
    }

    @Test
    @DisplayName("editar recusa codigo de barras que ja pertence a outro produto")
    void naoDeveEditarParaCodigoDeOutroProduto() {
        when(repositorio.findByIdAndAtivoTrue(1L)).thenReturn(Optional.of(dipirona()));
        when(repositorio.existsByCodigoBarrasAndIdNot("7891234567890", 1L)).thenReturn(true);

        assertThrows(RegraDeNegocioException.class, () -> service.editar(1L, dadosDipirona()));
    }

    @Test
    @DisplayName("listar sem filtro usa a consulta de todos os ativos")
    void deveListarTodosOsAtivos() {
        when(repositorio.findAllByAtivoTrueOrderByNomeAsc()).thenReturn(List.of(dipirona()));

        List<ProdutoResponse> resposta = service.listar(null, null);

        assertEquals(1, resposta.size());
        verify(repositorio).findAllByAtivoTrueOrderByNomeAsc();
    }

    @Test
    @DisplayName("listar com nome em branco nao cai no filtro por nome")
    void nomeEmBrancoNaoFiltra() {
        when(repositorio.findAllByAtivoTrueOrderByNomeAsc()).thenReturn(List.of());

        service.listar(null, "   ");

        verify(repositorio).findAllByAtivoTrueOrderByNomeAsc();
        verify(repositorio, never())
                .findAllByAtivoTrueAndNomeContainingIgnoreCaseOrderByNomeAsc(any());
    }
}
