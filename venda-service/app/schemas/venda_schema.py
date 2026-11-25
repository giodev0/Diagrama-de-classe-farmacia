from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer
from pydantic.alias_generators import to_camel

FormaPagamento = Literal["PIX", "CARTAO", "DINHEIRO"]

StatusVenda = Literal["ABERTA", "FINALIZADA", "CANCELADA"]

Dinheiro = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )
    
class ItemAdicionar(BaseSchema):
    produto_id: int = Field(gt=0)
    quantidade: int = Field(gt=0, le=100)
    
class DescontoRequest(BaseSchema):
    desconto_percentual: Decimal = Field(ge=0, le=100, decimal_places=2)
    
class FinalizarRequest(BaseSchema):
    forma_pagamento: FormaPagamento
    
class ItemVendaResponse(BaseSchema):
    id: int
    produto_id: int
    nome_produto: str
    preco_unitario: Dinheiro
    quantidade: int
    subtotal: Dinheiro
    
class VendaResponse(BaseSchema):
    id: int
    funcionario_id: int
    status: StatusVenda
    itens: list[ItemVendaResponse]
    subtotal: Dinheiro
    desconto_percentual: Dinheiro
    valor_desconto: Dinheiro
    valor_total: Dinheiro
    forma_pagamento: Optional[FormaPagamento] = None
    pagamento_id: Optional[int] = None
    criada_em: datetime
    finalizada_em: Optional[datetime] = None
    
    