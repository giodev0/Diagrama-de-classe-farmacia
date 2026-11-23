package br.edu.unifor.farmacia.estoque.domain;

import br.edu.unifor.farmacia.estoque.exception.EstoqueInsuficienteException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.LocalDateTime;

/**
 * Entidade de dominio do servico de Estoque.
 *
 * Guarda apenas o que e responsabilidade deste servico: produtoId, quantidade
 * e estoque minimo. Nome, preco e descricao pertencem ao servico de Produtos.
 *
 * GRASP (Information Expert): quem sabe a quantidade atual e quem decide se da
 * para retirar, por isso as regras de entrada/saida ficam na propria entidade.
 */
@Entity
@Table(name = "estoques")
public class Estoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "produto_id", nullable = false, unique = true)
    private Long produtoId;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "estoque_minimo", nullable = false)
    private Integer estoqueMinimo;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    /** Controle de concorrencia: evita duas vendas retirarem a mesma unidade. */
    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    protected Estoque() {
        // exigido pelo JPA
    }

    public Estoque(Long produtoId, Integer quantidadeInicial, Integer estoqueMinimo) {
        if (produtoId == null) {
            throw new IllegalArgumentException("produtoId e obrigatorio");
        }
        this.produtoId = produtoId;
        this.quantidade = exigirNaoNegativo(quantidadeInicial, "quantidade");
        this.estoqueMinimo = exigirNaoNegativo(estoqueMinimo, "estoqueMinimo");
    }

    public void adicionar(int unidades) {
        exigirPositivo(unidades);
        this.quantidade += unidades;
        this.atualizadoEm = LocalDateTime.now();
    }

    public void retirar(int unidades) {
        exigirPositivo(unidades);
        if (!temDisponivel(unidades)) {
            throw new EstoqueInsuficienteException(produtoId, quantidade, unidades);
        }
        this.quantidade -= unidades;
        this.atualizadoEm = LocalDateTime.now();
    }

    public boolean temDisponivel(int unidades) {
        return unidades > 0 && this.quantidade >= unidades;
    }

    public boolean isEstoqueBaixo() {
        return this.quantidade <= this.estoqueMinimo;
    }

    public void definirEstoqueMinimo(Integer novoMinimo) {
        this.estoqueMinimo = exigirNaoNegativo(novoMinimo, "estoqueMinimo");
        this.atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    void aoAtualizar() {
        this.atualizadoEm = LocalDateTime.now();
    }

    private static void exigirPositivo(int unidades) {
        if (unidades <= 0) {
            throw new IllegalArgumentException("A quantidade movimentada deve ser maior que zero");
        }
    }

    private static Integer exigirNaoNegativo(Integer valor, String campo) {
        if (valor == null || valor < 0) {
            throw new IllegalArgumentException(campo + " nao pode ser nulo nem negativo");
        }
        return valor;
    }

    public Long getId() {
        return id;
    }

    public Long getProdutoId() {
        return produtoId;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public Integer getEstoqueMinimo() {
        return estoqueMinimo;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
