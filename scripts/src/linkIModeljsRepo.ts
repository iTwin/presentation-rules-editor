/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import * as yargs from "yargs";

const packagesToLink = new Set([
  "@bentley/imodeljs-native",
  "@bentley/presentation-backend",
  "@bentley/presentation-common",
  "@bentley/presentation-components",
  "@bentley/presentation-frontend",
  "@bentley/ui-components",
]);

const repositoryRootLocation = getRepositoryRootLocation();

const args = yargs(process.argv.slice(2))
  .scriptName(path.basename(__filename))
  .command(
    "link [imodeljs_repo]",
    "Links packages from a local imodeljs repository into this repository",
    (builder) => {
      builder.positional(
        "imodeljs_repo",
        { description: "Path to a local imodeljs repository", default: "../imodeljs" },
      );
    },
  )
  .command(
    "unlink [imodeljs_repo]",
    "Undoes link command",
    (builder) => {
      builder.positional(
        "imodeljs_repo",
        { description: "Path to a local imodeljs repository", default: "../imodeljs" },
      );
    },
  )
  .strict()
  .argv;

if (typeof args.imodeljs_repo !== "string") {
  process.exit(1);
}

const iModeljsRepoLocation = path.isAbsolute(args.imodeljs_repo)
  ? args.imodeljs_repo
  : path.resolve(repositoryRootLocation, args.imodeljs_repo);
if (!isIModeljsRepository(iModeljsRepoLocation)) {
  console.error(`'${iModeljsRepoLocation}' is not an imodeljs repository.`);
  process.exit(1);
}

const packageSourceLocations = findPackageSourceLocations(iModeljsRepoLocation, packagesToLink);
const packageDesitinationLocations = findPackageDestinationLocations(packagesToLink);

for (const packageName of packagesToLink) {
  const sourceLocation = packageSourceLocations.get(packageName);
  const destinationLocation = packageDesitinationLocations.get(packageName);

  if (sourceLocation === undefined || destinationLocation === undefined) {
    console.error(`Could not determine locations for '${packageName}'`);
    continue;
  }

  if (args._[0] === "link") {
    console.log(`Symlinking ${packageName} => ${sourceLocation}`);
    linkPackage(sourceLocation, destinationLocation);
  } else {
    console.log(`Unsymlinking ${packageName} => ${sourceLocation}`);
    unlinkPackage(sourceLocation, destinationLocation);
  }
}

function getRepositoryRootLocation(): string {
  let currentPath = path.resolve(".");
  while (!fs.readdirSync(currentPath).includes("pnpm-workspace.yaml")) {
    currentPath = path.dirname(currentPath);
    if (path.dirname(currentPath) === currentPath) {
      console.error("Could not find presentation-rules-editor repository root. Is pnpm-workspace.yaml missing?");
      process.exit(1);
    }
  }

  return currentPath;
}

function isIModeljsRepository(pathToRepository: string): boolean {
  return fs.existsSync(path.join(pathToRepository, "rush.json"));
}

interface RushJson {
  projects: Array<{
    packageName: string;
    projectFolder: string;
  }>;
}

function findPackageSourceLocations(pathToRepository: string, packageNames: Set<string>): Map<string, string> {
  const rushJsonPath = path.join(pathToRepository, "rush.json");
  const rushJson: RushJson = JSON.parse(fs.readFileSync(rushJsonPath, { encoding: "utf-8" }));
  const sourceLocations = new Map<string, string>(rushJson.projects
    .filter((project: any) => packageNames.has(project.packageName))
    .map((project: any) => [project.packageName, path.resolve(pathToRepository, project.projectFolder)]),
  );

  // @bentley/imodeljs-native does not have a project in imodeljs monorepo
  if (packageNames.has("@bentley/imodeljs-native")) {
    const backendProject = rushJson.projects.find((project) => project.packageName === "@bentley/imodeljs-backend");
    if (backendProject === undefined) {
      console.error(`'@bentley/imodeljs-backend' is not present in '${rushJsonPath}'`);
      process.exit(1);
    }

    sourceLocations.set(
      "@bentley/imodeljs-native",
      path.join(pathToRepository, backendProject.projectFolder, "node_modules/@bentley/imodeljs-native"),
    );
  }

  return sourceLocations;
}

