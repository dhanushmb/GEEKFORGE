
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { careers } from '../data/careers'
import { localizeCareer } from '../data/careersKn'
import { localizeCareerMapText } from '../data/careerMapTranslations'
import { useLang } from '../LanguageContext'
import { useProfile } from '../ProfileContext'
import './CareerMap.css'

type Activity = {
  question: string
  options: string[]
  answer: number
  explanation: string
}

type Stage = {
  title: string
  subjects: string
  skills: string
  project: string
  nextStep: string
  activities: Activity[]
}

const educationLevels = [
  'Class 6–8',
  'Class 9–10',
  'Class 11–12',
  'Diploma',
  'College',
]

const icons = ['📚', '🎓', '🏫', '🛠️', '🚀']

const careerActivity = (
  career: string,
  stage: number,
): Activity[] => {
  const name = career.toLowerCase()

  if (name.includes('engineer') || name.includes('data') || name.includes('ai')) {
    return stage === 0
      ? [
          {
            question: 'What is the output of 5 + 3 × 2?',
            options: ['16', '11', '13', '10'],
            answer: 1,
            explanation: 'Multiplication comes first: 5 + 6 = 11.',
          },
          {
            question: 'Which skill helps computers follow instructions?',
            options: ['Programming', 'Painting', 'Cooking', 'Singing'],
            answer: 0,
            explanation: 'Programming gives computers instructions to execute.',
          },
        ]
      : [
          {
            question: 'Which language is commonly used in AI and ML?',
            options: ['Python', 'HTML only', 'CSS only', 'XML only'],
            answer: 0,
            explanation: 'Python has many machine learning libraries.',
          },
          {
            question: 'What does a machine learning model learn from?',
            options: ['Examples and data', 'Only electricity', 'Nothing', 'Random guesses only'],
            answer: 0,
            explanation: 'Models learn patterns from data during training.',
          },
        ]
  }

  if (name.includes('doctor')) {
    return [
      {
        question: 'Which organ pumps blood around the body?',
        options: ['Lungs', 'Heart', 'Kidney', 'Brain'],
        answer: 1,
        explanation: 'The heart pumps blood throughout the body.',
      },
      {
        question: 'Which subject is important for studying medicine?',
        options: ['Biology', 'History only', 'Music only', 'Drawing only'],
        answer: 0,
        explanation: 'Biology is an important foundation for medical studies.',
      },
    ]
  }

  if (name.includes('architect')) {
    return [
      {
        question: 'Which skill helps architects create building plans?',
        options: ['Spatial thinking', 'Memorizing songs', 'Swimming', 'Typing only'],
        answer: 0,
        explanation: 'Spatial thinking helps visualize structures and layouts.',
      },
      {
        question: 'Which tool can help create digital building designs?',
        options: ['CAD software', 'Calculator only', 'Music player', 'Web browser only'],
        answer: 0,
        explanation: 'CAD tools are used for technical drawing and design.',
      },
    ]
  }

  if (name.includes('psychologist')) {
    return [
      {
        question: 'Which skill is important for understanding people?',
        options: ['Active listening', 'Ignoring others', 'Guessing', 'Avoiding questions'],
        answer: 0,
        explanation: 'Active listening helps understand thoughts and feelings.',
      },
      {
        question: 'Psychology mainly studies:',
        options: ['Human behaviour and mind', 'Only buildings', 'Only machines', 'Only planets'],
        answer: 0,
        explanation: 'Psychology explores behaviour and mental processes.',
      },
    ]
  }

  if (name.includes('entrepreneur')) {
    return [
      {
        question: 'What should you understand before starting a business?',
        options: ['Customer needs', 'Only logo colours', 'Only office size', 'Nothing'],
        answer: 0,
        explanation: 'Understanding customer needs helps create useful products.',
      },
      {
        question: 'What is a prototype?',
        options: ['An early version of an idea', 'A final advertisement', 'A salary slip', 'A school certificate'],
        answer: 0,
        explanation: 'A prototype helps test an idea before building the final product.',
      },
    ]
  }

  if (name.includes('teacher')) {
    return [
      {
        question: 'What helps students understand a difficult topic?',
        options: ['Clear examples', 'Confusing instructions', 'Ignoring questions', 'Only memorization'],
        answer: 0,
        explanation: 'Examples make abstract ideas easier to understand.',
      },
      {
        question: 'Which skill is important for teachers?',
        options: ['Communication', 'Avoiding interaction', 'Ignoring feedback', 'Guessing'],
        answer: 0,
        explanation: 'Communication helps explain concepts and support students.',
      },
    ]
  }

  if (name.includes('research')) {
    return [
      {
        question: 'What should a researcher do before an experiment?',
        options: ['Define a research question', 'Ignore evidence', 'Choose results first', 'Avoid reading'],
        answer: 0,
        explanation: 'A clear research question guides the investigation.',
      },
      {
        question: 'Why is evidence important in research?',
        options: ['To support conclusions', 'To hide mistakes', 'To avoid testing', 'To replace observations'],
        answer: 0,
        explanation: 'Evidence helps researchers evaluate whether conclusions are supported.',
      },
    ]
  }

  return [
    {
      question: 'What is a good first step toward your dream career?',
      options: ['Learn the basics', 'Give up immediately', 'Avoid practice', 'Ignore education'],
      answer: 0,
      explanation: 'Strong foundations make advanced learning easier.',
    },
    {
      question: 'How can you improve a new skill?',
      options: ['Practice regularly', 'Never try', 'Avoid feedback', 'Only watch others'],
      answer: 0,
      explanation: 'Practice and feedback help skills improve over time.',
    },
  ]
}

