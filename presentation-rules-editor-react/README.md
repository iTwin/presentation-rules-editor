# @itwin/presentation-rules-editor-react

A set of React components used by [Presentation Rules Editor](https://presentationruleseditor.bentley.com).

## Installation

```cmd
npm install @itwin/presentation-rules-editor-react
```

## Usage

The following example demonstrates how to assemble a basic Presentation rules editor out of provided React components:

```tsx
import * as monaco from "monaco-editor";
import { useEffect, useState } from "react";
import { IModelConnection } from "@itwin/core-frontend";
import { ContentSpecificationTypes, Ruleset, RuleTypes } from "@itwin/presentation-common";
import { EditableRuleset, PropertyGrid, SoloRulesetEditor, Tree } from "@itwin/presentation-rules-editor-react";

function MyComponent(props: { iModel: IModelConnection }): React.ReactElement {
  const [editableRuleset] = useState(() => new EditableRuleset({ initialRuleset: ruleset }));
  const [rulesetEditor] = useState(
    () => new SoloRulesetEditor({ editableRuleset, monaco, contributions: { submitButton: true } }),
  );

  useEffect(
    () => {
      // Free resources when MyComponent unmounts
      return () => {
        rulesetEditor.dispose();
        editableRuleset.dispose();
      };
    },
    [editableRuleset, rulesetEditor],
  );

  return (
    <>
      <rulesetEditor.Component width={800} height={600} />
      <Tree
        width={350}
        height={400}
        iModel={props.iModel}
        editableRuleset={editableRuleset}
      />
      <PropertyGrid
        width={350}
        height={400}
        iModel={props.iModel}
        editableRuleset={editableRuleset}
      />
    </>
  );
}

const ruleset: Ruleset = {
  id: "ruleset1",
  rules: [{
    ruleType: RuleTypes.Content,
    specifications: [{
      specType: ContentSpecificationTypes.SelectedNodeInstances,
    }],
  }],
};
```
