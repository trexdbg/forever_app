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
    betaWithLoot: 91,
    betaWithoutLoot: 70,
    legacyScope: 150,
    legacyWithLoot: 82,
    legacyWithoutLoot: 68,
    allLootRows: 137
  }),
  index: Object.freeze({
    uniqueItems: 753,
    relations: 1279,
    itemIdsWithEvidenceInEquipment: 139,
    classicLevelingIdsWithoutOtherCatalogueEntry: 50,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 137, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 486, classic_reference: 772, unverified: 21})
  })
});
