package br.edu.unifor.farmacia.produto.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sobe o servico inteiro com banco H2 em memoria e exercita a API de produtos,
 * conferindo o contrato JSON e os codigos HTTP combinados com a equipe.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProdutoControllerIntegracaoTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String DIPIRONA = """
            {
              "nome": "Dipirona 500mg",
              "descricao": "Analgesico e antitermico",
              "preco": 8.50,
              "codigoBarras": "7891234567890",
              "tipo": "MEDICAMENTO"
            }
            """;

    @Test
    @DisplayName("cadastra, busca, lista e exclui um produto")
    void fluxoCompletoDoProduto() throws Exception {
        String corpo = mockMvc.perform(post("/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(DIPIRONA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nome").value("Dipirona 500mg"))
                .andExpect(jsonPath("$.preco").value(8.50))
                .andExpect(jsonPath("$.ativo").value(true))
                .andReturn().getResponse().getContentAsString();

        long id = Long.parseLong(corpo.replaceAll(".*\"id\":(\\d+).*", "$1"));

        mockMvc.perform(get("/produtos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoBarras").value("7891234567890"));

        mockMvc.perform(get("/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Dipirona 500mg"));

        mockMvc.perform(delete("/produtos/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/produtos/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("devolve 400 quando os dados sao invalidos")
    void deveRecusarDadosInvalidos() throws Exception {
        String invalido = """
                {
                  "nome": "",
                  "preco": -1,
                  "codigoBarras": "123",
                  "tipo": "MEDICAMENTO"
                }
                """;

        mockMvc.perform(post("/produtos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value("Dados invalidos"))
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.preco").exists());
    }

    @Test
    @DisplayName("devolve 404 para produto inexistente")
    void deveDevolver404() throws Exception {
        mockMvc.perform(get("/produtos/{id}", 9999))
                .andExpect(status().isNotFound());
    }
}
