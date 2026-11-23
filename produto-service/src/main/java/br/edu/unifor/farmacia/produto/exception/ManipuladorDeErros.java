package br.edu.unifor.farmacia.produto.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GRASP (Pure Fabrication): centraliza a traducao de excecoes em respostas HTTP,
 * para que nenhum controller precise repetir try/catch.
 *
 * Cada erro previsivel tem um handler proprio. O handler de Exception no final
 * e so a ultima rede de seguranca: se ele for acionado, e bug nosso, por isso
 * ele e o unico que grava o stack trace no log.
 */
@RestControllerAdvice
public class ManipuladorDeErros {

    private static final Logger log = LoggerFactory.getLogger(ManipuladorDeErros.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> naoEncontrado(RecursoNaoEncontradoException ex, HttpServletRequest req) {
        return construir(HttpStatus.NOT_FOUND, ex.getMessage(), req);
    }

    @ExceptionHandler({RegraDeNegocioException.class, IllegalArgumentException.class})
    public ResponseEntity<ErroResponse> regraDeNegocio(RuntimeException ex, HttpServletRequest req) {
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> validacao(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getField(), erro.getDefaultMessage()));

        ErroResponse corpo = ErroResponse.de(
                HttpStatus.BAD_REQUEST.value(), "Dados invalidos", req.getRequestURI(), campos);
        return ResponseEntity.badRequest().body(corpo);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> jsonInvalido(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return construir(HttpStatus.BAD_REQUEST, "JSON invalido, ausente ou mal formatado", req);
    }

    /** Ex.: /produtos/abc, ou ?tipo=XPTO que nao existe no enum TipoProduto. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResponse> parametroComTipoErrado(MethodArgumentTypeMismatchException ex,
                                                               HttpServletRequest req) {
        String mensagem = "Valor invalido para o parametro '" + ex.getName() + "': " + ex.getValue();
        return construir(HttpStatus.BAD_REQUEST, mensagem, req);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErroResponse> parametroAusente(MissingServletRequestParameterException ex,
                                                         HttpServletRequest req) {
        return construir(HttpStatus.BAD_REQUEST,
                "Parametro obrigatorio ausente: " + ex.getParameterName(), req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroResponse> rotaInexistente(NoResourceFoundException ex, HttpServletRequest req) {
        return construir(HttpStatus.NOT_FOUND, "Rota nao encontrada", req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErroResponse> metodoNaoSuportado(HttpRequestMethodNotSupportedException ex,
                                                           HttpServletRequest req) {
        return construir(HttpStatus.METHOD_NOT_ALLOWED,
                "Metodo " + ex.getMethod() + " nao suportado nessa rota", req);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErroResponse> formatoNaoSuportado(HttpMediaTypeNotSupportedException ex,
                                                            HttpServletRequest req) {
        return construir(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Content-Type nao suportado, use application/json", req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponse> erroInterno(Exception ex, HttpServletRequest req) {
        log.error("Erro nao tratado em {} {}", req.getMethod(), req.getRequestURI(), ex);
        return construir(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno no servico de produtos", req);
    }

    private ResponseEntity<ErroResponse> construir(HttpStatus status, String mensagem, HttpServletRequest req) {
        return ResponseEntity.status(status)
                .body(ErroResponse.de(status.value(), mensagem, req.getRequestURI()));
    }
}
