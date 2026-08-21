import { cp, rm, writeFile } from "node:fs/promises";

await rm("assets", { recursive: true, force: true });
await cp("dist/index.html", "index.html");
await cp("dist/assets", "assets", { recursive: true });
await writeFile(".nojekyll", "");
console.log("Sito statico copiato nella root per GitHub Pages.");
