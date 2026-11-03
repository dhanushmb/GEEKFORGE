import json
import unittest
from collections import Counter
from types import SimpleNamespace
from unittest.mock import patch

from pydantic import ValidationError

from app.main import CareerDiscoveryRequest
from app.services.career_ai import recommend_careers
from app.services.career_datasets import (
    FILES, attach_evidence, load_datasets, parse_rank, retrieve_evidence, safe_url,
)


class CareerDatasetTests(unittest.TestCase):
    def test_all_sources_loaded_and_missing_cutoffs_are_not_zero(self):
        records = load_datasets()
        counts = Counter(row['source_file'] for row in records)
        self.assertEqual(set(counts), set(FILES))
        self.assertEqual(counts[FILES[0]], 47)
        self.assertEqual(counts[FILES[1]], 448)
        self.assertEqual(counts[FILES[2]], 4407)
        self.assertTrue(all(row['cutoff_rank'] > 0 for row in records if row['kind'] == 'cutoff'))

    def test_misnamed_combined_file_is_pgcet_and_unknown_dates_stay_unknown(self):
        records = load_datasets()
        combined = [row for row in records if row['source_file'] == FILES[2]]
        self.assertTrue(all(row['exam'] == 'PGCET' for row in combined))
        self.assertTrue(any('Mock' in row['round'] for row in combined))
        kcets = [row for row in records if row['source_file'] == FILES[4]]
        self.assertTrue(all(row['year'] is None and row['round'] is None for row in kcets))

    def test_fractional_rank_and_blank_values(self):
        self.assertEqual(parse_rank('192962.7\n5'), 192962.75)
        self.assertEqual(parse_rank('12,480'), 12480)
        for value in ('', '--', 'NA', '0', '-1', 'nan', 'inf', 'not offered'):
            self.assertIsNone(parse_rank(value))

    def test_interests_change_pathway_retrieval(self):
        software = retrieve_evidence(['coding'], ['maths'], ['programming'], 'Class 12')
        medicine = retrieve_evidence(['doctor'], ['biology'], ['patient care'], 'Class 12')
        self.assertIn('pathway:EP008', {row['id'] for row in software})
        self.assertIn('pathway:EP017', {row['id'] for row in medicine})
        self.assertNotEqual([row['id'] for row in software], [row['id'] for row in medicine])
        self.assertFalse(any(row['kind'] == 'cutoff' for row in software))

    def test_kannada_interests_retrieve_relevant_sources(self):
        rows = retrieve_evidence(['ಕೋಡಿಂಗ್'], ['ಗಣಿತ'], ['ಪ್ರೋಗ್ರಾಮಿಂಗ್'], 'Class 12')
        self.assertIn('pathway:EP008', {row['id'] for row in rows})
        self.assertTrue(any(row['kind'] == 'course' for row in rows))

    def test_short_interest_words_are_searchable(self):
        rows = retrieve_evidence(['help'], ['bio'], ['draw'], 'Class 12')
        self.assertTrue(any(row['kind'] == 'pathway' and 'biology' in row.get('suited_for_interests', '').lower()
                            or row.get('id') == 'pathway:EP022' for row in rows))

    def test_exam_and_category_are_never_mixed(self):
        for exam in ('KCET', 'PGCET'):
            rows = retrieve_evidence(['computer science'], ['maths'], ['programming'], 'Undergraduate', exam, 5000, 'GM')
            cutoffs = [row for row in rows if row['kind'] == 'cutoff']
            self.assertTrue(cutoffs)
            self.assertTrue(all(row['exam'] == exam and row['category'] == 'GM' for row in cutoffs))
            for row in cutoffs:
                self.assertEqual(row['rank_comparison'], 'within_historical_cutoff' if 5000 <= row['cutoff_rank'] else 'above_historical_cutoff')
        self.assertFalse(any(row['kind'] == 'cutoff' for row in retrieve_evidence(['computer'], [], [], 'Class 12', 'KCET', None, 'UNKNOWN')))

    def test_rank_boundary_is_inclusive(self):
        args = (['civil'], [], [], 'Class 12', 'KCET')
        row = next(row for row in retrieve_evidence(*args, None, 'GM') if row['kind'] == 'cutoff')
        with patch('app.services.career_datasets.indexed_datasets', return_value=((row, {'civil'}),)):
            at_cutoff = retrieve_evidence(*args, row['cutoff_rank'], 'GM')
            above = retrieve_evidence(*args, row['cutoff_rank'] + 0.01, 'GM')
        self.assertEqual(at_cutoff[0]['rank_comparison'], 'within_historical_cutoff')
        self.assertEqual(above[0]['rank_comparison'], 'above_historical_cutoff')

    def test_evidence_is_resolved_from_sources_not_generated_metadata(self):
        evidence = [{'id': 'pathway:EP008', 'kind': 'pathway', 'title': 'Real title'}]
        result = attach_evidence([{'career': 'Engineer', 'source_ids': ['fake', 'pathway:EP008', 'pathway:EP008', {}],
                                  'evidence': [{'title': 'Made up'}]}], evidence)
        self.assertEqual(result[0]['evidence'], evidence)
        self.assertEqual(result[0]['source_ids'], ['pathway:EP008'])

    def test_recommendation_prompt_contains_data_and_resolves_citations(self):
        fake_response = SimpleNamespace(text=json.dumps({'recommendations': [
            {'career': 'Software engineer', 'source_ids': ['pathway:EP008', 'fake-id']}
        ]}))
        with patch('app.services.career_ai.get_gemini_client') as factory:
            factory.return_value.models.generate_content.return_value = fake_response
            result = json.loads(recommend_careers(['coding'], ['maths'], ['programming'], 'Class 12', 'Kannada'))
            request = factory.return_value.models.generate_content.call_args.kwargs
        self.assertIn('education_pathways_india.csv', request['contents'])
        self.assertIn('courses_dataset.csv', request['contents'])
        self.assertIn('Kannada', request['config'].system_instruction)
        self.assertNotIn('{language}', request['config'].system_instruction)
        self.assertEqual(result['recommendations'][0]['evidence'][0]['id'], 'pathway:EP008')

    def test_rank_requires_exam_and_category(self):
        base = dict(interests=['coding'], subjects=['maths'], skills=['logic'], class_level='Class 12')
        for options in ({'rank': 100}, {'exam': 'KCET'}, {'category': 'GM'}, {'exam': 'KCET', 'category': 'GM', 'rank': -1}):
            with self.assertRaises(ValidationError):
                CareerDiscoveryRequest(**base, **options)
        self.assertEqual(CareerDiscoveryRequest(**base, exam='KCET', category='GM', rank=1234.5).rank, 1234.5)

    def test_cutoffs_survive_when_model_does_not_cite_them(self):
        with patch('app.services.career_ai.get_gemini_client') as factory:
            factory.return_value.models.generate_content.return_value = SimpleNamespace(
                text=json.dumps({'recommendations': [{'career': 'Software engineer', 'source_ids': []}]}))
            result = json.loads(recommend_careers(['computer'], ['maths'], ['programming'],
                                                 'Undergraduate', exam='PGCET', rank=5000, category='GM'))
        self.assertTrue(result['cutoff_references'])
        self.assertTrue(all(row['exam'] == 'PGCET' and row['category'] == 'GM' for row in result['cutoff_references']))

    def test_provider_urls_allow_only_web_links(self):
        self.assertEqual(safe_url('https://swayam.gov.in/'), 'https://swayam.gov.in/')
        for value in ('javascript:alert(1)', 'file:///secret', 'https://user:password@example.com'):
            self.assertEqual(safe_url(value), '')


if __name__ == '__main__':
    unittest.main()
