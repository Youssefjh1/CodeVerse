import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const monacoPkgPath = path.join(rootDir, "node_modules", "monaco-editor", "package.json");
const sourceDir = path.join(rootDir, "node_modules", "monaco-editor", "min", "vs");
const targetRoot = path.join(rootDir, "public", "monaco");
const targetDir = path.join(targetRoot, "vs");
const versionFile = path.join(targetRoot, ".version");

if (!fs.existsSync(monacoPkgPath) || !fs.existsSync(sourceDir)) {
  console.warn("[sync-monaco] monaco-editor package not installed yet; skipping sync.");
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(monacoPkgPath, "utf8"));
const expectedVersion = String(pkg.version || "unknown");
const loaderPath = path.join(targetDir, "loader.js");

if (
  fs.existsSync(versionFile) &&
  fs.existsSync(loaderPath) &&
  fs.readFileSync(versionFile, "utf8").trim() === expectedVersion
) {
  process.exit(0);
}

fs.mkdirSync(targetRoot, { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
fs.writeFileSync(versionFile, `${expectedVersion}\n`, "utf8");
console.log(`[sync-monaco] Synced monaco-editor@${expectedVersion} assets to public/monaco/vs.`);
