/**
 * Utilidades de tela: avisos, modal de formulario e formatacao.
 */
const Ui = (() => {

  const avisos = () => document.getElementById('avisos');

  function avisar(mensagem, tipo = 'sucesso') {
    const caixa = document.createElement('div');
    caixa.className = `aviso ${tipo}`;
    caixa.textContent = mensagem;
    avisos().appendChild(caixa);
    setTimeout(() => caixa.remove(), 4500);
  }

  function avisarErro(erro) {
    console.error(erro);
    avisar(erro instanceof Error ? erro.message : String(erro), 'erro');
  }

  /** Escapa texto vindo da API antes de jogar no HTML. */
  function texto(valor) {
    if (valor === null || valor === undefined) {
      return '';
    }
    return String(valor)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function moeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function dataHora(valor) {
    if (!valor) {
      return '';
    }
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
  }

  function rotulo(valor) {
    return String(valor || '').replaceAll('_', ' ').toLowerCase();
  }

  function linhaVazia(tabela, colunas, mensagem) {
    tabela.querySelector('tbody').innerHTML =
      `<tr><td class="vazio" colspan="${colunas}">${texto(mensagem)}</td></tr>`;
  }

  // ---------------- Modal ----------------

  const modal = () => document.getElementById('modal');
  const formulario = () => document.getElementById('modal-form');

  /**
   * Abre um formulario montado a partir de uma lista de campos.
   * `aoSalvar` recebe os valores e pode ser assincrono; se lancar erro, o
   * modal continua aberto para a pessoa corrigir o que digitou.
   */
  function abrirFormulario({ titulo, campos, aoSalvar }) {
    document.getElementById('modal-titulo').textContent = titulo;

    formulario().innerHTML = campos.map((campo) => {
      const id = `campo-${campo.nome}`;
      const obrigatorio = campo.obrigatorio === false ? '' : 'required';
      const valor = campo.valor ?? '';

      if (campo.tipo === 'select') {
        const opcoes = campo.opcoes
          .map((o) => `<option value="${texto(o.valor)}" ${String(o.valor) === String(valor) ? 'selected' : ''}>${texto(o.rotulo)}</option>`)
          .join('');
        return `<label for="${id}">${texto(campo.rotulo)}</label>
                <select id="${id}" name="${texto(campo.nome)}" ${obrigatorio}>${opcoes}</select>
                ${campo.ajuda ? `<p class="ajuda">${texto(campo.ajuda)}</p>` : ''}`;
      }

      const extras = [
        campo.min !== undefined ? `min="${texto(campo.min)}"` : '',
        campo.passo !== undefined ? `step="${texto(campo.passo)}"` : '',
        campo.maximo !== undefined ? `maxlength="${texto(campo.maximo)}"` : '',
        campo.somenteLeitura ? 'readonly' : '',
      ].join(' ');

      return `<label for="${id}">${texto(campo.rotulo)}</label>
              <input id="${id}" name="${texto(campo.nome)}" type="${campo.tipo || 'text'}"
                     value="${texto(valor)}" ${obrigatorio} ${extras}>
              ${campo.ajuda ? `<p class="ajuda">${texto(campo.ajuda)}</p>` : ''}`;
    }).join('');

    formulario().onsubmit = async (evento) => {
      evento.preventDefault();
      const botao = botaoPrincipal();
      botao.disabled = true;
      try {
        const valores = Object.fromEntries(new FormData(formulario()).entries());
        await aoSalvar(valores);
        fecharFormulario();
      } catch (erro) {
        avisarErro(erro);
      } finally {
        botao.disabled = false;
      }
    };

    modal().hidden = false;
    formulario().querySelector('input:not([readonly]), select')?.focus();
  }

  /** Abre o modal em modo leitura: um conteudo pronto e um botao de fechar. */
  function abrirConteudo({ titulo, html }) {
    document.getElementById('modal-titulo').textContent = titulo;
    formulario().innerHTML = html;
    formulario().onsubmit = (evento) => {
      evento.preventDefault();
      fecharFormulario();
    };

    document.getElementById('modal-cancelar').hidden = true;
    botaoPrincipal().textContent = 'Fechar';
    modal().hidden = false;
  }

  const botaoPrincipal = () => document.querySelector('.acoes-modal .botao-primario');

  function fecharFormulario() {
    modal().hidden = true;
    formulario().innerHTML = '';
    formulario().onsubmit = null;

    // Desfaz o modo leitura, senao o proximo formulario abre sem Cancelar.
    document.getElementById('modal-cancelar').hidden = false;
    botaoPrincipal().textContent = 'Salvar';
  }

  function iniciar() {
    document.getElementById('modal-cancelar').addEventListener('click', fecharFormulario);

    modal().addEventListener('click', (evento) => {
      if (evento.target === modal()) {
        fecharFormulario();
      }
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && !modal().hidden) {
        fecharFormulario();
      }
    });
  }

  return {
    iniciar, avisar, avisarErro, texto, moeda, dataHora, rotulo,
    abrirConteudo,
    linhaVazia, abrirFormulario, fecharFormulario,
  };
})();
