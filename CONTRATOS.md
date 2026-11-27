# Contratos das APIs

Documento de referência da equipe. Define o que cada serviço expõe, para que
ninguém implemente assumindo um formato diferente.

> **Status:** os contratos de Usuários, Produtos, Estoque e Pagamentos
> descrevem código que **já existe e está rodando**. Os de Vendas e Relatórios
> são uma **proposta** de Giovana, aguardando validação de Guilherme e Sophia.
> Ajustem o que fizer sentido — o importante é fechar antes de implementar.

## Regras que valem para todos

- Comunicação por **HTTP/REST**, corpo em **JSON**
- Campos em **camelCase**
- Um serviço **nunca** acessa o banco de outro: pede pela API do dono do dado
- Valores monetários com 2 casas decimais
- Datas em ISO-8601

### Códigos HTTP

| Código | Quando |
|---|---|
| `200` | Consulta ou operação concluída |
| `201` | Recurso criado |
| `204` | Concluído sem corpo de resposta |
| `400` | Dados inválidos ou regra de negócio violada |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex.: concorrência) |
| `503` | Um serviço do qual este depende está fora do ar |
| `500` | Erro interno |

### Formato único de erro

```json
{
  "timestamp": "2026-11-23T20:15:03.114",
  "status": 404,
  "erro": "Produto nao encontrado para o id 99",
  "caminho": "/produtos/99"
}
```

Em erro de validação, o corpo traz também `campos`:

```json
{
  "timestamp": "2026-11-23T20:15:03.114",
  "status": 400,
  "erro": "Dados invalidos",
  "caminho": "/vendas",
  "campos": { "itens": "a venda precisa de pelo menos um item" }
}
```

> O `usuario-service` usa o formato do FastAPI (`{"detail": "..."}`). O
> frontend já entende os dois, mas vale padronizar quando der.

## Mapa de portas

| Serviço | Responsável | Linguagem | Porta | Banco |
|---|---|---|---|---|
| `usuario-service` | Guilherme | Python | `8001` | Postgres `usuario_db` |
| `produto-service` | Giovana | Java | `8002` | MySQL `produto_db` |
| `estoque-service` | Giovana | Java | `8003` | MySQL `estoque_db` |
| `venda-service` | Guilherme | Python | `8004` | Postgres `venda_db` |
| `pagamento-service` | Sophia | JavaScript | `8005` | SQLite |
| `relatorio-service` | Sophia | JavaScript | `8006` | SQLite `relatorio_db` |
| `frontend` | — | nginx | `8080` | — |

Pelo frontend tudo passa por `/api/<serviço>`, e o nginx encaminha.

---

# Serviços já implementados

## usuario-service — `8001`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Autenticar, devolve JWT |
| `POST` | `/usuarios` | Cadastrar (só ADMIN) |
| `GET` | `/usuarios` | Listar |
| `GET` | `/usuarios/{id}` | Buscar |
| `PUT` | `/usuarios/{id}` | Editar |
| `DELETE` | `/usuarios/{id}` | Excluir (lógico) |

`POST /auth/login` → `200`

```json
{ "accessToken": "eyJhbGciOi...", "tokenType": "bearer" }
```

Demais rotas exigem `Authorization: Bearer <token>`.

## produto-service — `8002`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/produtos` | Cadastrar |
| `GET` | `/produtos` | Listar (`?tipo=` ou `?nome=`) |
| `GET` | `/produtos/{id}` | Buscar por id |
| `GET` | `/produtos/codigo-barras/{codigo}` | Buscar por código |
| `PUT` | `/produtos/{id}` | Editar |
| `DELETE` | `/produtos/{id}` | Excluir (lógico) |

`GET /produtos/15` → `200`

```json
{
  "id": 15,
  "nome": "Dipirona 500mg",
  "descricao": "Analgesico e antitermico",
  "preco": 8.50,
  "codigoBarras": "7891234567890",
  "tipo": "MEDICAMENTO",
  "ativo": true,
  "criadoEm": "2026-11-23T20:15:03.114",
  "atualizadoEm": "2026-11-23T20:15:03.114"
}
```

`tipo`: `MEDICAMENTO`, `GENERICO`, `COSMETICO`, `HIGIENE_PESSOAL`,
`SUPLEMENTO`, `OUTRO`.

