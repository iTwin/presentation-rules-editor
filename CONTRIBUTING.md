# Contributing to this repository

## Debugging frontend code

1. Launch the editor application.
2. In Visual Studio Code, execute `Debug: Open Link` command and enter `http://localhost:8080`.

## Debugging backend code

1. In Visual Studio Code, open a  `JavaScript Debug Terminal`.
2. Start the backend from the terminal.

## Debugging iTwin.js issues

1. Clone the [iTwin.js](https://github.com/imodeljs/imodeljs) repository to the same disk partition as `presentation-rules-editor` repository.
2. `rush install` and `rush build` iTwin.js packages.
3. Run this top-level `npm` command in `presentation-rules-editor` repository:

    ```shell
    npm run link [path_to_the_cloned_itwinjs_repository]
    ```

    You can omit the path if both repositories are in the same parent folder.
4. Debug the application as you would normally.
5. Make sure to run the `unlink` command to restore changes made to both repositories during the linking process:

    ```shell
    npm run unlink [path_to_the_cloned_itwinjs_repository]
    ```

    Otherwise, you may experience weird behavior and errors when trying to run iTwin.js tests and test applications.

When using Visual Studio Code, you will need to add iTwin.js repository to the workspace in order to to able to set breakpoints in library code. This can be achieved by executing `Workspaces: Add Folder to Workspace...` command.
