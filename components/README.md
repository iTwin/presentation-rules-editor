# @itwin/presentation-rules-editor-react

A set of React components used by [Presentation Rules Editor](https://presentationruleseditor.bentley.com).

## Installation

```cmd
npm install @itwin/presentation-rules-editor-react
```

## Usage

The following example demonstrates how to assemble a basic Presentation rules editor out of provided React components:

```tsx
import * as React from "react";
import { IModelConnection } from "@itwin/core-frontend";
import { ContentSpecificationTypes, Ruleset, RuleTypes } from "@itwin/presentation-common";
import { PropertyGrid, Tree, useStandaloneRulesetEditor } from "@itwin/presentation-rules-editor-react";

interface MyComponentProps {
  imodel: IModelConnection;
}

function MyComponent(props: MyComponentProps): React.ReactElement {
  const { editableRuleset, rulesetEditor } = useStandaloneRulesetEditor({ initialRuleset: ruleset });
  return (
    <>
      <rulesetEditor.Component width={800} height={600} />
      <Tree
        width={350}
        height={400}
        imodel={props.imodel}
        editableRuleset={editableRuleset}
      />
      <PropertyGrid
        width={350}
        height={400}
        imodel={props.imodel}
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
