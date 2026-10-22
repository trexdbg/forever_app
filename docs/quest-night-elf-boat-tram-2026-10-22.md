# Night Elf route: Auberdine → Stormwind → Ironforge (steps 14–16)

Date: 2026-10-22. Scope: **WoW Forever transport** applied to the existing Classic-derived quest guide, not a Forever quest route or a claim that Classic has this boat.

The upstream Vanilla Questing source data was written for the old Menethil route and included a Dun Morogh death shortcut. These three *travel-only* steps have been adapted to Forever's new direct boat and the existing Deeprun Tram; all other steps, quest IDs and quest hand-ins remain as before. Keep this local correction when regenerating `data/quests/alliance.json` from `trexdbg/vanilla-questing`.

| Step | Zone | Instruction | Waypoint |
| --- | --- | --- | --- |
| 14 | Darkshore | Complete Flight to Auberdine, optionally bind hearthstone, board **Stormwind** boat at its own dock | Auberdine 30.5, 40.9 |
| 15 | Stormwind | Disembark at Stormwind Harbor, follow the dashed map line across the city to the Deeprun Tram in Dwarven District, and ride to Ironforge | Harbor 21.8, 56.9 → tram 69.6, 30.3 |
| 16 | Ironforge | Leave tram at Tinker Town, activate flight path | Tram 78.0, 51.4; flight master 56, 48 |

**Evidence and confidence:** Transport adjacency was independently documented for WoW Forever, not borrowed from historical Classic. The Wowcalc map attributes the following four dock/station points to client build **1.60.1.70450** (client-map derived, not verified by our own in-game run):
- Darkshore: https://wowcalc.net/en/forever/map/kalimdor/darkshore
- Stormwind: https://wowcalc.net/en/forever/map/eastern-kingdoms/stormwind-city
- Ironforge: https://wowcalc.net/en/forever/map/eastern-kingdoms/ironforge

The direct boat and Deeprun connection are also listed by https://www.method.gg/wow-forever/all-travel-routes-in-wow-forever-boats-zeppelins and https://warcraft.wiki.gg/wiki/World_of_Warcraft%3A_Forever . Blizzard describes the original tram endpoints at https://worldofwarcraft.blizzard.com/en-us/news/23156366/wow-classic-getting-around-azeroth .

Known limitation: site map images are inherited from the original Classic guide and may not depict Forever's newly added Stormwind port; the waypoint coordinates/instructions are based on newer Forever data. The separate Menethil leg later in the imported route (night-elf step 39 onward after renumbering) is **out of scope** and should be audited independently rather than silently rewritten here.

Check: `node --test tests/night-elf-forever-transit.test.mjs` plus normal data-quality suite. Rollback: revert the scoped PR.
