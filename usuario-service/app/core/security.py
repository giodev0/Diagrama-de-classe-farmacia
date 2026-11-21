from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings


def gerar_hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))

def criar_token(usuario_id: int, tipo: str) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(usuario_id),
        "tipo": tipo,
        "exp": expira,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decodificar_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

bearer = HTTPBearer()

def get_usuario_atual(credenciais: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = decodificar_token(credenciais.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    return {"id": int(payload["sub"]), "tipo": payload["tipo"]}

def exigir_admin(usuario: dict = Depends(get_usuario_atual)) -> dict:
    if usuario["tipo"] != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Apenas administradores")
    return usuario