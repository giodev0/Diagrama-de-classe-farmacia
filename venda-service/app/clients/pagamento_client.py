from decimal import Decimal
from typing import Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.externo_schema import PagamentoExterno

_proximo_id_mock = 1

class PagamentoClient:
    def __init__(self, token: Optional[str] = None):
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
        
    def processar(self, venda_id: int, valor: Decimal, forma_pagamento: str) -> PagamentoExterno:
        if settings.USAR_MOCKS:
            return self._processar_mock(venda_id, valor, forma_pagamento)
        
        try:
            resposta = httpx.post(
                f"{settings.PAGAMENTO_URL}/pagamentos",
                json = {
                    "vendaId": venda_id,
                    "valor": float(valor),
                    "formaPagamento": forma_pagamento,
                },
                headers=self.headers,
                timeout=10.0, 
            )
        
        except httpx.RequestError as erro:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Serviço de Pagamentos indisponível") from erro
        
        if resposta.status_code == 400:
            mensagem = resposta.json().get("erro", "Dados de pagamento inválidos")
            raise HTTPException(status.HTTP_400_BAD_REQUEST, mensagem)
        
        if resposta.status_code not in (200, 201):
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Erro ao processar pagamento")
        
        return PagamentoExterno.model_validate(resposta.json())
    
    def _processar_mock(self, venda_id: int, valor: Decimal, forma_pagamento: str) -> PagamentoExterno:
        global _proximo_id_mock
        status_pagamento = "RECUSADO" if valor > 1000 else "APROVADO"
        pagamento = PagamentoExterno(
            id=_proximo_id_mock,
            venda_id=venda_id,
            valor=valor,
            forma_pagamento=forma_pagamento,
            status=status_pagamento,
        )
        _proximo_id_mock += 1
        return pagamento
