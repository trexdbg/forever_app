/**
 * Expected published catalogue totals, pinned during source-reviewed data PRs.
 * Change ONE baseline here after a reviewed data update, never infer it from
 * the JSON under test: an unintended data regression must fail CI.
 *
 * Historical per-item regression expectations stay local to their tests.
 */
export const BASELINE = Object.freeze({
  editorialItems: 179,
  rares: Object.freeze({
    records: 378,
    betaScope: 161,
    betaWithLoot: 83,
    betaWithoutLoot: 78,
    legacyScope: 150,
    legacyWithLoot: 75,
    legacyWithoutLoot: 75,
    allLootRows: 123
  }),
  index: Object.freeze({
    uniqueItems: 739,
    relations: 1265,
    itemIdsWithEvidenceInEquipment: 132,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 123, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 470, classic_reference: 771, unverified: 24})
  })
});
