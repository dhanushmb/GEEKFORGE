# Career matching source snapshots

These five CSV files were supplied by the project owner and copied unchanged
from Downloads. They are reference data, not a live admissions feed.

| File | Original rows | Interpretation |
| --- | ---: | --- |
| education_pathways_india.csv | 47 | Education stages, eligibility, subjects, interests and example careers |
| courses_dataset.csv | 448 | Course/provider records; dates, fees and enrolment need current verification |
| KCET_cutoff_combined.csv | 4,407 | **PGCET**, despite the filename: all source PDFs name PGCET and college codes start with T. Contains 2024–2026 records, including mock rounds and explicitly ambiguous round labels. |
| pgcet_2025_mtech_rest_of_karnataka_cutoffs.csv | 822 | PGCET M.Tech, second/final rounds. Year 2025 comes from the filename. |
| rest_of_karnataka_dataset.csv | 1,668 | Undergraduate engineering; KCET inferred from E-series college codes/course names. Exam, year and round are absent from the CSV; year/round remain null. Quota comes from the filename. |

The loader expands wide category columns to individual cutoff records, skips
blank/unparseable ranks, and preserves positive fractional ranks. It removes
PDF-inserted whitespace inside numbers, including `192962.7\n5`. Unknown values
are never converted to zero. Original CSV row numbers (including the header)
remain attached to every record.

Matching uses local keyword retrieval with common English/Kannada interest
aliases. Education level boosts relevant pathways; it is not an eligibility
decision. At most eight records of each type are sent to Gemini. Cutoff evidence
requires an explicitly selected exam and category; rank is optional. Rank <=
the recorded cutoff means only a historical numeric comparison, including for
mock rounds. It is not a seat or eligibility prediction. No category is inferred
from personal data. Retrieval chooses one representative row per college/course
using topical relevance, rank comparison, then year and distance from the
student's rank (or ascending cutoff if no rank), retaining its actual round.

Gemini selects source IDs for its explanations. The server resolves only IDs
in the retrieved context and attaches the original records to the response;
generated links/cutoff metadata cannot replace source records. File content is
provided as reference data, never as application instructions. Only HTTP(S)
provider links without embedded credentials are retained.

To refresh, replace the relevant CSV here with the same schema, update this
provenance note, and restart the API (the parsed index is cached). The application
does not read from the owner's Downloads folder at runtime. No extra service,
API key, database or embedding dependency is required.
