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
| Login | `usuario-service` | ✅ funcionando |
| Produtos | `produto-service` | ✅ CRUD completo com filtros |
| Estoque | `estoque-service` + `produto-service` | ✅ entrada, saída, mínimo, histórico |
| Pagamentos | `pagamento-service` | ✅ consulta e processamento |
| Vendas | `venda-service` | ✅ implementada, aguardando o serviço subir |
| Relatórios | `relatorio-service` | ✅ implementada, aguardando o serviço subir |

### As telas de Vendas e Relatórios já estão prontas

Foram escritas contra o contrato de [`CONTRATOS.md`](../CONTRATOS.md). Como os
serviços ainda não existem, o nginx responde `503` nesses caminhos e as telas
mostram um aviso explicando o que falta, em vez de quebrarem.

**Para ligar, quando os serviços existirem:**

1. No [`nginx.conf`](nginx.conf), apague o bloco `return 503` e descomente o
   `proxy_pass` logo acima dele
2. Descomente o serviço no `docker-compose.yml`
3. `docker compose up --build`

**Nenhuma linha de JavaScript muda.**

> Não descomente o `proxy_pass` antes do serviço existir: o nginx resolve o
> nome do upstream ao iniciar e se recusa a subir se o host não existir — o
> que derrubaria o frontend inteiro.

A tela de Vendas monta o carrinho e calcula bruto, desconto e total no
navegador só para exibição. **Quem calcula de verdade é o `venda-service`**,
que é quem consulta o preço em Produtos. O frontend nunca decide preço.

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
js/vendas.js    -> tela de vendas (carrinho e pagamento)
js/relatorios.js -> tela de relatorios
js/app.js      -> navegação entre abas
```

Nenhum arquivo de tela chama `fetch` direto: tudo passa pelo `js/api.js`.
Assim o tratamento de erro, o token JWT e os caminhos ficam em um lugar só —
o mesmo princípio de responsabilidade única aplicado no backend.

## Tratamento de erros

O `js/api.js` entende os dois formatos de erro que os serviços usam:

| Serviço | Formato |
|---|---|
| produtos, estoque | `{ "status": 400, "erro": "...", "campos": { ... } }` |
| usuários (FastAPI) | `{ "detail": "..." }` |

Serviço fora do ar vira a mensagem *"Não foi possível falar com o servidor"*
em vez de um `TypeError` no console.
