
import json
import logging
import os
from typing import Literal

import httpx
from google.genai import errors as genai_errors
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator

from app.data.careers import CAREERS
from app.routes.image_analysis import router as image_router
from app.routes.auth import get_auth_store, router as auth_router
from app.routes.voice import router as voice_router

from app.services.career_ai import ask_career_ai, recommend_careers

# DISHA AI multimodal routes

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]
frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
] or DEFAULT_FRONTEND_ORIGINS


app = FastAPI(
    title="DISHA AI API",
    description="Multimodal AI Career Exploration Platform",
    version="1.0.0",
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register multimodal routers
app.include_router(image_router)
app.include_router(voice_router)
app.include_router(auth_router)


@app.middleware("http")
async def require_authenticated_api(request, call_next):
    path = request.url.path
    public_auth_paths = {"/api/auth/login", "/api/auth/signup"}
    if (
        path.startswith("/api/")
        and path not in public_auth_paths
        and request.method != "OPTIONS"
    ):
        scheme, separator, token = request.headers.get(
            "authorization", ""
        ).partition(" ")
        user = (
            get_auth_store().get_session_account(token.strip())
            if separator and scheme.lower() == "bearer" and token.strip()
            else None
        )
        if not user:
            return JSONResponse(
                status_code=401,
                content={"detail": "Sign in to continue."},
            )
        request.state.user = user
    return await call_next(request)


# Request and response models
class CareerChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=8000)
    language: Literal["English", "Kannada"] = "English"


class CareerChatResponse(BaseModel):
    answer: str
    source: str


class CareerDiscoveryRequest(BaseModel):
    interests: list[str] = Field(min_length=1, max_length=20)
    subjects: list[str] = Field(min_length=1, max_length=20)
    skills: list[str] = Field(min_length=1, max_length=20)
    class_level: str = Field(min_length=1, max_length=100)
    language: Literal["English", "Kannada"] = "English"
    exam: Literal["KCET", "PGCET"] | None = None
    rank: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    category: str | None = Field(default=None, pattern=r"^[A-Z0-9]{1,5}$")

    @model_validator(mode="after")
    def validate_admission_comparison(self):
        if self.rank is not None and (not self.exam or not self.category):
            raise ValueError("Choose an exam and category when supplying a rank.")
        if bool(self.exam) != bool(self.category):
            raise ValueError("Choose both an exam and category for cutoff references.")
        return self


# Root endpoint
@app.get("/")
def root():
    return {
        "project": "DISHA AI",
        "status": "running",
        "message": "Career exploration API is ready",
    }


# Health endpoint
@app.get("/health")
def health():
    return {"status": "healthy"}


# Career list endpoint
@app.get("/api/careers")
def get_careers():
    return {"careers": CAREERS}


# AI Career Mentor endpoint
@app.post(
    "/api/career/chat",
    response_model=CareerChatResponse,
)
def career_chat(request: CareerChatRequest):
    try:
        answer = ask_career_ai(request.question, request.language)
        if not answer.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI mentor returned an empty response. Please try again.",
            )

        return CareerChatResponse(
            answer=answer,
            source="gemini",
        )

    except httpx.TransportError as exc:
        logger.warning("AI mentor connection failed after retries: %s", type(exc).__name__)
        return JSONResponse(status_code=503, content={
            "code": "mentor_network",
            "detail": "The guide could not connect to the AI service. Please try again.",
        })
    except genai_errors.APIError as exc:
        logger.warning("AI mentor provider returned HTTP %s", exc.code)
        if exc.code == 429:
            code, message = "mentor_rate_limited", "The AI service request limit has been reached. Please try again later."
        elif exc.code in {400, 401, 402, 403, 404}:
            code, message = "mentor_configuration", "The AI service configuration needs attention."
        else:
            code, message = "mentor_busy", "The AI service is temporarily unavailable. Please try again."
        return JSONResponse(status_code=503, content={"code": code, "detail": message})
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Gemini career chat failed")
        raise HTTPException(
            status_code=502,
            detail="The AI mentor is temporarily unavailable. Please try again.",
        ) from exc


# AI Career Discovery endpoint
@app.post("/api/career/recommend")
def career_recommend(request: CareerDiscoveryRequest):
    try:
        admission = {}
        if request.exam:
            admission = {"exam": request.exam, "rank": request.rank, "category": request.category}
        result = recommend_careers(
            interests=request.interests,
            subjects=request.subjects,
            skills=request.skills,
            class_level=request.class_level,
            language=request.language,
            **admission,
        )

        try:
            recommendations = json.loads(result)
        except json.JSONDecodeError as exc:
            logger.exception("Gemini returned invalid career recommendations")
            raise HTTPException(
                status_code=502,
                detail="The AI returned invalid recommendations. Please try again.",
            ) from exc

        cutoff_references = []
        if isinstance(recommendations, dict):
            cutoff_references = recommendations.get("cutoff_references", [])
            recommendations = recommendations.get("recommendations")

        if not isinstance(recommendations, list) or not recommendations:
            raise HTTPException(
                status_code=502,
                detail="The AI returned invalid recommendations. Please try again.",
            )

        return {"recommendations": recommendations, "cutoff_references": cutoff_references, "source": "gemini"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Gemini career recommendations failed")
        raise HTTPException(
            status_code=502,
            detail="Career recommendations are temporarily unavailable.",
        ) from exc
