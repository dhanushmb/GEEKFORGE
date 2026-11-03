"""Retrieve bounded, attributable evidence from the supplied CSV snapshots.

The combined file is PGCET despite its KCET filename. No source is treated
as current admission eligibility or as a guarantee of an available seat.
"""

import csv
import math
import re
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "datasets"
FILES = (
    "education_pathways_india.csv",
    "courses_dataset.csv",
    "KCET_cutoff_combined.csv",
    "pgcet_2025_mtech_rest_of_karnataka_cutoffs.csv",
    "rest_of_karnataka_dataset.csv",
)

# Expand common English/Kannada interests before lexical retrieval. This is
# deliberately local: no embedding service or additional credentials needed.
ALIASES = {
    "coding": "programming computer software technical engineering",
    "code": "programming computer software technical engineering",
    "computer": "software computing technical engineering",
    "cse": "computer science software",
    "ai": "artificial intelligence machine learning data",
    "ml": "machine learning data",
    "math": "maths mathematics statistics",
    "maths": "math mathematics statistics",
    "doctor": "medicine medical biology patient healthcare mbbs",
    "bio": "biology healthcare biosciences",
    "help": "helping care service community",
    "draw": "drawing design art architecture creativity",
    "farming": "agriculture agricultural food",
    "drawing": "design architecture creativity",
    "ಕೋಡಿಂಗ್": "coding programming computer software technical engineering",
    "ಸಂಕೇತ ಬರೆಯುವುದು": "coding programming computer software technical engineering",
    "ಜನರಿಗೆ ಸಹಾಯ": "helping care service community",
    "ಪ್ರೋಗ್ರಾಮಿಂಗ್": "programming computer software technical engineering",
    "ಗಣಕ": "computer science software",
    "ಕಂಪ್ಯೂಟರ್": "computer science software",
    "ಗಣಿತ": "maths mathematics statistics",
    "ವಿಜ್ಞಾನ": "science research",
    "ಭೌತಶಾಸ್ತ್ರ": "physics",
    "ರಸಾಯನಶಾಸ್ತ್ರ": "chemistry chemical",
    "ಜೀವವಿಜ್ಞಾನ": "biology healthcare biosciences",
    "ವೈದ್ಯ": "medicine medical healthcare mbbs",
    "ಆರೋಗ್ಯ": "healthcare medical nursing",
    "ತಂತ್ರಜ್ಞಾನ": "technology computer engineering",
    "ಎಐ": "artificial intelligence machine learning data",
    "ದತ್ತಾಂಶ": "data statistics analytics",
    "ವಿನ್ಯಾಸ": "design architecture creativity",
    "ಚಿತ್ರಕಲೆ": "drawing design architecture",
    "ಕೃಷಿ": "agriculture agricultural farming",
    "ವ್ಯವಹಾರ": "business management commerce",
    "ಹಣಕಾಸು": "finance accounting commerce",
    "ಸಂವಹನ": "communication",
    "ಸಮಸ್ಯೆ ಪರಿಹಾರ": "problem solving logic",
    "ಯಂತ್ರ": "machine mechanical",
    "ಶಿಕ್ಷಣ": "education teaching",
    "ಕಾನೂನು": "law legal",
}
STOP_WORDS = set("and or the a an of in for to with by after class course courses skills learning".split())


def terms(text: str, expand: bool = False) -> set[str]:
    text = text.lower()
    if expand:
        additions = [value for key, value in ALIASES.items()
                     if (key in text if not key.isascii() else re.search(r"\b" + re.escape(key) + r"\b", text))]
        text += " " + " ".join(additions)
    return {word for word in re.findall(r"[a-z]+", text)
            if len(word) > 1 and word not in STOP_WORDS}


def parse_rank(value: str) -> float | None:
    # PDF extraction can insert newlines within fractional ranks.
    value = re.sub(r"\s+", "", value).replace(",", "")
    if not re.fullmatch(r"\d+(?:\.\d+)?", value):
        return None
    number = float(value)
    return number if math.isfinite(number) and number > 0 else None


def safe_url(value: str) -> str:
    parsed = urlsplit(value.strip())
    return value.strip() if parsed.scheme in {"http", "https"} and parsed.netloc and not parsed.username else ""


def read_rows(filename: str):
    with (DATA_DIR / filename).open(encoding="utf-8-sig", newline="") as handle:
        for row_number, row in enumerate(csv.DictReader(handle), start=2):
            yield row_number, {key: (value or "").strip() for key, value in row.items() if key}


