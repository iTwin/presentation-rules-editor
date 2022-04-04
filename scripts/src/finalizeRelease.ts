/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const packageJsonFilePath = path.join(process.cwd(), "package.json");
if (!fs.existsSync(packageJsonFilePath)) {
  console.error(`File "${packageJsonFilePath}" does not exist.`);
  process.exit(1);
}

const packageJson = JSON.parse(String(fs.readFileSync(packageJsonFilePath)));
const packageName: string = packageJson.name;
if (!packageName) {
  console.error("Could not obtain package name.");
  process.exit(1);
}

const packageVersion: string = packageJson.version;
if (!packageVersion) {
  console.error("Could not obtain package version.");
  process.exit(1);
}

const changelogFilePath = path.join(process.cwd(), "CHANGELOG.md");
if (!fs.existsSync(changelogFilePath)) {
  console.error(`File "${changelogFilePath}" does not exist.`);
  process.exit(1);
}

const changelogContent = String(fs.readFileSync(changelogFilePath));
const unreleasedHeaderStartPosition = changelogContent.indexOf("## [Unreleased]");
if (unreleasedHeaderStartPosition === -1) {
  console.error("Could not find Unreleased section.");
  process.exit(1);
}

const unreleasedHeaderEndPosition = changelogContent.indexOf("\n", unreleasedHeaderStartPosition);
if (unreleasedHeaderEndPosition === -1) {
  console.error("Changelog file cannot end with Unreleased section without listed changes.");
  process.exit(1);
}

const unreleasedHeader = changelogContent.substring(unreleasedHeaderStartPosition, unreleasedHeaderEndPosition);
const releaseHeader = unreleasedHeader
  .replace("Unreleased", packageVersion)
  .replace("HEAD", `v${packageVersion}`)
  .concat(` - ${formatDate(new Date())}`);

const updatedChangelogContent = changelogContent
  .slice(0, unreleasedHeaderEndPosition)
  .concat("\n\n", releaseHeader, changelogContent.slice(unreleasedHeaderEndPosition));

fs.writeFileSync(changelogFilePath, updatedChangelogContent);

try {
  execSync(`git add ${packageJsonFilePath} ${changelogFilePath}`);
  execSync(`git commit -e -m \"Release ${packageName}@${packageVersion}\"`);
} catch (error) {
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : "Could not commit file changes.");
  process.exit(1);
}

function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

  function pad(component: number): string {
    return String(component).padStart(2, "0");
  }
}
