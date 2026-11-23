package br.edu.unifor.farmacia.estoque.repository;

import br.edu.unifor.farmacia.estoque.domain.MovimentacaoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Historico de entradas e saidas, consultado tambem pelo servico de Relatorios. */
public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    List<MovimentacaoEstoque> findAllByProdutoIdOrderByDataDesc(Long produtoId);
}
