public class Cartao implements FormaPagamento {
    private String numeroCartao;
    private int parcelas;

    @Override
    public boolean processar(double valor) {
        // TODO: implementar
        return false;
    }
}