function findPackageDestinationLocations(packageNames: Iterable<string>): Map<string, string> {
  const normalizedPackageNameToOriginalName = new Map<string, string>();
  for (const packageName of packageNames) {
    // Change separator between package scope and its name from '/' to '+'
    normalizedPackageNameToOriginalName.set(packageName.replace("/", "+"), packageName);
  }

  const packageStoreFolder = path.join(repositoryRootLocation, "node_modules/.pnpm");
  const packageDestinationMap = new Map<string, string>();
  for (const folderName of fs.readdirSync(packageStoreFolder)) {
    // Folder names are either '<package_name>@<version>_<hash>' or '@<scope>+<package_name>@<version>_<hash>
    const folderNameWithoutVersionSuffix = folderName.slice(0, folderName.indexOf("@", 1));
    const originalPackageName = normalizedPackageNameToOriginalName.get(folderNameWithoutVersionSuffix);
    if (originalPackageName !== undefined) {
      if (packageDestinationMap.has(originalPackageName)) {
        console.error(`Error: multiple versions of '${originalPackageName}' have been detected in this repository.`);
        console.error("Hint: running 'pnpm prune' might resolve this issue.");
        process.exit(1);
      }

      const packageNameWithoutScope = originalPackageName.slice(originalPackageName.indexOf("/") + 1);
      packageDestinationMap.set(
        originalPackageName,
        path.resolve(packageStoreFolder, folderName, "node_modules", "@bentley", packageNameWithoutScope),
      );
    }
  }

  return packageDestinationMap;
}

function linkPackage(sourceLocation: string, destinationLocation: string): void {
  const { sourceLib, destinationLib, destinationLibBackup } = getPathsForPackage(sourceLocation, destinationLocation);

  // Make a backup of the lib folder in the locally installed package
  if (!fs.existsSync(destinationLibBackup) && fs.existsSync(destinationLib)) {
    fs.renameSync(destinationLib, destinationLibBackup);
  }

  // Move external package's lib folder into our repository
  if (!fs.existsSync(destinationLib) && fs.existsSync(sourceLib)) {
    fs.renameSync(sourceLib, destinationLib);
  }

  // Symlink the moved lib folder back into its original place
  if (!fs.existsSync(sourceLib) && fs.existsSync(destinationLib)) {
    fs.symlinkSync(destinationLib, sourceLib);
  }
}

function unlinkPackage(sourceLocation: string, destinationLocation: string): void {
  const { sourceLib, destinationLib, destinationLibBackup } = getPathsForPackage(sourceLocation, destinationLocation);

  // Remove lib folder from the external repository if it is a symbolic link
  if (fs.existsSync(sourceLib) && fs.lstatSync(sourceLib).isSymbolicLink()) {
    fs.unlinkSync(sourceLib);
  }

  // Move lib folder back into its original location in the external repository
  if (!fs.existsSync(sourceLib) && fs.existsSync(destinationLib)) {
    fs.renameSync(destinationLib, sourceLib);
  }

  // Restore locally installed lib folder from backup
  if (fs.existsSync(destinationLibBackup)) {
    if (fs.existsSync(destinationLib)) {
      rimraf.sync(destinationLib);
    }

    fs.renameSync(destinationLibBackup, destinationLib);
  }
}

interface PackageLocations {
  /** lib folder of the package in imodeljs repository */
  sourceLib: string;
  /** lib folder of the package in this repository */
  destinationLib: string;
  /** lib folder that holds the original package files that were installed in this repository */
  destinationLibBackup: string;
}

function getPathsForPackage(sourceLocation: string, destinationLocation: string): PackageLocations {
  return {
    sourceLib: path.join(sourceLocation, "lib"),
    destinationLib: path.join(destinationLocation, "lib"),
    destinationLibBackup: path.join(destinationLocation, "lib_original"),
  };
}
