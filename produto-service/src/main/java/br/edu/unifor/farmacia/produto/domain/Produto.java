package br.edu.unifor.farmacia.produto.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidade de dominio do servico de Produtos.
 *
 * GRASP (Information Expert): as regras que dependem apenas dos dados do
 * proprio produto (validacao de preco, inativacao, atualizacao de dados)
 * ficam aqui, e nao espalhadas pelo service ou pelo controller.
 */
@Entity
@Table(name = "produtos")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 255)
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(name = "codigo_barras", nullable = false, unique = true, length = 50)
    private String codigoBarras;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoProduto tipo;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    protected Produto() {
        // exigido pelo JPA
    }

    public Produto(String nome, String descricao, BigDecimal preco, String codigoBarras, TipoProduto tipo) {
        this.nome = nome;
        this.descricao = descricao;
        this.codigoBarras = codigoBarras;
        this.tipo = tipo;
        definirPreco(preco);
    }

    /** Regra de negocio propria do produto: preco sempre maior que zero. */
    public final void definirPreco(BigDecimal novoPreco) {
        if (novoPreco == null || novoPreco.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O preco do produto deve ser maior que zero");
        }
        this.preco = novoPreco;
    }

    public void atualizarDados(String nome, String descricao, BigDecimal preco, String codigoBarras, TipoProduto tipo) {
        this.nome = nome;
        this.descricao = descricao;
        this.codigoBarras = codigoBarras;
        this.tipo = tipo;
        definirPreco(preco);
    }

    /** Exclusao logica: o produto some das consultas mas o historico de vendas continua valido. */
    public void inativar() {
        this.ativo = false;
    }

    @PreUpdate
    void aoAtualizar() {
        this.atualizadoEm = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getPreco() {
        return preco;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public TipoProduto getTipo() {
        return tipo;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
