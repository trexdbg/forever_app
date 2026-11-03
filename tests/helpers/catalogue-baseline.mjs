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
    betaWithLoot: 90,
    betaWithoutLoot: 71,
    legacyScope: 150,
    legacyWithLoot: 81,
    legacyWithoutLoot: 69,
    allLootRows: 136
  }),
  index: Object.freeze({
    uniqueItems: 752,
    relations: 1278,
    itemIdsWithEvidenceInEquipment: 139,
    classicLevelingIdsWithoutOtherCatalogueEntry: 50,
    byKind: Object.freeze({merchant: 923, boss: 205, rare: 136, recipe: 14}),
    byEvidence: Object.freeze({documented_forever: 485, classic_reference: 772, unverified: 21})
  })
});
