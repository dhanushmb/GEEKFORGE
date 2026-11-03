
import logging
import re
from urllib.parse import parse_qs, urlparse

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound

from app.services.gemini import MODEL, get_gemini_client

router = APIRouter(prefix="/api/video", tags=["Video Explorer"])
logger = logging.getLogger(__name__)


class VideoRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    question: str = Field(
        default="Explain this video in simple language for students.",
        min_length=1,
        max_length=1000,
    )
    language: str = Field(default="English", min_length=1, max_length=40)


def extract_video_id(url: str) -> str | None:
    try:
        parsed_url = urlparse(url)
    except ValueError:
        return None
    host = (parsed_url.hostname or "").lower()
    if host not in {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
    }:
        return None

    if host.endswith("youtu.be"):
        candidate = parsed_url.path.strip("/").split("/", 1)[0]
    elif parsed_url.path == "/watch":
        candidate = parse_qs(parsed_url.query).get("v", [""])[0]
    else:
        match = re.fullmatch(r"/(?:embed|shorts)/([A-Za-z0-9_-]{11})/?", parsed_url.path)
        candidate = match.group(1) if match else ""

    return candidate if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate) else None


def get_transcript_text(video_id: str) -> str:
    transcript_list = YouTubeTranscriptApi().list(video_id)
    try:
        transcript = transcript_list.find_transcript(["en"])
    except NoTranscriptFound:
        try:
            transcript = next(iter(transcript_list))
        except StopIteration as exc:
            raise HTTPException(
                status_code=404,
                detail="No transcript is available for this video.",
            ) from exc

    snippets = transcript.fetch()
    return " ".join(snippet.text for snippet in snippets.snippets).strip()


@router.post("/explore")
def explore_video(request: VideoRequest):

    video_id = extract_video_id(request.url)

    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid YouTube video URL.",
        )

    try:

        transcript_text = get_transcript_text(video_id)

        if not transcript_text:
            raise HTTPException(
                status_code=404,
                detail="No transcript available for this video.",
            )

        prompt = f"""
You are DISHA AI, a friendly career exploration guide
for Indian students, especially rural students.
Respond entirely in {request.language}. Do not use English except for proper names,
standard acronyms, or terms that have no natural translation.

Analyze the following educational YouTube video transcript.

Student question:
{request.question}

Video transcript:
{transcript_text[:30000]}

Explain in simple student-friendly language:

1. What this video is about.
2. Important concepts explained simply.
3. Careers or professions related to the video.
4. Skills students can learn.
5. Education pathways in India, wherever relevant.
6. One practical learning activity for students.

Use headings and bullet points.
Be encouraging and easy to understand.

Do not invent information not supported by the transcript.
Clearly distinguish general career guidance from information
directly stated in the video.
"""

        response = get_gemini_client().models.generate_content(
            model=MODEL,
            contents=prompt,
        )

        explanation = getattr(response, "text", None)

        if not explanation:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty explanation.",
            )

        return {
            "success": True,
            "video_id": video_id,
            "video_url": request.url,
            "explanation": explanation,
            "source": "youtube_transcript + gemini",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Video exploration failed")
        raise HTTPException(
            status_code=502,
            detail="Video exploration failed. Please try again.",
        ) from exc
