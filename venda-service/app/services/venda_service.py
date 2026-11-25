from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from fastapi import HTTPException, status

from app.clients.estoque_client import EstoqueClient
from app.clients.pagamento_client import PagamentoClient
from app.clients.produto_client import ProdutoClient
from app.models.venda import ItemVenda, Venda
from app.repositories.venda_repository import VendaRepository
from app.schemas.venda_schema import DescontoRequest, FinalizarRequest, ItemAdicionar

DESCONTO_MAXIMO_FUNCIONARIO = Decimal("20")


CENTAVOS = Decimal("0.01")

class VendaService:
    def __init__(self, repo: VendaRepository, produtos: ProdutoClient, estoque: EstoqueClient, pagamentos: PagamentoClient):
        self.repo = repo
        self.produtos = produtos
        self.estoque = estoque
        self.pagamentos = pagamentos
        
    def _buscar_venda_editavel(self, venda_id: int, usuario_logado: dict) -> Venda:
        venda = self.buscar_venda(venda_id)
        if venda.funcionario_id != usuario_logado["id"] and usuario_logado["tipo"] != "ADMIN":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Esta venda pertence a outro funcionário")
        
        if venda.status != "ABERTA":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"A venda está {venda.status} e não pode ser alterada")
        
        return venda
    
    def _recalcular_totais(self, venda: Venda) -> None:
        subtotal = sum((item.subtotal for item in venda.itens), Decimal("0"))
        percentual = venda.desconto_percentual or Decimal("0")
        desconto = (subtotal * percentual / 100).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
        
        venda.subtotal = subtotal
        venda.valor_desconto = desconto
        venda.valor_total = subtotal - desconto
        
    def buscar_venda(self, id: int) -> Venda:
        venda = self.repo.buscar_por_id(id)
        if not venda:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Venda {id} não encontrada")
        
        return venda
    
    def listar_vendas(self, inicio: Optional[date], fim: Optional[date], status_venda: Optional[str]) -> list[Venda]:
        if inicio and fim and inicio > fim:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "A data inicial é depois da data final")
        
        return self.repo.listar(inicio, fim, status_venda)
    
    def criar_venda(self, usuario_logado: dict) -> Venda:
        venda = Venda(funcionario_id=usuario_logado["id"])
        return self.repo.salvar(venda)
    
         
    def adicionar_item(self, venda_id: int, dados: ItemAdicionar, usuario_logado: dict) -> Venda:
        venda = self._buscar_venda_editavel(venda_id, usuario_logado)
        produto = self.produtos.buscar_produto(dados.produto_id)
        item = next((i for i in venda.itens if i.produto_id == produto.id), None)
        quantidade_total = dados.quantidade + (item.quantidade if item else 0)
        if not self.estoque.verificar_disponibilidade(produto.id, quantidade_total):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Estoque insuficiente para {produto.nome}")
        
        if item:
            item.quantidade = quantidade_total
            item.subtotal = item.preco_unitario * quantidade_total
        else:
            venda.itens.append(ItemVenda(
                produto_id=produto.id,
                nome_produto=produto.nome,
                preco_unitario=produto.preco,
                quantidade=dados.quantidade,
                subtotal=produto.preco * dados.quantidade
            ))
        
        self._recalcular_totais(venda)
        return self.repo.salvar(venda)
    
    def remover_item(self, venda_id: int, item_id: int, usuario_logado: dict) -> Venda:
        venda = self._buscar_venda_editavel(venda_id, usuario_logado)
        item = next((i for i in venda.itens if i.id == item_id), None)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Item {item_id} não encontrado nesta venda")
        
        venda.itens.remove(item)
        self._recalcular_totais(venda)
        return self.repo.salvar(venda)
    
    def aplicar_desconto(self, venda_id: int, dados: DescontoRequest, usuario_logado: dict) -> Venda:
        venda = self._buscar_venda_editavel(venda_id, usuario_logado)
        if usuario_logado["tipo"] != "ADMIN" and dados.desconto_percentual > DESCONTO_MAXIMO_FUNCIONARIO:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Funcionário pode dar no máximo {DESCONTO_MAXIMO_FUNCIONARIO}% de desconto")
        
        venda.desconto_percentual = dados.desconto_percentual
        self._recalcular_totais(venda)
        return self.repo.salvar(venda)
    
    def cancelar_venda(self, venda_id: int, usuario_logado: dict) -> Venda:
        venda = self._buscar_venda_editavel(venda_id, usuario_logado)
        venda.status = "CANCELADA"
        return self.repo.salvar(venda)
    
    def finalizar_venda(self, venda_id: int, dados: FinalizarRequest, usuario_logado: dict) -> Venda:
        venda = self._buscar_venda_editavel(venda_id, usuario_logado)
        if not venda.itens:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Não é possível finalizar uma venda sem itens")
        
        for item in venda.itens:
            if not self.estoque.verificar_disponibilidade(item.produto_id, item.quantidade):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Estoque insuficiente para {item.nome_produto}")
            
        if venda.pagamento_id is None:
            pagamento = self.pagamentos.processar(venda_id, venda.valor_total, dados.forma_pagamento)
            if pagamento.status != "APROVADO":
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Pagamento recusado")
            
            venda.pagamento_id = pagamento.id
            venda.forma_pagamento = dados.forma_pagamento
            self.repo.salvar(venda)
            
        for item in venda.itens:
            self.estoque.retirar(item.produto_id, item.quantidade, f"Venda: {venda.id}")
            
        venda.status = "FINALIZADA"
        venda.finalizada_em = datetime.now()
        return self.repo.salvar(venda)
