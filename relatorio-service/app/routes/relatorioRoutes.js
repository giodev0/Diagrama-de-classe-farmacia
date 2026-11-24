const express = require("express");

const relatorioController =
  require("../controllers/relatorioController");

const router = express.Router();

router.post(
  "/sincronizar",
  relatorioController.sincronizar
);

router.get(
  "/vendas",
  relatorioController.listarVendas
);

router.get(
  "/produtos",
  relatorioController.listarProdutos
);

router.get(
  "/estoque",
  relatorioController.listarEstoque
);

module.exports = router;