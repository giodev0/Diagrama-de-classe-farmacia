/**
 * Camada de acesso aos microsservicos.
 *
 * Todas as chamadas passam pelo nginx, que encaminha cada caminho /api para o
 * servico dono daquele dado. O frontend nao conhece porta nem host de ninguem.
 */
const Api = (() => {

  const CAMINHOS = {
    auth: '/api/auth',
    usuarios: '/api/usuarios',
    produtos: '/api/produtos',
    estoques: '/api/estoque',
    pagamentos: '/api/pagamentos',
    vendas: '/api/vendas',
    relatorios: '/api/relatorios',
  };

  const CHAVE_TOKEN = 'farmacia.token';
  const CHAVE_USUARIO = 'farmacia.usuario';

  /** Erro de API com o status HTTP junto, para a tela decidir o que mostrar. */
  class ErroApi extends Error {
    constructor(status, mensagem, campos) {
      super(mensagem);
      this.name = 'ErroApi';
      this.status = status;
      this.campos = campos || null;
    }
  }

  function token() {
    return sessionStorage.getItem(CHAVE_TOKEN);
  }

  function guardarSessao(tokenRecebido, usuario) {
    sessionStorage.setItem(CHAVE_TOKEN, tokenRecebido);
    sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  }

  function usuarioLogado() {
    const bruto = sessionStorage.getItem(CHAVE_USUARIO);
    return bruto ? JSON.parse(bruto) : null;
  }

  function limparSessao() {
    sessionStorage.removeItem(CHAVE_TOKEN);
    sessionStorage.removeItem(CHAVE_USUARIO);
  }

  /**
   * Extrai a mensagem de erro das duas formas que os servicos usam:
   * - produtos, estoque, vendas, pagamentos e relatorios: { erro, campos }
   * - usuarios (FastAPI):  { detail }
   */
  function mensagemDeErro(corpo, status) {
    if (!corpo) {
      return `Erro ${status}`;
    }
    if (corpo.campos) {
      const detalhes = Object.entries(corpo.campos)
        .map(([campo, texto]) => `${campo}: ${texto}`)
        .join('; ');
      return `${corpo.erro || 'Dados inválidos'} (${detalhes})`;
    }
    if (corpo.erro) {
      return corpo.erro;
    }
    if (typeof corpo.detail === 'string') {
      return corpo.detail;
    }
    if (Array.isArray(corpo.detail)) {
      return corpo.detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
    }
    return `Erro ${status}`;
  }

  async function requisitar(url, opcoes = {}) {
    const cabecalhos = { ...(opcoes.headers || {}) };

    if (opcoes.corpo !== undefined) {
      cabecalhos['Content-Type'] = 'application/json';
    }
    if (opcoes.autenticado !== false && token()) {
      cabecalhos['Authorization'] = `Bearer ${token()}`;
    }

    let resposta;
    try {
      resposta = await fetch(url, {
        method: opcoes.metodo || 'GET',
        headers: cabecalhos,
        body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      });
    } catch (falhaDeRede) {
      // fetch so rejeita quando nem chegou a ter resposta HTTP.
      throw new ErroApi(0, 'Não foi possível falar com o servidor. O serviço está no ar?');
    }

    // 204 e 205 nao tem corpo.
    const semConteudo = resposta.status === 204 || resposta.status === 205;
    let corpo = null;

    if (!semConteudo) {
      const texto = await resposta.text();
      if (texto) {
        try {
          corpo = JSON.parse(texto);
        } catch {
          corpo = { erro: texto };
        }
      }
    }

    if (!resposta.ok) {
      throw new ErroApi(resposta.status, mensagemDeErro(corpo, resposta.status), corpo?.campos);
    }

    return corpo;
  }

  function comParametros(caminho, parametros) {
    const query = new URLSearchParams();
    Object.entries(parametros || {}).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
        query.append(chave, valor);
      }
    });
    const texto = query.toString();
    return texto ? `${caminho}?${texto}` : caminho;
  }

  return {
    ErroApi,
    token,
    guardarSessao,
    usuarioLogado,
    limparSessao,

    // ---- usuarios ----
    login: (email, senha) => requisitar(`${CAMINHOS.auth}/login`, {
      metodo: 'POST', corpo: { email, senha }, autenticado: false,
    }),

    // ---- produtos ----
    listarProdutos: (filtros) => requisitar(comParametros(CAMINHOS.produtos, filtros)),
    buscarProduto: (id) => requisitar(`${CAMINHOS.produtos}/${id}`),
    criarProduto: (dados) => requisitar(CAMINHOS.produtos, { metodo: 'POST', corpo: dados }),
    editarProduto: (id, dados) => requisitar(`${CAMINHOS.produtos}/${id}`, { metodo: 'PUT', corpo: dados }),
    excluirProduto: (id) => requisitar(`${CAMINHOS.produtos}/${id}`, { metodo: 'DELETE' }),

    // ---- estoque ----
    listarEstoques: () => requisitar(CAMINHOS.estoques),
    listarEstoquesBaixos: () => requisitar(`${CAMINHOS.estoques}/baixos`),
    criarEstoque: (dados) => requisitar(CAMINHOS.estoques, { metodo: 'POST', corpo: dados }),
    darEntrada: (produtoId, dados) =>
      requisitar(`${CAMINHOS.estoques}/${produtoId}/entrada`, { metodo: 'POST', corpo: dados }),
    darSaida: (produtoId, dados) =>
      requisitar(`${CAMINHOS.estoques}/${produtoId}/saida`, { metodo: 'POST', corpo: dados }),
    alterarEstoqueMinimo: (produtoId, estoqueMinimo) =>
      requisitar(`${CAMINHOS.estoques}/${produtoId}/estoque-minimo`, {
        metodo: 'PATCH', corpo: { estoqueMinimo },
      }),
    listarMovimentacoes: (produtoId) =>
      requisitar(`${CAMINHOS.estoques}/${produtoId}/movimentacoes`),

    // ---- pagamentos ----
    listarPagamentos: () => requisitar(CAMINHOS.pagamentos),
    processarPagamento: (dados) => requisitar(CAMINHOS.pagamentos, { metodo: 'POST', corpo: dados }),

    // ---- vendas (venda-service) ----
    // A venda nasce vazia (o funcionario vem do token) e e montada no
    // servidor, item a item. Precos e totais sao sempre calculados la.
    listarVendas: (filtros) => requisitar(comParametros(CAMINHOS.vendas, filtros)),
    buscarVenda: (id) => requisitar(`${CAMINHOS.vendas}/${id}`),
    criarVenda: () => requisitar(CAMINHOS.vendas, { metodo: 'POST' }),
    adicionarItem: (id, produtoId, quantidade) =>
      requisitar(`${CAMINHOS.vendas}/${id}/itens`, {
        metodo: 'POST', corpo: { produtoId, quantidade },
      }),
    removerItem: (id, itemId) =>
      requisitar(`${CAMINHOS.vendas}/${id}/itens/${itemId}`, { metodo: 'DELETE' }),
    aplicarDesconto: (id, descontoPercentual) =>
      requisitar(`${CAMINHOS.vendas}/${id}/desconto`, {
        metodo: 'PUT', corpo: { descontoPercentual },
      }),
    finalizarVenda: (id, formaPagamento) =>
      requisitar(`${CAMINHOS.vendas}/${id}/finalizar`, {
        metodo: 'POST', corpo: { formaPagamento },
      }),
    cancelarVenda: (id) => requisitar(`${CAMINHOS.vendas}/${id}/cancelar`, { metodo: 'PUT' }),

    // ---- relatorios (relatorio-service) ----
    sincronizarRelatorios: () =>
      requisitar(`${CAMINHOS.relatorios}/sincronizar`, { metodo: 'POST' }),
    relatorioDeVendas: () => requisitar(`${CAMINHOS.relatorios}/vendas`),
    relatorioDeProdutos: () => requisitar(`${CAMINHOS.relatorios}/produtos`),
    relatorioDeEstoque: () => requisitar(`${CAMINHOS.relatorios}/estoque`),
  };
})();
