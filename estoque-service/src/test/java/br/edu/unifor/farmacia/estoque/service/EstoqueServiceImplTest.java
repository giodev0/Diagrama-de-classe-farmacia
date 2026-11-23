package br.edu.unifor.farmacia.estoque.service;

import br.edu.unifor.farmacia.estoque.client.ProdutoClient;
import br.edu.unifor.farmacia.estoque.client.ProdutoResumo;
import br.edu.unifor.farmacia.estoque.domain.Estoque;
import br.edu.unifor.farmacia.estoque.domain.MovimentacaoEstoque;
import br.edu.unifor.farmacia.estoque.domain.TipoMovimentacao;
import br.edu.unifor.farmacia.estoque.dto.DisponibilidadeResponse;
import br.edu.unifor.farmacia.estoque.dto.EstoqueRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueResponse;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoRequest;
import br.edu.unifor.farmacia.estoque.exception.EstoqueInsuficienteException;
import br.edu.unifor.farmacia.estoque.exception.RecursoNaoEncontradoException;
import br.edu.unifor.farmacia.estoque.exception.RegraDeNegocioException;
import br.edu.unifor.farmacia.estoque.mapper.EstoqueMapper;
import br.edu.unifor.farmacia.estoque.repository.EstoqueRepository;
import br.edu.unifor.farmacia.estoque.repository.MovimentacaoEstoqueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Teste unitario do caso de uso de estoque, sem banco e sem HTTP.
 *
 * O ProdutoClient e uma implementacao falsa escrita a mao: como o service
 * depende da interface, e nao do RestClient (Inversao de Dependencia), da
 * para simular "produto existe" e "produto nao existe" em uma linha.
 */
@ExtendWith(MockitoExtension.class)
class EstoqueServiceImplTest {

    private static final Long PRODUTO_EXISTENTE = 15L;

    @Mock
    private EstoqueRepository repositorio;

    @Mock
    private MovimentacaoEstoqueRepository movimentacoes;

    private EstoqueServiceImpl service;

    /** Responde como o produto-service responderia: so o produto 15 existe. */
    private final ProdutoClient produtoClient = produtoId ->
            PRODUTO_EXISTENTE.equals(produtoId)
                    ? Optional.of(new ProdutoResumo(PRODUTO_EXISTENTE, "Dipirona", new BigDecimal("8.50")))
                    : Optional.empty();

    @BeforeEach
    void preparar() {
        service = new EstoqueServiceImpl(repositorio, movimentacoes, produtoClient, new EstoqueMapper());
    }

    @Test
    @DisplayName("cadastrar valida o produto no produto-service e registra a carga inicial")
    void deveCadastrarEstoque() {
        when(repositorio.existsByProdutoId(PRODUTO_EXISTENTE)).thenReturn(false);
        when(repositorio.save(any(Estoque.class)))
                .thenAnswer(chamada -> chamada.getArgument(0));

        EstoqueResponse resposta = service.cadastrar(new EstoqueRequest(PRODUTO_EXISTENTE, 10, 3));

        assertEquals(10, resposta.quantidade());
        assertFalse(resposta.estoqueBaixo());

        ArgumentCaptor<MovimentacaoEstoque> captor =
                ArgumentCaptor.forClass(MovimentacaoEstoque.class);
        verify(movimentacoes).save(captor.capture());
        assertEquals(TipoMovimentacao.ENTRADA, captor.getValue().getTipo());
        assertEquals(10, captor.getValue().getQuantidade());
    }

    @Test
    @DisplayName("nao cadastra estoque de produto que nao existe no produto-service")
    void naoDeveCadastrarProdutoInexistente() {
        when(repositorio.existsByProdutoId(404L)).thenReturn(false);

        assertThrows(RecursoNaoEncontradoException.class,
                () -> service.cadastrar(new EstoqueRequest(404L, 5, 1)));

        verify(repositorio, never()).save(any(Estoque.class));
    }

