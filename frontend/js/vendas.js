/**
 * Tela de Vendas: consome o venda-service.
 *
 * Segue o contrato de CONTRATOS.md. Enquanto o serviço não existe, a tela
 * mostra um aviso em vez de quebrar — ver `mostrarIndisponivel`.
 *
 * A venda acontece em duas etapas, de propósito:
 *   1. monta o carrinho e cria a venda como RASCUNHO (nada sai do estoque)
 *   2. paga, e só então o estoque é reduzido
 */
const Vendas = (() => {

  const FORMAS = [
    { valor: 'PIX', rotulo: 'Pix' },
    { valor: 'CARTAO', rotulo: 'Cartão' },
    { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
  ];

  /** Itens do carrinho da venda que está sendo montada. */
  let carrinho = [];

  const secao = () => document.getElementById('secao-vendas');
  const tabela = () => document.getElementById('tabela-vendas');

  // ---------------- disponibilidade do serviço ----------------

  /**
   * Enquanto o venda-service não existe, o nginx responde 503 e o frontend
   * mostra o que falta. Nenhum JavaScript muda quando o serviço entrar no ar.
   */
  function servicoIndisponivel(erro) {
    return erro.status === 503 || erro.status === 404 || erro.status === 0;
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
      Ui.linhaVazia(tabela(), 6, 'Não foi possível carregar as vendas.');
    }
  }

  const ETIQUETAS = {
    RASCUNHO: 'alerta',
    FINALIZADA: 'ok',
    PAGAMENTO_RECUSADO: 'erro',
    CANCELADA: 'erro',
  };

  function desenhar(vendas) {
    if (!vendas.length) {
      Ui.linhaVazia(tabela(), 6, 'Nenhuma venda registrada.');
      return;
    }

    tabela().querySelector('tbody').innerHTML = vendas.map((v) => {
      const rascunho = v.status === 'RASCUNHO';
      return `
        <tr>
          <td>${v.id}</td>
          <td>${Ui.dataHora(v.criadaEm)}</td>
          <td>${v.itens ? v.itens.length : 0}</td>
          <td>${Ui.moeda(v.valorTotal)}</td>
          <td><span class="etiqueta ${ETIQUETAS[v.status] || 'alerta'}">${Ui.texto(Ui.rotulo(v.status))}</span></td>
          <td class="acoes">
            <button class="botao-linha" data-detalhe="${v.id}">Detalhes</button>
            ${rascunho ? `<button class="botao-linha" data-pagar="${v.id}">Pagar</button>` : ''}
            ${rascunho ? `<button class="botao-linha perigo" data-cancelar="${v.id}">Cancelar</button>` : ''}
          </td>
        </tr>`;
    }).join('');
  }

  // ---------------- carrinho ----------------

  function totalDoCarrinho() {
    const bruto = carrinho.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
    const desconto = Number(document.getElementById('venda-desconto').value) || 0;
    const valorDesconto = bruto * (desconto / 100);
    return { bruto, valorDesconto, total: bruto - valorDesconto };
  }

  function desenharCarrinho() {
    const corpo = document.querySelector('#tabela-carrinho tbody');

    if (!carrinho.length) {
      corpo.innerHTML = '<tr><td class="vazio" colspan="5">Nenhum item adicionado.</td></tr>';
    } else {
      corpo.innerHTML = carrinho.map((item, indice) => `
        <tr>
          <td>${Ui.texto(item.nome)}</td>
          <td>${item.quantidade}</td>
          <td>${Ui.moeda(item.preco)}</td>
          <td>${Ui.moeda(item.preco * item.quantidade)}</td>
          <td class="acoes">
            <button class="botao-linha perigo" data-remover="${indice}">Remover</button>
          </td>
        </tr>`).join('');
    }

    const { bruto, valorDesconto, total } = totalDoCarrinho();
    document.getElementById('venda-bruto').textContent = Ui.moeda(bruto);
    document.getElementById('venda-valor-desconto').textContent = `- ${Ui.moeda(valorDesconto)}`;
    document.getElementById('venda-total').textContent = Ui.moeda(total);
    document.getElementById('finalizar-venda').disabled = carrinho.length === 0;
  }

  async function abrirAdicaoDeItem() {
    await Produtos.carregar();
    const produtos = Produtos.carregados();

    if (!produtos.length) {
      Ui.avisar('Cadastre um produto antes de iniciar uma venda.', 'erro');
      return;
    }

    Ui.abrirFormulario({
      titulo: 'Adicionar item',
      campos: [
        {
          nome: 'produtoId', rotulo: 'Produto', tipo: 'select',
          opcoes: produtos.map((p) => ({
            valor: p.id, rotulo: `${p.nome} — ${Ui.moeda(p.preco)}`,
          })),
        },
        { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'number', min: '1', valor: 1 },
      ],
      aoSalvar: (valores) => {
        const produto = produtos.find((p) => String(p.id) === String(valores.produtoId));
        const quantidade = Number(valores.quantidade);

        // Mesmo produto duas vezes vira uma linha só, com a soma.
        const existente = carrinho.find((i) => i.produtoId === produto.id);
        if (existente) {
          existente.quantidade += quantidade;
        } else {
          carrinho.push({
            produtoId: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco),
            quantidade,
          });
        }
        desenharCarrinho();
      },
    });
  }

  function limparCarrinho() {
    carrinho = [];
    document.getElementById('venda-desconto').value = 0;
    desenharCarrinho();
  }

  async function criarVenda() {
    const usuario = Api.usuarioLogado();

    try {
      const venda = await Api.criarVenda({
        funcionarioId: usuario?.id ?? 1,
        descontoPercentual: Number(document.getElementById('venda-desconto').value) || 0,
        itens: carrinho.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      });

      Ui.avisar(`Venda #${venda.id} criada. Agora é só receber o pagamento.`);
      limparCarrinho();
      await carregar();
      abrirPagamento(venda.id, venda.valorTotal);
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  // ---------------- pagamento ----------------

  function abrirPagamento(vendaId, valorTotal) {
    Ui.abrirFormulario({
      titulo: `Pagamento da venda #${vendaId}`,
      campos: [
        {
          nome: 'valor', rotulo: 'Valor a receber', valor: Ui.moeda(valorTotal ?? 0),
          somenteLeitura: true, obrigatorio: false,
        },
        { nome: 'formaPagamento', rotulo: 'Forma de pagamento', tipo: 'select', opcoes: FORMAS },
      ],
      aoSalvar: async (valores) => {
        const venda = await Api.pagarVenda(vendaId, valores.formaPagamento);

        // Pagamento recusado volta 200 com o status no corpo: nao e erro de
        // requisicao, e resultado de negocio.
        if (venda.status === 'FINALIZADA') {
          Ui.avisar(`Venda #${vendaId} finalizada. Estoque baixado.`);
        } else {
          Ui.avisar(`Pagamento recusado. A venda #${vendaId} segue em aberto.`, 'erro');
        }

        await carregar();
      },
    });
  }

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
            <div><span>Bruto</span><strong>${Ui.moeda(venda.valorBruto)}</strong></div>
            <div><span>Desconto (${venda.descontoPercentual ?? 0}%)</span><strong>- ${Ui.moeda(venda.valorDesconto)}</strong></div>
            <div class="destaque"><span>Total</span><strong>${Ui.moeda(venda.valorTotal)}</strong></div>
            <div><span>Situação</span><strong>${Ui.texto(Ui.rotulo(venda.status))}</strong></div>
            ${venda.pagamentoId ? `<div><span>Pagamento</span><strong>#${venda.pagamentoId}</strong></div>` : ''}
          </div>`,
      });
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
      await carregar();
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  // ---------------- ligação com a tela ----------------

  function iniciar() {
    document.getElementById('adicionar-item').addEventListener('click', abrirAdicaoDeItem);
    document.getElementById('limpar-venda').addEventListener('click', limparCarrinho);
    document.getElementById('finalizar-venda').addEventListener('click', criarVenda);
    document.getElementById('venda-desconto').addEventListener('input', desenharCarrinho);
    document.getElementById('filtro-status-venda').addEventListener('change', carregar);

    document.querySelector('#tabela-carrinho tbody').addEventListener('click', (evento) => {
      const indice = evento.target.dataset.remover;
      if (indice !== undefined) {
        carrinho.splice(Number(indice), 1);
        desenharCarrinho();
      }
    });

    tabela().addEventListener('click', (evento) => {
      const dados = evento.target.dataset;
      if (dados.detalhe) {
        mostrarDetalhe(dados.detalhe);
      }
      if (dados.pagar) {
        abrirPagamento(dados.pagar);
      }
      if (dados.cancelar) {
        cancelar(dados.cancelar);
      }
    });

    desenharCarrinho();
  }

  return { iniciar, carregar };
})();
