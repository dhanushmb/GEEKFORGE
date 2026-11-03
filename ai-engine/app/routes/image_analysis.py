import logging
from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from google.genai import types
from PIL import Image

from app.services.gemini import MODEL, get_gemini_client

router = APIRouter(prefix="/api/image", tags=["Image Analysis"])
logger = logging.getLogger(__name__)


@router.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    question: str = Form(
        "Explain this image in simple language for a student.",
        min_length=1,
        max_length=1000,
    ),
    language: str = Form("English", min_length=1, max_length=40),
):
    try:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a valid image.",
            )

        image_bytes = await image.read(10 * 1024 * 1024 + 1)

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image must be smaller than 10 MB.",
            )

        try:
            with Image.open(BytesIO(image_bytes)) as uploaded_image:
                uploaded_image.verify()
            with Image.open(BytesIO(image_bytes)) as uploaded_image:
                img = uploaded_image.convert("RGB")
        except (OSError, ValueError) as exc:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a readable image.",
            ) from exc
        image_buffer = BytesIO()
        img.save(image_buffer, format="JPEG")
        img.close()

        prompt = f"""
You are DISHA AI, a friendly career exploration guide for Indian students.
Respond entirely in {language}. Do not use English except for proper names,
standard acronyms, or terms that have no natural translation.

Analyze the uploaded image and answer the student's question.

Question: {question}

Instructions:
- Explain in simple, student-friendly language.
- If the image shows a profession, explain the profession.
- Explain relevant skills, education, and career opportunities.
- Be encouraging and culturally relevant to Indian students.
- Do not invent details that cannot be identified from the image.
"""

        image_part = types.Part.from_bytes(
            data=image_buffer.getvalue(),
            mime_type="image/jpeg",
        )
        response = get_gemini_client().models.generate_content(
            model=MODEL,
            contents=[prompt, image_part],
        )
        analysis = response.text
        if not analysis:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty image explanation.",
            )

        return {
            "success": True,
            "question": question,
            "analysis": analysis,
            "source": "gemini",
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Gemini image analysis failed")
        raise HTTPException(
            status_code=502,
            detail="Image analysis failed. Please try again.",
        ) from exc
    finally:
        await image.close()