# produto-service

Microsserviço de **Produtos** do Sistema de Farmácia.

- **Responsável:** Giovana Fernandes
- **Linguagem:** Java 21 + Spring Boot 3.4
- **Banco próprio:** PostgreSQL (`produto_db`)
- **Porta:** `8002`
- **Papel na arquitetura:** **provedor**. Vendas, Estoque e Relatórios consultam
  este serviço por HTTP; ninguém acessa o `BD Produtos` diretamente.

## Modelo de dados

Tabela `produtos`:

| Campo           | Tipo          | Observação                          |
|-----------------|---------------|-------------------------------------|
| `id`            | bigserial     | PK                                  |
| `nome`          | varchar(120)  | obrigatório                         |
| `descricao`     | varchar(255)  | opcional                            |
| `preco`         | numeric(10,2) | sempre maior que zero               |
| `codigo_barras` | varchar(50)   | único                               |
| `tipo`          | varchar(30)   | enum `TipoProduto`                  |
| `ativo`         | boolean       | exclusão lógica                     |
| `criado_em`     | timestamp     |                                     |
| `atualizado_em` | timestamp     |                                     |

`TipoProduto`: `MEDICAMENTO`, `GENERICO`, `COSMETICO`, `HIGIENE_PESSOAL`,
`SUPLEMENTO`, `OUTRO`.

## Endpoints

| Método   | Rota                                | Status de sucesso | Descrição                         |
|----------|-------------------------------------|-------------------|-----------------------------------|
| `POST`   | `/produtos`                         | `201 Created`     | Cadastrar produto                 |
| `GET`    | `/produtos`                         | `200 OK`          | Listar (`?tipo=` ou `?nome=`)     |
| `GET`    | `/produtos/{id}`                    | `200 OK`          | Buscar por id                     |
| `GET`    | `/produtos/codigo-barras/{codigo}`  | `200 OK`          | Buscar por código de barras       |
| `PUT`    | `/produtos/{id}`                    | `200 OK`          | Editar produto                    |
| `DELETE` | `/produtos/{id}`                    | `204 No Content`  | Excluir (lógico)                  |
| `GET`    | `/`                                 | `200 OK`          | Status do serviço                 |

### Cadastrar produto

`POST /produtos`

```json
{
  "nome": "Dipirona 500mg",
  "descricao": "Analgesico e antitermico",
  "preco": 8.50,
  "codigoBarras": "7891234567890",
  "tipo": "MEDICAMENTO"
}
```

`201 Created` (header `Location: /produtos/15`):

```json
{
  "id": 15,
  "nome": "Dipirona 500mg",
  "descricao": "Analgesico e antitermico",
  "preco": 8.50,
  "codigoBarras": "7891234567890",
  "tipo": "MEDICAMENTO",
  "ativo": true,
  "criadoEm": "2026-11-22T20:15:03.114",
  "atualizadoEm": "2026-11-22T20:15:03.114"
}
```

### Erros

Todos os erros seguem o mesmo formato combinado com a equipe:

```json
{
  "timestamp": "2026-11-22T20:15:03.114",
  "status": 404,
  "erro": "Produto nao encontrado para o id 99",
  "caminho": "/produtos/99"
}
```

Em erro de validação o corpo também traz `campos`:

```json
{
  "timestamp": "2026-11-22T20:15:03.114",
  "status": 400,
  "erro": "Dados invalidos",
  "caminho": "/produtos",
  "campos": { "preco": "preco deve ser maior que zero" }
}
```

| Código | Quando acontece                                                        |
|--------|------------------------------------------------------------------------|
| `200`  | Consulta ou edição com sucesso                                         |
| `201`  | Produto cadastrado                                                     |
| `204`  | Produto excluído                                                       |
| `400`  | Dados inválidos, JSON mal formado, `id`/`tipo` inválido na URL, código de barras repetido |
| `404`  | Produto não encontrado, ou rota inexistente                            |
| `405`  | Método HTTP não suportado na rota                                      |
| `415`  | `Content-Type` diferente de `application/json`                         |
| `500`  | Erro interno (registrado no log do serviço)                            |

> **Exclusão é lógica.** O produto excluído sai das consultas mas continua na
> tabela, então o código de barras dele **permanece ocupado**: cadastrar outro
> produto com o mesmo código devolve `400`. Isso é proposital, para não quebrar
> o histórico de vendas que aponta para aquele `id`.

## Como rodar

Com Docker (junto com todo o sistema, a partir da raiz do repositório):

```bash
docker compose up --build produto-service
```

Localmente (precisa de um PostgreSQL em `localhost:5435` com o banco `produto_db`):

```bash
mvn spring-boot:run
```

## Testes

```bash
mvn test
```

**25 testes em JUnit 5**, do domínio puro até o fluxo HTTP completo:

| Classe | Tipo | O que cobre |
|---|---|---|
| `ProdutoTest` | unitário de domínio | regras da entidade: preço > 0, inativação, atualização |
| `ProdutoServiceImplTest` | unitário com Mockito | regras do caso de uso com repositório simulado |
| `ProdutoRepositoryTest` | `@DataJpaTest` + H2 | as consultas derivadas, que só falham em runtime |
| `ProdutoControllerIntegracaoTest` | `@SpringBootTest` + H2 | fluxo HTTP completo e contrato JSON |
| `ContratoDeErrosTest` | `@SpringBootTest` + H2 | 400/404/405/415 nos caminhos de erro |

O `ProdutoServiceImplTest` roda **sem banco e sem subir o Spring** — isso só é
possível porque o service depende da interface `ProdutoRepository`, e não do
JPA direto. É a Inversão de Dependência pagando na prática.

## Organização do código (SOLID e GRASP)

```
controller/  -> entrada HTTP, só traduz requisição/resposta
service/     -> interface do caso de uso + implementação
repository/  -> abstração de persistência (Spring Data)
domain/      -> entidade Produto e suas regras
dto/         -> contrato de entrada e saída da API
mapper/      -> conversão entidade <-> DTO
exception/   -> exceções de negócio e tradução para HTTP
```

- **SRP:** controller só cuida de HTTP, service da regra de aplicação,
  mapper da conversão e o handler da tradução de erros.
- **OCP / DIP:** `ProdutoController` depende da interface `ProdutoService` e
  `ProdutoServiceImpl` depende da interface `ProdutoRepository`; trocar a
  implementação não exige mudar quem usa.
- **ISP:** DTOs separados para entrada (`ProdutoRequest`) e saída
  (`ProdutoResponse`), em vez de expor a entidade do banco.
- **GRASP – Information Expert:** validar preço, inativar e atualizar dados
  são responsabilidade da própria entidade `Produto`.
- **GRASP – Pure Fabrication:** `ProdutoMapper` e `ManipuladorDeErros` existem
  só para tirar responsabilidades técnicas do caso de uso.
- **GRASP – Low Coupling / High Cohesion:** o serviço não conhece nenhum outro
  banco nem nenhum outro serviço; é totalmente independente.
