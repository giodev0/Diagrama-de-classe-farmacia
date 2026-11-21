from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

TipoUsuario = Literal["ADMIN", "FUNCIONARIO"]

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class UsuarioBase(BaseSchema):
    nome: str = Field(min_length=3, max_length=100)
    email: EmailStr
    tipo: TipoUsuario = "FUNCIONARIO"

class UsuarioCreate(UsuarioBase):
    senha: str = Field(min_length=6)

class UsuarioUpdate(BaseSchema):
    nome: Optional[str] = Field(default=None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    senha: Optional[str] = Field(default=None, min_length=6)
    tipo: Optional[TipoUsuario] = None

class UsuarioResponse(UsuarioBase):
    id: int
    ativo: bool
    criado_em: datetime

class LoginRequest(BaseSchema):
    email: EmailStr
    senha: str

class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
