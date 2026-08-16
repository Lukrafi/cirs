/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const worldPath = path.join(__dirname, "../src/lib/world-data.json");
const sitePath = path.join(__dirname, "site.txt");
const world = JSON.parse(fs.readFileSync(worldPath, "utf-8"));
const site = JSON.parse(fs.readFileSync(sitePath, "utf-8"));

for (const sConf of site.confederations) {
  const target = world.confederations.find(c => c.name === sConf.name);
  if (!target) {
    world.confederations.push(sConf);
  } else {
    for (const sCountry of sConf.countries) {
      const existing = target.countries.find(c => c.name === sCountry.name || c.code === sCountry.code);
      if (!existing) {
        target.countries.push(sCountry);
      }
    }
  }
}

fs.writeFileSync(worldPath, JSON.stringify(world, null, 2));
console.log("Merged successfully.");
for (const c of world.confederations) {
  console.log(`  ${c.name}: ${c.countries.length} countries`);
}