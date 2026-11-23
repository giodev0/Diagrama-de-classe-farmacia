/**
 * Tela de Pagamentos: consome o pagamento-service.
 *
 * Numa venda real quem chama o pagamento é o venda-service, não o frontend.
 * Esta tela existe para consultar os pagamentos e para testar o serviço
 * isoladamente enquanto o venda-service não fica pronto.
 */
const Pagamentos = (() => {

  const FORMAS = [
    { valor: 'PIX', rotulo: 'Pix' },
    { valor: 'CARTAO', rotulo: 'Cartão' },
    { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
  ];

  const tabela = () => document.getElementById('tabela-pagamentos');

  async function carregar() {
    try {
      desenhar(await Api.listarPagamentos());
    } catch (erro) {
      Ui.avisarErro(erro);
      Ui.linhaVazia(tabela(), 6, 'Não foi possível carregar os pagamentos.');
    }
  }

  function desenhar(pagamentos) {
    if (!pagamentos.length) {
      Ui.linhaVazia(tabela(), 6, 'Nenhum pagamento registrado.');
      return;
    }

    tabela().querySelector('tbody').innerHTML = pagamentos.map((p) => `
      <tr>
        <td>${p.id}</td>
        <td>${p.vendaId}</td>
        <td>${Ui.moeda(p.valor)}</td>
        <td>${Ui.texto(Ui.rotulo(p.formaPagamento))}</td>
        <td><span class="etiqueta ${p.status === 'APROVADO' ? 'ok' : 'erro'}">${Ui.texto(Ui.rotulo(p.status))}</span></td>
        <td>${Ui.dataHora(p.data)}</td>
      </tr>
    `).join('');
  }

  function abrirNovo() {
    Ui.abrirFormulario({
      titulo: 'Processar pagamento',
      campos: [
        {
          nome: 'vendaId', rotulo: 'ID da venda', tipo: 'number', min: '1',
          ajuda: 'Enquanto o venda-service não existe, use um número qualquer para teste.',
        },
        { nome: 'valor', rotulo: 'Valor (R$)', tipo: 'number', passo: '0.01', min: '0.01' },
        { nome: 'formaPagamento', rotulo: 'Forma de pagamento', tipo: 'select', opcoes: FORMAS },
      ],
      aoSalvar: async (valores) => {
        await Api.processarPagamento({
          vendaId: Number(valores.vendaId),
          valor: Number(valores.valor),
          formaPagamento: valores.formaPagamento,
        });
        Ui.avisar('Pagamento processado.');
        await carregar();
      },
    });
  }

  function iniciar() {
    document.getElementById('novo-pagamento').addEventListener('click', abrirNovo);
  }

  return { iniciar, carregar };
})();
