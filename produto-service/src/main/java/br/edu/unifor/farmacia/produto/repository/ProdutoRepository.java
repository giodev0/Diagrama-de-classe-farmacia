package br.edu.unifor.farmacia.produto.repository;

import br.edu.unifor.farmacia.produto.domain.Produto;
import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Abstracao de persistencia. O service depende desta interface e nao de JPA
 * diretamente (SOLID - Inversao de Dependencia).
 */
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    Optional<Produto> findByIdAndAtivoTrue(Long id);

    Optional<Produto> findByCodigoBarrasAndAtivoTrue(String codigoBarras);

    boolean existsByCodigoBarras(String codigoBarras);

    boolean existsByCodigoBarrasAndIdNot(String codigoBarras, Long id);

    List<Produto> findAllByAtivoTrueOrderByNomeAsc();

    List<Produto> findAllByAtivoTrueAndTipoOrderByNomeAsc(TipoProduto tipo);

    List<Produto> findAllByAtivoTrueAndNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}
