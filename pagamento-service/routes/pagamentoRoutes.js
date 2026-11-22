const express = require("express");

const pagamentoController =
  require("../controllers/pagamentoController");

const router = express.Router();

router.post(
  "/",
  pagamentoController.criarPagamento
);

router.get(
  "/",
  pagamentoController.listarPagamentos
);

router.get(
  "/:id",
  pagamentoController.buscarPagamentoPorId
);

module.exports = router;