import type { Journey, Lang } from '../types'

export const colleges = [
  {
    college: 'UVCE, Bengaluru',
    course: 'B.E. Computer Science',
    cutoff: 4200,
    category: 'GM',
    fees: '₹25,000 / year (govt)',
    location: 'Bengaluru',
    year: '2024 (labelled sample)',
  },
  {
    college: 'BMS College of Engineering',
    course: 'B.E. Computer Science',
    cutoff: 1800,
    category: 'GM',
    fees: '₹1.2L–₹2.5L / year*',
    location: 'Bengaluru',
    year: '2024 (labelled sample)',
  },
  {
    college: 'SIT, Tumakuru',
    course: 'B.E. Information Science',
    cutoff: 14500,
    category: 'GM',
    fees: 'Check college site',
    location: 'Tumakuru',
    year: '2024 (labelled sample)',
  },
  {
    college: 'NIE, Mysuru',
    course: 'B.E. Computer Science',
    cutoff: 8900,
    category: 'GM',
    fees: 'Check college site',
    location: 'Mysuru',
    year: '2024 (labelled sample)',
  },
]

export const scholarships = [
  {
    name: 'SSP — State Scholarship Portal (Karnataka)',
    who: 'Eligible SC/ST/OBC/EWS and other notified categories',
    action: 'Check scheme list and documents on SSP before applying',
    source: 'ssp.postmatric.karnataka.gov.in (verify live)',
  },
  {
    name: 'National Scholarship Portal',
    who: 'Central and some state-linked schemes',
    action: 'Filter by student type, class, and income',
    source: 'scholarships.gov.in (verify live)',
  },
  {
    name: 'E-Pass / post-matric (as applicable)',
    who: 'Varies by category and course',
    action: 'Confirm current-year circular; do not assume eligibility',
    source: 'Karnataka social welfare / BCWD notices',
  },
]

export const restartOptions = [
  {
    titleEn: 'Karnataka Open School / NIOS',
    titleKn: 'ಕರ್ನಾಟಕ ಓಪನ್ ಸ್ಕೂಲ್ / NIOS',
    detailEn: 'Complete Class 10 or 12 through open schooling if you left mid-way. Confirm current centres and eligibility.',
    detailKn: 'ಮಧ್ಯದಲ್ಲಿ ಬಿಟ್ಟಿದ್ದರೆ ಮುಕ್ತ ಶಾಲೆಯ ಮೂಲಕ 10 ಅಥವಾ 12 ಪೂರೈಸಿ. ಪ್ರಸ್ತುತ ಕೇಂದ್ರ ಮತ್ತು ಅರ್ಹತೆಯನ್ನು ದೃಢಪಡಿಸಿ.',
  },
  {
    titleEn: 'IGNOU / distance undergraduate',
    titleKn: 'IGNOU / ದೂರ ಶಿಕ್ಷಣ ಪದವಿ',
    detailEn: 'Flexible undergraduate programmes after 12th (or equivalent). Check last qualifying exam rules.',
    detailKn: '12ನೇ (ಅಥವಾ ಸಮಾನ) ನಂತರ ನಮ್ಯ ಪದವಿ ಕಾರ್ಯಕ್ರಮಗಳು. ಅರ್ಹತಾ ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
  },
  {
    titleEn: 'ITI / NSDC vocational short courses',
    titleKn: 'ITI / NSDC ವೃತ್ತಿಪರ ಕೋರ್ಸ್‌ಗಳು',
    detailEn: 'Skill routes that can run alongside work. Match the trade to local demand.',
    detailKn: 'ಕೆಲಸದ ಜೊತೆಗೆ ನಡೆಸಬಹುದಾದ ಕೌಶಲ ಮಾರ್ಗಗಳು. ಸ್ಥಳೀಯ ಬೇಡಿಕೆಗೆ ವ್ಯಾಪಾರವನ್ನು ಹೊಂದಿಸಿ.',
  },
]

type Roadmap = {
  title: string
  prereq: string[]
  exams: string[]
  cost: string[]
  related: string[]
}

