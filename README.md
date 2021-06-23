# Presentation Rules Editor

[![Build status](https://github.com/imodeljs/presentation-rules-editor/actions/workflows/CI.yml/badge.svg?branch=master)](https://github.com/imodeljs/presentation-rules-editor/actions/workflows/CI.yml?query=branch%3Amaster)

A monorepo for [Presentation](https://www.itwinjs.org/learning/presentation/) ruleset editing application and its components.

## Running

To start using the editing application, you will need to build it and supply a snapshot iModel.

1. Clone this repository.
2. Install application dependencies:

    ```shell
    npx pnpm install
    ```

3. Start the application:

    ```shell
    npm start
    ```

4. Put a snapshot iModel inside `app/backend/assets/imodels` folder and reload the page.
5. You will now be able to select the snapshot from a dropdown menu and start working on a ruleset.

## Contributing

You can submit feature requests or bugs by creating [issues](https://github.com/imodeljs/presentation-rules-editor/issues).
