package br.edu.unifor.farmacia.estoque.controller;

import br.edu.unifor.farmacia.estoque.dto.DisponibilidadeResponse;
import br.edu.unifor.farmacia.estoque.dto.EstoqueMinimoRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueRequest;
import br.edu.unifor.farmacia.estoque.dto.EstoqueResponse;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoRequest;
import br.edu.unifor.farmacia.estoque.dto.MovimentacaoResponse;
import br.edu.unifor.farmacia.estoque.service.EstoqueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * Porta de entrada HTTP do servico de Estoque.
 * A chave publica deste servico e o produtoId, que e o identificador
 * que o servico de Vendas conhece.
 */
@RestController
@RequestMapping("/estoques")
public class EstoqueController {

    private final EstoqueService service;

    public EstoqueController(EstoqueService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EstoqueResponse> cadastrar(@RequestBody @Valid EstoqueRequest dados,
                                                     UriComponentsBuilder uriBuilder) {
        EstoqueResponse estoque = service.cadastrar(dados);
        URI endereco = uriBuilder.path("/estoques/{produtoId}")
                .buildAndExpand(estoque.produtoId()).toUri();
        return ResponseEntity.created(endereco).body(estoque);
    }

    @GetMapping
    public ResponseEntity<List<EstoqueResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/baixos")
    public ResponseEntity<List<EstoqueResponse>> listarEstoqueBaixo() {
        return ResponseEntity.ok(service.listarEstoqueBaixo());
    }

    @GetMapping("/{produtoId}")
    public ResponseEntity<EstoqueResponse> consultar(@PathVariable Long produtoId) {
        return ResponseEntity.ok(service.consultarPorProduto(produtoId));
    }

    @GetMapping("/{produtoId}/disponibilidade")
    public ResponseEntity<DisponibilidadeResponse> verificarDisponibilidade(@PathVariable Long produtoId,
                                                                            @RequestParam int quantidade) {
        return ResponseEntity.ok(service.verificarDisponibilidade(produtoId, quantidade));
    }

    @PostMapping("/{produtoId}/entrada")
    public ResponseEntity<EstoqueResponse> adicionar(@PathVariable Long produtoId,
                                                     @RequestBody @Valid MovimentacaoRequest dados) {
        return ResponseEntity.ok(service.adicionarUnidades(produtoId, dados));
    }

    @PostMapping("/{produtoId}/saida")
    public ResponseEntity<EstoqueResponse> retirar(@PathVariable Long produtoId,
                                                   @RequestBody @Valid MovimentacaoRequest dados) {
        return ResponseEntity.ok(service.retirarUnidades(produtoId, dados));
    }

    @PatchMapping("/{produtoId}/estoque-minimo")
    public ResponseEntity<EstoqueResponse> atualizarEstoqueMinimo(@PathVariable Long produtoId,
                                                                  @RequestBody @Valid EstoqueMinimoRequest dados) {
        return ResponseEntity.ok(service.atualizarEstoqueMinimo(produtoId, dados));
    }

    @GetMapping("/{produtoId}/movimentacoes")
    public ResponseEntity<List<MovimentacaoResponse>> listarMovimentacoes(@PathVariable Long produtoId) {
        return ResponseEntity.ok(service.listarMovimentacoes(produtoId));
    }
}
