package br.edu.unifor.farmacia.estoque.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Historico de entradas e saidas do estoque.
 *
 * GRASP (Creator): sempre criada a partir de um Estoque ja movimentado, por isso
 * as fabricas estaticas recebem a entidade e guardam a quantidade resultante.
 */
@Entity
@Table(name = "movimentacoes_estoque")
public class MovimentacaoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "produto_id", nullable = false)
    private Long produtoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMovimentacao tipo;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "quantidade_resultante", nullable = false)
    private Integer quantidadeResultante;

    @Column(length = 255)
    private String observacao;

    @Column(nullable = false, updatable = false)
    private LocalDateTime data = LocalDateTime.now();

    protected MovimentacaoEstoque() {
        // exigido pelo JPA
    }

    private MovimentacaoEstoque(Estoque estoque, TipoMovimentacao tipo, int quantidade, String observacao) {
        this.produtoId = estoque.getProdutoId();
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.quantidadeResultante = estoque.getQuantidade();
        this.observacao = observacao;
    }

    public static MovimentacaoEstoque entrada(Estoque estoque, int quantidade, String observacao) {
        return new MovimentacaoEstoque(estoque, TipoMovimentacao.ENTRADA, quantidade, observacao);
    }

    public static MovimentacaoEstoque saida(Estoque estoque, int quantidade, String observacao) {
        return new MovimentacaoEstoque(estoque, TipoMovimentacao.SAIDA, quantidade, observacao);
    }

    public Long getId() {
        return id;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public Integer getQuantidadeResultante() {
        return quantidadeResultante;
    }

    public String getObservacao() {
        return observacao;
    }

    public LocalDateTime getData() {
        return data;
    }
}
