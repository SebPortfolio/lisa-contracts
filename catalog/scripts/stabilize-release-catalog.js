const fs = require("fs");

// package.json stabilisieren
const pkgPath = "../package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const stableVersion = pkg.version.split("-dev")[0];
pkg.version = stableVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// pom.xml stabilisieren
const pomPath = "../pom.xml";
let pom = fs.readFileSync(pomPath, "utf8");
pom = pom.replace(
  /(<artifactId>catalog-api<\/artifactId>\s*<version>)(.*?)(-SNAPSHOT)(<\/version>)/,
  "$1$2$4",
);
fs.writeFileSync(pomPath, pom, "utf8");

// catalog.yaml stabilisieren
const openApiPath = "../catalog.yaml";
let openApi = fs.readFileSync(openApiPath, "utf8");
openApi = openApi.replace(
  /(info:\s*title:.*\s*version:\s*)(.*)/,
  `$1${stableVersion}`,
);
fs.writeFileSync(openApiPath, openApi, "utf8");

console.log("Stabile OpenApiRelease-Version vorbereitet: " + stableVersion);
