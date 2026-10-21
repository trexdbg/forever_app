/**
 * Expected published catalogue totals, pinned during source-reviewed data PRs.
 * Change ONE baseline here after a reviewed data update, never infer it from
 * the JSON under test: an unintended data regression must fail CI.
 *
 * Historical per-item regression expectations stay local to their tests.
 */
export const BASELINE = Object.freeze({
  editorialItems: 180,
  rares: Object.freeze({
    records: 378,
    betaScope: 161,
    betaWithLoot: 84,
    betaWithoutLoot: 77,
    legacyScope: 150,
    legacyWithLoot: 76,
    legacyWithoutLoot: 74,
    allLootRows: 125
  }),
  index: Object.freeze({
    uniqueItems: 741,
    relations: 1267,
    itemIdsWithEvidenceInEquipment: 133,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 125, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 471, classic_reference: 772, unverified: 24})
  })
});
