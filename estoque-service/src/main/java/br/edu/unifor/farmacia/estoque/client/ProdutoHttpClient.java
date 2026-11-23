package br.edu.unifor.farmacia.estoque.client;

import br.edu.unifor.farmacia.estoque.exception.ServicoIndisponivelException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Optional;

/**
 * Implementacao HTTP da porta ProdutoClient.
 *
 * Aqui mora a unica dependencia deste servico com o mundo externo: uma chamada
 * REST para o servico de Produtos. O estoque NUNCA acessa o banco de produtos.
 *
 *   estoque-service -> GET /produtos/{id} -> produto-service -> BD Produtos
 *
 * Timeout e demais ajustes de transporte ficam em RestClientConfig.
 */
@Component
public class ProdutoHttpClient implements ProdutoClient {

    private final RestClient restClient;

    public ProdutoHttpClient(RestClient.Builder builder,
                             @Value("${servicos.produto.url}") String urlProdutoService) {
        this.restClient = builder.baseUrl(urlProdutoService).build();
    }

    @Override
    public Optional<ProdutoResumo> buscarPorId(Long produtoId) {
        try {
            ProdutoResumo produto = restClient.get()
                    .uri("/produtos/{id}", produtoId)
                    .retrieve()
                    .body(ProdutoResumo.class);

            return Optional.ofNullable(produto);

        } catch (HttpClientErrorException.NotFound ex) {
            // Produto inexistente nao e falha de integracao: e resposta valida.
            return Optional.empty();

        } catch (RestClientException ex) {
            throw new ServicoIndisponivelException(
                    "Nao foi possivel consultar o servico de Produtos", ex);
        }
    }
}