> **Para Vendas:** leia apenas `id`, `nome` e `preco`. Ignore campos
> desconhecidos, assim o serviço pode evoluir o JSON sem quebrar ninguém.

## estoque-service — `8003`

> **Atenção:** este serviço usa `/estoque` no **singular**, diferente dos
> demais. A chave da URL é o **`produtoId`**, não o id do registro de estoque.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/estoque` | Criar estoque de um produto |
| `GET` | `/estoque` | Listar |
| `GET` | `/estoque/baixos` | Produtos com estoque baixo |
| `GET` | `/estoque/{produtoId}` | Consultar quantidade |
| `GET` | `/estoque/{produtoId}/disponibilidade?quantidade=2` | Verificar disponibilidade |
| `POST` | `/estoque/{produtoId}/entrada` | Adicionar unidades |
| `POST` | `/estoque/{produtoId}/saida` | Retirar unidades |
| `PATCH` | `/estoque/{produtoId}/estoque-minimo` | Alterar o mínimo |
| `GET` | `/estoque/{produtoId}/movimentacoes` | Histórico |

`GET /estoque/15/disponibilidade?quantidade=2` → `200`

```json
{
  "produtoId": 15,
  "quantidadeSolicitada": 2,
  "quantidadeDisponivel": 10,
  "disponivel": true
}
```

`POST /estoque/15/saida` → `200`

```json
{ "quantidade": 2, "observacao": "Venda 1042" }
```

Sem saldo, responde `400` e **não altera nada**.

## pagamento-service — `8005`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/pagamentos` | Processar pagamento |
| `GET` | `/pagamentos` | Listar |
| `GET` | `/pagamentos/{id}` | Consultar |

`POST /pagamentos` → `201`

```json
{ "vendaId": 1042, "valor": 15.30, "formaPagamento": "PIX" }
```

```json
{
  "id": 7,
  "vendaId": 1042,
  "valor": 15.30,
  "formaPagamento": "PIX",
  "status": "APROVADO",
  "data": "2026-11-23T20:15:03.114Z"
}
```

`formaPagamento`: `PIX`, `CARTAO`, `DINHEIRO`. `status`: `APROVADO`, `RECUSADO`.

---

# Proposta: venda-service — `8004`

**Responsável:** Guilherme · **Python** · banco próprio `venda_db`

É o serviço que coordena o fluxo. Consome Produtos, Estoque e Pagamentos.

## A venda acontece em duas etapas

Separar em duas chamadas permite ao funcionário montar o carrinho, **ver o
total** e só então escolher a forma de pagamento.

### Etapa 1 — montar a venda

`POST /vendas` → `201`

```json
{
  "funcionarioId": 1,
  "descontoPercentual": 10,
  "itens": [
    { "produtoId": 15, "quantidade": 2 },
    { "produtoId": 23, "quantidade": 1 }
  ]
}
```

O serviço, nesta ordem:

1. `GET /produtos/{id}` para cada item — pega `nome` e `preco`
2. `GET /estoque/{produtoId}/disponibilidade?quantidade=N` para cada item
3. Calcula subtotais, aplica o desconto e grava a venda como `RASCUNHO`

**Ainda não baixa o estoque.**

```json
{
  "id": 1042,
  "funcionarioId": 1,
  "status": "RASCUNHO",
  "itens": [
    {
      "produtoId": 15,
      "nomeProduto": "Dipirona 500mg",
      "quantidade": 2,
      "precoUnitario": 8.50,
      "subtotal": 17.00
    }
  ],
  "valorBruto": 17.00,
  "descontoPercentual": 10,
  "valorDesconto": 1.70,
  "valorTotal": 15.30,
  "criadaEm": "2026-11-23T20:15:03.114",
  "finalizadaEm": null,
  "pagamentoId": null
}
```

> `nomeProduto` e `precoUnitario` ficam **gravados na venda**. É um retrato do
> momento: se o preço mudar amanhã, a venda de hoje continua correta.

Erros: `400` se faltar item, quantidade ≤ 0 ou desconto fora de 0–100;
`404` se algum produto não existir; `400` se faltar estoque, informando qual
produto; `503` se Produtos ou Estoque estiverem fora do ar.

### Etapa 2 — pagar e finalizar

`POST /vendas/1042/pagamento` → `200`

```json
{ "formaPagamento": "PIX" }
```

O serviço:

