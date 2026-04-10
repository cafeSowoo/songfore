import { access } from "node:fs/promises";
import path from "node:path";

const requiredFiles = [
  "dj/index.html",
  "src/main.js",
  "src/app.js",
  "src/lib/api.js",
  "src/styles.css",
  "supabase/schema.sql",
  "config/runtime-config.js",
  "netlify/functions/place-search.js",
  "netlify/functions/trip.js",
  "netlify/functions/places.js",
  "netlify/functions/comments.js"
];

for (const file of requiredFiles) {
  const absolutePath = path.join(process.cwd(), file);
  await access(absolutePath);
  console.log(`OK ${file}`);
}

console.log("Static scaffold check passed.");