function createStages(education: string, career: string): Stage[] {
  const isSchool = education.includes('Class 6') || education.includes('Class 9')
  const isHigherSchool = education.includes('Class 11')
  const isDiploma = education === 'Diploma'

  const stageTitles = isSchool
    ? [
        'Build your foundation',
        'Discover your interests',
        'Choose your subjects',
        'Explore your dream career',
        'Prepare for higher education',
      ]
    : isHigherSchool
      ? [
          'Strengthen your basics',
          'Choose your career direction',
          'Prepare for higher education',
          'Build practical skills',
          'Plan your next step',
        ]
      : isDiploma
        ? [
            'Strengthen diploma foundations',
            'Build technical skills',
            'Explore degree pathways',
            'Specialize in your dream career',
            'Prepare for career opportunities',
          ]
        : [
            'Strengthen your foundations',
            'Learn career fundamentals',
            'Explore specialization',
            'Build practical experience',
            'Prepare for career opportunities',
          ]

  const descriptions = [
    {
      subjects: 'Mathematics, Science, English and basic digital literacy',
      skills: 'Logical thinking, communication, curiosity',
      project: 'Solve puzzles and complete a short learning quiz.',
      nextStep: 'Practice school subjects and explore learning resources.',
    },
    {
      subjects: `Subjects and introductory concepts related to ${career}`,
      skills: 'Problem solving, independent learning, digital literacy',
      project: 'Complete a career-interest activity and explore related subjects.',
      nextStep: 'Identify subjects and skills that support your career goal.',
    },
    {
      subjects: `Courses and educational routes related to ${career}`,
      skills: 'Technical foundations, teamwork, communication',
      project: 'Complete a career-specific mini quiz or beginner exercise.',
      nextStep: 'Compare courses, colleges, eligibility and scholarships.',
    },
    {
      subjects: `Advanced topics and practical learning in ${career}`,
      skills: 'Practical skills, portfolio building, collaboration',
      project: 'Complete a small project or practical challenge.',
      nextStep: 'Build a portfolio and explore internships or training.',
    },
    {
      subjects: 'Professional learning and career development',
      skills: 'Communication, teamwork, problem solving',
      project: 'Complete a career-readiness challenge.',
      nextStep: 'Explore suitable jobs, higher education and opportunities.',
    },
  ]

  return stageTitles.map((title, index) => ({
    title,
    ...descriptions[index],
    activities: careerActivity(career, index),
  }))
}

