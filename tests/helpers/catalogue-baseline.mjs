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
    betaWithLoot: 96,
    betaWithoutLoot: 65,
    legacyScope: 150,
    legacyWithLoot: 87,
    legacyWithoutLoot: 63,
    allLootRows: 142
  }),
  index: Object.freeze({
    uniqueItems: 758,
    relations: 1284,
    itemIdsWithEvidenceInEquipment: 140,
    classicLevelingIdsWithoutOtherCatalogueEntry: 50,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 142, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 491, classic_reference: 772, unverified: 21})
  })
});
