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
    betaWithLoot: 92,
    betaWithoutLoot: 69,
    legacyScope: 150,
    legacyWithLoot: 83,
    legacyWithoutLoot: 67,
    allLootRows: 138
  }),
  index: Object.freeze({
    uniqueItems: 754,
    relations: 1280,
    itemIdsWithEvidenceInEquipment: 139,
    classicLevelingIdsWithoutOtherCatalogueEntry: 50,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 138, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 487, classic_reference: 772, unverified: 21})
  })
});
