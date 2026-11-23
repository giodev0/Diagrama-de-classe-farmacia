package br.edu.unifor.farmacia.estoque.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.Duration;

/**
 * Configuracao de transporte das chamadas HTTP de saida.
 *
 * Fica separada do ProdutoHttpClient de proposito (SRP): o adaptador cuida de
 * traduzir a resposta do produto-service, e nao de decidir timeout. Isso
 * tambem deixa o adaptador testavel com MockRestServiceServer, que precisa
 * instalar a propria fabrica de requisicoes.
 */
@Configuration
public class RestClientConfig {

    /**
     * Sem timeout explicito, uma lentidao no produto-service deixaria as
     * requisicoes do estoque penduradas ate o cliente desistir.
     */
    @Bean
    public RestClientCustomizer timeoutDasChamadasExternas(
            @Value("${servicos.produto.timeout-segundos:5}") int timeoutSegundos) {

        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(timeoutSegundos));
        fabrica.setReadTimeout(Duration.ofSeconds(timeoutSegundos));

        return builder -> builder.requestFactory(fabrica);
    }
}
