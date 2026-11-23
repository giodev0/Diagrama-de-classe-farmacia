package br.edu.unifor.farmacia.produto.mapper;

import br.edu.unifor.farmacia.produto.domain.Produto;
import br.edu.unifor.farmacia.produto.dto.ProdutoRequest;
import br.edu.unifor.farmacia.produto.dto.ProdutoResponse;
import org.springframework.stereotype.Component;

/**
 * GRASP (Creator / Pure Fabrication): classe criada apenas para converter
 * entidade <-> DTO, liberando o service dessa responsabilidade (SRP).
 */
@Component
public class ProdutoMapper {

    public Produto paraEntidade(ProdutoRequest dados) {
        return new Produto(
                dados.nome(),
                dados.descricao(),
                dados.preco(),
                dados.codigoBarras(),
                dados.tipo()
        );
    }

    public ProdutoResponse paraResposta(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getDescricao(),
                produto.getPreco(),
                produto.getCodigoBarras(),
                produto.getTipo(),
                produto.isAtivo(),
                produto.getCriadoEm(),
                produto.getAtualizadoEm()
        );
    }
}
