import java.util.Date;

public class Promocional implements PoliticaDesconto {
    private double percentual;
    private Date dataInicial;
    private Date dataFim;

    @Override
    public double calcularDesconto(Venda venda) {
        // TODO: implementar
        return 0.0;
    }
}