export function CareerMap() {
  const { lang, t } = useLang()
  const { profile } = useProfile()

  const [interest, setInterest] = useState(
    careers[0]?.title || profile.interest || 'Technology',
  )
  const [education, setEducation] = useState('Class 9–10')
  const [currentStage, setCurrentStage] = useState(0)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [completedActivities, setCompletedActivities] = useState<number[]>([])
  const [activeActivity, setActiveActivity] = useState<number | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [activityFinished, setActivityFinished] = useState(false)

  const selectedCareer = careers.find(career => career.title === interest)
  const careerName = selectedCareer?.title || interest
  const localizedCareerName = selectedCareer
    ? localizeCareer(selectedCareer, lang).title
    : interest

  const stages = createStages(education, careerName).map(stage => ({
    ...stage,
    title: localizeCareerMapText(stage.title, lang, careerName, localizedCareerName),
    subjects: localizeCareerMapText(stage.subjects, lang, careerName, localizedCareerName),
    skills: localizeCareerMapText(stage.skills, lang, careerName, localizedCareerName),
    project: localizeCareerMapText(stage.project, lang, careerName, localizedCareerName),
    nextStep: localizeCareerMapText(stage.nextStep, lang, careerName, localizedCareerName),
    activities: stage.activities.map(activity => ({
      ...activity,
      question: localizeCareerMapText(activity.question, lang, careerName, localizedCareerName),
      options: activity.options.map(option => localizeCareerMapText(option, lang, careerName, localizedCareerName)),
      explanation: localizeCareerMapText(activity.explanation, lang, careerName, localizedCareerName),
    })),
  }))

  const startingStage =
    education === 'Class 6–8' || education === 'Class 9–10'
      ? 0
      : education === 'Class 11–12'
        ? 1
        : education === 'Diploma'
          ? 2
          : 3

  const currentActivity =
    activeActivity !== null
      ? stages[activeActivity].activities
      : []

  const activityQuestion = currentActivity[questionIndex]

  function openActivity(index: number) {
    setActiveActivity(index)
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setActivityFinished(false)
  }

  function submitAnswer() {
    if (selectedAnswer === null || !activityQuestion) return

    const correct = selectedAnswer === activityQuestion.answer
    const updatedScore = score + (correct ? 1 : 0)
    setScore(updatedScore)

    if (questionIndex < currentActivity.length - 1) {
      setQuestionIndex(questionIndex + 1)
      setSelectedAnswer(null)
    } else {
      setActivityFinished(true)

      if (updatedScore === currentActivity.length) {
        setCompletedActivities(previous =>
          previous.includes(activeActivity!)
            ? previous
            : [...previous, activeActivity!],
        )
      }
    }
  }

  function resetPathway() {
    setCurrentStage(startingStage)
    setCompletedStages([])
    setCompletedActivities([])
    setActiveActivity(null)
  }

  return (
    <section className="page-section map-page">
      <div className="map-heading">
        <span className="section-kicker">{t('careerMapKicker')}</span>
        <h1>{t('mapTitle')}</h1>
        <p className="lede">
          {t('careerMapLead')}
        </p>
      </div>

      <div className="pathway-selector">
        <div className="pathway-selector-heading">
          <span className="pathway-label">{t('careerMapSelectorKicker')}</span>
          <h2>{t('whereToday')}</h2>
          <p>{t('chooseEducationCareer')}</p>
        </div>

        <div className="pathway-select-grid">
          <label>
            <span>{t('currentEducation')}</span>
            <select
              value={education}
              onChange={event => {
                setEducation(event.target.value)
                resetPathway()
              }}
            >
              {educationLevels.map(level => (
                <option key={level} value={level}>{localizeCareerMapText(level, lang, careerName, localizedCareerName)}</option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('dreamCareer')}</span>
            <select
              value={interest}
              onChange={event => {
                setInterest(event.target.value)
                resetPathway()
              }}
            >
              {careers.map(career => (
                <option key={career.slug} value={career.title}>
                  {localizeCareer(career, lang).title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="pathway-summary">
          <div className="pathway-summary-icon">✨</div>
          <div>
            <span>{t('dreamPossible')}</span>
            <h3>{t('pathwayTo')} {localizedCareerName}</h3>
            <p>
            {t('startingFrom')} <strong>{localizeCareerMapText(education, lang, careerName, localizedCareerName)}</strong>. {t('followStages')}
            </p>
          </div>
        </div>
      </div>

      <div className="pathway-progress">
        <div>
          <span className="pathway-label">{t('journeyLabel')}</span>
          <h2>{t('fiveStages')}</h2>
        </div>
        <span className="progress-count">
          {t('stage')} {currentStage + 1} {t('of')} 5
        </span>
      </div>

      <div className="pathway-timeline">
        {stages.map((stage, index) => {
          const isCurrent = index === currentStage
          const isCompleted = completedStages.includes(index)

          return (
            <article
              className={`pathway-stage ${isCurrent ? 'current' : ''} ${
                isCompleted ? 'completed' : ''
              }`}
              key={stage.title}
            >
              <div className="timeline-marker">
                <span className="timeline-number">
                  {isCompleted ? '✓' : String(index + 1).padStart(2, '0')}
                </span>
                <span className="timeline-icon">{icons[index]}</span>
              </div>

              <div className="stage-card">
                <div className="stage-card-top">
                  <span className="stage-status">
                    {isCompleted
                      ? t('completed')
                      : isCurrent
                        ? t('currentStageLabel')
                        : t('upcomingStage')}
                  </span>
                  <span className="stage-number">{t('stage')} {index + 1}</span>
                </div>

                <h3>{stage.title}</h3>
                <p className="stage-description">
                  {index === 0
                    ? t('stageDescription1')
                    : index === 1
                      ? t('stageDescription2')
                      : index === 2
                        ? localizeCareerMapText(`Explore courses that can help you become a ${careerName}.`, lang, careerName, localizedCareerName)
                        : index === 3
                          ? t('stageDescription4')
                          : t('stageDescription5')}
                </p>

                <div className="stage-details">
                  <div className="stage-detail">
                    <span className="detail-icon">📖</span>
                    <div>
                      <strong>{t('educationSubjects')}</strong>
                      <p>{stage.subjects}</p>
                    </div>
                  </div>

                  <div className="stage-detail">
                    <span className="detail-icon">💡</span>
                    <div>
                      <strong>{t('skillsToLearn')}</strong>
                      <p>{stage.skills}</p>
                    </div>
                  </div>

                  <div className="stage-detail">
                    <span className="detail-icon">🧩</span>
                    <div>
                      <strong>{t('tryActivity')}</strong>
                      <p>{stage.project}</p>
                      <button
                        className="activity-open-button"
                        onClick={() => openActivity(index)}
                      >
                        {completedActivities.includes(index)
                          ? t('activityCompletedTryAgain')
                          : t('startInteractiveActivity')}
                      </button>
                    </div>
                  </div>

                  <div className="stage-detail next-step">
                    <span className="detail-icon">➡️</span>
                    <div>
                      <strong>{t('nextStepLabel')}</strong>
                      <p>{stage.nextStep}</p>
                    </div>
                  </div>
                </div>

                <button
                  className={`stage-action ${isCurrent ? 'active' : ''}`}
                  onClick={() => setCurrentStage(index)}
                >
                  {isCurrent ? t('currentStage') : t('markCurrentStage')}
                </button>

                {!isCompleted && completedActivities.includes(index) && (
                  <button
                    className="stage-complete-button"
                    onClick={() => {
                      setCompletedStages(previous =>
                        previous.includes(index)
                          ? previous
                          : [...previous, index],
                      )
                      if (index < 4) setCurrentStage(index + 1)
                    }}
                  >
                    {t('completeAndContinue')}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="pathway-footer-card">
        <span>🌱</span>
        <div>
          <h3>{t('everyJourneyDifferent')}</h3>
          <p>
            {t('journeyEncouragement')}
          </p>
        </div>
      </div>

      {selectedCareer && (
        <Link
          className="pathway-career-link"
          to={`/career/${selectedCareer.slug}`}
        >
          {t('exploreCareerDetail')} ({localizedCareerName})
        </Link>
      )}

      {activeActivity !== null && activityQuestion && (
        <div className="activity-modal-overlay">
          <div className="activity-modal">
            <button
              className="activity-close"
              onClick={() => setActiveActivity(null)}
              aria-label={t('closeActivity')}
            >
              ×
            </button>

            <span className="pathway-label">
              {t('stage')} {activeActivity + 1} {t('stageActivity')}
            </span>
            <h2>{localizedCareerName} {t('learningChallenge')}</h2>

            {!activityFinished ? (
              <>
                <div className="activity-progress">
                  {t('question')} {questionIndex + 1} {t('of')} {currentActivity.length}
                </div>

                <h3>{activityQuestion.question}</h3>

                <div className="activity-options">
                  {activityQuestion.options.map((option, index) => (
                    <button
                      key={option}
                      className={
                        selectedAnswer === index ? 'selected' : ''
                      }
                      onClick={() => setSelectedAnswer(index)}
                    >
                      {lang === 'kn' ? ['ಅ', 'ಆ', 'ಇ', 'ಈ'][index] : String.fromCharCode(65 + index)}. {option}
                    </button>
                  ))}
                </div>

                <button
                  className="activity-submit"
                  disabled={selectedAnswer === null}
                  onClick={submitAnswer}
                >
                  {questionIndex === currentActivity.length - 1
                    ? t('finishActivity')
                    : t('nextQuestion')}
                </button>
              </>
            ) : (
              <div className="activity-result">
                <div className="activity-result-icon">
                  {score === currentActivity.length ? '🎉' : '🌱'}
                </div>
                <h3>
                  {t('scored')} {score}/{currentActivity.length}
                </h3>
                <p>
                  {score === currentActivity.length
                    ? t('excellentCompleted')
                    : t('reviewAndRetry')}
                </p>

                {score < currentActivity.length && (
                  <button
                    className="activity-submit"
                    onClick={() => openActivity(activeActivity)}
                  >
                    {t('tryAgain')}
                  </button>
                )}

                {score === currentActivity.length && (
                  <button
                    className="activity-submit"
                    onClick={() => setActiveActivity(null)}
                  >
                    {t('continueLearning')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
