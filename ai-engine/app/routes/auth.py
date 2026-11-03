import re
import sqlite3
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field, model_validator

from app.services.auth_store import AuthStore

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^\+?[1-9]\d{6,14}$")


@lru_cache(maxsize=1)
def get_auth_store() -> AuthStore:
    return AuthStore()


class AccountInput(BaseModel):
    name: str = Field(default="", max_length=100)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=6, max_length=128)

    @model_validator(mode="after")
    def validate_identifier(self):
        if self.email is not None:
            self.email = self.email.strip().lower()
            if not self.email:
                self.email = None
            elif not EMAIL_PATTERN.fullmatch(self.email):
                raise ValueError("Enter a valid email address.")
        if self.phone is not None:
            self.phone = re.sub(r"[\s()-]", "", self.phone.strip())
            if not self.phone:
                self.phone = None
            elif not PHONE_PATTERN.fullmatch(self.phone):
                raise ValueError("Enter a valid phone number with country code if needed.")
        if not self.email and not self.phone:
            raise ValueError("Provide an email address or phone number.")
        return self


class LoginInput(BaseModel):
    identifier: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class AuthResponse(BaseModel):
    token: str
    expires_at: int
    user: dict[str, object]


def _session_response(account: dict[str, object], store: AuthStore) -> AuthResponse:
    token, expires_at = store.create_session(int(account["id"]))
    return AuthResponse(token=token, expires_at=expires_at, user=account)


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(request: AccountInput, store: Annotated[AuthStore, Depends(get_auth_store)]):
    try:
        account = store.create_account(
            name=request.name,
            email=request.email,
            phone=request.phone,
            password=request.password,
        )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists with that email or phone number.",
        ) from exc
    return _session_response(account, store)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginInput, store: Annotated[AuthStore, Depends(get_auth_store)]):
    identifier = request.identifier.strip().lower()
    if not EMAIL_PATTERN.fullmatch(identifier):
        identifier = re.sub(r"[\s()-]", "", request.identifier.strip())
    account = store.authenticate(identifier, request.password)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/phone number or password is incorrect.",
        )
    return _session_response(account, store)


def _bearer_token(authorization: str | None) -> str:
    scheme, separator, token = (authorization or "").partition(" ")
    if not separator or scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
        )
    return token.strip()


def current_user(
    store: Annotated[AuthStore, Depends(get_auth_store)],
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, object]:
    token = _bearer_token(authorization)
    user = store.get_session_account(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        )
    return user


@router.get("/me")
def me(user: Annotated[dict[str, object], Depends(current_user)]):
    return {"user": user}


@router.post("/logout", status_code=204)
def logout(
    store: Annotated[AuthStore, Depends(get_auth_store)],
    _user: Annotated[dict[str, object], Depends(current_user)],
    authorization: Annotated[str | None, Header()] = None,
):
    store.delete_session(_bearer_token(authorization))
