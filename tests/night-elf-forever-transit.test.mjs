import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const data = JSON.parse(readFileSync(new URL("../data/quests/alliance.json", import.meta.url), "utf8"));
const nelf = data.routes.nelf;

test("night elf steps 14–17 use the direct Forever boat then Deeprun Tram", () => {
  const [auberdine, arrival, departure, ironforge] = nelf.slice(13, 17);
  assert.deepEqual([auberdine.zone, arrival.zone, departure.zone, ironforge.zone],
    ["darkshore", "stormwind", "stormwind", "ironforge"]);
  assert.equal(auberdine.waypoints[1].header, "auberdine stormwind dock");
  assert.deepEqual(auberdine.waypoints[1].coords, {x:30.5, y:40.9});
  assert.deepEqual(auberdine.waypoints[1].special, ["sail to stormwind"]);
  assert.deepEqual(arrival.waypoints[0].coords, {x:21.8, y:56.9});
  assert.deepEqual(arrival.waypoints[0].special, ["go to the dwarven district tram"]);
  assert.deepEqual(departure.waypoints[0].coords, {x:69.6, y:30.3});
  assert.deepEqual(departure.waypoints[0].special, ["ride to ironforge"]);
  assert.deepEqual(ironforge.waypoints[0].coords, {x:78, y:51.4});
  assert.equal(ironforge.waypoints[1].header, "ironforge flightpath");
  assert.deepEqual(ironforge.waypoints[1].special, ["learn the flightpath"]);
  assert.deepEqual(nelf[12].waypoints.at(-1).special, ["fly to auberdine"]);
  assert.equal(nelf[17].zone, "ironforge");
  assert.equal(nelf[17].waypoints.at(-1).header, "gates of ironforge");
});

test("four transport steps require no Menethil detour, drowning or spirit-resurrection", () => {
  const text = JSON.stringify(nelf.slice(13, 17)).toLowerCase();
  assert.doesNotMatch(text, /menethil|wetlands|drown|spirit ress|placeholder/);
  for (const step of nelf.slice(13, 17)) {
    for (const point of step.waypoints) {
      assert.ok(Number.isFinite(point.coords.x) && point.coords.x >= 0 && point.coords.x <= 100);
      assert.ok(Number.isFinite(point.coords.y) && point.coords.y >= 0 && point.coords.y <= 100);
      assert.ok(point.header !== "placeholder");
    }
  }
  for (let i = 13; i <= 17; i++) assert.ok(nelf[i].experience >= nelf[i - 1].experience);
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
