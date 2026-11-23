package br.edu.unifor.farmacia.estoque.controller;

import br.edu.unifor.farmacia.estoque.client.ProdutoClient;
import br.edu.unifor.farmacia.estoque.client.ProdutoResumo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sobe o servico de estoque com H2 em memoria.
 *
 * O ProdutoClient real e trocado por uma implementacao falsa: como o service
 * depende da interface (Inversao de Dependencia), da para testar o estoque sem
 * precisar que o produto-service esteja no ar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EstoqueControllerIntegracaoTest {

    private static final Long PRODUTO_EXISTENTE = 1L;
    private static final Long PRODUTO_INEXISTENTE = 404L;

    @TestConfiguration
    static class ProdutoClientFalsoConfig {

        @Bean
        @Primary
        ProdutoClient produtoClientFalso() {
            return produtoId -> PRODUTO_EXISTENTE.equals(produtoId)
                    ? Optional.of(new ProdutoResumo(PRODUTO_EXISTENTE, "Dipirona 500mg", new BigDecimal("8.50")))
                    : Optional.empty();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("cadastra estoque, movimenta entrada e saida e acusa estoque insuficiente")
    void fluxoCompletoDoEstoque() throws Exception {
        mockMvc.perform(post("/estoques")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId": 1, "quantidade": 10, "estoqueMinimo": 3}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.produtoId").value(1))
                .andExpect(jsonPath("$.quantidade").value(10))
                .andExpect(jsonPath("$.estoqueBaixo").value(false));

        mockMvc.perform(get("/estoques/{produtoId}/disponibilidade", 1).param("quantidade", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disponivel").value(true))
                .andExpect(jsonPath("$.quantidadeDisponivel").value(10));

        mockMvc.perform(post("/estoques/{produtoId}/saida", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"quantidade": 8, "observacao": "Venda 1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidade").value(2))
                .andExpect(jsonPath("$.estoqueBaixo").value(true));

        mockMvc.perform(post("/estoques/{produtoId}/saida", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"quantidade": 5}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        mockMvc.perform(post("/estoques/{produtoId}/entrada", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"quantidade": 20, "observacao": "Reposicao"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidade").value(22));

        mockMvc.perform(get("/estoques/{produtoId}/movimentacoes", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        mockMvc.perform(get("/estoques/baixos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("recusa estoque para produto que nao existe no produto-service")
    void naoDeveCadastrarEstoqueDeProdutoInexistente() throws Exception {
        mockMvc.perform(post("/estoques")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"produtoId": 404, "quantidade": 5, "estoqueMinimo": 1}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro")
                        .value("Produto " + PRODUTO_INEXISTENTE + " nao encontrado no servico de Produtos"));
    }

    @Test
    @DisplayName("devolve 404 quando o produto nao tem estoque cadastrado")
    void deveDevolver404ParaEstoqueInexistente() throws Exception {
        mockMvc.perform(get("/estoques/{produtoId}", 777))
                .andExpect(status().isNotFound());
    }
}
