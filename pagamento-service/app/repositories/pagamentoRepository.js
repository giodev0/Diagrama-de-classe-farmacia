const db = require("../core/database");
const Pagamento = require("../models/pagamento");

class PagamentoRepository {

  salvar(pagamento) {
    return new Promise((resolve, reject) => {

      const sql = `
        INSERT INTO pagamentos
        (
          vendaId,
          valor,
          formaPagamento,
          status,
          data
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      const valores = [
        pagamento.vendaId,
        pagamento.valor,
        pagamento.formaPagamento,
        pagamento.status,
        pagamento.data
      ];

      db.run(
        sql,
        valores,
        function (erro) {

          if (erro) {
            return reject(erro);
          }

          resolve(
            new Pagamento({
              id: this.lastID,
              vendaId: pagamento.vendaId,
              valor: pagamento.valor,
              formaPagamento: pagamento.formaPagamento,
              status: pagamento.status,
              data: pagamento.data
            })
          );
        }
      );
    });
  }

  buscarPorId(id) {
    return new Promise((resolve, reject) => {

      db.get(
        "SELECT * FROM pagamentos WHERE id = ?",
        [id],
        (erro, pagamento) => {

          if (erro) {
            return reject(erro);
          }

          if (!pagamento) {
            return resolve(null);
          }

          resolve(
            new Pagamento(pagamento)
          );
        }
      );
    });
  }

  listar() {
    return new Promise((resolve, reject) => {

      db.all(
        "SELECT * FROM pagamentos ORDER BY id",
        [],
        (erro, pagamentos) => {

          if (erro) {
            return reject(erro);
          }

          resolve(
            pagamentos.map(
              pagamento =>
                new Pagamento(pagamento)
            )
          );
        }
      );
    });
  }
}

module.exports = PagamentoRepository;