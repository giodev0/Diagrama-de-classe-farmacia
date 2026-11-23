package br.edu.unifor.farmacia.estoque.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

/** Formato unico de erro da API, combinado entre os microsservicos da equipe. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResponse(
        LocalDateTime timestamp,
        int status,
        String erro,
        String caminho,
        Map<String, String> campos
) {

    public static ErroResponse de(int status, String erro, String caminho) {
        return new ErroResponse(LocalDateTime.now(), status, erro, caminho, null);
    }

    public static ErroResponse de(int status, String erro, String caminho, Map<String, String> campos) {
        return new ErroResponse(LocalDateTime.now(), status, erro, caminho, campos);
    }
}
