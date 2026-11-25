from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, DateTime, func, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Venda(Base):
    __tablename__ = "vendas"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    funcionario_id: Mapped[int] = mapped_column(nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="ABERTA")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    desconto_percentual: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    valor_desconto: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    valor_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    forma_pagamento: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pagamento_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    criada_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    finalizada_em: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    itens: Mapped[list["ItemVenda"]] = relationship(
        back_populates="venda", cascade="all, delete-orphan"
    )
    
class ItemVenda(Base):
    __tablename__ = "itens_venda"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    venda_id: Mapped[int] = mapped_column(ForeignKey("vendas.id"), nullable=False)
    produto_id: Mapped[int] = mapped_column(nullable=False)
    nome_produto: Mapped[str] = mapped_column(String(150), nullable=False)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantidade: Mapped[int] = mapped_column(nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    venda: Mapped["Venda"] = relationship(back_populates="itens")