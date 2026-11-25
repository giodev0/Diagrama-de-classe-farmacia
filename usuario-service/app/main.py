from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.usuario_controller import router as usuario_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.erros import registrar_handlers_de_erro
from app.core.security import gerar_hash_senha
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository

Base.metadata.create_all(bind=engine)

def criar_admin_inicial():
    db = SessionLocal()
    try:
        repo = UsuarioRepository(db)
        if not repo.buscar_por_email(settings.ADMIN_EMAIL):
            repo.salvar(Usuario(
                nome="Administrador",
                email=settings.ADMIN_EMAIL,
                senha_hash=gerar_hash_senha(settings.ADMIN_SENHA),
                tipo="ADMIN",
            ))
            print(f"ADMIN inicial criado: {settings.ADMIN_EMAIL}")
    finally:
        db.close()

criar_admin_inicial()

app = FastAPI(title="Serviço de Usuário", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

registrar_handlers_de_erro(app)

app.include_router(usuario_router)