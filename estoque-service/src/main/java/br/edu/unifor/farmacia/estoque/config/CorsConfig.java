package br.edu.unifor.farmacia.estoque.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Libera o acesso do frontend ao servico.
 *
 * Em producao o frontend passa pelo nginx e divide a mesma origem, entao o
 * CORS nem entra em acao. Isso aqui existe para quem roda o frontend solto
 * (Live Server, python -m http.server) durante o desenvolvimento.
 *
 * As origens permitidas vem de configuracao, nunca "*" fixo no codigo.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] origensPermitidas;

    public CorsConfig(@Value("${cors.origens-permitidas}") String[] origensPermitidas) {
        this.origensPermitidas = origensPermitidas;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(origensPermitidas)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
