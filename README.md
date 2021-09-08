# Presentation Rules Editor

[![Build status](https://github.com/iTwin/presentation-rules-editor/actions/workflows/CI.yml/badge.svg?branch=master)](https://github.com/iTwin/presentation-rules-editor/actions/workflows/CI.yml?query=branch%3Amaster)

A monorepo for [Presentation](https://www.itwinjs.org/learning/presentation/) ruleset editing application and its components.

## Using

To start editing rulesets, you will need to build the editor application:

1. Clone this repository.
2. Install application dependencies:

    ```shell
    npx pnpm install
    ```

3. Start the application:

    ```shell
    npm start
    ```

4. Select an imodel within the launched browser window.
    > If you have a snapshot imodel, put it inside `app/backend/assets/imodels` folder.

5. You will now be presented with a ruleset editor.

## Contributing

You can submit feature requests or bugs by creating [issues](https://github.com/iTwin/presentation-rules-editor/issues).
