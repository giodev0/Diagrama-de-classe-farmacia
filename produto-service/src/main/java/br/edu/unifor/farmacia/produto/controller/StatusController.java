package br.edu.unifor.farmacia.produto.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Endpoint simples usado pelos outros servicos para checar se o servico esta no ar. */
@RestController
public class StatusController {

    @GetMapping("/")
    public Map<String, String> status() {
        return Map.of("mensagem", "Servico de Produtos funcionando");
    }
}
