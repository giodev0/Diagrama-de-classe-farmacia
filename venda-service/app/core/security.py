import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer = HTTPBearer()

def get_usuario_atual(credenciais: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    token = credenciais.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as erro:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirado") from erro
    except jwt.InvalidTokenError as erro:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido") from erro
    
    if "sub" not in payload or "tipo" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sem os dados do usuário")
    
    return {
        "id": int(payload["sub"]),
        "tipo": payload["tipo"],
        "token": token
    }