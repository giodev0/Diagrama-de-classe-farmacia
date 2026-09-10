# 💊 Sistema de Farmácia

Sistema de gerenciamento para farmácia desenvolvido em **Java**, com estrutura baseada em modelagem UML e princípios de orientação a objetos.

## 📋 Sobre o projeto

Projeto acadêmico que implementa a estrutura de um sistema completo de farmácia, contemplando controle de produtos, estoque, vendas, pagamentos, descontos e geração de relatórios. A arquitetura foi modelada a partir de um diagrama de classes UML, com foco em separação de responsabilidades e uso de padrões de projeto.

## 📐 Diagrama de classes

![Diagrama de Classes do Sistema de Farmácia](docs/diagrama-classes.png)

## ⚙️ Funcionalidades

- 📦 **Gestão de produtos** — cadastro, edição, exclusão e consulta de medicamentos, cosméticos e produtos de higiene
- 📊 **Controle de estoque** — adição, retirada, verificação de disponibilidade e alerta de estoque baixo
- 🛒 **Realização de vendas** — criação de vendas com múltiplos itens e cálculo automático de totais
- 💳 **Formas de pagamento** — suporte a Pix, cartão (com parcelamento) e dinheiro (com cálculo de troco)
- 🏷️ **Políticas de desconto** — desconto percentual, cupom e promoções por período
- 📈 **Relatórios** — vendas, estoque e produtos
- 👥 **Gestão de usuários** — administradores e funcionários com níveis de acesso distintos

## 🏗️ Estrutura de classes

### Modelo de domínio
| Categoria | Classes |
|-----------|---------|
| **Produtos** | `Produto`, `Medicamento`, `Cosmetico`, `Higiene` |
| **Usuários** | `Usuario`, `Administrador`, `Funcionario` |
| **Vendas** | `Venda`, `ItemVenda`, `StatusVenda` |
| **Estoque** | `Estoque`, `ItemEstoque` |
| **Pagamento** | `FormaPagamento` (interface), `Pix`, `Cartao`, `Dinheiro` |
| **Desconto** | `PoliticaDesconto` (interface), `Percentual`, `Cupom`, `Promocional` |
| **Relatório** | `GeradorRelatorio` (interface), `RelatorioVendas`, `RelatorioEstoque`, `RelatorioProdutos` |

### Camada de serviços
`ServicoProduto` · `ServicoUsuario` · `ServicoVenda` · `ServicoEstoque` · `ServicoRelatorio`

## 🎯 Padrões de projeto aplicados

- **Strategy** — permite trocar dinamicamente algoritmos de pagamento (`FormaPagamento`), desconto (`PoliticaDesconto`) e geração de relatório (`GeradorRelatorio`)
- **Service Layer** — camada de serviços separando as regras de negócio das entidades do domínio
- **Herança** — hierarquia de `Produto` e `Usuario` para reaproveitamento de código

## 🛠️ Tecnologias

- **Java**
- Modelagem em **UML**

## 📁 Estrutura do repositório

```
farmacia/
├── Produto.java
├── Medicamento.java
├── Cosmetico.java
├── Higiene.java
├── Usuario.java
├── Administrador.java
├── Funcionario.java
├── Venda.java
├── ItemVenda.java
├── StatusVenda.java
├── FormaPagamento.java
├── Pix.java
├── Cartao.java
├── Dinheiro.java
├── PoliticaDesconto.java
├── Percentual.java
├── Cupom.java
├── Promocional.java
├── Estoque.java
├── ItemEstoque.java
├── GeradorRelatorio.java
├── RelatorioVendas.java
├── RelatorioEstoque.java
├── RelatorioProdutos.java
├── ServicoProduto.java
├── ServicoUsuario.java
├── ServicoVenda.java
├── ServicoEstoque.java
└── ServicoRelatorio.java
```

## 🚧 Status do projeto

🟡 **Em desenvolvimento** — estrutura de classes definida com base no diagrama UML. Implementação dos métodos em andamento.

## 👩‍💻 Autoras

**Giovana Fernandes e Sophia Filizola**
Estudantes de Ciência da Computação — Universidade de Fortaleza (Unifor)

[![Instagram](https://img.shields.io/badge/Instagram-@giodev0-E4405F?style=flat&logo=instagram&logoColor=white)](https://instagram.com/giodev0)
