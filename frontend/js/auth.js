/**
 * Login contra o usuario-service.
 *
 * O token JWT fica em sessionStorage: some quando a aba fecha, o que e o
 * comportamento certo para um caixa de farmacia compartilhado.
 */
const Auth = (() => {

  /** Le o payload do JWT so para mostrar o perfil na tela. */
  function lerPayload(token) {
    try {
      const corpo = token.split('.')[1];
      const json = atob(corpo.replaceAll('-', '+').replaceAll('_', '/'));
      return JSON.parse(json);
    } catch {
      return {};
    }
  }

  async function entrar(email, senha) {
    const resposta = await Api.login(email, senha);
    const token = resposta.accessToken || resposta.access_token;

    if (!token) {
      throw new Api.ErroApi(500, 'O servidor não devolveu um token de acesso');
    }

    const payload = lerPayload(token);
    Api.guardarSessao(token, { email, tipo: payload.tipo || 'FUNCIONARIO' });
    return token;
  }

  function sair() {
    Api.limparSessao();
    window.location.reload();
  }

  function estaLogado() {
    return Boolean(Api.token());
  }

  function iniciar(aoEntrar) {
    const form = document.getElementById('form-login');
    const caixaErro = document.getElementById('login-erro');

    form.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      caixaErro.hidden = true;

      const botao = form.querySelector('button[type="submit"]');
      botao.disabled = true;
      botao.textContent = 'Entrando...';

      try {
        await entrar(
          document.getElementById('login-email').value.trim(),
          document.getElementById('login-senha').value,
        );
        aoEntrar();
      } catch (erro) {
        caixaErro.textContent = erro.message;
        caixaErro.hidden = false;
      } finally {
        botao.disabled = false;
        botao.textContent = 'Entrar';
      }
    });

    document.getElementById('botao-sair').addEventListener('click', sair);
  }

  return { iniciar, sair, estaLogado };
})();
