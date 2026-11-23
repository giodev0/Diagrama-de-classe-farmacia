package br.edu.unifor.farmacia.produto.controller;

import br.edu.unifor.farmacia.produto.domain.TipoProduto;
import br.edu.unifor.farmacia.produto.dto.ProdutoRequest;
import br.edu.unifor.farmacia.produto.dto.ProdutoResponse;
import br.edu.unifor.farmacia.produto.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * Porta de entrada HTTP do servico de Produtos.
 * So traduz HTTP para o caso de uso; nenhuma regra de negocio mora aqui (SRP).
 */
@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoService service;

    public ProdutoController(ProdutoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ProdutoResponse> cadastrar(@RequestBody @Valid ProdutoRequest dados,
                                                     UriComponentsBuilder uriBuilder) {
        ProdutoResponse produto = service.cadastrar(dados);
        URI endereco = uriBuilder.path("/produtos/{id}").buildAndExpand(produto.id()).toUri();
        return ResponseEntity.created(endereco).body(produto);
    }

    @GetMapping
    public ResponseEntity<List<ProdutoResponse>> listar(@RequestParam(required = false) TipoProduto tipo,
                                                        @RequestParam(required = false) String nome) {
        return ResponseEntity.ok(service.listar(tipo, nome));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProdutoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/codigo-barras/{codigoBarras}")
    public ResponseEntity<ProdutoResponse> buscarPorCodigoBarras(@PathVariable String codigoBarras) {
        return ResponseEntity.ok(service.buscarPorCodigoBarras(codigoBarras));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoResponse> editar(@PathVariable Long id,
                                                  @RequestBody @Valid ProdutoRequest dados) {
        return ResponseEntity.ok(service.editar(id, dados));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
