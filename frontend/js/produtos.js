/**
 * Tela de Produtos: consome o produto-service.
 */
const Produtos = (() => {

  const TIPOS = [
    { valor: 'MEDICAMENTO', rotulo: 'Medicamento' },
    { valor: 'GENERICO', rotulo: 'Genérico' },
    { valor: 'COSMETICO', rotulo: 'Cosmético' },
    { valor: 'HIGIENE_PESSOAL', rotulo: 'Higiene pessoal' },
    { valor: 'SUPLEMENTO', rotulo: 'Suplemento' },
    { valor: 'OUTRO', rotulo: 'Outro' },
  ];

  let cache = [];

  const tabela = () => document.getElementById('tabela-produtos');

  /** Outras telas usam isto para montar listas de produto sem refazer o fetch. */
  function carregados() {
    return cache;
  }

  async function carregar() {
    const filtros = {
      nome: document.getElementById('filtro-nome').value,
      tipo: document.getElementById('filtro-tipo').value,
    };

    try {
      cache = await Api.listarProdutos(filtros);
      desenhar(cache);
    } catch (erro) {
      Ui.avisarErro(erro);
      Ui.linhaVazia(tabela(), 6, 'Não foi possível carregar os produtos.');
    }
  }

  function desenhar(produtos) {
    if (!produtos.length) {
      Ui.linhaVazia(tabela(), 6, 'Nenhum produto encontrado.');
      return;
    }

    tabela().querySelector('tbody').innerHTML = produtos.map((p) => `
      <tr>
        <td>${p.id}</td>
        <td>${Ui.texto(p.nome)}</td>
        <td>${Ui.texto(Ui.rotulo(p.tipo))}</td>
        <td>${Ui.moeda(p.preco)}</td>
        <td>${Ui.texto(p.codigoBarras)}</td>
        <td class="acoes">
          <button class="botao-linha" data-editar="${p.id}">Editar</button>
          <button class="botao-linha perigo" data-excluir="${p.id}">Excluir</button>
        </td>
      </tr>
    `).join('');
  }

  function camposDoFormulario(produto) {
    return [
      { nome: 'nome', rotulo: 'Nome', valor: produto?.nome, maximo: 120 },
      { nome: 'descricao', rotulo: 'Descrição', valor: produto?.descricao, obrigatorio: false, maximo: 255 },
      { nome: 'preco', rotulo: 'Preço (R$)', tipo: 'number', passo: '0.01', min: '0.01', valor: produto?.preco },
      {
        nome: 'codigoBarras', rotulo: 'Código de barras', valor: produto?.codigoBarras,
        maximo: 50, ajuda: 'Entre 8 e 50 caracteres, único por produto.',
      },
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS, valor: produto?.tipo },
    ];
  }

  /** O backend recusa descricao vazia como string, entao mandamos null. */
  function montarCorpo(valores) {
    return {
      nome: valores.nome.trim(),
      descricao: valores.descricao?.trim() || null,
      preco: Number(valores.preco),
      codigoBarras: valores.codigoBarras.trim(),
      tipo: valores.tipo,
    };
  }

  function abrirNovo() {
    Ui.abrirFormulario({
      titulo: 'Novo produto',
      campos: camposDoFormulario(null),
      aoSalvar: async (valores) => {
        await Api.criarProduto(montarCorpo(valores));
        Ui.avisar('Produto cadastrado.');
        await carregar();
      },
    });
  }

  function abrirEdicao(id) {
    const produto = cache.find((p) => String(p.id) === String(id));
    if (!produto) {
      return;
    }

    Ui.abrirFormulario({
      titulo: `Editar ${produto.nome}`,
      campos: camposDoFormulario(produto),
      aoSalvar: async (valores) => {
        await Api.editarProduto(id, montarCorpo(valores));
        Ui.avisar('Produto atualizado.');
        await carregar();
      },
    });
  }

  async function excluir(id) {
    const produto = cache.find((p) => String(p.id) === String(id));
    if (!confirm(`Excluir "${produto?.nome ?? id}"?\n\nO produto sai das listagens, mas o código de barras continua reservado.`)) {
      return;
    }

    try {
      await Api.excluirProduto(id);
      Ui.avisar('Produto excluído.');
      await carregar();
    } catch (erro) {
      Ui.avisarErro(erro);
    }
  }

  function iniciar() {
    document.getElementById('novo-produto').addEventListener('click', abrirNovo);

    document.getElementById('filtro-produtos').addEventListener('submit', (evento) => {
      evento.preventDefault();
      carregar();
    });

    document.getElementById('limpar-filtro').addEventListener('click', () => {
      document.getElementById('filtro-nome').value = '';
      document.getElementById('filtro-tipo').value = '';
      carregar();
    });

    tabela().addEventListener('click', (evento) => {
      const editar = evento.target.dataset.editar;
      const excluirId = evento.target.dataset.excluir;
      if (editar) {
        abrirEdicao(editar);
      }
      if (excluirId) {
        excluir(excluirId);
      }
    });
  }

  return { iniciar, carregar, carregados, TIPOS };
})();
