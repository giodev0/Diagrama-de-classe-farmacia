from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.model.usuario import Usuario


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def salvar(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario
    
    def buscar_por_id(self, id: int) -> Optional[Usuario]:
        return self.db.get(Usuario, id)
    
    def buscar_por_email(self, email: str) -> Optional[Usuario]:
        consulta = select(Usuario).where(Usuario.email == email)
        return self.db.scalars(consulta).first()

    def listar(self, apenas_ativos: bool = True) -> list[Usuario]:
        consulta = select(Usuario)
        if apenas_ativos:
            consulta = consulta.where(Usuario.ativo.is_(True))
        return list(self.db.scalars(consulta).all())

    def excluir(self, usuario: Usuario) -> None:
        self.db.delete(usuario)
        self.db.commit()

    def contar_admins_ativos(self) -> int:
        consulta = select(func.count()).select_from(Usuario).where(
            Usuario.tipo == "ADMIN",
            Usuario.ativo.is_(True),
        )
        return self.db.scalar(consulta)
        