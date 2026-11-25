from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

def _resposta_erro(request: Request, status_code: int, mensagem: str, campos: dict | None = None, headers: dict | None = None) -> JSONResponse:
    corpo = {
        "timestamp": datetime.now().isoformat(timespec="milliseconds"),
        "status": status_code,
        "erro": mensagem,
        "caminho": request.url.path,
    }
    if campos:
        corpo["campos"] = campos
    return JSONResponse(status_code=status_code, content=corpo, headers=headers)

def registrar_handlers_de_erro(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def erro_http(request: Request, exc: StarletteHTTPException):
        return _resposta_erro(request, exc.status_code, str(exc.detail), headers=getattr(exc, "headers", None))
    
    @app.exception_handler(RequestValidationError)
    async def erro_validacao(request: Request, exc: RequestValidationError):
        campos = {}
        for erro in exc.errors():
            nome = ".".join(str(parte) for parte in erro["loc"][1:]) or "corpo"
            campos[nome] = erro["msg"]
        return _resposta_erro(request, 400, "Dados invalidos", campos)