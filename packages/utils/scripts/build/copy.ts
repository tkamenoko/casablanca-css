import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import license from "../../../../LICENSE?raw";
import readme from "../../README.md?raw";

async function main() {
  const dist = resolve("./dist/");
  const licensePath = resolve(dist, "LICENSE");
  const readmePath = resolve(dist, "README.md");
  await Promise.all([
    writeFile(licensePath, license),
    writeFile(readmePath, readme),
  ]);
}

await main();
