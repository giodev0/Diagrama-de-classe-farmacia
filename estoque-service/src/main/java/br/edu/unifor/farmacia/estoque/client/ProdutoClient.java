package br.edu.unifor.farmacia.estoque.client;

import java.util.Optional;

/**
 * Porta de saida para o servico de Produtos (papel de consumidor do estoque).
 *
 * SOLID (Inversao de Dependencia): o service depende desta interface, nao do
 * RestClient. Em teste da para trocar por uma implementacao em memoria.
 */
public interface ProdutoClient {

    Optional<ProdutoResumo> buscarPorId(Long produtoId);
}
