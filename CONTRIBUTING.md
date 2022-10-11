# Contributing to this repository

## Development

### Setup

Follow the [steps for running the application](./README.md#using). These actually start a development server which automatically reloads the application when source files are modified.

### Directory structure

* `app/` — contains source code for the editor application.
* `presentation-rules-editor-react/` — contains reusable components that can be added to other applications that wish to integrate a presentation ruleset editor.

### Localization

Localization provides very limited value to Presentation Rules Editor because the ruleset schema and the documentation is only available in the English language. Nevertheless, we do attempt to prepare user-facing strings for localization when it is not inconvenient.

iTwin.js packages present huge challenges to keeping bundle sizes sane. To maintain reasonable application startup performance, we load all iTwin.js libraries in the background, which makes built-in iTwin.js localization API inaccessible during the initial page render. React components hosted in application's `ITwinJsApp/` folder are loaded later and fully depend on iTwin.js code, so they do not have the same problem, thus you will only see attempts at localization in this subtree.

## Testing

We have two sets of tests:

* Unit tests for `presentation-rules-editor` package, which require 100% test coverage.
* End-to-end tests for the editor application.

To run these tests, execute `npm test` in `presentation-rules-editor-react/` and `app/e2e-tests/` directories respectively.

## Debugging

### Frontend

1. Launch Presentation Rules Editor application like you normally would.
2. In Visual Studio Code, execute `Debug: Open Link` command and enter `http://localhost:8080`.

### Backend

1. In Visual Studio Code, open a  `JavaScript Debug Terminal`.
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

## Optimizing fonts

Presentation Rules Editor application is configured to request only a subset of `Open Sans` font for the initial page load. The rest of the font is downloaded seperately when there is a demand for it.

The procedure used for generating optimized font subsets is laid out below. It assumes that the system has Python 3.7 or later.

1. Make sure the following Python packages are installed:

    ```bash
    pip install brotli fonttools
    ```

2. Download [`Open Sans` font](https://fonts.google.com/specimen/Open+Sans) archive and extract the compressed files.
3. Generate optimized font subsets by issuing the following commands:

    ```bash
    pyftsubset OpenSans-VariableFont_wdth,wght.ttf --unicodes="00-7F,A9" --flavor="woff2" --output-file=OpenSans-subset.woff2
    pyftsubset OpenSans-VariableFont_wdth,wght.ttf --unicodes="80-FFFF" --flavor="woff2" --output-file=OpenSans-rest.woff2
    ```

    The character ranges in `unicodes` parameter for the first command must include all latin characters, digits, punctuation, and a © (copyright) symbol. The second font subset is generated out of all remaining characters, and may overlap slightly with the first one. Counterintuitively, although the first 32 unicode characters are not printable, expanding the range to include them results in a smaller font file.
4. Make sure that the character ranges which were used to generate font subsets are matched in stylesheet rules.
