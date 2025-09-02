/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { PropertyRecord } from "@itwin/appui-abstract";
import { IPropertyValueRenderer, PropertyValueRendererContext, PropertyValueRendererManager, useDebouncedAsyncValue } from "@itwin/components-react";
import { Id64String } from "@itwin/core-bentley";
import { ECSqlReader, QueryBinder, QueryRowFormat } from "@itwin/core-common";
import { IModelConnection } from "@itwin/core-frontend";
import { Format, Formatter, FormatterSpec } from "@itwin/core-quantity";
import { ECVersion, SchemaContext, Format as SchemaFormat, SchemaKey, SchemaUnitProvider } from "@itwin/ecschema-metadata";
import { ECSchemaRpcLocater } from "@itwin/ecschema-rpcinterface-common";
import { Text } from "@itwin/itwinui-react";
import { KeySet } from "@itwin/presentation-common";
import { useUnifiedSelectionContext } from "@itwin/presentation-components";
import { Presentation } from "@itwin/presentation-frontend";

type StationValueType = "from" | "to" | "at";

export function registerStationPropertyFeature() {
  Presentation.registerInitializationHandler(async (): Promise<() => void> => {
    const customRenderers: Array<{ name: string; renderer: IPropertyValueRenderer }> = [
      { name: "AtStation", renderer: new StationPropertyValueRenderer("at") },
      { name: "FromStation", renderer: new StationPropertyValueRenderer("from") },
      { name: "ToStation", renderer: new StationPropertyValueRenderer("to") },
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
}

/**
 * Property value renderer for STATION values.
 * @alpha
 */
export class StationPropertyValueRenderer implements IPropertyValueRenderer {
  public constructor(private _type: StationValueType) {}

  public canRender(record: PropertyRecord) {
    return ["AtStation", "FromStation", "ToStation"].some((rendererName) => rendererName === record.property.renderer?.name);
  }

  public render(_record: PropertyRecord, context?: PropertyValueRendererContext) {
    return <StationPropertyValueRendererImpl context={context} type={this._type} />;
  }
}

function StationPropertyValueRendererImpl(props: { type: StationValueType; context?: PropertyValueRendererContext }) {
  const { imodel, elementIds, inProgress: elementIdsInProgress } = useIModelSelectedElementIds();
  const { value, inProgress: valueInProgress } = useComputedStationValue({ imodel, elementId: elementIds ? elementIds[0] : undefined, type: props.type });

  if (elementIdsInProgress || valueInProgress) {
    return <StationValueSkeleton />;
  }

  return (
    <Text style={props.context?.style} title={value ?? ""}>
      {value}
    </Text>
  );
}

const sampleValues = ["0+0", "1+1.23", "3+616.55", "13+416.59"];
function StationValueSkeleton() {
  const sampleValue = React.useMemo(() => sampleValues[Math.round(Math.random() * (sampleValues.length - 1))], []);
  return (
    <Text isSkeleton={true} title="Loading...">
      {sampleValue}
    </Text>
  );
}

function useIModelSelectedElementIds() {
  // Ideally, we's like to get element id a the raw property value for this renderer. Sadly, that's
  // currently not possible, so we use unified selection context.
  const selectionContext = useUnifiedSelectionContext();
  // The context changes on every selection, but we don't want to re-load property value on selection
  // change. Instead, we want to reload it only when the component is re-mounted (generally, when property
  // grid reloads due to selection change).
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const selectionContextOnce = React.useMemo(() => selectionContext, []);
  const elementIds = useDebouncedAsyncValue(
    React.useCallback(async () => {
      if (!selectionContextOnce) {
        // eslint-disable-next-line no-console
        console.error("UnifiedSelectionContext is not available.");
        return undefined;
      }

      const res = await Presentation.presentation.getContentInstanceKeys({
        imodel: selectionContextOnce.imodel,
        keys: new KeySet(selectionContextOnce.getSelection()),
        rulesetOrId: {
          id: "selected-elements",
          rules: [
            {
              ruleType: "Content",
              specifications: [
                {
                  specType: "SelectedNodeInstances",
                  acceptableSchemaName: "BisCore",
                  acceptableClassNames: ["Element"],
                  acceptablePolymorphically: true,
                },
              ],
            },
          ],
        },
      });

      const ids = new Array<Id64String>();
      for await (const key of res.items()) {
        ids.push(key.id);
      }
      return ids;
    }, [selectionContextOnce]),
  );
  return {
    imodel: selectionContext?.imodel,
    inProgress: elementIds.inProgress,
    elementIds: elementIds.value,
  };
}

function useComputedStationValue(props: { imodel?: IModelConnection; elementId?: Id64String; type: StationValueType }) {
  const { schemas, units } = React.useMemo(() => {
    // note: the schema context should be stored way above in the components hierarchy to avoid re-creating it on
    // each property load
    const ctx = new SchemaContext();
    if (props.imodel) {
      ctx.addLocater(new ECSchemaRpcLocater(props.imodel.getRpcProps()));
    }
    const unitsProvider = new SchemaUnitProvider(ctx);
    return { schemas: ctx, units: unitsProvider };
  }, [props.imodel]);

  const formatterSpec = useDebouncedAsyncValue(
    React.useCallback(async () => {
      const persistenceUnit = await units.findUnitByName("Units:M");
      const formatsSchema = await schemas.getSchema(new SchemaKey("Formats", new ECVersion(1)));
      if (!formatsSchema) {
        // eslint-disable-next-line no-console
        console.error(`Failed to find "Formats" schema.`);
        return undefined;
      }
      const schemaFormat = await formatsSchema.getItem<SchemaFormat>("StationZ_1000_3");
      if (!schemaFormat) {
        // eslint-disable-next-line no-console
        console.error(`Failed to find the "StationZ_1000_3" format in "Formats" schema.`);
        return undefined;
      }
      return FormatterSpec.create("", await Format.createFromJSON("", units, schemaFormat.toJSON()), units, persistenceUnit);
    }, [schemas, units]),
  );

  const displayValue = useDebouncedAsyncValue(
    React.useCallback(async () => {
      if (!props.imodel || !props.elementId || formatterSpec.inProgress) {
        return undefined;
      }

      const queryReader = createStationValueReader(props.imodel, props.elementId, props.type);
      if (!(await queryReader.step())) {
        return "";
      }

      const distanceAlong = queryReader.current[0];
      const stationValue = queryReader.current[1];
      return formatterSpec.value
        ? Formatter.formatQuantity(stationValue, formatterSpec.value)
        : `Distance along: ${distanceAlong}; \nStation value: ${stationValue}`;
    }, [formatterSpec.inProgress, formatterSpec.value, props.imodel, props.elementId, props.type]),
  );

  return {
    inProgress: formatterSpec.inProgress || displayValue.inProgress,
    value: displayValue.value,
  };
}

function createStationValueReader(imodel: IModelConnection, elementId: Id64String, type: StationValueType): ECSqlReader {
  function createLinearlyLocatedQuery() {
    switch (type) {
      case "at":
        return `
          SELECT
            COALESCE(lrOnObj.LinearElementId, lrOnSisterObj.LinearElementId) LinearElementId,
            COALESCE(lrOnObj.DistanceAlongFromStart, lrOnSisterObj.DistanceAlongFromStart) DistanceAlongFromStart
          FROM (
            SELECT
              along.TargetECInstanceId LinearElementId,
              at.AtPosition.DistanceAlongFromStart DistanceAlongFromStart
            FROM lr.ILinearlyLocatedAlongILinearElement along
            JOIN lr.LinearlyReferencedAtLocation at ON along.SourceECInstanceId = at.Element.Id
            WHERE along.SourceECInstanceId = :elementId
          ) lrOnObj
          FULL JOIN (
            SELECT
              along.TargetECInstanceId LinearElementId,
              at.AtPosition.DistanceAlongFromStart DistanceAlongFromStart
            FROM lr.ILinearlyLocatedAlongILinearElement along
            JOIN lr.LinearlyReferencedAtLocation at ON along.SourceECInstanceId = at.Element.Id
            JOIN lr.ILinearLocationLocatesElement locates ON locates.SourceECInstanceId = along.SourceECInstanceId
            WHERE locates.TargetECInstanceId = :elementId
          ) lrOnSisterObj ON lrOnObj.LinearElementId = lrOnSisterObj.LinearElementId
          LIMIT 1
        `;
      case "from":
        return `
          SELECT
            COALESCE(lrOnObj.LinearElementId, lrOnSisterObj.LinearElementId) LinearElementId,
            COALESCE(lrOnObj.DistanceAlongFromStart, lrOnSisterObj.DistanceAlongFromStart) DistanceAlongFromStart
          FROM (
            SELECT
              along.TargetECInstanceId LinearElementId,
              fromTo.FromPosition.DistanceAlongFromStart DistanceAlongFromStart
            FROM lr.ILinearlyLocatedAlongILinearElement along
            JOIN lr.LinearlyReferencedFromToLocation fromTo ON along.SourceECInstanceId = fromTo.Element.Id
            WHERE along.SourceECInstanceId = :elementId
          ) lrOnObj
          FULL JOIN (
            SELECT
              along.TargetECInstanceId LinearElementId,
              fromTo.FromPosition.DistanceAlongFromStart DistanceAlongFromStart
            FROM lr.ILinearlyLocatedAlongILinearElement along
            JOIN lr.LinearlyReferencedFromToLocation fromTo ON along.SourceECInstanceId = fromTo.Element.Id
            JOIN lr.ILinearLocationLocatesElement locates ON locates.SourceECInstanceId = along.SourceECInstanceId
            WHERE locates.TargetECInstanceId = :elementId
          ) lrOnSisterObj ON lrOnObj.LinearElementId = lrOnSisterObj.LinearElementId
          LIMIT 1
        `;
      case "to":
        return `
          SELECT
            COALESCE(lrOnObj.LinearElementId, lrOnSisterObj.LinearElementId) LinearElementId,
            COALESCE(lrOnObj.DistanceAlongFromStart, lrOnSisterObj.DistanceAlongFromStart) DistanceAlongFromStart
          FROM (
            SELECT
              along.TargetECInstanceId LinearElementId,
              fromTo.ToPosition.DistanceAlongFromStart DistanceAlongFromStart
            FROM lr.ILinearlyLocatedAlongILinearElement along
            JOIN lr.LinearlyReferencedFromToLocation fromTo ON along.SourceECInstanceId = fromTo.Element.Id
            WHERE along.SourceECInstanceId = :elementId
          ) lrOnObj
          FULL JOIN (
            SELECT
              along.TargetECInstanceId LinearElementId,
              fromTo.ToPosition.DistanceAlongFromStart DistanceAlongFromStart
            FROM lr.ILinearlyLocatedAlongILinearElement along
            JOIN lr.LinearlyReferencedFromToLocation fromTo ON along.SourceECInstanceId = fromTo.Element.Id
            JOIN lr.ILinearLocationLocatesElement locates ON locates.SourceECInstanceId = along.SourceECInstanceId
            WHERE locates.TargetECInstanceId = :elementId
          ) lrOnSisterObj ON lrOnObj.LinearElementId = lrOnSisterObj.LinearElementId
          LIMIT 1
        `;
    }
  }

  // cspell:disable
  const ecsql = `
    SELECT
      linearlyLocated.DistanceAlongFromStart DistanceAlong,
      COALESCE(station.Station, alg.StartStation) + (linearlyLocated.DistanceAlongFromStart - COALESCE(stationAt.AtPosition.DistanceAlongFromStart, alg.StartValue, 0)) StationValue
    FROM rralign.Alignment alg
    JOIN (${createLinearlyLocatedQuery()}) linearlyLocated ON alg.ECInstanceId = linearlyLocated.LinearElementId
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
  // cspell:enable
  const bindings = new QueryBinder().bindId("elementId", elementId);
  return imodel.createQueryReader(ecsql, bindings, { rowFormat: QueryRowFormat.UseECSqlPropertyIndexes });
}
