package br.edu.unifor.farmacia.estoque.exception;

/**
 * Lancada quando o servico de Produtos nao responde.
 * Vira HTTP 503 para que quem chamou saiba que o problema e de integracao,
 * e nao um erro dos dados enviados.
 */
public class ServicoIndisponivelException extends RuntimeException {

    public ServicoIndisponivelException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
