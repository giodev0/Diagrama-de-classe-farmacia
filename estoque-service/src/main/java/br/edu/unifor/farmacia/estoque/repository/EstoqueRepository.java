package br.edu.unifor.farmacia.estoque.repository;

import br.edu.unifor.farmacia.estoque.domain.Estoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * Abstracao de persistencia do estoque (SOLID - Inversao de Dependencia).
 */
public interface EstoqueRepository extends JpaRepository<Estoque, Long> {

    Optional<Estoque> findByProdutoId(Long produtoId);

    boolean existsByProdutoId(Long produtoId);

    List<Estoque> findAllByOrderByProdutoIdAsc();

    @Query("SELECT e FROM Estoque e WHERE e.quantidade <= e.estoqueMinimo ORDER BY e.produtoId")
    List<Estoque> buscarComEstoqueBaixo();
}
