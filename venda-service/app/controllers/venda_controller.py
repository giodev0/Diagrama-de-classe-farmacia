from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.clients.estoque_client import EstoqueClient
from app.clients.pagamento_client import PagamentoClient
from app.clients.produto_client import ProdutoClient
from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.repositories.venda_repository import VendaRepository
from app.schemas.venda_schema import (
    DescontoRequest,
    FinalizarRequest,
    ItemAdicionar,
    StatusVenda,
    VendaResponse
)
from app.services.venda_service import VendaService

router = APIRouter(prefix="/vendas", tags=["Vendas"])

def get_venda_service(db: Session = Depends(get_db), usuario_logado: dict = Depends(get_usuario_atual)) -> VendaService:
    token = usuario_logado["token"]
    return VendaService(
        repo=VendaRepository(db),
        produtos=ProdutoClient(token),
        estoque=EstoqueClient(token),
        pagamentos=PagamentoClient(token)
    )

@router.post("", response_model=VendaResponse, status_code=status.HTTP_201_CREATED)
def criar(usuario_logado: dict = Depends(get_usuario_atual), service: VendaService = Depends(get_venda_service)):
    return service.criar_venda(usuario_logado)

@router.get("", response_model=VendaResponse)
def listar(inicio: Optional[date] = Query(default=None), fim: Optional[date] = Query(default=None), status_venda: Optional[StatusVenda] = Query(default=None, alias="status"), service: VendaService = Depends(get_venda_service)):
    return service.listar_vendas(inicio, fim, status_venda)

@router.get("/{id}", response_model=VendaResponse)
def buscar(id: int, service: VendaService = Depends(get_venda_service)):
    return service.buscar_venda(id)
    
@router.post("/{id}/itens", response_model=VendaResponse)
def adicionar_item(id: int, dados: ItemAdicionar, usuario_logado: dict = Depends(get_usuario_atual), service: VendaService = Depends(get_venda_service)):
    return service.adicionar_item(id, dados, usuario_logado)

@router.delete("/{id}/itens/{item_id}", response_model=VendaResponse)
def remover_item(id: int, item_id: int, usuario_logado: dict = Depends(get_usuario_atual), service: VendaService = Depends(get_venda_service)):
    return service.remover_item(id, item_id, usuario_logado)

@router.put("/{id}/desconto", response_model=VendaResponse)
def aplicar_desconto(id: int, dados: DescontoRequest, usuario_logado: dict = Depends(get_usuario_atual), service: VendaService = Depends(get_venda_service)):
    return service.aplicar_desconto(id, dados, usuario_logado)

@router.post("/{id}/finalizar", response_model=VendaResponse)
def finalizar(id: int, dados: FinalizarRequest, usuario_logado: dict = Depends(get_usuario_atual), service: VendaService = Depends(get_venda_service)):
    return service.finalizar_venda(id, dados, usuario_logado)

@router.put("/{id}/cancelar", response_model=VendaResponse)
def cancelar(id: int, usuario_logado: dict = Depends(get_usuario_atual), service: VendaService = Depends(get_venda_service)):
    return service.cancelar_venda(id, usuario_logado)