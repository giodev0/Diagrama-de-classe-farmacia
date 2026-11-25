from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class ExternoSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
    )
    
class ProdutoExterno(ExternoSchema):
    id: int
    nome: str
    preco: Decimal

class DisponibilidadeExterna(ExternoSchema):
    produto_id: int
    quantidade_solicitada: int
    quantidade_disponivel: int
    disponivel: bool
    
class PagamentoExterno(ExternoSchema):
    id: int
    venda_id: int
    valor: Decimal
    forma_pagamento: str
    status: str