    @Test
    @DisplayName("nao cadastra estoque duplicado e nem chama o produto-service a toa")
    void naoDeveCadastrarEstoqueDuplicado() {
        when(repositorio.existsByProdutoId(PRODUTO_EXISTENTE)).thenReturn(true);

        assertThrows(RegraDeNegocioException.class,
                () -> service.cadastrar(new EstoqueRequest(PRODUTO_EXISTENTE, 10, 3)));

        verify(repositorio, never()).save(any(Estoque.class));
    }

    @Test
    @DisplayName("cadastrar com quantidade zero nao gera movimentacao de carga inicial")
    void cadastroZeradoNaoGeraMovimentacao() {
        when(repositorio.existsByProdutoId(PRODUTO_EXISTENTE)).thenReturn(false);
        when(repositorio.save(any(Estoque.class))).thenAnswer(c -> c.getArgument(0));

        service.cadastrar(new EstoqueRequest(PRODUTO_EXISTENTE, 0, 3));

        verify(movimentacoes, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("saida registra movimentacao e baixa a quantidade")
    void deveRegistrarSaida() {
        Estoque estoque = new Estoque(PRODUTO_EXISTENTE, 10, 3);
        when(repositorio.findByProdutoId(PRODUTO_EXISTENTE)).thenReturn(Optional.of(estoque));
        when(repositorio.save(any(Estoque.class))).thenAnswer(c -> c.getArgument(0));

        EstoqueResponse resposta =
                service.retirarUnidades(PRODUTO_EXISTENTE, new MovimentacaoRequest(4, "Venda 1042"));

        assertEquals(6, resposta.quantidade());

        ArgumentCaptor<MovimentacaoEstoque> captor =
                ArgumentCaptor.forClass(MovimentacaoEstoque.class);
        verify(movimentacoes).save(captor.capture());
        assertEquals(TipoMovimentacao.SAIDA, captor.getValue().getTipo());
        assertEquals(6, captor.getValue().getQuantidadeResultante());
        assertEquals("Venda 1042", captor.getValue().getObservacao());
    }

    @Test
    @DisplayName("saida sem saldo nao salva nada")
    void saidaSemSaldoNaoPersiste() {
        Estoque estoque = new Estoque(PRODUTO_EXISTENTE, 2, 1);
        when(repositorio.findByProdutoId(PRODUTO_EXISTENTE)).thenReturn(Optional.of(estoque));

        assertThrows(EstoqueInsuficienteException.class,
                () -> service.retirarUnidades(PRODUTO_EXISTENTE, new MovimentacaoRequest(5, null)));

        verify(repositorio, never()).save(any(Estoque.class));
        verify(movimentacoes, never()).save(any(MovimentacaoEstoque.class));
        assertEquals(2, estoque.getQuantidade());
    }

    @Test
    @DisplayName("disponibilidade responde sem alterar o estoque")
    void deveVerificarDisponibilidade() {
        Estoque estoque = new Estoque(PRODUTO_EXISTENTE, 10, 3);
        when(repositorio.findByProdutoId(PRODUTO_EXISTENTE)).thenReturn(Optional.of(estoque));

        DisponibilidadeResponse resposta = service.verificarDisponibilidade(PRODUTO_EXISTENTE, 4);

        assertTrue(resposta.disponivel());
        assertEquals(10, resposta.quantidadeDisponivel());
        assertEquals(4, resposta.quantidadeSolicitada());
        assertEquals(10, estoque.getQuantidade());
        verify(repositorio, never()).save(any(Estoque.class));
    }

    @Test
    @DisplayName("disponibilidade com quantidade invalida e erro de requisicao")
    void disponibilidadeComQuantidadeInvalida() {
        assertThrows(RegraDeNegocioException.class,
                () -> service.verificarDisponibilidade(PRODUTO_EXISTENTE, 0));
    }

    @Test
    @DisplayName("consultar estoque inexistente lanca RecursoNaoEncontradoException")
    void deveFalharSemEstoqueCadastrado() {
        when(repositorio.findByProdutoId(777L)).thenReturn(Optional.empty());

        assertThrows(RecursoNaoEncontradoException.class, () -> service.consultarPorProduto(777L));
    }
}