export const roadmaps: Record<Journey, Record<Lang, Roadmap>> = {
  school: {
    en: {
      title: 'Path toward MBBS (not a guarantee)',
      prereq: [
        'Class 11–12 with Physics, Chemistry, Biology and English',
        'Track NEET syllabus alongside board exams',
        'Keep school records and ID documents ready',
      ],
      exams: [
        'NEET-UG is the national medical entrance — confirm current NTA brochure',
        'State counselling (KEA) after NEET for Karnataka seats',
        'Note: cutoff ranks change every year',
      ],
      cost: [
        'Government seats cost much less than private; verify current fee circulars',
        'Investigate SSP and central scholarships early',
        'Ask the mentor about related allied-health careers if cost is a barrier',
      ],
      related: ['BDS', 'BAMS / BHMS (separate counselling)', 'B.Sc Nursing', 'Allied health (OT, radiology, pharmacy)'],
    },
    kn: {
      title: 'MBBS ಕಡೆಗಿನ ಮಾರ್ಗ (ಭರವಸೆ ಅಲ್ಲ)',
      prereq: [
        '11–12ನೇ ತರಗತಿ: ಭೌತ, ರಸಾಯನ, ಜೀವವಿಜ್ಞಾನ ಮತ್ತು ಇಂಗ್ಲಿಷ್',
        'ಬೋರ್ಡ್ ಪರೀಕ್ಷೆಯ ಜೊತೆಗೆ NEET ಪಠ್ಯಕ್ರಮ',
        'ಶಾಲಾ ದಾಖಲೆ ಮತ್ತು ಗುರುತಿನ ಪತ್ರಗಳನ್ನು ಸಿದ್ಧವಾಗಿರಿಸಿ',
      ],
      exams: [
        'NEET-UG ರಾಷ್ಟ್ರೀಯ ವೈದ್ಯಕೀಯ ಪ್ರವೇಶ — ಪ್ರಸ್ತುತ NTA ಬ್ರೋಷರ್ ನೋಡಿ',
        'NEET ನಂತರ ಕರ್ನಾಟಕ ಸೀಟುಗಳಿಗೆ KEA ಕೌನ್ಸೆಲಿಂಗ್',
        'ಕಟಾಫ್ ರ‍್ಯಾಂಕ್ ಪ್ರತಿ ವರ್ಷ ಬದಲಾಗುತ್ತದೆ',
      ],
      cost: [
        'ಸರ್ಕಾರಿ ಸೀಟುಗಳು ಖಾಸಗಿಗಿಂತ ಕಡಿಮೆ ವೆಚ್ಚ; ಪ್ರಸ್ತುತ ಶುಲ್ಕ ಚೀಟಿ ಪರಿಶೀಲಿಸಿ',
        'SSP ಮತ್ತು ಕೇಂದ್ರ ವಿದ್ಯಾರ್ಥಿವೇತನಗಳನ್ನು ಮುಂಚಿತವಾಗಿ ನೋಡಿ',
        'ವೆಚ್ಚ ತೊಡಕಾದರೆ ಸಂಬಂಧಿತ ಆರೋಗ್ಯ ವೃತ್ತಿಗಳ ಬಗ್ಗೆ ಮಾರ್ಗದರ್ಶಿಯನ್ನು ಕೇಳಿ',
      ],
      related: ['BDS', 'BAMS / BHMS', 'B.Sc ನರ್ಸಿಂಗ್', 'ಅಲೈಡ್ ಹೆಲ್ತ್'],
    },
  },
  admission: {
    en: {
      title: 'KCET counselling checklist (sample rank 12480)',
      prereq: [
        'PUC / 12th science with required subjects',
        'KCET rank card and documents as per KEA checklist',
        'Decide GM / category and rural / Hyderabad-Karnataka claim with proof',
      ],
      exams: [
        'Follow KEA option-entry dates — missing a round can drop a seat',
        'Use historical 2024 cutoffs only as context, not as prediction',
        'Keep a mix of reach / match / safety options',
      ],
      cost: [
        'Prefer government / aided if budget is tight',
        'Confirm tuition + hostel separately',
        'Check SSP after seat allotment, not before eligibility is known',
      ],
      related: ['ISE / ECE if CSE cutoff is too tight', 'SIT Tumakuru, NIE Mysuru as location alternatives'],
    },
    kn: {
      title: 'KCET ಕೌನ್ಸೆಲಿಂಗ್ ಪಟ್ಟಿ (ಮಾದರಿ ರ‍್ಯಾಂಕ್ 12480)',
      prereq: [
        'ಅಗತ್ಯ ವಿಷಯಗಳೊಂದಿಗೆ PUC / 12ನೇ ವಿಜ್ಞಾನ',
        'KEA ಪಟ್ಟಿಯಂತೆ KCET ರ‍್ಯಾಂಕ್ ಕಾರ್ಡ್ ಮತ್ತು ದಾಖಲೆಗಳು',
        'ವರ್ಗ / ಗ್ರಾಮೀಣ / ಹೈದರಾಬಾದ್-ಕರ್ನಾಟಕ ಹಕ್ಕನ್ನು ಪುರಾವೆಯೊಂದಿಗೆ ನಿರ್ಧರಿಸಿ',
      ],
      exams: [
        'KEA ಆಯ್ಕೆ-ನಮೂದು ದಿನಾಂಕಗಳನ್ನು ಅನುಸರಿಸಿ',
        '2024 ಕಟಾಫ್ ಕೇವಲ ಸಂದರ್ಭ; ಭವಿಷ್ಯವಾಣಿ ಅಲ್ಲ',
        'ರೀಚ್ / ಮ್ಯಾಚ್ / ಸೇಫ್ಟಿ ಆಯ್ಕೆಗಳ ಮಿಶ್ರಣ ಇರಿಸಿ',
      ],
      cost: [
        'ಬಜೆಟ್ ಕಡಿಮೆಯಿದ್ದರೆ ಸರ್ಕಾರಿ / ಅನುದಾನಿತವನ್ನು ಆದ್ಯತೆ',
        'ಶುಲ್ಕ + ಹಾಸ್ಟೆಲ್ ಪ್ರತ್ಯೇಕವಾಗಿ ಖಚಿತಪಡಿಸಿ',
        'ಸೀಟು ನಂತರ SSP ನೋಡಿ',
      ],
      related: ['CSE ಕಟಾಫ್ ಕಷ್ಟವಾದರೆ ISE / ECE', 'ತುಮಕೂರು / ಮೈಸೂರು ಪರ್ಯಾಯಗಳು'],
    },
  },
  restart: {
    en: {
      title: 'Restart plan for an adult learner',
      prereq: [
        'Gather whatever school leaving records you have',
        'Write down weekly hours you can study while working',
        'Decide: complete 10/12 first, or a short skill course in parallel',
      ],
      exams: [
        'NIOS / state open school enrolment windows',
        'Some ITI trades have age and education rules — check the current prospectus',
        'IGNOU needs the last qualifying certificate',
      ],
      cost: [
        'Open schooling and many ITI/govt skill courses are lower cost than private degrees',
        'Ask about fee reimbursement only after confirming category eligibility',
      ],
      related: ['Retail / accounting certificates', 'Spoken English + Kannada digital literacy', 'Later: diploma lateral entry if 12th is completed'],
    },
    kn: {
      title: 'ವಯಸ್ಕ ಕಲಿಯುವವರಿಗೆ ಮರುಪ್ರಾರಂಭ ಯೋಜನೆ',
      prereq: [
        'ಇರುವ ಶಾಲಾ ದಾಖಲೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ',
        'ಕೆಲಸದ ಜೊತೆಗೆ ವಾರಕ್ಕೆ ಎಷ್ಟು ಗಂಟೆ ಓದಬಹುದು ಬರೆಯಿರಿ',
        'ಮೊದಲು 10/12 ಪೂರೈಸುವುದೇ ಅಥವಾ ಕೌಶಲ ಕೋರ್ಸ್ ಜೊತೆಗೆ ನಡೆಸುವುದೇ ನಿರ್ಧರಿಸಿ',
      ],
      exams: [
        'NIOS / ರಾಜ್ಯ ಮುಕ್ತ ಶಾಲೆ ದಾಖಲಾತಿ ಕಿಟಕಿಗಳು',
        'ಕೆಲವು ITI ವ್ಯಾಪಾರಗಳಿಗೆ ವಯಸ್ಸು ಮತ್ತು ಶಿಕ್ಷಣ ನಿಯಮಗಳಿವೆ',
        'IGNOUಗೆ ಕೊನೆಯ ಅರ್ಹತಾ ಪ್ರಮಾಣಪತ್ರ ಬೇಕು',
      ],
      cost: [
        'ಮುಕ್ತ ಶಾಲೆ ಮತ್ತು ಅನೇಕ ಸರ್ಕಾರಿ ಕೌಶಲ ಕೋರ್ಸ್‌ಗಳು ಖಾಸಗಿ ಪದವಿಗಿಂತ ಕಡಿಮೆ ವೆಚ್ಚ',
        'ವರ್ಗ ಅರ್ಹತೆ ಖಚಿತವಾದ ನಂತರವೇ ಶುಲ್ಕ ಮರುಪಾವತಿ ಕೇಳಿ',
      ],
      related: ['ಚಿಲ್ಲರೆ / ಲೆಕ್ಕಪತ್ರ ಪ್ರಮಾಣಪತ್ರಗಳು', 'ಡಿಜಿಟಲ್ ಸಾಕ್ಷರತೆ', '12ನೇ ನಂತರ ಡಿಪ್ಲೊಮಾ ಲ್ಯಾಟರಲ್ ಎಂಟ್ರಿ'],
    },
  },
}

