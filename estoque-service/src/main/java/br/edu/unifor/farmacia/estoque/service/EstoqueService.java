package br.edu.unifor.farmacia.estoque.service;

import br.edu.unifor.farmacia.estoque.dto.DisponibilidadeResponse;
import br.edu.unifor.farmacia.estoque.dto.EstoqueMinimoRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueResponse;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoRequest;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoResponse;

import java.util.List;

/**
 * Contrato do caso de uso de estoque.
 * O controller depende desta interface (SOLID - Inversao de Dependencia).
 */
public interface EstoqueService {

    EstoqueResponse cadastrar(EstoqueRequest dados);

    List<EstoqueResponse> listar();

    EstoqueResponse consultarPorProduto(Long produtoId);

    DisponibilidadeResponse verificarDisponibilidade(Long produtoId, int quantidade);

    EstoqueResponse adicionarUnidades(Long produtoId, MovimentacaoRequest dados);

    EstoqueResponse retirarUnidades(Long produtoId, MovimentacaoRequest dados);

    EstoqueResponse atualizarEstoqueMinimo(Long produtoId, EstoqueMinimoRequest dados);

    List<EstoqueResponse> listarEstoqueBaixo();

    List<MovimentacaoResponse> listarMovimentacoes(Long produtoId);
}
