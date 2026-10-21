/**
 * Expected published catalogue totals, pinned during source-reviewed data PRs.
 * Change ONE baseline here after a reviewed data update, never infer it from
 * the JSON under test: an unintended data regression must fail CI.
 *
 * Historical per-item regression expectations stay local to their tests.
 */
export const BASELINE = Object.freeze({
  editorialItems: 183,
  rares: Object.freeze({
    records: 378,
    betaScope: 161,
    betaWithLoot: 86,
    betaWithoutLoot: 75,
    legacyScope: 150,
    legacyWithLoot: 78,
    legacyWithoutLoot: 72,
    allLootRows: 128
  }),
  index: Object.freeze({
    uniqueItems: 744,
    relations: 1270,
    itemIdsWithEvidenceInEquipment: 136,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 128, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 474, classic_reference: 772, unverified: 24})
  })
});
