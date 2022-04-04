# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/iTwin/presentation-rules-editor/tree/HEAD)

## [0.1.0](https://github.com/iTwin/presentation-rules-editor/tree/v0.1.0)

### Added

- `EditableRuleset`: Represents a ruleset with dynamic content. It acts as the main communication channel between different components in this package.
- `SoloRulesetEditor`: Represents a single monaco editor instance that is used to edit an associated ruleset.
- `PropertyGrid`: React component that displays properties of selected elements and reacts to the ruleset changes.
- `Tree`: React component that displays a tree hierachy defined by a Presentation ruleset and reacts to the ruleset changes.
