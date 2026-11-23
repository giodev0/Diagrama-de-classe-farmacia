package br.edu.unifor.farmacia.produto.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Garante que os caminhos de erro devolvem o codigo HTTP certo.
 * O trabalho cobra uso correto de 400/404/405, entao nenhum erro de requisicao
 * pode escapar como 500.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContratoDeErrosTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("tipo invalido no filtro vira 400, nao 500")
    void tipoInvalidoDeveSer400() throws Exception {
        mockMvc.perform(get("/produtos").param("tipo", "XPTO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("id nao numerico vira 400, nao 500")
    void idInvalidoDeveSer400() throws Exception {
        mockMvc.perform(get("/produtos/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
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
        mockMvc.perform(post("/produtos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("corpo ausente no cadastro vira 400")
    void corpoAusenteDeveSer400() throws Exception {
        mockMvc.perform(post("/produtos").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}