@lru_cache(maxsize=1)
def load_datasets() -> tuple[dict, ...]:
    records = []
    for filename in FILES:
        for row_number, row in read_rows(filename):
            base = {"source_file": filename, "source_row": row_number}
            if filename == FILES[0]:
                records.append({**base, "id": f"pathway:{row['pathway_id']}", "kind": "pathway",
                                "title": row["course_or_programme"], **row})
            elif filename == FILES[1]:
                records.append({**base, **row, "id": f"course:{row_number}", "kind": "course",
                                "title": row["course_title"], "url": safe_url(row["url"])})
            elif filename == FILES[2]:
                rank = parse_rank(row["cutoff_rank"])
                if rank is None:
                    continue
                records.append({**base, "id": f"combined:{row_number}", "kind": "cutoff",
                                "title": row["course"], "college": row["college"],
                                "college_code": row["college_code"], "exam": "PGCET",
                                "exam_basis": "Source PDF filenames identify PGCET; CSV filename says KCET.",
                                "year": int(row["year"]), "round": row["counselling_round"],
                                "quota": row["quota"], "category": row["category"], "cutoff_rank": rank,
                                "source_document": row["source_file"], "source_page": row["source_page"],
                                "generated_date": row["generated_date"]})
            else:
                pgcet = filename == FILES[3]
                metadata = {"College Code", "College Name", "Course Name", "Round", "Quota"}
                for category, value in row.items():
                    if category in metadata:
                        continue
                    rank = parse_rank(value)
                    if rank is None:
                        continue
                    records.append({**base, "id": f"{'pgcet' if pgcet else 'kcet'}:{row_number}:{category}",
                                    "kind": "cutoff", "title": row["Course Name"],
                                    "college": row["College Name"], "college_code": row["College Code"],
                                    "exam": "PGCET" if pgcet else "KCET",
                                    "exam_basis": "PGCET M.Tech identified by source filename." if pgcet else
                                    "KCET engineering inferred from E-series college codes and undergraduate courses; exam absent from CSV.",
                                    "year": 2025 if pgcet else None,
                                    "year_basis": "Source filename" if pgcet else "Not supplied",
                                    "round": row.get("Round") or None,
                                    "quota": row.get("Quota") or "Rest of Karnataka (source filename)",
                                    "category": category, "cutoff_rank": rank})
    return tuple(records)


@lru_cache(maxsize=1)
def indexed_datasets() -> tuple[tuple[dict, set[str]], ...]:
    fields = ("title", "stream_or_field", "key_subjects_or_skills", "example_careers",
              "suited_for_interests", "subject_area")
    return tuple((record, terms(" ".join(str(record.get(field, "")) for field in fields)))
                 for record in load_datasets())


def retrieve_evidence(interests: list[str], subjects: list[str], skills: list[str],
                      class_level: str, exam: str | None = None,
                      rank: float | None = None, category: str | None = None) -> list[dict]:
    query = terms(" ".join(interests + subjects + skills), expand=True)
    stage = class_level.lower()
    starting_point = ("After Graduation" if any(value in stage for value in ("undergraduate", "graduate", "degree", "ಪದವಿ"))
                      else "After Class 10" if re.search(r"\b(?:8|9|10)\b", stage) else "After Class 12")
    candidates = {"pathway": [], "course": [], "cutoff": []}
    for record, keywords in indexed_datasets():
        overlap = query & keywords
        if not overlap:
            continue
        kind = record["kind"]
        if kind == "cutoff" and (not exam or not category or record["exam"] != exam or record["category"] != category):
            continue
        # Interest matches matter most. Education only boosts relevant pathways.
        score = len(overlap) / math.sqrt(max(len(keywords), 1))
        if kind == "pathway" and record["starting_point"] == starting_point:
            score += 1.5
        candidates[kind].append((score, record))

    selected = []
    for kind, limit in (("pathway", 8), ("course", 8), ("cutoff", 8)):
        # Prefer higher topical relevance, then historically within-rank rows,
        # then newer records. Never drop a row's exam/category/year/round.
        ranked = sorted(candidates[kind], key=lambda item: (
            -item[0],
            0 if rank is None or kind != "cutoff" or rank <= item[1]["cutoff_rank"] else 1,
            -(item[1].get("year") or 0),
            abs(item[1]["cutoff_rank"] - rank) if kind == "cutoff" and rank is not None else item[1].get("cutoff_rank", 0),
            item[1]["source_row"], item[1]["id"]))
        seen = set()
        count = 0
        for _, record in ranked:
            # One historical example per college/course; all periods remain in
            # the index and the chosen row's exact round is always retained.
            identity = (record.get("college_code"), record["title"]) if kind == "cutoff" else record["title"]
            if identity in seen:
                continue
            seen.add(identity)
            item = dict(record)
            if kind == "cutoff" and rank is not None:
                item["rank_comparison"] = "within_historical_cutoff" if rank <= item["cutoff_rank"] else "above_historical_cutoff"
            selected.append(item)
            count += 1
            if count == limit:
                break
    return selected


def attach_evidence(recommendations: list, evidence: list[dict]) -> list[dict]:
    """Resolve model-selected IDs against retrieved data, never model metadata."""
    by_id = {record["id"]: record for record in evidence}
    result = []
    for item in recommendations:
        if not isinstance(item, dict) or not isinstance(item.get("career"), str):
            continue
        ids = item.get("source_ids", [])
        ids = ids if isinstance(ids, list) else []
        valid_ids = list(dict.fromkeys(value for value in ids if isinstance(value, str) and value in by_id))[:6]
        result.append({**item, "source_ids": valid_ids, "evidence": [by_id[value] for value in valid_ids]})
    return result
