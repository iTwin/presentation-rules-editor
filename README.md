# Presentation Rules Editor

[![Build status](https://github.com/iTwin/presentation-rules-editor/actions/workflows/CI.yml/badge.svg?branch=master)](https://github.com/iTwin/presentation-rules-editor/actions/workflows/CI.yml?query=branch%3Amaster) [![CodeQL](https://github.com/iTwin/presentation-rules-editor/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/iTwin/presentation-rules-editor/actions/workflows/codeql-analysis.yml)

A monorepo for [Presentation](https://www.itwinjs.org/presentation/) ruleset editing application and its components.

## Using

To start editing rulesets, you will need to build the editor application:

1. Clone this repository.
2. Install application dependencies:

   ```shell
   npx pnpm install
   ```

3. Build app/common and presentation-rules-editor-react (if it was never built prior):

   ```shell
   npm run build:components
   ```

   ```shell
   npm run build:common
   ```

4. Start the application:

   ```shell
   npm start
   ```

5. Select an imodel within the launched browser window.

   > If you have a snapshot imodel, put it inside `app/backend/assets/imodels` folder.

6. You will now be presented with a ruleset editor.

### Local backend access

Open the local application at `http://localhost:3000`. The backend listens only on `127.0.0.1:3001` and accepts browser requests only from that frontend origin. The frontend obtains a temporary session capability on its first local RPC request and sends it with every later one, including generic iModel reads. Reload the frontend after restarting the backend.

Local snapshot RPCs accept filenames, not paths. Files must end in `.bim` and resolve to regular files within `app/backend/assets/imodels`, or the `imodels` directory under a configured `IModelHost.appAssetsDir`. Symlinks cannot grant access outside that directory. Copy snapshots into the directory rather than linking to files elsewhere.

The local backend is for a trusted developer workstation, not a shared or publicly accessible service. Its origin checks only stop browsers, so any local process, including those of other users and any other server on port 3000, can obtain a session.

## Contributing

You can submit feature requests or bugs by creating [issues](https://github.com/iTwin/presentation-rules-editor/issues).
