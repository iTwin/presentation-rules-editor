/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
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
  const locations = getLocationsForPackage(sourceLocation, destinationLocation);

  // Make a backup for the package in this repository
  if (!fs.existsSync(locations.localPackageBackup)) {
    fs.renameSync(destinationLocation, locations.localPackageBackup);
  }

  // Link the imodeljs package to this repository
  if (!fs.existsSync(destinationLocation)) {
    fs.symlinkSync(sourceLocation, destinationLocation);
  }

  // Make a backup for node_modules in imodeljs repository
  if (!fs.existsSync(locations.remoteNodeModulesBackup) && fs.existsSync(locations.remoteNodeModules)) {
    fs.renameSync(locations.remoteNodeModules, locations.remoteNodeModulesBackup);
  }

  // Replace imodeljs node_modules with our node_modules
  if (!fs.existsSync(locations.remoteNodeModules)) {
    fs.symlinkSync(locations.localNodeModules, locations.remoteNodeModules);
  }
}

function unlinkPackage(sourceLocation: string, destinationLocation: string): void {
  const locations = getLocationsForPackage(sourceLocation, destinationLocation);

  // Restore the package from backup in this repository
  if (fs.existsSync(locations.localPackageBackup)) {
    fs.unlinkSync(destinationLocation);
    fs.renameSync(locations.localPackageBackup, destinationLocation);
  }

  // Restore the package's node_modules from backup in imodeljs repository
  if (fs.existsSync(locations.remoteNodeModulesBackup)) {
    fs.unlinkSync(locations.remoteNodeModules);
    fs.renameSync(locations.remoteNodeModulesBackup, locations.remoteNodeModules);
  }
}

interface PackageLocations {
  /** Package's node_modules folder in this repository. */
  localNodeModules: string;
  /** Original package that was installed in this repository. */
  localPackageBackup: string;
  /** Package's node_modules folder in imodeljs repository. */
  remoteNodeModules: string;
  /** Package's original node_modules folder in imodeljs repository. */
  remoteNodeModulesBackup: string;
}

function getLocationsForPackage(sourceLocation: string, destinationLocation: string): PackageLocations {
  return {
    localNodeModules: path.resolve(destinationLocation, "../../"),
    localPackageBackup: path.join(path.dirname(destinationLocation), `${path.basename(destinationLocation)}_original`),
    remoteNodeModules: path.join(sourceLocation, "node_modules"),
    remoteNodeModulesBackup: path.join(sourceLocation, "node_modules_original"),
  };
}
