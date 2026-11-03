import { useLang } from '../LanguageContext'
import type { DatasetEvidence } from '../services/api'

export function CareerEvidence({ records, title }: { records: DatasetEvidence[]; title?: string }) {
  const { t } = useLang()
  if (!records.length) return null

  return <details className="career-evidence">
    <summary>{title || t('datasetReferences')} ({records.length})</summary>
    {records.map(record => <div className="evidence-record" key={record.id}>
      <span className="section-kicker">{t(record.kind === 'pathway' ? 'datasetPathway' : record.kind === 'course' ? 'datasetCourse' : 'datasetCutoff')}</span>
      <strong>{record.title}</strong>
      {record.kind === 'pathway' && <>
        {record.eligibility && <p>{t('datasetEligibility')}: {record.eligibility}</p>}
        {record.entrance_exam_or_admission && <p>{t('datasetAdmission')}: {record.entrance_exam_or_admission}</p>}
      </>}
      {record.kind === 'course' && <>
        <p>{[record.source_platform, record.offered_by, record.duration].filter(Boolean).join(' · ')}</p>
        {record.cost && <p>{t('datasetCost')}: {record.cost}</p>}
        {(record.start_date || record.end_date) && <p>{t('datasetDates')}: {record.start_date || t('datasetUnknown')} – {record.end_date || t('datasetUnknown')}</p>}
        {record.url && /^https?:\/\//i.test(record.url) && <a href={record.url} target="_blank" rel="noreferrer">{t('datasetVisitProvider')} ↗</a>}
      </>}
      {record.kind === 'cutoff' && <>
        <p>{record.college}</p>
        <p>{record.exam === 'PGCET' ? t('pgcetExam') : t('kcetExam')} · {record.category} · {t('cutoff')}: {record.cutoff_rank}</p>
        <p>{t('yearLabel')}: {record.year ?? t('datasetUnknown')} · {t('datasetRound')}: {record.round || t('datasetUnknown')}</p>
        <p>{t('datasetQuota')}: {record.quota}</p>
        {record.exam === 'KCET' && <p>{t('datasetExamInferred')}</p>}
        {record.rank_comparison && <p>{t(record.rank_comparison === 'within_historical_cutoff' ? 'datasetRankWithin' : 'datasetRankAbove')}</p>}
      </>}
      <small>{t('datasetSource')}: {record.source_file} · {t('datasetRow')} {record.source_row}</small>
    </div>)}
  </details>
}
