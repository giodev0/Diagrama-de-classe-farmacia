/**
 * Tela de Relatórios: consome o relatorio-service.
 *
 * O relatorio-service guarda uma cópia dos dados de Produtos, Estoque e
 * Vendas, atualizada em POST /relatorios/sincronizar. As rotas de leitura
 * devolvem listas simples; os indicadores (faturamento, ticket médio,
 * estoque baixo) são somados aqui, só para exibição.
 */
const Relatorios = (() => {

  const area = () => document.getElementById('relatorio-resultado');

  /** 502/504 vêm do nginx quando o container não responde. */
  function servicoIndisponivel(erro) {
    return [0, 502, 503, 504].includes(erro.status);
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

  // ---------------- peças de desenho ----------------

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

  const SEM_DADOS = 'Nada sincronizado ainda. Clique em "Sincronizar dados".';

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

  /** "AAAA-MM-DD" no fuso do navegador (toISOString usaria UTC). */
  function dataLocal(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
  }

  // ---------------- relatórios ----------------

  function relatorioDeVendas() {
    return comTratamento(async () => {
      const inicio = document.getElementById('relatorio-inicio').value;
      const fim = document.getElementById('relatorio-fim').value;

      // A data vem do venda-service sem fuso ("2026-11-26T14:03:00"), então
      // os 10 primeiros caracteres já são o dia da venda.
      const vendas = (await Api.relatorioDeVendas()).filter((v) => {
        const dia = String(v.data).slice(0, 10);
        return (!inicio || dia >= inicio) && (!fim || dia <= fim);
      });

      const faturamento = vendas.reduce((soma, v) => soma + Number(v.valorTotal), 0);
      const ticketMedio = vendas.length ? faturamento / vendas.length : 0;

      const linhas = vendas.map((v) => `
        <tr>
          <td>#${v.vendaId}</td>
          <td>${Ui.dataHora(v.data)}</td>
          <td>${Ui.moeda(v.valorTotal)}</td>
        </tr>`);

      area().innerHTML = `
        <h3>Vendas finalizadas</h3>
        <div class="indicadores">
          ${cartao('Vendas', vendas.length)}
          ${cartao('Faturamento', Ui.moeda(faturamento))}
          ${cartao('Ticket médio', Ui.moeda(ticketMedio))}
        </div>
        ${tabela(['Venda', 'Data', 'Total'], linhas, 'Nenhuma venda finalizada no período.')}`;
    });
  }

  function relatorioDeProdutos() {
    return comTratamento(async () => {
      const produtos = await Api.relatorioDeProdutos();
      const unidades = produtos.reduce((soma, p) => soma + Number(p.quantidadeVendida), 0);
      const vendidos = produtos.filter((p) => p.quantidadeVendida > 0);

      const linhas = produtos.map((p, posicao) => `
        <tr>
          <td>${p.quantidadeVendida > 0 ? `${posicao + 1}º` : '—'}</td>
          <td>${Ui.texto(p.nome)}</td>
          <td>${p.quantidadeVendida}</td>
        </tr>`);

      area().innerHTML = `
        <h3>Produtos mais vendidos</h3>
        <div class="indicadores">
          ${cartao('Produtos', produtos.length)}
          ${cartao('Com vendas', vendidos.length)}
          ${cartao('Unidades vendidas', unidades)}
        </div>
        ${tabela(['Posição', 'Produto', 'Qtd. vendida'], linhas, SEM_DADOS)}`;
    });
  }

  function relatorioDeEstoque() {
    return comTratamento(async () => {
      const estoques = await Api.relatorioDeEstoque();

      // O relatório de estoque só tem o produtoId. O nome é do
      // produto-service; se ele estiver fora, a tela mostra só o id.
      let nomes = new Map();
      try {
        nomes = new Map((await Api.listarProdutos()).map((p) => [p.id, p.nome]));
      } catch {
        // Segue sem os nomes.
      }

      // Mesma regra do estoque-service: baixo é quantidade <= mínimo.
      const situacao = (e) => {
        if (e.quantidade === 0) return 'SEM_ESTOQUE';
        if (e.quantidade <= e.estoqueMinimo) return 'BAIXO';
        return 'OK';
      };

      const etiquetas = { OK: 'ok', BAIXO: 'alerta', SEM_ESTOQUE: 'erro' };
      const contagem = { OK: 0, BAIXO: 0, SEM_ESTOQUE: 0 };

      const linhas = estoques.map((e) => {
        const s = situacao(e);
        contagem[s] += 1;
        return `
          <tr>
            <td>${Ui.texto(nomes.get(e.produtoId) || `Produto #${e.produtoId}`)}</td>
            <td>${e.quantidade}</td>
            <td>${e.estoqueMinimo}</td>
            <td><span class="etiqueta ${etiquetas[s]}">${Ui.texto(Ui.rotulo(s))}</span></td>
          </tr>`;
      });

      area().innerHTML = `
        <h3>Situação do estoque</h3>
        <div class="indicadores">
          ${cartao('Produtos', estoques.length)}
          ${cartao('Estoque baixo', contagem.BAIXO)}
          ${cartao('Em falta', contagem.SEM_ESTOQUE)}
        </div>
        ${tabela(['Produto', 'Quantidade', 'Mínimo', 'Situação'], linhas, SEM_DADOS)}`;
    });
  }

  async function sincronizar() {
    const botao = document.getElementById('sincronizar-relatorios');
    botao.disabled = true;
    try {
      const r = await Api.sincronizarRelatorios();
      const reg = r.registros || {};
      Ui.avisar(`Sincronizado: ${reg.produtos ?? 0} produtos, ${reg.estoque ?? 0} estoques, ${reg.vendas ?? 0} vendas.`);

      // O relatorio-service não falha se um serviço de origem estiver fora:
      // ele só pula aquela parte. Avisa quais ficaram desatualizados.
      const nomes = { produtos: 'Produtos', estoque: 'Estoque', vendas: 'Vendas' };
      const falharam = Object.entries(r.servicos || {})
        .filter(([, ok]) => !ok)
        .map(([chave]) => nomes[chave] || chave);
      if (falharam.length) {
        Ui.avisar(`Não foi possível ler: ${falharam.join(', ')}. Esses dados não foram atualizados.`, 'erro');
      }
    } catch (erro) {
      if (servicoIndisponivel(erro)) {
        mostrarIndisponivel();
        return;
      }
      Ui.avisarErro(erro);
    } finally {
      botao.disabled = false;
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
    document.getElementById('relatorio-inicio').value = dataLocal(primeiroDia);
    document.getElementById('relatorio-fim').value = dataLocal(hoje);
  }

  return { iniciar, carregar };
})();
