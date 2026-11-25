from datetime import date, datetime, time, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.venda import Venda

class VendaRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def salvar(self, venda: Venda) -> Venda:
        self.db.add(venda)
        self.db.commit()
        self.db.refresh(venda)
        return venda
    
    def buscar_por_id(self, id: int) -> Optional[Venda]:
        consulta = select(Venda).options(selectinload(Venda.itens)).where(Venda.id == id)
        return self.db.scalars(consulta).first()
    
    def listar(self, inicio: Optional[date] = None, fim: Optional[date] = None, status: Optional[str] = None) -> list[Venda]:
        consulta = select(Venda).options(selectinload(Venda.itens))
        if inicio:
            consulta = consulta.where(Venda.criada_em >= datetime.combine(inicio, time.min))
            
        if fim:
            consulta = consulta.where(Venda.criada_em < datetime.combine(fim + timedelta(days=1), time.min))
            
        if status:
            consulta = consulta.where(Venda.status == status)
            
        consulta = consulta.order_by(Venda.criada_em.desc())
        return list(self.db.scalars(consulta).all())
