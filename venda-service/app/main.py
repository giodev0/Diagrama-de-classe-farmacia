from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.venda_controller import router as venda_router
from app.core.database import Base, engine
from app.core.erros import registrar_handlers_de_erro
from app.models import venda

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Serviço de Venda", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

registrar_handlers_de_erro(app)

@app.get("/", tags=["Status"])
def status_servico():
    return {"mensagem": "Serviço de Vendas funcionando"}

app.include_router(venda_router)