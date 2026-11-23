/**
 * Tela de Estoque: consome o estoque-service.
 *
 * O estoque guarda apenas produtoId, quantidade e mínimo. O nome do produto
 * vem do produto-service e é juntado aqui, na tela. É assim que uma interface
 * de microsserviços compõe dados: cada serviço entrega o que é dele.
 */
const Estoque = (() => {

  const tabela = () => document.getElementById('tabela-estoque');

  function nomeDoProduto(produtoId) {
    const produto = Produtos.carregados().find((p) => String(p.id) === String(produtoId));
    return produto ? `${produto.nome} (#${produtoId})` : `Produto #${produtoId}`;
  }

  async function carregar() {
    const apenasBaixos = document.getElementById('apenas-baixos').checked;

    try {
      // Garante que a lista de produtos exista para traduzir os ids em nomes.
      if (!Produtos.carregados().length) {
        await Produtos.carregar();
      }

      const estoques = apenasBaixos
        ? await Api.listarEstoquesBaixos()
        : await Api.listarEstoques();

      desenhar(estoques);
    } catch (erro) {
      Ui.avisarErro(erro);
      Ui.linhaVazia(tabela(), 5, 'Não foi possível carregar o estoque.');
    }
  }

  function desenhar(estoques) {
    if (!estoques.length) {
      Ui.linhaVazia(tabela(), 5, 'Nenhum estoque cadastrado.');
      return;
    }

    tabela().querySelector('tbody').innerHTML = estoques.map((e) => {
      const situacao = e.estoqueBaixo
        ? (e.quantidade === 0
          ? '<span class="etiqueta erro">sem estoque</span>'
          : '<span class="etiqueta alerta">estoque baixo</span>')
        : '<span class="etiqueta ok">ok</span>';

      return `
        <tr>
          <td>${Ui.texto(nomeDoProduto(e.produtoId))}</td>
          <td>${e.quantidade}</td>
          <td>${e.estoqueMinimo}</td>
          <td>${situacao}</td>
          <td class="acoes">
            <button class="botao-linha" data-entrada="${e.produtoId}">Entrada</button>
            <button class="botao-linha" data-saida="${e.produtoId}">Saída</button>
            <button class="botao-linha" data-minimo="${e.produtoId}">Mínimo</button>
            <button class="botao-linha" data-historico="${e.produtoId}">Histórico</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function abrirCadastro() {
    await Produtos.carregar();

    const opcoes = Produtos.carregados().map((p) => ({ valor: p.id, rotulo: `${p.nome} (#${p.id})` }));

    if (!opcoes.length) {
      Ui.avisar('Cadastre um produto antes de criar o estoque dele.', 'erro');
      return;
    }

    Ui.abrirFormulario({
      titulo: 'Cadastrar estoque',
      campos: [
        {
          nome: 'produtoId', rotulo: 'Produto', tipo: 'select', opcoes,
          ajuda: 'O estoque confirma o produto na API de Produtos antes de salvar.',
        },
        { nome: 'quantidade', rotulo: 'Quantidade inicial', tipo: 'number', min: '0', valor: 0 },
        { nome: 'estoqueMinimo', rotulo: 'Estoque mínimo', tipo: 'number', min: '0', valor: 0 },
      ],
      aoSalvar: async (valores) => {
        await Api.criarEstoque({
          produtoId: Number(valores.produtoId),
          quantidade: Number(valores.quantidade),
          estoqueMinimo: Number(valores.estoqueMinimo),
        });
        Ui.avisar('Estoque cadastrado.');
        await carregar();
      },
    });
  }

  function abrirMovimentacao(produtoId, tipo) {
    const entrada = tipo === 'entrada';

    Ui.abrirFormulario({
      titulo: `${entrada ? 'Entrada' : 'Saída'} — ${nomeDoProduto(produtoId)}`,
      campos: [
        { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'number', min: '1', valor: 1 },
        {
          nome: 'observacao', rotulo: 'Observação', obrigatorio: false, maximo: 255,
          ajuda: entrada ? 'Ex.: nota fiscal da reposição.' : 'Ex.: número da venda.',
        },
      ],
      aoSalvar: async (valores) => {
        const corpo = {
          quantidade: Number(valores.quantidade),
          observacao: valores.observacao?.trim() || null,
        };
        if (entrada) {
          await Api.darEntrada(produtoId, corpo);
        } else {
          await Api.darSaida(produtoId, corpo);
        }
        Ui.avisar(entrada ? 'Entrada registrada.' : 'Saída registrada.');
        await carregar();
      },
    });
  }

  function abrirEstoqueMinimo(produtoId) {
    Ui.abrirFormulario({
      titulo: `Estoque mínimo — ${nomeDoProduto(produtoId)}`,
      campos: [
        { nome: 'estoqueMinimo', rotulo: 'Novo mínimo', tipo: 'number', min: '0', valor: 0 },
      ],
      aoSalvar: async (valores) => {
        await Api.alterarEstoqueMinimo(produtoId, Number(valores.estoqueMinimo));
        Ui.avisar('Estoque mínimo atualizado.');
        await carregar();
      },
    });
  }

  async function mostrarHistorico(produtoId) {
    try {
      const movimentacoes = await Api.listarMovimentacoes(produtoId);

      const linhas = movimentacoes.length
        ? movimentacoes.map((m) => `
            <tr>
              <td>${Ui.dataHora(m.data)}</td>
              <td>${m.tipo === 'ENTRADA'
                ? '<span class="etiqueta ok">entrada</span>'
                : '<span class="etiqueta alerta">saída</span>'}</td>
              <td>${m.quantidade}</td>
              <td>${m.quantidadeResultante}</td>
              <td>${Ui.texto(m.observacao || '—')}</td>
            </tr>`).join('')
        : '<tr><td class="vazio" colspan="5">Sem movimentações.</td></tr>';

      Ui.abrirConteudo({
        titulo: `Histórico — ${nomeDoProduto(produtoId)}`,
        html: `
          <div class="tabela-rolavel">
            <table>
              <thead>
                <tr><th>Data</th><th>Tipo</th><th>Qtd.</th><th>Saldo</th><th>Observação</th></tr>
              </thead>
              <tbody>${linhas}</tbody>
            </table>
          </div>`,
      });
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  function iniciar() {
    document.getElementById('novo-estoque').addEventListener('click', abrirCadastro);
    document.getElementById('apenas-baixos').addEventListener('change', carregar);

    tabela().addEventListener('click', (evento) => {
      const dados = evento.target.dataset;
      if (dados.entrada) {
        abrirMovimentacao(dados.entrada, 'entrada');
      }
      if (dados.saida) {
        abrirMovimentacao(dados.saida, 'saida');
      }
      if (dados.minimo) {
        abrirEstoqueMinimo(dados.minimo);
      }
      if (dados.historico) {
        mostrarHistorico(dados.historico);
      }
    });
  }

  return { iniciar, carregar };
})();
