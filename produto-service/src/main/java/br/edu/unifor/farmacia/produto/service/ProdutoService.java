package br.edu.unifor.farmacia.produto.service;

import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import br.edu.unifor.farmacia.produto.dto.ProdutoRequest;
import br.edu.unifor.farmacia.produto.dto.ProdutoResponse;

import java.util.List;

/**
 * Contrato do caso de uso de produtos.
 * O controller depende desta interface e nao da implementacao
 * (SOLID - Inversao de Dependencia e Aberto/Fechado).
 */
public interface ProdutoService {

    ProdutoResponse cadastrar(ProdutoRequest dados);

    List<ProdutoResponse> listar(TipoProduto tipo, String nome);

    ProdutoResponse buscarPorId(Long id);

    ProdutoResponse buscarPorCodigoBarras(String codigoBarras);

    ProdutoResponse editar(Long id, ProdutoRequest dados);

    void excluir(Long id);
}
