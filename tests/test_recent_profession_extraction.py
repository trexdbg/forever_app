"""Synthetic HTML boundary tests; no source fetches and no invented live data."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('extractor', Path(__file__).parents[1] / 'scripts/extract-recent-profession-snapshots.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fixture(**changes):
    values = {'build':module.BUILD, 'profession':'First Aid', 'spell':'900001', 'anchor':'900001',
        'learn':'', 'yellow':'20', 'quantity':'2', 'ingredient':'3'}
    values.update(changes)
    return '''<p>{build}</p><div class="pw" data-name="{profession}">
    <li class="pw-row" id="r-{anchor}" data-r="{spell}" data-src="trainer"
      data-learn="{learn}" data-yellow="{yellow}" data-green="30" data-grey="40" data-status="new">
      <h4 class="rd-name"><a href="https://www.wowhead.com/forever/item=900002">Fixture Output</a></h4>
      <p class="rd-sub">Common Item level 5 Makes {quantity}</p>
      <div class="rd-reagents"><ul><li><a href="https://www.wowhead.com/classic/item=900003">
      <b class="rd-count">{ingredient}</b><span class="rd-reagent-name">Fixture Reagent</span></a></li></ul></div>
    </li></div>'''.format(**values)


class ExtractionTests(unittest.TestCase):
    def parse(self, **changes):
        return module.extract(fixture(**changes), 'first-aid', '2026-10-17')

    def test_exact_ids_quantity_and_unknown_training_are_separate_from_yellow(self):
        row = self.parse()[0]
        self.assertEqual(row['spell_id'],900001)
        self.assertEqual(row['output']['item_id'],900002)
        self.assertEqual(row['output']['quantity_reported'],2)
        self.assertEqual(row['ingredients'][0]['quantity'],3)
        self.assertEqual(row['skill_yellow_reported'],20)
        self.assertIsNone(row['learning_skill_reported'])
        self.assertIsNone(row['availability_in_game'])
        self.assertIsNone(row['output']['verified_live_yield'])
        self.assertEqual(row['evidence_level'],'documented_forever')

    def test_explicit_requirement_preserved_not_replaced_with_yellow(self):
        self.assertEqual(self.parse(learn='10')[0]['learning_skill_reported'],10)

    def test_above_scope_is_not_imported(self):
        self.assertEqual(self.parse(yellow='151'),[])

    def test_unknown_build_profession_anchor_range_and_zero_are_rejected(self):
        for values in [{'build':'unknown'},{'profession':'Alchemy'},{'anchor':'900099'},
                       {'quantity':'2-3'},{'quantity':'0'},{'ingredient':'0'},{'ingredient':'2.5'}]:
            with self.subTest(values=values), self.assertRaises(ValueError):
                self.parse(**values)


if __name__ == '__main__':
    unittest.main()
