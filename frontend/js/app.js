/**
 * Monta a aplicacao: login, navegacao entre abas e carregamento sob demanda.
 */
(() => {

  /** Cada aba sabe quem recarregar quando e aberta. */
  const CARREGADORES = {
    produtos: Produtos.carregar,
    estoque: Estoque.carregar,
    vendas: Vendas.carregar,
    pagamentos: Pagamentos.carregar,
    relatorios: Relatorios.carregar,
  };

  function trocarSecao(nome) {
    document.querySelectorAll('.aba').forEach((aba) => {
      aba.classList.toggle('ativa', aba.dataset.secao === nome);
    });

    document.querySelectorAll('.secao').forEach((secao) => {
      secao.classList.toggle('ativa', secao.id === `secao-${nome}`);
    });

    CARREGADORES[nome]?.();
  }

  function mostrarApp() {
    document.getElementById('tela-login').hidden = true;
    document.getElementById('app').hidden = false;

    const usuario = Api.usuarioLogado();
    document.getElementById('usuario-logado').textContent =
      usuario ? `${usuario.email} · ${Ui.rotulo(usuario.tipo)}` : '';

    trocarSecao('produtos');
  }

  function iniciar() {
    Ui.iniciar();
    Auth.iniciar(mostrarApp);
    Produtos.iniciar();
    Estoque.iniciar();
    Vendas.iniciar();
    Pagamentos.iniciar();
    Relatorios.iniciar();

    document.querySelectorAll('.aba').forEach((aba) => {
      aba.addEventListener('click', () => trocarSecao(aba.dataset.secao));
    });

    // Recarregar a pagina com a sessao ainda aberta nao deve pedir login de novo.
    if (Auth.estaLogado()) {
      mostrarApp();
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
