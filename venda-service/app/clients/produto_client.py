from decimal import Decimal
from typing import Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.externo_schema import ProdutoExterno

PRODUTOS_MOCK = {
    1: ProdutoExterno(id=1, nome="Dipirona 500mg", preco=Decimal("8.50")),
    2: ProdutoExterno(id=2, nome="Paracetamol 750mg", preco=Decimal("12.90")),
    3: ProdutoExterno(id=3, nome="Vitamina C", preco=Decimal("25.00")),
}

class ProdutoClient:
    def __init__(self, token: Optional[str] = None):
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    def buscar_produto(self, produto_id: int) -> ProdutoExterno:
        if settings.USAR_MOCKS:
            return self._buscar_mock(produto_id)
        
        try:
            resposta = httpx.get(
                f"{settings.PRODUTO_URL}/produtos/{produto_id}",
                headers=self.headers,
                timeout=5.0
            )
            
        except httpx.RequestError as erro:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de Produtos indisponível") from erro
        
        if resposta.status_code == 404:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Produto {produto_id} não encontrado")
        
        if resposta.status_code != 200:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao consultar o serviço de Produtos")
        
        return ProdutoExterno.model_validate(resposta.json())
    
    def _buscar_mock(self, produto_id: int) -> ProdutoExterno:
        produto = PRODUTOS_MOCK.get(produto_id)
        if not produto:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Produto {produto_id} não encontrado")
        return produto