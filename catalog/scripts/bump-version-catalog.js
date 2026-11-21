/**
 * catalog/scripts/bump.js
 * Automatische Versionspflege für Maven (pom.xml), npm (package.json) und OpenAPI (catalog.yaml).
 * - Final-Versionen erhalten ein -SNAPSHOT (Maven) bzw. ein Zeitstempel-Prerelease (npm).
 * - Bereits laufende Prereleases/Snapshots behalten die Basisversion und aktualisieren nur den Zeitstempel.
 * - Mit Vorab-Validierung: Es wird erst geschrieben, wenn alle Prüfungen erfolgreich sind.
 */

const fs = require("fs");

const pkgPath = "../package.json";
const pomPath = "../pom.xml";
const openApiPath = "../catalog.yaml";

// Dateien einlesen und Existenz prüfen
if (!fs.existsSync(pkgPath)) {
  console.error("FEHLER: package.json nicht gefunden unter " + pkgPath);
  process.exit(1);
}
if (!fs.existsSync(pomPath)) {
  console.error("FEHLER: pom.xml nicht gefunden unter " + pomPath);
  process.exit(1);
}
if (!fs.existsSync(openApiPath)) {
  console.error("FEHLER: catalog.yaml nicht gefunden unter " + openApiPath);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
let pom = fs.readFileSync(pomPath, "utf8");
let openApi = fs.readFileSync(openApiPath, "utf8");

// package.json validieren und neue Version berechnen
const isDevVersion = pkg.version.includes("-dev");
const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);

let newFinalVersion;
let newNpmVersion;

if (!isDevVersion) {
  let parts = pkg.version.split(".");
  if (parts.length !== 3) {
    console.error(
      "FEHLER: Ungültiges SemVer-Format in package.json (" + pkg.version + ")",
    );
    process.exit(1);
  }
  parts[2] = parseInt(parts[2], 10) + 1;
  newFinalVersion = parts.join(".");
  newNpmVersion = `${newFinalVersion}-dev.${timestamp}`;
} else {
  const baseVersion = pkg.version.split("-dev")[0];
  newFinalVersion = baseVersion;
  newNpmVersion = `${baseVersion}-dev.${timestamp}`;
}

// pom.xml validieren (Regex-Check im Vorfeld) und Zielversion bestimmen
const pomRegex =
  /(<artifactId>catalog-api<\/artifactId>\s*<version>)(.*?)(-SNAPSHOT)?(<\/version>)/;
if (!pomRegex.test(pom)) {
  console.error(
    "FEHLER: Artifact-ID 'catalog-api' wurde in der pom.xml nicht gefunden!",
  );
  process.exit(1);
}

const targetPomVersion = `${newFinalVersion}-SNAPSHOT`;

// catalog.yaml validieren
const openApiRegex = /(info:\s*title:.*\s*version:\s*)(.*)/;
if (!openApiRegex.test(openApi)) {
  console.error(
    "FEHLER: version im info-Block wurde in der catalog.yaml nicht gefunden!",
  );
  process.exit(1);
}

// package.json schreiben
pkg.version = newNpmVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`npm-Version aktualisiert auf: ${newNpmVersion}`);

// pom.xml schreiben
if (!isDevVersion) {
  pom = pom.replace(pomRegex, `$1${targetPomVersion}$4`);
  fs.writeFileSync(pomPath, pom, "utf8");
  console.log(`pom.xml aktualisiert auf: ${targetPomVersion}`);
} else {
  console.log(`pom.xml bleibt unverändert auf Snapshot-Stand.`);
}

// catalog.yaml schreiben
const newOpenApiVersion = newNpmVersion.replace("dev", "alpha");
openApi = openApi.replace(openApiRegex, `$1${newOpenApiVersion}`);
fs.writeFileSync(openApiPath, openApi, "utf8");
console.log(`yaml-Version aktualisiert auf: ${newOpenApiVersion}`);
