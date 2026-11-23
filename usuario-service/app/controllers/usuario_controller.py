from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import exigir_admin, get_usuario_atual
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario_schema import (
    LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse, UsuarioUpdate,
)
from app.services.usuario_service import UsuarioService

router = APIRouter(tags=["Usuários"])

def get_usuario_service(db: Session = Depends(get_db)) -> UsuarioService:
    return UsuarioService(UsuarioRepository(db))

@router.post("/auth/login", response_model=TokenResponse)
def login(dados: LoginRequest, service: UsuarioService = Depends(get_usuario_service)):
    return service.autenticar_usuario(dados)

@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exigir_admin)])
def cadastrar(dados: UsuarioCreate, service: UsuarioService = Depends(get_usuario_service)):
    return service.cadastrar_usuario(dados)

@router.delete("/usuarios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(id: int, usuario_logado: dict = Depends(exigir_admin), service: UsuarioService = Depends(get_usuario_service)):
    service.excluir_usuario(id, usuario_logado)

@router.get("/usuarios", response_model=list[UsuarioResponse], dependencies=[Depends(get_usuario_atual)])
def listar(service: UsuarioService = Depends(get_usuario_service)):
    return service.listar_usuarios()

@router.get("/usuarios/{id}", response_model=UsuarioResponse, dependencies=[Depends(get_usuario_atual)])
def buscar(id: int, service: UsuarioService = Depends(get_usuario_service)):
    return service.buscar_usuario(id)

@router.put("/usuarios/{id}", response_model=UsuarioResponse, dependencies=[Depends(get_usuario_atual)])
def editar(id: int, dados: UsuarioUpdate, usuario_logado: dict = Depends(get_usuario_atual), service: UsuarioService = Depends(get_usuario_service)):
    return service.editar_usuario(id, dados, usuario_logado)
