import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

const entries = [
  "index.html",
  "regular-notice.html",
  "notice-mail.html",
  "assets",
  "tools"
];

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of entries) {
  await cp(path.join(rootDir, entry), path.join(distDir, entry), {
    recursive: true,
    force: true,
    filter(source) {
      return !source.endsWith(`${path.sep}server.mjs`);
    }
  });
}

console.log(`Built static assets in ${distDir}`);
