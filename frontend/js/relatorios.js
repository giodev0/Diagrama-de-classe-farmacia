/**
 * Tela de Relatórios: consome o relatorio-service.
 *
 * Segue o contrato de CONTRATOS.md. Enquanto o serviço não existe, a tela
 * mostra um aviso em vez de quebrar.
 */
const Relatorios = (() => {

  const area = () => document.getElementById('relatorio-resultado');

  function servicoIndisponivel(erro) {
    return erro.status === 503 || erro.status === 404 || erro.status === 0;
  }

  function mostrarIndisponivel() {
    document.getElementById('relatorios-indisponivel').hidden = false;
    document.getElementById('relatorios-conteudo').hidden = true;
  }

  function mostrarConteudo() {
    document.getElementById('relatorios-indisponivel').hidden = true;
    document.getElementById('relatorios-conteudo').hidden = false;
  }

  /** Só confere se o serviço responde; não desenha nada ainda. */
  async function carregar() {
    try {
      await Api.relatorioDeEstoque();
      mostrarConteudo();
    } catch (erro) {
      if (servicoIndisponivel(erro)) {
        mostrarIndisponivel();
      } else {
        mostrarConteudo();
      }
    }
  }

  function cartao(rotulo, valor) {
    return `<div class="cartao-indicador">
              <span>${Ui.texto(rotulo)}</span>
              <strong>${Ui.texto(valor)}</strong>
            </div>`;
  }

  function tabela(colunas, linhas, vazio) {
    if (!linhas.length) {
      return `<p class="vazio">${Ui.texto(vazio)}</p>`;
    }
    return `<div class="tabela-rolavel">
              <table>
                <thead><tr>${colunas.map((c) => `<th>${Ui.texto(c)}</th>`).join('')}</tr></thead>
                <tbody>${linhas.join('')}</tbody>
              </table>
            </div>`;
  }

  async function comTratamento(acao) {
    area().innerHTML = '<p class="vazio">Gerando relatório...</p>';
    try {
      await acao();
    } catch (erro) {
      if (servicoIndisponivel(erro)) {
        mostrarIndisponivel();
        return;
      }
      Ui.avisarErro(erro);
      area().innerHTML = '<p class="vazio">Não foi possível gerar o relatório.</p>';
    }
  }

  function relatorioDeVendas() {
    return comTratamento(async () => {
      const dados = await Api.relatorioDeVendas({
        dataInicio: document.getElementById('relatorio-inicio').value,
        dataFim: document.getElementById('relatorio-fim').value,
      });

      const r = dados.resumo || {};
      const linhas = (dados.vendas || []).map((v) => `
        <tr>
          <td>${v.vendaId}</td>
          <td>${Ui.dataHora(v.data)}</td>
          <td>${Ui.moeda(v.valorTotal)}</td>
          <td>${Ui.texto(Ui.rotulo(v.formaPagamento))}</td>
          <td>${Ui.texto(Ui.rotulo(v.status))}</td>
        </tr>`);

      const formas = (dados.porFormaPagamento || []).map((f) => `
        <tr>
          <td>${Ui.texto(Ui.rotulo(f.formaPagamento))}</td>
          <td>${f.quantidade}</td>
          <td>${Ui.moeda(f.valor)}</td>
        </tr>`);

      area().innerHTML = `
        <h3>Relatório de vendas</h3>
        <div class="indicadores">
          ${cartao('Vendas', r.quantidadeVendas ?? 0)}
          ${cartao('Faturamento', Ui.moeda(r.valorTotal ?? 0))}
          ${cartao('Ticket médio', Ui.moeda(r.ticketMedio ?? 0))}
          ${cartao('Descontos', Ui.moeda(r.totalDescontos ?? 0))}
        </div>
        <h4>Por forma de pagamento</h4>
        ${tabela(['Forma', 'Qtd.', 'Valor'], formas, 'Sem pagamentos no período.')}
        <h4>Vendas do período</h4>
        ${tabela(['Venda', 'Data', 'Total', 'Forma', 'Situação'], linhas, 'Sem vendas no período.')}`;
    });
  }

  function relatorioDeProdutos() {
    return comTratamento(async () => {
      const dados = await Api.relatorioDeProdutos();

      const linhas = (dados.itens || []).map((i) => `
        <tr>
          <td>${Ui.texto(i.nome)}</td>
          <td>${Ui.texto(Ui.rotulo(i.tipo))}</td>
          <td>${i.quantidadeVendida}</td>
          <td>${Ui.moeda(i.valorVendido)}</td>
        </tr>`);

      area().innerHTML = `
        <h3>Produtos mais vendidos</h3>
        <p class="ajuda">Gerado em ${Ui.dataHora(dados.geradoEm)}</p>
        ${tabela(['Produto', 'Tipo', 'Qtd. vendida', 'Valor'], linhas, 'Nenhuma venda registrada.')}`;
    });
  }

  function relatorioDeEstoque() {
    return comTratamento(async () => {
      const dados = await Api.relatorioDeEstoque();
      const r = dados.resumo || {};

      const etiquetas = { OK: 'ok', BAIXO: 'alerta', SEM_ESTOQUE: 'erro' };
      const linhas = (dados.itens || []).map((i) => `
        <tr>
          <td>${Ui.texto(i.nome)}</td>
          <td>${i.quantidade}</td>
          <td>${i.estoqueMinimo}</td>
          <td><span class="etiqueta ${etiquetas[i.situacao] || 'alerta'}">${Ui.texto(Ui.rotulo(i.situacao))}</span></td>
        </tr>`);

      area().innerHTML = `
        <h3>Situação do estoque</h3>
        <p class="ajuda">Gerado em ${Ui.dataHora(dados.geradoEm)}</p>
        <div class="indicadores">
          ${cartao('Produtos', r.totalProdutos ?? 0)}
          ${cartao('Estoque baixo', r.produtosComEstoqueBaixo ?? 0)}
          ${cartao('Em falta', r.produtosEmFalta ?? 0)}
        </div>
        ${tabela(['Produto', 'Quantidade', 'Mínimo', 'Situação'], linhas, 'Nenhum estoque cadastrado.')}`;
    });
  }

  async function sincronizar() {
    try {
      const r = await Api.sincronizarRelatorios();
      Ui.avisar(`Sincronizado: ${r.produtos ?? 0} produtos, ${r.estoques ?? 0} estoques, ${r.vendas ?? 0} vendas.`);
    } catch (erro) {
      if (servicoIndisponivel(erro)) {
        mostrarIndisponivel();
        return;
      }
      Ui.avisarErro(erro);
    }
  }

  function iniciar() {
    document.getElementById('relatorio-vendas').addEventListener('click', relatorioDeVendas);
    document.getElementById('relatorio-produtos').addEventListener('click', relatorioDeProdutos);
    document.getElementById('relatorio-estoque').addEventListener('click', relatorioDeEstoque);
    document.getElementById('sincronizar-relatorios').addEventListener('click', sincronizar);

    // Período padrão: o mês corrente.
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    document.getElementById('relatorio-inicio').value = primeiroDia.toISOString().slice(0, 10);
    document.getElementById('relatorio-fim').value = hoje.toISOString().slice(0, 10);
  }

  return { iniciar, carregar };
})();
