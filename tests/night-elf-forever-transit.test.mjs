import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const data = JSON.parse(readFileSync(new URL("../data/quests/alliance.json", import.meta.url), "utf8"));
const nelf = data.routes.nelf;

test("night elf steps 14–16 use the direct Forever boat and a continuous port-to-tram route", () => {
  const [auberdine, stormwind, ironforge] = nelf.slice(13, 16);
  assert.equal(nelf.length, 46, "merging two Stormwind steps removes exactly one stage");
  assert.deepEqual([auberdine.zone, stormwind.zone, ironforge.zone],
    ["darkshore", "stormwind", "ironforge"]);
  assert.equal(auberdine.waypoints[1].header, "auberdine stormwind dock");
  assert.deepEqual(auberdine.waypoints[1].coords, {x:30.5, y:40.9});
  assert.deepEqual(auberdine.waypoints[1].special, ["sail to stormwind"]);

  // Keeping both waypoints in one zone/step is what causes the existing map
  // renderer to draw its dashed connecting line between harbor and tram.
  assert.equal(stormwind.waypoints.length, 2);
  assert.equal(stormwind.waypoints[0].header, "stormwind harbor");
  assert.deepEqual(stormwind.waypoints[0].coords, {x:21.8, y:56.9});
  assert.deepEqual(stormwind.waypoints[0].special, ["go to the dwarven district tram"]);
  assert.equal(stormwind.waypoints[1].header, "deeprun tram");
  assert.deepEqual(stormwind.waypoints[1].coords, {x:69.6, y:30.3});
  assert.deepEqual(stormwind.waypoints[1].special, ["ride to ironforge"]);

  // Arrival in Ironforge, and the next departure, are otherwise unchanged.
  assert.deepEqual(ironforge.waypoints[0].coords, {x:78, y:51.4});
  assert.equal(ironforge.waypoints[1].header, "ironforge flightpath");
  assert.deepEqual(ironforge.waypoints[1].special, ["learn the flightpath"]);
  assert.deepEqual(nelf[12].waypoints.at(-1).special, ["fly to auberdine"]);
  assert.equal(nelf[16].zone, "ironforge");
  assert.equal(nelf[16].waypoints.at(-1).header, "gates of ironforge");
});

test("quest map draws the connection between multiple waypoints of a single step", () => {
  const source = readFileSync(new URL("../assets/quests.js", import.meta.url), "utf8");
  assert.match(source, /if\(pts\.length>1\)/);
  assert.match(source, /ctx\.moveTo\(p\.x,p\.y\)/);
  assert.match(source, /ctx\.lineTo\(p\.x,p\.y\)/);
  assert.match(source, /ctx\.setLineDash\(\[8,6\]\)/);
});

test("three transport steps require no Menethil detour, drowning or spirit-resurrection", () => {
  const text = JSON.stringify(nelf.slice(13, 16)).toLowerCase();
  assert.doesNotMatch(text, /menethil|wetlands|drown|spirit ress|placeholder/);
  for (const step of nelf.slice(13, 16)) {
    for (const point of step.waypoints) {
      assert.ok(Number.isFinite(point.coords.x) && point.coords.x >= 0 && point.coords.x <= 100);
      assert.ok(Number.isFinite(point.coords.y) && point.coords.y >= 0 && point.coords.y <= 100);
      assert.ok(point.header !== "placeholder");
    }
  }
  for (let i = 13; i <= 16; i++) assert.ok(nelf[i].experience >= nelf[i - 1].experience);
});

test("boat and tram headings/notes render correctly in French and English", () => {
  const source = readFileSync(new URL("../assets/quest-locale.js", import.meta.url), "utf8");
  const context = {window:{}, document:{documentElement:{lang:"fr"}}};
  runInNewContext(source, context);
  const locale = context.window.ForeverQuestLocale;
  assert.equal(locale.header("auberdine stormwind dock"), "Quai d'Auberdine pour Hurlevent");
  assert.equal(locale.header("stormwind harbor"), "Port de Hurlevent");
  assert.equal(locale.header("deeprun tram"), "Tram des profondeurs");
  assert.match(locale.note("sail to stormwind"), /bateau direct pour Hurlevent/);
  assert.match(locale.note("go to the dwarven district tram"), /Quartier des Nains/);
  assert.match(locale.note("ride to ironforge"), /Tram des profondeurs.*Forgefer/);
  context.document.documentElement.lang = "en";
  assert.equal(locale.header("stormwind harbor"), "Stormwind Harbor");
  assert.equal(locale.header("deeprun tram"), "Deeprun Tram");
  assert.match(locale.note("sail to stormwind"), /Sail to Stormwind/);
  assert.match(locale.note("ride to ironforge"), /Ride to Ironforge/);
});
