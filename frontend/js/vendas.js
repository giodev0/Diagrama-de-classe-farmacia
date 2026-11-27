/**
 * Tela de Vendas: consome o venda-service.
 *
 * A venda é montada no servidor, passo a passo:
 *   1. POST /vendas                  cria a venda ABERTA, vazia
 *   2. POST /vendas/{id}/itens       adiciona itens (o serviço busca o preço
 *                                    em Produtos e confere o Estoque)
 *   3. PUT  /vendas/{id}/desconto    aplica o desconto
 *   4. POST /vendas/{id}/finalizar   paga; só então o estoque é baixado
 *
 * A tela nunca calcula preço nem total: ela só desenha a venda que o
 * venda-service devolve a cada passo.
 */
const Vendas = (() => {

  const FORMAS = [
    { valor: 'PIX', rotulo: 'Pix' },
    { valor: 'CARTAO', rotulo: 'Cartão' },
    { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
  ];

  const ETIQUETAS = {
    ABERTA: 'alerta',
    FINALIZADA: 'ok',
    CANCELADA: 'erro',
  };

  /** Recarregar a página não deve perder a venda que estava no caixa. */
  const CHAVE_VENDA_ATUAL = 'farmacia.vendaAtual';

  /** A venda ABERTA que está sendo montada, como o servidor devolveu. */
  let vendaAtual = null;

  const tabela = () => document.getElementById('tabela-vendas');

  // ---------------- disponibilidade do serviço ----------------

  /** 502/504 vêm do nginx quando o container não responde. */
  function servicoIndisponivel(erro) {
    return [0, 502, 503, 504].includes(erro.status);
  }

  function mostrarIndisponivel() {
    document.getElementById('vendas-indisponivel').hidden = false;
    document.getElementById('vendas-conteudo').hidden = true;
  }

  function mostrarConteudo() {
    document.getElementById('vendas-indisponivel').hidden = true;
    document.getElementById('vendas-conteudo').hidden = false;
  }

  // ---------------- listagem ----------------

  async function carregar() {
    try {
      const vendas = await Api.listarVendas({
        status: document.getElementById('filtro-status-venda').value,
      });
      mostrarConteudo();
      desenhar(vendas);
    } catch (erro) {
      if (servicoIndisponivel(erro)) {
        mostrarIndisponivel();
        return;
      }
      Ui.avisarErro(erro);
      Ui.linhaVazia(tabela(), 7, 'Não foi possível carregar as vendas.');
      return;
    }

    await retomarVendaAtual();
  }

  function desenhar(vendas) {
    if (!vendas.length) {
      Ui.linhaVazia(tabela(), 7, 'Nenhuma venda registrada.');
      return;
    }

    tabela().querySelector('tbody').innerHTML = vendas.map((v) => {
      const aberta = v.status === 'ABERTA';
      return `
        <tr>
          <td>${v.id}</td>
          <td>${Ui.dataHora(v.finalizadaEm || v.criadaEm)}</td>
          <td>${quantidadeDeUnidades(v)}</td>
          <td>${Ui.moeda(v.valorTotal)}</td>
          <td>${Ui.texto(rotuloDaForma(v.formaPagamento))}</td>
          <td><span class="etiqueta ${ETIQUETAS[v.status] || 'alerta'}">${Ui.texto(Ui.rotulo(v.status))}</span></td>
          <td class="acoes">
            <button class="botao-linha" data-detalhe="${v.id}">Detalhes</button>
            ${aberta ? `<button class="botao-linha" data-continuar="${v.id}">Continuar</button>` : ''}
            ${aberta ? `<button class="botao-linha perigo" data-cancelar="${v.id}">Cancelar</button>` : ''}
          </td>
        </tr>`;
    }).join('');
  }

  function quantidadeDeUnidades(venda) {
    return (venda.itens || []).reduce((soma, i) => soma + i.quantidade, 0);
  }

  function rotuloDaForma(forma) {
    return FORMAS.find((f) => f.valor === forma)?.rotulo || '—';
  }

  // ---------------- venda em andamento ----------------

  function definirVendaAtual(venda) {
    vendaAtual = venda && venda.status === 'ABERTA' ? venda : null;

    if (vendaAtual) {
      sessionStorage.setItem(CHAVE_VENDA_ATUAL, String(vendaAtual.id));
    } else {
      sessionStorage.removeItem(CHAVE_VENDA_ATUAL);
    }
    desenharVendaAtual();
  }

  /** Ao abrir a aba, volta para a venda que estava aberta no caixa. */
  async function retomarVendaAtual() {
    const id = vendaAtual?.id || sessionStorage.getItem(CHAVE_VENDA_ATUAL);
    if (!id) {
      desenharVendaAtual();
      return;
    }
    try {
      definirVendaAtual(await Api.buscarVenda(id));
    } catch {
      // A venda sumiu ou o serviço caiu: o caixa só volta ao estado vazio.
      definirVendaAtual(null);
    }
  }

  function desenharVendaAtual() {
    document.getElementById('venda-sem-andamento').hidden = Boolean(vendaAtual);
    document.getElementById('venda-em-andamento').hidden = !vendaAtual;

    if (!vendaAtual) {
      return;
    }

    const v = vendaAtual;
    document.getElementById('venda-atual-titulo').textContent = `Venda #${v.id}`;

    const corpo = document.querySelector('#tabela-itens-venda tbody');
    if (!v.itens.length) {
      corpo.innerHTML = '<tr><td class="vazio" colspan="5">Nenhum item adicionado.</td></tr>';
    } else {
      corpo.innerHTML = v.itens.map((item) => `
        <tr>
          <td>${Ui.texto(item.nomeProduto)}</td>
          <td>${item.quantidade}</td>
          <td>${Ui.moeda(item.precoUnitario)}</td>
          <td>${Ui.moeda(item.subtotal)}</td>
          <td class="acoes">
            <button class="botao-linha perigo" data-remover="${item.id}">Remover</button>
          </td>
        </tr>`).join('');
    }

    document.getElementById('venda-desconto').value = v.descontoPercentual;
    document.getElementById('venda-subtotal').textContent = Ui.moeda(v.subtotal);
    document.getElementById('venda-valor-desconto').textContent = `- ${Ui.moeda(v.valorDesconto)}`;
    document.getElementById('venda-total').textContent = Ui.moeda(v.valorTotal);
    document.getElementById('finalizar-venda').disabled = v.itens.length === 0;
  }

  async function novaVenda() {
    try {
      definirVendaAtual(await Api.criarVenda());
      await carregarLista();
      abrirAdicaoDeItem();
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  /** Recarrega só a tabela, sem mexer na venda em andamento. */
  async function carregarLista() {
    try {
      desenhar(await Api.listarVendas({
        status: document.getElementById('filtro-status-venda').value,
      }));
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  async function abrirAdicaoDeItem() {
    let produtos;
    try {
      produtos = await Api.listarProdutos();
    } catch (erro) {
      Ui.avisarErro(erro);
      return;
    }

    if (!produtos.length) {
      Ui.avisar('Cadastre um produto antes de vender.', 'erro');
      return;
    }

    Ui.abrirFormulario({
      titulo: `Adicionar item à venda #${vendaAtual.id}`,
      campos: [
        {
          nome: 'produtoId', rotulo: 'Produto', tipo: 'select',
          opcoes: produtos.map((p) => ({
            valor: p.id, rotulo: `${p.nome} — ${Ui.moeda(p.preco)}`,
          })),
        },
        {
          nome: 'quantidade', rotulo: 'Quantidade', tipo: 'number', min: '1', valor: 1,
          ajuda: 'O venda-service confere no Estoque se há unidades suficientes.',
        },
      ],
      aoSalvar: async (valores) => {
        const venda = await Api.adicionarItem(
          vendaAtual.id, Number(valores.produtoId), Number(valores.quantidade),
        );
        definirVendaAtual(venda);
        await carregarLista();
      },
    });
  }

  async function removerItem(itemId) {
    try {
      definirVendaAtual(await Api.removerItem(vendaAtual.id, itemId));
      await carregarLista();
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  async function aplicarDesconto() {
    const campo = document.getElementById('venda-desconto');
    try {
      definirVendaAtual(await Api.aplicarDesconto(vendaAtual.id, Number(campo.value) || 0));
      await carregarLista();
    } catch (erro) {
      Ui.avisarErro(erro);
      // Volta o campo para o desconto que de fato está valendo.
      campo.value = vendaAtual.descontoPercentual;
    }
  }

  function abrirPagamento() {
    const venda = vendaAtual;

    Ui.abrirFormulario({
      titulo: `Pagamento da venda #${venda.id}`,
      campos: [
        {
          nome: 'valor', rotulo: 'Valor a receber', valor: Ui.moeda(venda.valorTotal),
          somenteLeitura: true, obrigatorio: false,
        },
        { nome: 'formaPagamento', rotulo: 'Forma de pagamento', tipo: 'select', opcoes: FORMAS },
      ],
      // Pagamento recusado ou estoque insuficiente voltam como erro: o modal
      // continua aberto e a venda segue ABERTA para tentar de novo.
      aoSalvar: async (valores) => {
        await Api.finalizarVenda(venda.id, valores.formaPagamento);
        Ui.avisar(`Venda #${venda.id} finalizada. Estoque baixado.`);
        definirVendaAtual(null);
        await carregarLista();
      },
    });
  }

  async function continuar(id) {
    try {
      definirVendaAtual(await Api.buscarVenda(id));
      document.getElementById('secao-vendas').scrollIntoView({ behavior: 'smooth' });
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  async function cancelar(id) {
    if (!confirm(`Cancelar a venda #${id}?`)) {
      return;
    }
    try {
      await Api.cancelarVenda(id);
      Ui.avisar(`Venda #${id} cancelada.`);
      if (String(vendaAtual?.id) === String(id)) {
        definirVendaAtual(null);
      }
      await carregarLista();
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  // ---------------- detalhe ----------------

  async function mostrarDetalhe(id) {
    try {
      const venda = await Api.buscarVenda(id);

      const linhas = (venda.itens || []).map((i) => `
        <tr>
          <td>${Ui.texto(i.nomeProduto)}</td>
          <td>${i.quantidade}</td>
          <td>${Ui.moeda(i.precoUnitario)}</td>
          <td>${Ui.moeda(i.subtotal)}</td>
        </tr>`).join('');

      Ui.abrirConteudo({
        titulo: `Venda #${venda.id}`,
        html: `
          <div class="tabela-rolavel">
            <table>
              <thead>
                <tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th></tr>
              </thead>
              <tbody>${linhas || '<tr><td class="vazio" colspan="4">Sem itens.</td></tr>'}</tbody>
            </table>
          </div>
          <div class="resumo-venda">
            <div><span>Subtotal</span><strong>${Ui.moeda(venda.subtotal)}</strong></div>
            <div><span>Desconto (${venda.descontoPercentual}%)</span><strong>- ${Ui.moeda(venda.valorDesconto)}</strong></div>
            <div class="destaque"><span>Total</span><strong>${Ui.moeda(venda.valorTotal)}</strong></div>
            <div><span>Situação</span><strong>${Ui.texto(Ui.rotulo(venda.status))}</strong></div>
            <div><span>Criada em</span><strong>${Ui.dataHora(venda.criadaEm)}</strong></div>
            ${venda.finalizadaEm ? `<div><span>Finalizada em</span><strong>${Ui.dataHora(venda.finalizadaEm)}</strong></div>` : ''}
            ${venda.formaPagamento ? `<div><span>Forma</span><strong>${Ui.texto(rotuloDaForma(venda.formaPagamento))}</strong></div>` : ''}
            ${venda.pagamentoId ? `<div><span>Pagamento</span><strong>#${venda.pagamentoId}</strong></div>` : ''}
          </div>`,
      });
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  // ---------------- ligação com a tela ----------------

  function iniciar() {
    document.getElementById('nova-venda').addEventListener('click', novaVenda);
    document.getElementById('adicionar-item').addEventListener('click', abrirAdicaoDeItem);
    document.getElementById('aplicar-desconto').addEventListener('click', aplicarDesconto);
    document.getElementById('finalizar-venda').addEventListener('click', abrirPagamento);
    document.getElementById('cancelar-venda-atual').addEventListener('click', () => cancelar(vendaAtual.id));
    document.getElementById('fechar-venda-atual').addEventListener('click', () => definirVendaAtual(null));
    document.getElementById('filtro-status-venda').addEventListener('change', carregarLista);

    document.getElementById('venda-desconto').addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        aplicarDesconto();
      }
    });

    document.querySelector('#tabela-itens-venda tbody').addEventListener('click', (evento) => {
      const itemId = evento.target.dataset.remover;
      if (itemId) {
        removerItem(itemId);
      }
    });

    tabela().addEventListener('click', (evento) => {
      const dados = evento.target.dataset;
      if (dados.detalhe) {
        mostrarDetalhe(dados.detalhe);
      }
      if (dados.continuar) {
        continuar(dados.continuar);
      }
      if (dados.cancelar) {
        cancelar(dados.cancelar);
      }
    });

    desenharVendaAtual();
  }

  return { iniciar, carregar };
})();
