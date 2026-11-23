package br.edu.unifor.farmacia.produto.service;

import br.edu.unifor.farmacia.produto.domain.Produto;
import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import br.edu.unifor.farmacia.produto.dto.ProdutoRequest;
import br.edu.unifor.farmacia.produto.dto.ProdutoResponse;
import br.edu.unifor.farmacia.produto.exception.RecursoNaoEncontradoException;
import br.edu.unifor.farmacia.produto.exception.RegraDeNegocioException;
import br.edu.unifor.farmacia.produto.mapper.ProdutoMapper;
import br.edu.unifor.farmacia.produto.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * GRASP (Controlador de caso de uso): coordena repositorio, mapper e entidade.
 * Recebe as dependencias pelo construtor (baixo acoplamento / injecao de dependencia).
 */
@Service
public class ProdutoServiceImpl implements ProdutoService {

    private final ProdutoRepository repositorio;
    private final ProdutoMapper mapper;

    public ProdutoServiceImpl(ProdutoRepository repositorio, ProdutoMapper mapper) {
        this.repositorio = repositorio;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public ProdutoResponse cadastrar(ProdutoRequest dados) {
        // A unicidade vale tambem para produtos ja excluidos: a exclusao e logica,
        // entao o codigo de barras continua ocupado na tabela.
        if (repositorio.existsByCodigoBarras(dados.codigoBarras())) {
            throw new RegraDeNegocioException(
                    "O codigo de barras " + dados.codigoBarras()
                            + " ja pertence a um produto cadastrado (ativo ou excluido)");
        }
        Produto produto = repositorio.save(mapper.paraEntidade(dados));
        return mapper.paraResposta(produto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar(TipoProduto tipo, String nome) {
        List<Produto> produtos;
        if (tipo != null) {
            produtos = repositorio.findAllByAtivoTrueAndTipoOrderByNomeAsc(tipo);
        } else if (nome != null && !nome.isBlank()) {
            produtos = repositorio.findAllByAtivoTrueAndNomeContainingIgnoreCaseOrderByNomeAsc(nome.trim());
        } else {
            produtos = repositorio.findAllByAtivoTrueOrderByNomeAsc();
        }
        return produtos.stream().map(mapper::paraResposta).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProdutoResponse buscarPorId(Long id) {
        return mapper.paraResposta(buscarAtivo(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ProdutoResponse buscarPorCodigoBarras(String codigoBarras) {
        Produto produto = repositorio.findByCodigoBarrasAndAtivoTrue(codigoBarras)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Produto nao encontrado para o codigo de barras " + codigoBarras));
        return mapper.paraResposta(produto);
    }

    @Override
    @Transactional
    public ProdutoResponse editar(Long id, ProdutoRequest dados) {
        Produto produto = buscarAtivo(id);

        if (repositorio.existsByCodigoBarrasAndIdNot(dados.codigoBarras(), id)) {
            throw new RegraDeNegocioException("Ja existe outro produto com o codigo de barras informado");
        }

        produto.atualizarDados(
                dados.nome(),
                dados.descricao(),
                dados.preco(),
                dados.codigoBarras(),
                dados.tipo()
        );
        return mapper.paraResposta(repositorio.save(produto));
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        Produto produto = buscarAtivo(id);
        produto.inativar();
        repositorio.save(produto);
    }

    private Produto buscarAtivo(Long id) {
        return repositorio.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Produto nao encontrado para o id " + id));
    }
}
