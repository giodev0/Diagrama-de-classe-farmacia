const config = {
  port: process.env.PORT || 8006,

  produtoServiceUrl:
    process.env.PRODUTO_SERVICE_URL ||
    "http://localhost:8002",

  estoqueServiceUrl:
    process.env.ESTOQUE_SERVICE_URL ||
    "http://localhost:8003",

  vendaServiceUrl:
    process.env.VENDA_SERVICE_URL ||
    "http://localhost:8004"
};

module.exports = config;