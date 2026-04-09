import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const configDir = path.join(rootDir, "config");
const outputFile = path.join(configDir, "runtime-config.js");

const payload = {
  tripSlug: process.env.TRIP_SLUG || "dj",
  tripTitle: process.env.TRIP_TITLE || "대전 독서모임 여행",
  tripDescription:
    process.env.TRIP_DESCRIPTION || "독서모임 멤버들이 함께 장소를 모으는 보드",
  naverMapsClientId: process.env.NAVER_MAPS_CLIENT_ID || ""
};

await mkdir(configDir, { recursive: true });

const fileContents = `window.__DJ_CONFIG__ = ${JSON.stringify(payload, null, 2)};\n`;
await writeFile(outputFile, fileContents, "utf8");

console.log(`Generated ${outputFile}`);
