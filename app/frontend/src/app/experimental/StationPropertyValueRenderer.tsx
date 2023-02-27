/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* eslint-disable no-console */

import * as React from "react";
import { PropertyRecord } from "@itwin/appui-abstract";
import { IPropertyValueRenderer, PropertyValueRendererContext, PropertyValueRendererManager, useDebouncedAsyncValue } from "@itwin/components-react";
import { Id64String } from "@itwin/core-bentley";
import { QueryBinder, QueryRowFormat } from "@itwin/core-common";
import { IModelConnection } from "@itwin/core-frontend";
import { Format, Formatter, FormatterSpec } from "@itwin/core-quantity";
import { ECVersion, SchemaContext, Format as SchemaFormat, SchemaKey, SchemaUnitProvider } from "@itwin/ecschema-metadata";
import { ECSchemaRpcLocater } from "@itwin/ecschema-rpcinterface-common";
import { KeySet } from "@itwin/presentation-common";
import { useUnifiedSelectionContext } from "@itwin/presentation-components";
import { Presentation } from "@itwin/presentation-frontend";

Presentation.registerInitializationHandler(async (): Promise<() => void> => {
  const customRenderers: Array<{ name: string, renderer: IPropertyValueRenderer }> = [
    { name: "Station", renderer: new StationPropertyValueRenderer() },
  ];

  for (const { name, renderer } of customRenderers) {
    PropertyValueRendererManager.defaultManager.registerRenderer(name, renderer);
  }

  return () => {
    for (const { name } of customRenderers) {
      PropertyValueRendererManager.defaultManager.unregisterRenderer(name);
    }
  };
});

/**
 * Property value renderer for STATION values.
 * @alpha
 */
export class StationPropertyValueRenderer implements IPropertyValueRenderer {
  public canRender(record: PropertyRecord) {
    return record.property.renderer?.name === "Station";
  }

  public render(_record: PropertyRecord, context?: PropertyValueRendererContext) {
    return <StationPropertyValueRendererImpl context={context} />;
  }
}

function StationPropertyValueRendererImpl(props: { context?: PropertyValueRendererContext }) {
  const { value: iModelSelectedElementIds, inProgress } = useIModelSelectedElementIds();

  if (inProgress)
    return null;

  if (!iModelSelectedElementIds)
    return <>Error: No selection context?</>;

  if (iModelSelectedElementIds.elementIds.length === 0)
    return <>No elements selected</>;

  if (iModelSelectedElementIds.elementIds.length > 1)
    return <>Error: Only 1 element supported</>;

  return <ElementsStationPropertyValue imodel={iModelSelectedElementIds.imodel} elementId={iModelSelectedElementIds.elementIds[0]} context={props.context} />;
}

function ElementsStationPropertyValue(props: { imodel: IModelConnection, elementId: Id64String, context?: PropertyValueRendererContext }) {
  const { value } = useComputedStationValue({ imodel: props.imodel, elementId: props.elementId });
  return (
    <span style={props.context?.style} title={value ?? ""}>{value}</span>
  );
}

function useIModelSelectedElementIds() {
  const selectionContext = useUnifiedSelectionContext();
  return useDebouncedAsyncValue(React.useCallback(async () => {
    if (!selectionContext)
      return undefined;

    const res = await Presentation.presentation.getContentInstanceKeys({
      imodel: selectionContext.imodel,
      keys: new KeySet(selectionContext.getSelection()),
      rulesetOrId: {
        id: "selected-elements",
        rules: [{
          ruleType: "Content",
          specifications: [{
            specType: "SelectedNodeInstances",
            acceptableSchemaName: "BisCore",
            acceptableClassNames: ["Element"],
            acceptablePolymorphically: true,
          }],
        }],
      },
    });
    const elementIds = new Array<Id64String>();
    for await (const key of res.items()) {
      elementIds.push(key.id);
    }
    return { imodel: selectionContext.imodel, elementIds };
  }, [selectionContext]));
}

function useComputedStationValue(props: { imodel: IModelConnection, elementId: Id64String }) {
  const schemaContext = React.useMemo(() => {
    const ctx = new SchemaContext();
    ctx.addLocater(new ECSchemaRpcLocater(props.imodel.getRpcProps()));
    return ctx;
  }, [props.imodel]);

  const formatterSpec = useDebouncedAsyncValue(React.useCallback(async () => {
    const unitsProvider = new SchemaUnitProvider(schemaContext);
    const persistenceUnit = await unitsProvider.findUnitByName("Units:M");
    const formatsSchema = await schemaContext.getSchema(new SchemaKey("Formats", new ECVersion(1)));
    if (!formatsSchema) {
      console.error(`Failed to find "Formats" schema.`);
      return undefined;
    }
    const schemaFormat = await formatsSchema.getItem<SchemaFormat>("StationZ_1000_3");
    if (!schemaFormat) {
      console.error(`Failed to find the "StationZ_1000_3" format in "Formats" schema.`);
      return undefined;
    }
    return FormatterSpec.create("", await Format.createFromJSON("", unitsProvider, schemaFormat.toJSON()), unitsProvider, persistenceUnit);
  }, [schemaContext]));

  return useDebouncedAsyncValue(React.useCallback(async () => {
    if (formatterSpec.inProgress)
      return null;

    const ecsql = `
      SELECT
        linearlyLocated.DistanceAlongFromStart DistanceAlong,
        (
          COALESCE(station.Station, alg.StartStation) + (
            linearlyLocated.DistanceAlongFromStart - COALESCE(
              stationAt.AtPosition.DistanceAlongFromStart,
              alg.StartValue,
              0
            )
          )
        ) StationValue
      FROM
        rralign.Alignment alg
      JOIN (
        SELECT
          along.TargetECInstanceId LinearElementId,
          fromTo.FromPosition.DistanceAlongFromStart DistanceAlongFromStart
        FROM
          lr.ILinearlyLocatedAlongILinearElement along
          JOIN lr.LinearlyReferencedFromToLocation fromTo ON along.SourceECInstanceId = fromTo.Element.Id
        WHERE
          fromTo.Element.Id = ?
      ) linearlyLocated ON alg.ECInstanceId = linearlyLocated.LinearElementId
      LEFT JOIN rralign.AlignmentStation station ON alg.ECInstanceId = station.Parent.Id
      LEFT JOIN lr.LinearlyReferencedAtLocation stationAt ON station.ECInstanceId = stationAt.Element.Id
      WHERE
        station.ECInstanceId IS NULL
        OR stationAt.AtPosition.DistanceAlongFromStart <= linearlyLocated.DistanceAlongFromStart
      ORDER BY
        stationAt.AtPosition.DistanceAlongFromStart DESC
      LIMIT
        1
    `;
    let queryResult: { distanceAlong: number, stationValue: number } | undefined;
    for await (const row of props.imodel.query(ecsql, (new QueryBinder()).bindId(1, props.elementId), { rowFormat: QueryRowFormat.UseECSqlPropertyIndexes })) {
      queryResult = {
        distanceAlong: row[0],
        stationValue: row[1],
      };
      break;
    }
    if (!queryResult)
      return "<no value>";

    if (!formatterSpec.value)
      return `Distance along: ${queryResult.distanceAlong}; \nStation value: ${queryResult.stationValue}`;

    return Formatter.formatQuantity(queryResult.stationValue, formatterSpec.value);
  }, [formatterSpec.inProgress, formatterSpec.value, props.imodel, props.elementId]));
}
