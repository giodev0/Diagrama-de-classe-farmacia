package br.edu.unifor.farmacia.estoque.client;

import br.edu.unifor.farmacia.estoque.exception.ServicoIndisponivelException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Testa o lado consumidor da integracao: como o estoque reage a cada resposta
 * possivel do produto-service, sem precisar subir o outro servico.
 *
 * O MockRestServiceServer finge ser o produto-service e permite conferir
 * inclusive a URL exata que foi chamada.
 */
class ProdutoHttpClientTest {

    private MockRestServiceServer produtoServiceFalso;
    private ProdutoHttpClient client;

    @BeforeEach
    void preparar() {
        RestClient.Builder builder = RestClient.builder();
        produtoServiceFalso = MockRestServiceServer.bindTo(builder).build();
        client = new ProdutoHttpClient(builder, "http://produto-service:8002");
    }

    @Test
    @DisplayName("produto existente vira ProdutoResumo preenchido")
    void deveLerProdutoExistente() {
        produtoServiceFalso
                .expect(requestTo("http://produto-service:8002/produtos/15"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"id": 15, "nome": "Dipirona", "preco": 8.50}
                        """, MediaType.APPLICATION_JSON));

        Optional<ProdutoResumo> produto = client.buscarPorId(15L);

        assertTrue(produto.isPresent());
        assertEquals(15L, produto.get().id());
        assertEquals("Dipirona", produto.get().nome());
        assertEquals(new BigDecimal("8.50"), produto.get().preco());
        produtoServiceFalso.verify();
    }

    @Test
    @DisplayName("campos novos no JSON de produtos nao quebram o estoque")
    void deveIgnorarCamposDesconhecidos() {
        produtoServiceFalso
                .expect(requestTo("http://produto-service:8002/produtos/15"))
                .andRespond(withSuccess("""
                        {
                          "id": 15, "nome": "Dipirona", "preco": 8.50,
                          "descricao": "Analgesico", "codigoBarras": "789",
                          "tipo": "MEDICAMENTO", "ativo": true,
                          "campoQueAindaNaoExiste": "qualquer coisa"
                        }
                        """, MediaType.APPLICATION_JSON));

        Optional<ProdutoResumo> produto = client.buscarPorId(15L);

        assertTrue(produto.isPresent());
        assertEquals("Dipirona", produto.get().nome());
    }

    @Test
    @DisplayName("404 do produto-service vira Optional vazio, nao excecao")
    void deveTratar404ComoProdutoInexistente() {
        produtoServiceFalso
                .expect(requestTo("http://produto-service:8002/produtos/999"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertTrue(client.buscarPorId(999L).isEmpty());
    }

    @Test
    @DisplayName("produto-service fora do ar vira ServicoIndisponivelException")
    void deveSinalizarServicoForaDoAr() {
        produtoServiceFalso
                .expect(requestTo("http://produto-service:8002/produtos/15"))
                .andRespond(withException(new java.net.ConnectException("connection refused")));

        assertThrows(ServicoIndisponivelException.class, () -> client.buscarPorId(15L));
    }

    @Test
    @DisplayName("erro 500 no produto-service tambem vira ServicoIndisponivelException")
    void deveSinalizarErroInternoDoOutroServico() {
        produtoServiceFalso
                .expect(requestTo("http://produto-service:8002/produtos/15"))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThrows(ServicoIndisponivelException.class, () -> client.buscarPorId(15L));
    }
}
