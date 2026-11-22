from fastapi import HTTPException, status

from app.core.security import criar_token, gerar_hash_senha, verificar_senha
from app.model.usuario import Usuario
from app.repository.usuario_repository import UsuarioRepository
from app.schema.usuario_schema import LoginRequest, TokenResponse, UsuarioCreate, UsuarioUpdate

class UsuarioService:
    def __init__(self, repo: UsuarioRepository):
        self.repo = repo

    def cadastrar_usuario(self, dados: UsuarioCreate) -> Usuario:
        if self.repo.buscar_por_email(dados.email):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email já cadastrado")

        usuario = Usuario(
            nome=dados.nome,
            email=dados.email,
            tipo=dados.tipo,
            senha_hash=gerar_hash_senha(dados.senha),
        )
        return self.repo.salvar(usuario)

    def buscar_usuario(self, id: int) -> Usuario:
        usuario = self.repo.buscar_por_id(id)
        if not usuario or not usuario.ativo:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")
        return usuario

    def listar_usuarios(self) -> list[Usuario]:
        return self.repo.listar()

    def editar_usuario(self, id: int, dados: UsuarioUpdate, usuario_logado: dict) -> Usuario:
        if usuario_logado["id"] != id and usuario_logado["tipo"] != "ADMIN":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Sem permissão para editar esse usuário")
        
        if dados.tipo and usuario_logado["tipo"] != "ADMIN":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Apenas administradores podem alterar o tipo")

        if dados.tipo and usuario_logado["id"] == id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Você não pode alterar o próprio tipo")

        usuario = self.buscar_usuario(id)
        alteracoes = dados.model_dump(exclude_unset=True, exclude_none=True)
        if alteracoes.get("tipo") == "FUNCIONARIO" and usuario.tipo == "ADMIN":
            if self.repo.contar_admins_ativos() <= 1:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Não é possível rebaixar o último administrador")

        if "email" in alteracoes and alteracoes["email"] != usuario.email:
            if self.repo.buscar_por_email(alteracoes["email"]):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email já cadastrado")

        if "senha" in alteracoes:
            usuario.senha_hash = gerar_hash_senha(alteracoes.pop("senha"))

        for campo, valor in alteracoes.items():
            setattr(usuario, campo, valor)

        return self.repo.salvar(usuario)

    def excluir_usuario(self, id: int, usuario_logado: dict) -> None:
        if usuario_logado["id"] == id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Você não pode excluir a própria conta")
        
        usuario = self.buscar_usuario(id)
        if usuario.tipo == "ADMIN" and self.repo.contar_admins_ativos() <= 1:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Não é possível excluir o último administrador")
        
        usuario.ativo = False
        self.repo.salvar(usuario)

    def autenticar_usuario(self, dados: LoginRequest) -> TokenResponse:
        usuario = self.repo.buscar_por_email(dados.email)
        if not usuario or not usuario.ativo or not verificar_senha(dados.senha, usuario.senha_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou senha inválidos")
        
        return TokenResponse(access_token=criar_token(usuario.id, usuario.tipo))