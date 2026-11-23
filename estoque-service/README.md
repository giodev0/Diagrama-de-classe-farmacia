# estoque-service

Microsserviço de **Estoque** do Sistema de Farmácia.

- **Responsável:** Giovana Fernandes
- **Linguagem:** Java 21 + Spring Boot 3.4
- **Banco próprio:** PostgreSQL (`estoque_db`)
- **Porta:** `8003`
- **Papel na arquitetura:** **provedor e consumidor**. Provê quantidade e
  disponibilidade para Vendas e Relatórios, e consome a API de Produtos para
  validar se o `produtoId` existe.

```
estoque-service  ->  GET /produtos/{id}  ->  produto-service  ->  BD Produtos
```

O estoque **nunca** acessa o `BD Produtos` diretamente, e por isso **não**
guarda nome, preço ou descrição: esses dados pertencem ao serviço de Produtos.

## Modelo de dados

Tabela `estoques`:

| Campo            | Tipo      | Observação                          |
|------------------|-----------|-------------------------------------|
| `id`             | bigserial | PK                                  |
| `produto_id`     | bigint    | único — chave usada pelas Vendas    |
| `quantidade`     | integer   | nunca negativa                      |
| `estoque_minimo` | integer   | nível de alerta                     |
| `atualizado_em`  | timestamp |                                     |
| `versao`         | bigint    | trava otimista contra venda dupla   |

Tabela `movimentacoes_estoque` (histórico de entradas e saídas):
`id`, `produto_id`, `tipo` (`ENTRADA` / `SAIDA`), `quantidade`,
`quantidade_resultante`, `observacao`, `data`.

## Endpoints

| Método  | Rota                                          | Status | Descrição                              |
|---------|-----------------------------------------------|--------|----------------------------------------|
| `POST`  | `/estoques`                                    | `201`  | Criar o estoque de um produto          |
| `GET`   | `/estoques`                                    | `200`  | Listar todos os estoques               |
| `GET`   | `/estoques/baixos`                             | `200`  | Produtos com estoque baixo             |
| `GET`   | `/estoques/{produtoId}`                        | `200`  | Consultar quantidade                   |
| `GET`   | `/estoques/{produtoId}/disponibilidade?quantidade=2` | `200` | Verificar disponibilidade        |
| `POST`  | `/estoques/{produtoId}/entrada`                | `200`  | Adicionar unidades                     |
| `POST`  | `/estoques/{produtoId}/saida`                  | `200`  | Retirar unidades                       |
| `PATCH` | `/estoques/{produtoId}/estoque-minimo`         | `200`  | Alterar o estoque mínimo               |
| `GET`   | `/estoques/{produtoId}/movimentacoes`          | `200`  | Histórico do produto                   |
| `GET`   | `/`                                            | `200`  | Status do serviço                      |

### Criar o estoque de um produto

`POST /estoques`

```json
{ "produtoId": 15, "quantidade": 10, "estoqueMinimo": 3 }
```

`201 Created`:

```json
{
  "id": 1,
  "produtoId": 15,
  "quantidade": 10,
  "estoqueMinimo": 3,
  "estoqueBaixo": false,
  "atualizadoEm": "2026-11-22T20:15:03.114"
}
```

### Verificar disponibilidade (usado pelo serviço de Vendas)

`GET /estoques/15/disponibilidade?quantidade=2`

```json
{
  "produtoId": 15,
  "quantidadeSolicitada": 2,
  "quantidadeDisponivel": 10,
  "disponivel": true
}
```

### Retirar unidades (só depois do pagamento aprovado)

`POST /estoques/15/saida`

```json
{ "quantidade": 2, "observacao": "Venda 1042" }
```

Resposta `200 OK` com o estoque atualizado. Se não houver saldo, o serviço
responde `400` e **não** altera a quantidade:

```json
{
  "timestamp": "2026-11-22T20:15:03.114",
  "status": 400,
  "erro": "Estoque insuficiente para o produto 15: disponivel 1, solicitado 2",
  "caminho": "/estoques/15/saida"
}
```

### Códigos HTTP

| Código | Quando acontece                                                         |
|--------|-------------------------------------------------------------------------|
| `200`  | Consulta ou movimentação com sucesso                                    |
| `201`  | Estoque criado                                                          |
| `400`  | Dados inválidos, `produtoId` não numérico, `quantidade` ausente ou ≤ 0, estoque insuficiente |
| `404`  | Estoque não cadastrado, produto inexistente no `produto-service`, ou rota inexistente |
| `405`  | Método HTTP não suportado na rota                                       |
| `409`  | Duas operações mexeram no mesmo estoque ao mesmo tempo — tentar de novo |
| `415`  | `Content-Type` diferente de `application/json`                          |
| `503`  | O `produto-service` está fora do ar                                     |
| `500`  | Erro interno (registrado no log do serviço)                             |

> Se um produto for excluído no `produto-service`, o registro de estoque dele
> continua existindo aqui. Isso é esperado em microsserviços: cada serviço é
> dono do seu dado e não há exclusão em cascata entre bancos.

## Como rodar

Com Docker (sobe junto o `produto-service`, de quem ele depende):

```bash
docker compose up --build estoque-service
```

Localmente (PostgreSQL em `localhost:5436` com o banco `estoque_db` e o
`produto-service` rodando em `localhost:8002`):

```bash
mvn spring-boot:run
```

Variáveis de ambiente: `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`,
`PRODUTO_SERVICE_URL`, `PRODUTO_SERVICE_TIMEOUT`, `SERVER_PORT`.

Testes:

```bash
mvn test
```

## Organização do código (SOLID e GRASP)

```
controller/  -> entrada HTTP
service/     -> interface do caso de uso + implementação
repository/  -> abstração de persistência
client/      -> porta de saída para o produto-service
domain/      -> Estoque, MovimentacaoEstoque e suas regras
dto/         -> contrato de entrada e saída da API
mapper/      -> conversão entidade <-> DTO
exception/   -> exceções de negócio e tradução para HTTP
```

- **SRP:** cada camada tem um motivo só para mudar.
- **DIP:** `EstoqueServiceImpl` depende das interfaces `EstoqueRepository` e
  `ProdutoClient`. Nos testes o `ProdutoClient` é trocado por uma
  implementação falsa, e o serviço roda sem o `produto-service` no ar.
- **OCP:** trocar `RestClient` por outro cliente HTTP (ou por mensageria) só
  exige uma nova implementação de `ProdutoClient`.
- **GRASP – Information Expert:** quem decide se dá para retirar unidades é a
  entidade `Estoque`, que é quem conhece a quantidade.
- **GRASP – Creator:** `MovimentacaoEstoque` é criada a partir do `Estoque` já
  movimentado, pelas fábricas `entrada(...)` e `saida(...)`.
- **GRASP – Protected Variations:** o `ProdutoResumo` ignora campos
  desconhecidos, então o `produto-service` pode adicionar campos no JSON sem
  quebrar o estoque.
