# Contributing to this repository

## Development

### Setup

Follow the [steps for running the application](./README.md#using). These actually start a development server which automatically reloads the application when source files are modified.

### Directory structure

- `app/` — contains source code for the editor application.
- `presentation-rules-editor-react/` — contains reusable components that can be added to other applications that wish to integrate a presentation ruleset editor.

### Environment variables

- `app/frontend/` — has an `.env` file which has `OAUTH_CLIENT_ID` set to the same value that used in production. However, if you try to Sign In using this client id, it won't work. You need to register a new client and specify it's id in `.env.local`. See [.env](app/frontend/.env) for details.

### Localization

Localization provides very limited value to Presentation Rules Editor because the ruleset schema and the documentation is only available in the English language. Nevertheless, we do attempt to prepare user-facing strings for localization when it is not inconvenient.

We are using built-in iTwin.js localization API in the parts of application that already depend on iTwin.js. This is because, to maintain reasonable application startup performance, all iTwin.js libraries have to be loaded in the background, which makes localization unavailable in the initial app bundle.

To summarize, we only do string localization inside `ITwinJsApp/` subdirectory.

## Testing

We have two sets of tests:

- Unit tests for `presentation-rules-editor` package, which require 100% test coverage.

  - To run these tests navigate to `presentation-rules-editor-react/` and execute:

  ```bash
   npm test
  ```

- End-to-end tests for the editor application. These tests are split into `web` and `local` tests.

  - To run `web` tests navigate to `app/e2e-tests/` and execute:

  ```bash
   npm run test:web
  ```

  - To run `local` tests navigate to `app/e2e-tests/` and execute:

  ```bash
   npm run test:local
  ```

## Debugging

### Frontend

1. Launch Presentation Rules Editor application like you normally would.
2. In Visual Studio Code, execute `Debug: Open Link` command and enter `http://localhost:3000`.

### Backend

1. In Visual Studio Code, open a `JavaScript Debug Terminal`.
2. Start the backend from the created terminal.

### Core iTwin.js libraries

1. Clone the [iTwin.js](https://github.com/imodeljs/imodeljs) repository.
2. `rush install` and `rush build` iTwin.js packages.
3. Run this top-level `npm` command in `presentation-rules-editor` repository:

   ```shell
   npm run link [path_to_the_cloned_itwinjs_repository]
   ```

   You can omit the path if both repositories share the same parent folder.

4. Start debugging the Presentation Rules Editor as you would normally.
5. Make sure to run `unlink` to restore changes made to both repositories by the `link` command:

   ```shell
   npm run unlink [path_to_the_cloned_itwinjs_repository]
   ```

   Otherwise, you may experience weird behavior and errors when trying to run iTwin.js tests and test applications.

When using Visual Studio Code, you will need to add iTwin.js repository to the workspace in order to be able to set breakpoints in library code. This can be achieved by executing `Workspaces: Add Folder to Workspace...` command.

## Threat Model

This repo uses [Threagile](https://github.com/BentleySystems/threagile) to generate a threat model (see the `.threat-model/threagile.yaml` in this repo). To ensure that we keep our threat model up-to-date (both in terms of the architecture of our service and any potential threats) we will review the threat model under two different circumstances. Each review entails making sure the threat model continuously aligns with our service, captures known threats, and reflects the current status of any risk-tracking items.

1. During every PR, care should be taken to identify changes that could have a security impact. In such cases, `threagile.yaml`, representing the threat model, should be updated in the same PR. It is both the developer's and reviewer's responsibility to ask, "what could go wrong?" resulting from direct changes or changes to prior security assumptions. Developers should use each PR as an opportunity to preemptively update `threagile.yaml` to expedite this process. No PRs will be approved or merged without including required `threagile.yaml` changes.

2. A quarterly review of `threagile.yaml`. Each quarterly review will be tracked via a GitHub issue in this repo with the tag ["threat model"](https://github.com/iTwin/presentation-rules-editor/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22threat%20model%22), and should be approved by the security champion and dev lead by typing 'APPROVED' in the issue once the review is complete. Threat model review consists of validating system model accuracy, identifying any new manual threats, and verifying up-to-date statuses on all risk tracking items.
