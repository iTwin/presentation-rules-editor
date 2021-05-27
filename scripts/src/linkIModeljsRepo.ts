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
  const paths = getPathsForPackage(sourceLocation, destinationLocation);

  // Make a backup of the lib folder in the locally installed package
  if (!fs.existsSync(paths.destinationLibBackup) && fs.existsSync(paths.destinationLib)) {
    fs.renameSync(paths.destinationLib, paths.destinationLibBackup);
  }

  // Move external package's lib folder into our repository
  if (!fs.existsSync(paths.destinationLib) && fs.existsSync(paths.sourceLib)) {
    fs.renameSync(paths.sourceLib, paths.destinationLib);
  }

  // Symlink external package's src folder into our repository for sourcemap support
  if (!fs.existsSync(paths.destinationSrc) && fs.existsSync(paths.sourceSrc)) {
    fs.symlinkSync(paths.sourceSrc, paths.destinationSrc);
  }

  // Symlink the moved lib folder back into its original place
  if (!fs.existsSync(paths.sourceLib) && fs.existsSync(paths.destinationLib)) {
    fs.symlinkSync(paths.destinationLib, paths.sourceLib);
  }
}

function unlinkPackage(sourceLocation: string, destinationLocation: string): void {
  const paths = getPathsForPackage(sourceLocation, destinationLocation);

  // Remove lib folder from the external repository if it is a symbolic link
  if (fs.existsSync(paths.sourceLib) && fs.lstatSync(paths.sourceLib).isSymbolicLink()) {
    fs.unlinkSync(paths.sourceLib);
  }

  // Move lib folder back into its original location in the external repository
  if (!fs.existsSync(paths.sourceLib) && fs.existsSync(paths.destinationLib)) {
    fs.renameSync(paths.destinationLib, paths.sourceLib);
  }

  // Remove src symlink
  if (fs.existsSync(paths.destinationSrc)) {
    fs.unlinkSync(paths.destinationSrc);
  }

  // Restore locally installed lib folder from backup
  if (fs.existsSync(paths.destinationLibBackup)) {
    if (fs.existsSync(paths.destinationLib)) {
      rimraf.sync(paths.destinationLib);
    }

    fs.renameSync(paths.destinationLibBackup, paths.destinationLib);
  }
}

interface PackageLocations {
  /** lib folder of the package in imodeljs repository */
  sourceLib: string;
  /** src folder of the package in imodeljs repository */
  sourceSrc: string;
  /** lib folder of the package in this repository */
  destinationLib: string;
  /** src folder of the package in this repository */
  destinationSrc: string;
  /** lib folder that holds the original package files that were installed in this repository */
  destinationLibBackup: string;
}

function getPathsForPackage(sourceLocation: string, destinationLocation: string): PackageLocations {
  return {
    sourceLib: path.join(sourceLocation, "lib"),
    sourceSrc: path.join(sourceLocation, "src"),
    destinationLib: path.join(destinationLocation, "lib"),
    destinationSrc: path.join(destinationLocation, "src"),
    destinationLibBackup: path.join(destinationLocation, "lib_original"),
  };
}