1. `POST /pagamentos` com `vendaId`, `valorTotal` e `formaPagamento`
2. **Se aprovado**, `POST /estoque/{produtoId}/saida` para cada item
3. Marca a venda como `FINALIZADA`

```json
{
  "id": 1042,
  "status": "FINALIZADA",
  "pagamentoId": 7,
  "valorTotal": 15.30,
  "finalizadaEm": "2026-11-23T20:16:10.002"
}
```

> **O estoque só é reduzido depois do pagamento aprovado.** É a regra central
> do fluxo e está no documento da equipe.

**Pagamento recusado devolve `200`**, com a venda em `PAGAMENTO_RECUSADO` e o
estoque intacto. Não é erro de requisição — é resultado de negócio, e o
frontend trata pelo campo `status`.

### Demais rotas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/vendas` | Listar (`?status=`, `?dataInicio=`, `?dataFim=`) |
| `GET` | `/vendas/{id}` | Detalhe com itens |
| `POST` | `/vendas/{id}/cancelar` | Cancelar venda em `RASCUNHO` |

`status`: `RASCUNHO`, `FINALIZADA`, `PAGAMENTO_RECUSADO`, `CANCELADA`.

---

# Proposta: relatorio-service — `3006`

**Responsável:** Sophia · **JavaScript** · banco próprio `relatorio_db`

É **consumidor**: lê dos outros serviços, guarda no banco próprio e serve as
consultas de lá. Nunca acessa banco alheio nem consulta os outros serviços a
cada requisição.

## Sincronização

`POST /relatorios/sincronizar` → `200`

Busca dados em Produtos, Estoque e Vendas e grava localmente. Pode ser
disparado pelo botão no frontend.

```json
{
  "sincronizadoEm": "2026-11-23T20:20:00.000Z",
  "produtos": 6,
  "estoques": 5,
  "vendas": 12
}
```

## Consultas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/relatorios/vendas?dataInicio=&dataFim=` | Vendas do período |
| `GET` | `/relatorios/produtos` | Produtos mais vendidos |
| `GET` | `/relatorios/estoque` | Situação do estoque |

`GET /relatorios/vendas?dataInicio=2026-11-01&dataFim=2026-11-30` → `200`

```json
{
  "periodo": { "inicio": "2026-11-01", "fim": "2026-11-30" },
  "resumo": {
    "quantidadeVendas": 12,
    "valorTotal": 845.60,
    "ticketMedio": 70.47,
    "totalDescontos": 42.10
  },
  "porFormaPagamento": [
    { "formaPagamento": "PIX", "quantidade": 7, "valor": 520.30 }
  ],
  "vendas": [
    {
      "vendaId": 1042,
      "data": "2026-11-23T20:16:10.002",
      "valorTotal": 15.30,
      "formaPagamento": "PIX",
      "status": "FINALIZADA"
    }
  ]
}
```

`GET /relatorios/produtos` → `200`

```json
{
  "geradoEm": "2026-11-23T20:20:00.000Z",
  "itens": [
    {
      "produtoId": 15,
      "nome": "Dipirona 500mg",
      "tipo": "MEDICAMENTO",
      "quantidadeVendida": 48,
      "valorVendido": 408.00
    }
  ]
}
```

`GET /relatorios/estoque` → `200`

```json
{
  "geradoEm": "2026-11-23T20:20:00.000Z",
  "resumo": {
    "totalProdutos": 6,
    "produtosEmFalta": 1,
    "produtosComEstoqueBaixo": 2
  },
  "itens": [
    {
      "produtoId": 15,
      "nome": "Dipirona 500mg",
      "quantidade": 108,
      "estoqueMinimo": 20,
      "situacao": "OK"
    }
  ]
}
```

`situacao`: `OK`, `BAIXO`, `SEM_ESTOQUE`.

---

# Como ligar os dois serviços quando ficarem prontos

O frontend **já está implementado** para ambos. Para ativar:

1. Em [`frontend/nginx.conf`](frontend/nginx.conf), troque os blocos de
   `return 503` pelos `proxy_pass` comentados logo acima deles
2. Em `docker-compose.yml`, descomente os serviços e seus bancos
3. Subir: `docker compose up --build`

Nenhuma linha de JavaScript precisa mudar. Enquanto os serviços não existem,
as telas mostram um aviso explicando o que falta, em vez de quebrar.