export function mentorReply(question: string, journey: Journey, lang: Lang): string {
  const q = question.toLowerCase()
  const aboutCollege = /kcet|college|cutoff|ಕಾಲೇಜು|ರ್ಯಾಂಕ್|ರ‍್ಯಾಂಕ್/.test(q)
  const aboutMbbs = /neet|mbbs|doctor|ವೈದ್ಯ/.test(q)
  const aboutRestart = /nios|iti|open school|ಮುಕ್ತ|ಮರು/.test(q)
  const topic: Journey = aboutCollege
    ? 'admission'
    : aboutMbbs
      ? 'school'
      : aboutRestart
        ? 'restart'
        : journey

  if (lang === 'kn') {
    if (topic === 'school') {
      return 'MBBSಗೆ ಸಾಮಾನ್ಯವಾಗಿ 12ನೇ ತರಗತಿಯಲ್ಲಿ PCB ಮತ್ತು NEET-UG ಬೇಕು. ನಂತರ KEA ಕೌನ್ಸೆಲಿಂಗ್. ಇದು ಮಾಹಿತಿ ಮಾತ್ರ — ಪ್ರವೇಶಕ್ಕೆ ಭರವಸೆ ಇಲ್ಲ. ಮೂಲ: NTA NEET ಬ್ರೋಷರ್ ಮತ್ತು KEA (ಪ್ರಸ್ತುತ ವರ್ಷವನ್ನು ಪರಿಶೀಲಿಸಿ).'
    }
    if (topic === 'admission') {
      return 'KCET ರ‍್ಯಾಂಕ್ 12480ನ್ನು 2024 ಐತಿಹಾಸಿಕ GM ಕಟಾಫ್‌ನೊಂದಿಗೆ ಹೋಲಿಸಿದಾಗ UVCE/NIE/SIT ರೀತಿಯ ಆಯ್ಕೆಗಳು ಸಂದರ್ಭಕ್ಕೆ ಬರಬಹುದು. ಕಟಾಫ್ ಪ್ರತಿ ವರ್ಷ ಬದಲಾಗುತ್ತದೆ. ಮೂಲ: ಲೇಬಲ್ ಮಾಡಿದ 2024 ಮಾದರಿ ದತ್ತಾಂಶ — KEA ಪ್ರಕಟಣೆಯನ್ನು ದೃಢಪಡಿಸಿ.'
    }
    return 'ಮುಕ್ತ ಶಾಲೆ (NIOS/ರಾಜ್ಯ), ITI/ಕೌಶಲ ಕೋರ್ಸ್ ಮತ್ತು ನಂತರ ದೂರಶಿಕ್ಷಣವನ್ನು ಹಂತ ಹಂತವಾಗಿ ನೋಡಬಹುದು. ಅರ್ಹತೆ ನಿಮ್ಮ ಕೊನೆಯ ತರಗತಿ ಮತ್ತು ವಯಸ್ಸಿಗೆ ಒಳಪಟ್ಟಿದೆ. ಮೂಲ: NIOS / KSDD / IGNOU ಪ್ರಾಸ್ಪೆಕ್ಟಸ್.'
  }
  if (topic === 'school') {
    return 'For MBBS, learners typically need Class 12 PCB and NEET-UG, then KEA counselling for Karnataka seats. This is guidance only — we never guarantee a seat. Source: NTA NEET information bulletin and KEA (verify the current year).'
  }
  if (topic === 'admission') {
    return 'A sample KCET rank of 12480, compared with labelled 2024 GM historical cutoffs, may put some CSE/ISE options at UVCE, NIE, or SIT in range depending on category and round. Cutoffs move every year. Source: labelled 2024 sample — confirm on KEA.'
  }
  return 'A practical restart is often: complete 10/12 via open schooling if needed, add a vocational course that fits work hours, then consider distance UG. Eligibility depends on last exam passed. Source: NIOS / state open school / ITI prospectus.'
}
