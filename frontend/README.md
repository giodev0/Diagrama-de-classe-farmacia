# frontend

Interface web do Sistema de Farmácia. HTML, CSS e JavaScript puros, sem
framework e sem etapa de build, servidos por **nginx**.

- **Porta:** `8080` → http://localhost:8080
- **Acesso:** login com o usuário administrador criado pelo `usuario-service`
  (as credenciais estão no seu `.env`, veja o `.env.example` na raiz)

## Por que nginx e não abrir o `index.html` direto

O nginx serve os arquivos **e** funciona como proxy reverso: cada caminho
`/api/...` é encaminhado para o microsserviço dono daquele dado.

```
navegador  →  /api/produtos/15   →  nginx  →  produto-service:8002/produtos/15
           →  /api/estoque/15   →  nginx  →  estoque-service:8003/estoque/15
           →  /api/pagamentos    →  nginx  →  pagamento-service:8005/pagamentos
           →  /api/vendas        →  nginx  →  venda-service:8004/vendas
           →  /api/relatorios    →  nginx  →  relatorio-service:8006/relatorios
           →  /api/auth/login    →  nginx  →  usuario-service:8001/auth/login
```

Isso resolve dois problemas de uma vez:

1. **CORS deixa de existir.** Para o navegador tudo vem da mesma origem
   (`localhost:8080`), então não há requisição entre origens diferentes.
2. **O frontend não precisa saber a porta de ninguém.** Se um serviço mudar
   de porta, só o `nginx.conf` muda.

Abrir o `index.html` direto no navegador (`file://`) **não funciona** — não
existe quem encaminhe o `/api`.

## Como rodar

```bash
cp .env.example .env    # na raiz, se ainda não existir
docker compose up --build
```

Depois acesse http://localhost:8080.

Para mexer só no frontend sem rebuildar a imagem a cada alteração:

```bash
docker compose up -d                 # sobe os serviços
docker compose restart frontend      # recarrega após alterar os arquivos
```

## Telas

| Aba | Serviço consumido | Estado |
|---|---|---|
| Login | `usuario-service` | funcionando |
| Produtos | `produto-service` | CRUD completo com filtros |
| Estoque | `estoque-service` + `produto-service` | entrada, saída, mínimo, histórico |
| Pagamentos | `pagamento-service` | consulta e processamento |
| Vendas | `venda-service` | venda montada item a item, desconto, pagamento e cancelamento |
| Relatórios | `relatorio-service` | vendas por período, produtos mais vendidos e situação do estoque |

### Detalhe da tela de Vendas

A venda é montada **no servidor**, um passo de cada vez:

```
Nova venda          POST /vendas                 -> venda ABERTA, vazia
Adicionar item      POST /vendas/{id}/itens      -> venda-service busca o preço
                                                    em Produtos e confere o Estoque
Remover item        DELETE /vendas/{id}/itens/{itemId}
Aplicar desconto    PUT  /vendas/{id}/desconto   -> funcionário: no máximo 20%
Receber pagamento   POST /vendas/{id}/finalizar  -> paga e só então baixa o estoque
Cancelar            PUT  /vendas/{id}/cancelar
```

A cada passo o serviço devolve a venda inteira, e a tela só redesenha o que
recebeu. **O frontend nunca calcula preço nem total.** O id da venda em
andamento fica em `sessionStorage`, então recarregar a página não perde o
caixa; vendas deixadas em aberto podem ser retomadas pela lista
("Continuar").

### Detalhe da tela de Relatórios

O `relatorio-service` guarda uma cópia dos dados de Produtos, Estoque e
Vendas, atualizada pelo botão **Sincronizar dados**
(`POST /relatorios/sincronizar`). As rotas de leitura devolvem listas
simples; os indicadores (faturamento, ticket médio, estoque baixo) e o filtro
por período do relatório de vendas são feitos na tela, só para exibição. O
relatório de estoque só traz o `produtoId`, então a tela busca os nomes no
`produto-service`, do mesmo jeito que a aba Estoque.

### Detalhe da tela de Estoque

O `estoque-service` guarda apenas `produtoId`, `quantidade` e `estoqueMinimo`
— ele não repete o nome do produto, porque esse dado é do `produto-service`.
Quem junta as duas coisas é o frontend, em `js/estoque.js`:

```js
const produto = Produtos.carregados().find(p => p.id === estoque.produtoId);
```

É assim que uma interface de microsserviços compõe informação: cada serviço
entrega o que é dele e a tela monta a visão final.

## Organização

```
index.html     -> estrutura das telas
css/estilo.css -> estilos
js/api.js      -> única camada que fala HTTP; concentra token e erros
js/ui.js       -> avisos, modal de formulário e formatação
js/auth.js     -> login e sessão
js/produtos.js -> tela de produtos
js/estoque.js  -> tela de estoque
js/pagamentos.js -> tela de pagamentos
js/vendas.js    -> tela de vendas (venda em andamento e pagamento)
js/relatorios.js -> tela de relatorios
js/app.js      -> navegação entre abas
img/icones.svg -> ícones da interface (sprite SVG, desenhado para o projeto)
img/logo.svg   -> logo, usado também como favicon
```

Nenhum arquivo de tela chama `fetch` direto: tudo passa pelo `js/api.js`.
Assim o tratamento de erro, o token JWT e os caminhos ficam em um lugar só —
o mesmo princípio de responsabilidade única aplicado no backend.

## Tratamento de erros

O `js/api.js` entende os dois formatos de erro que os serviços usam:

| Serviço | Formato |
|---|---|
| produtos, estoque, vendas | `{ "status": 400, "erro": "...", "campos": { ... } }` |
| pagamentos, relatórios | `{ "erro": "..." }` |
| usuários (FastAPI) | `{ "detail": "..." }` |

Serviço fora do ar vira a mensagem *"Não foi possível falar com o servidor"*
em vez de um `TypeError` no console.
