package br.edu.unifor.farmacia.estoque.controller;

import br.edu.unifor.farmacia.estoque.client.ProdutoClient;
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

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Garante que os caminhos de erro devolvem o codigo HTTP certo.
 * O servico de Vendas depende disso para saber se o problema foi dele
 * (400) ou se o estoque simplesmente nao existe (404).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContratoDeErrosTest {

    @TestConfiguration
    static class ProdutoClientFalsoConfig {

        @Bean
        @Primary
        ProdutoClient produtoClientFalso() {
            return produtoId -> Optional.empty();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("produtoId nao numerico vira 400, nao 500")
    void produtoIdInvalidoDeveSer400() throws Exception {
        mockMvc.perform(get("/estoque/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("disponibilidade sem o parametro quantidade vira 400")
    void quantidadeAusenteDeveSer400() throws Exception {
        mockMvc.perform(get("/estoque/{produtoId}/disponibilidade", 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Parametro obrigatorio ausente: quantidade"));
    }

    @Test
    @DisplayName("rota inexistente vira 404, nao 500")
    void rotaInexistenteDeveSer404() throws Exception {
        mockMvc.perform(get("/rota-que-nao-existe"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("metodo nao suportado vira 405, nao 500")
    void metodoErradoDeveSer405() throws Exception {
        mockMvc.perform(post("/estoque/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }
}
