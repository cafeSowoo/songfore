import { access } from "node:fs/promises";
import path from "node:path";

const requiredFiles = [
  "index.html",
  "tools/grouping-dnd-v4/index.html",
  "tools/notice-mail-v2/index.html",
  "tools/book-recommend/index.html",
  "tools/book-collage/index.html",
  "tools/book-cover-wide/index.html",
  "netlify/functions/book-recommend.js",
  "netlify/functions/book-collage.js",
  "netlify/functions/book-cover-wide.js",
  "netlify/functions/lib/http.js",
  "functions/api/book-recommend.js",
  "functions/api/book-collage.js",
  "functions/api/book-cover-wide.js",
  "functions/api/book-recommend-manus-test.js",
  "functions/_lib/netlifyCompat.js",
  "scripts/build-static.mjs",
  "wrangler.toml"
];

for (const file of requiredFiles) {
  const absolutePath = path.join(process.cwd(), file);
  await access(absolutePath);
  console.log(`OK ${file}`);
}

console.log("Songfore static scaffold check passed.");
