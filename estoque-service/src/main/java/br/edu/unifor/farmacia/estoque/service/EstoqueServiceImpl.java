package br.edu.unifor.farmacia.estoque.service;

import br.edu.unifor.farmacia.estoque.client.ProdutoClient;
import br.edu.unifor.farmacia.estoque.domain.Estoque;
import br.edu.unifor.farmacia.estoque.domain.MovimentacaoEstoque;
import br.edu.unifor.farmacia.estoque.dto.DisponibilidadeResponse;
import br.edu.unifor.farmacia.estoque.dto.EstoqueMinimoRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueResponse;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoRequest;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoResponse;
import br.edu.unifor.farmacia.estoque.exception.RecursoNaoEncontradoException;
import br.edu.unifor.farmacia.estoque.exception.RegraDeNegocioException;
import br.edu.unifor.farmacia.estoque.mapper.EstoqueMapper;
import br.edu.unifor.farmacia.estoque.repository.EstoqueRepository;
import br.edu.unifor.farmacia.estoque.repository.MovimentacaoEstoqueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Caso de uso do estoque.
 *
 * GRASP (Low Coupling): depende de abstracoes (repositorios, mapper e
 * ProdutoClient) e nunca do banco de outro servico. Antes de criar um estoque,
 * confirma pela API de Produtos que o produtoId existe de verdade.
 */
@Service
public class EstoqueServiceImpl implements EstoqueService {

    private final EstoqueRepository repositorio;
    private final MovimentacaoEstoqueRepository movimentacoes;
    private final ProdutoClient produtoClient;
    private final EstoqueMapper mapper;

    public EstoqueServiceImpl(EstoqueRepository repositorio,
                              MovimentacaoEstoqueRepository movimentacoes,
                              ProdutoClient produtoClient,
                              EstoqueMapper mapper) {
        this.repositorio = repositorio;
        this.movimentacoes = movimentacoes;
        this.produtoClient = produtoClient;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public EstoqueResponse cadastrar(EstoqueRequest dados) {
        if (repositorio.existsByProdutoId(dados.produtoId())) {
            throw new RegraDeNegocioException(
                    "Ja existe estoque cadastrado para o produto " + dados.produtoId());
        }

        produtoClient.buscarPorId(dados.produtoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Produto " + dados.produtoId() + " nao encontrado no servico de Produtos"));

        Estoque estoque = repositorio.save(
                new Estoque(dados.produtoId(), dados.quantidade(), dados.estoqueMinimo()));

        if (estoque.getQuantidade() > 0) {
            movimentacoes.save(MovimentacaoEstoque.entrada(
                    estoque, estoque.getQuantidade(), "Carga inicial do estoque"));
        }

        return mapper.paraResposta(estoque);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstoqueResponse> listar() {
        return repositorio.findAllByOrderByProdutoIdAsc().stream()
                .map(mapper::paraResposta)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EstoqueResponse consultarPorProduto(Long produtoId) {
        return mapper.paraResposta(buscarPorProduto(produtoId));
    }

    @Override
    @Transactional(readOnly = true)
    public DisponibilidadeResponse verificarDisponibilidade(Long produtoId, int quantidade) {
        if (quantidade <= 0) {
            throw new RegraDeNegocioException("quantidade deve ser maior que zero");
        }

        Estoque estoque = buscarPorProduto(produtoId);

        return new DisponibilidadeResponse(
                produtoId,
                quantidade,
                estoque.getQuantidade(),
                estoque.temDisponivel(quantidade)
        );
    }

    @Override
    @Transactional
    public EstoqueResponse adicionarUnidades(Long produtoId, MovimentacaoRequest dados) {
        Estoque estoque = buscarPorProduto(produtoId);
        estoque.adicionar(dados.quantidade());

        repositorio.save(estoque);
        movimentacoes.save(MovimentacaoEstoque.entrada(estoque, dados.quantidade(), dados.observacao()));

        return mapper.paraResposta(estoque);
    }

    @Override
    @Transactional
    public EstoqueResponse retirarUnidades(Long produtoId, MovimentacaoRequest dados) {
        Estoque estoque = buscarPorProduto(produtoId);
        estoque.retirar(dados.quantidade());

        repositorio.save(estoque);
        movimentacoes.save(MovimentacaoEstoque.saida(estoque, dados.quantidade(), dados.observacao()));

        return mapper.paraResposta(estoque);
    }

    @Override
    @Transactional
    public EstoqueResponse atualizarEstoqueMinimo(Long produtoId, EstoqueMinimoRequest dados) {
        Estoque estoque = buscarPorProduto(produtoId);
        estoque.definirEstoqueMinimo(dados.estoqueMinimo());
        return mapper.paraResposta(repositorio.save(estoque));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstoqueResponse> listarEstoqueBaixo() {
        return repositorio.buscarComEstoqueBaixo().stream()
                .map(mapper::paraResposta)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listarMovimentacoes(Long produtoId) {
        buscarPorProduto(produtoId);
        return movimentacoes.findAllByProdutoIdOrderByDataDesc(produtoId).stream()
                .map(mapper::paraResposta)
                .toList();
    }

    private Estoque buscarPorProduto(Long produtoId) {
        return repositorio.findByProdutoId(produtoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Estoque nao encontrado para o produto " + produtoId));
    }
}
