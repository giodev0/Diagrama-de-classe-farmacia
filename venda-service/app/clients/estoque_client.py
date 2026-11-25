from typing import Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.externo_schema import DisponibilidadeExterna

ESTOQUE_MOCK = {1: 50, 2: 3, 3: 0}

def _mensagem_erro(resposta: httpx.Response, padrao: str) -> str:
    try:
        return resposta.json().get("erro", padrao)
    except ValueError:
        return padrao

class EstoqueClient:
    def __init__(self, token: Optional[str] = None):
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
        
    def verificar_disponibilidade(self, produto_id: int, quantidade: int) -> bool:
        if settings.USAR_MOCKS:
            return ESTOQUE_MOCK.get(produto_id, 0) >= quantidade
        
        try:
            resposta = httpx.get(
                f"{settings.ESTOQUE_URL}/estoque/{produto_id}/disponibilidade",
                params={"quantidade": quantidade},
                headers=self.headers,
                timeout=5.0,
            )
        
        except httpx.RequestError as erro:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de estoque indisponível") from erro
        
        if resposta.status_code == 404:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Produto {produto_id} sem registro no estoque")
        
        if resposta.status_code == 503:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, _mensagem_erro(resposta, "Serviço de estoque indisponível"))
        
        if resposta.status_code != 200:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao consultar serviço de Estoque")
        
        return DisponibilidadeExterna.model_validate(resposta.json()).disponivel
    
    def retirar(self, produto_id: int, quantidade: int, observacao: str = "") -> None:
        if settings.USAR_MOCKS:
            if ESTOQUE_MOCK.get(produto_id, 0) < quantidade:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Estoque insuficiente do produto {produto_id}")
            ESTOQUE_MOCK[produto_id] -= quantidade
            return
        
        try:
            resposta = httpx.post(
                f"{settings.ESTOQUE_URL}/estoque/{produto_id}/saida",
                json={"quantidade": quantidade, "observacao": observacao},
                headers=self.headers,
                timeout=5.0,
            )
        
        except httpx.RequestError as erro:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de estoque indisponível") from erro
        
        if resposta.status_code == 400:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, _mensagem_erro(resposta, f"Estoque insuficiente do produto {produto_id}"))
        
        if resposta.status_code == 409:
            raise HTTPException(status.HTTP_409_CONFLICT, f"O estoque do produto {produto_id} foi alterado por outra operação. Tente novamente.")
        
        if resposta.status_code != 200:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao retirar do estoque") 
        