package br.edu.unifor.farmacia.estoque.mapper;

import br.edu.unifor.farmacia.estoque.domain.Estoque;
import br.edu.unifor.farmacia.estoque.domain.MovimentacaoEstoque;
import br.edu.unifor.farmacia.estoque.dto.EstoqueResponse;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoResponse;
import org.springframework.stereotype.Component;

/**
 * GRASP (Pure Fabrication): conversao entidade -> DTO isolada do caso de uso.
 */
@Component
public class EstoqueMapper {

    public EstoqueResponse paraResposta(Estoque estoque) {
        return new EstoqueResponse(
                estoque.getId(),
                estoque.getProdutoId(),
                estoque.getQuantidade(),
                estoque.getEstoqueMinimo(),
                estoque.isEstoqueBaixo(),
                estoque.getAtualizadoEm()
        );
    }

    public MovimentacaoResponse paraResposta(MovimentacaoEstoque movimentacao) {
        return new MovimentacaoResponse(
                movimentacao.getId(),
                movimentacao.getProdutoId(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getQuantidadeResultante(),
                movimentacao.getObservacao(),
                movimentacao.getData()
        );
    }
}
