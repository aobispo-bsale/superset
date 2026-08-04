/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  CategoricalColorNamespace,
  getColumnLabel,
  getMetricLabel,
  getNumberFormatter,
  getTimeFormatter,
  NumberFormats,
  ValueFormatter,
  getValueFormatter,
  t,
  tooltipHtml,
} from '@superset-ui/core';
import type { TreemapSeriesNodeItemOption } from 'echarts/types/src/chart/treemap/TreemapSeries';
import type { EChartsCoreOption } from 'echarts/core';
import type { TreemapSeriesOption } from 'echarts/charts';
import {
  DEFAULT_FORM_DATA as DEFAULT_TREEMAP_FORM_DATA,
  EchartsTreemapChartProps,
  EchartsTreemapFormData,
  EchartsTreemapLabelType,
  TreemapSeriesCallbackDataParams,
  TreemapTransformedProps,
} from './types';
import { formatSeriesName, getColtypesMapping } from '../utils/series';
import {
  COLOR_SATURATION,
  HIERARCHICAL_COLOR_SATURATION,
  BORDER_WIDTH,
  GAP_WIDTH,
  LABEL_FONTSIZE,
  extractTreePathInfo,
} from './constants';
import { OpacityEnum } from '../constants';
import { getDefaultTooltip } from '../utils/tooltip';
import { Refs } from '../types';
import { treeBuilder, TreeNode } from '../utils/treeBuilder';

export function formatLabel({
  params,
  labelType,
  numberFormatter,
}: {
  params: TreemapSeriesCallbackDataParams;
  labelType: EchartsTreemapLabelType;
  numberFormatter: ValueFormatter;
}): string {
  const { name = '', value } = params;
  const formattedValue = numberFormatter(value as number);

  switch (labelType) {
    case EchartsTreemapLabelType.Key:
      return name;
    case EchartsTreemapLabelType.Value:
      return formattedValue;
    case EchartsTreemapLabelType.KeyValue:
      return `${name}: ${formattedValue}`;
    default:
      return name;
  }
}

export function formatTooltip({
  params,
  numberFormatter,
}: {
  params: TreemapSeriesCallbackDataParams;
  numberFormatter: ValueFormatter;
}): string {
  const { value, treePathInfo = [] } = params;
  const formattedValue = numberFormatter(value as number);
  const { metricLabel, treePath } = extractTreePathInfo(treePathInfo);
  const percentFormatter = getNumberFormatter(NumberFormats.PERCENT_2_POINT);

  // treePathInfo[0] is the root wrapper (carries the global total),
  // the last index is the hovered node, the one before is its direct parent.
  const currentNode = treePathInfo[treePathInfo.length - 1];
  const parentNode = treePathInfo[treePathInfo.length - 2];
  const rootNode = treePathInfo[0];

  let formattedPercent = '';
  if (parentNode) {
    const percent: number = parentNode.value
      ? (currentNode.value as number) / (parentNode.value as number)
      : 0;
    formattedPercent = percentFormatter(percent);
  }

  let formattedGlobalPercent = '';
  if (rootNode && rootNode.value) {
    const globalPercent =
      (currentNode.value as number) / (rootNode.value as number);
    formattedGlobalPercent = percentFormatter(globalPercent);
  }

  const primaryRow = [metricLabel, formattedValue];
  if (formattedPercent) {
    primaryRow.push(formattedPercent);
  }
  const rows: string[][] = [primaryRow];
  if (formattedGlobalPercent) {
    // empty middle cell aligns the global percent under the parent percent.
    rows.push([t('% del total'), '', formattedGlobalPercent]);
  }
  return tooltipHtml(rows, treePath.join(' ▸ '));
}

export default function transformProps(
  chartProps: EchartsTreemapChartProps,
): TreemapTransformedProps {
  const {
    formData,
    height,
    queriesData,
    width,
    hooks,
    filterState,
    theme,
    inContextMenu,
    emitCrossFilters,
    datasource,
  } = chartProps;
  const { data = [] } = queriesData[0];
  const { columnFormats = {}, currencyFormats = {} } = datasource;
  const { setDataMask = () => {}, onContextMenu } = hooks;
  const coltypeMapping = getColtypesMapping(queriesData[0]);
  const BORDER_COLOR = theme.colorBgBase;

  const {
    colorScheme,
    groupby = [],
    metric = '',
    labelType,
    labelPosition,
    numberFormat,
    currencyFormat,
    dateFormat,
    showLabels,
    showUpperLabels,
    hierarchicalColor,
    dashboardId,
    sliceId,
  }: EchartsTreemapFormData = {
    ...DEFAULT_TREEMAP_FORM_DATA,
    ...formData,
  };
  const refs: Refs = {};
  const colorFn = CategoricalColorNamespace.getScale(colorScheme as string);
  const numberFormatter = getValueFormatter(
    metric,
    currencyFormats,
    columnFormats,
    numberFormat,
    currencyFormat,
  );

  const formatter = (params: TreemapSeriesCallbackDataParams) =>
    formatLabel({
      params,
      numberFormatter,
      labelType,
    });

  const columnsLabelMap = new Map<string, string[]>();
  const metricLabel = getMetricLabel(metric);
  const groupbyLabels = groupby.map(getColumnLabel);
  const treeData = treeBuilder(data, groupbyLabels, metricLabel);
  // No `borderColor`/`borderWidth` here: on an ECharts label those draw a box
  // around the text, not a stroke on the glyphs (that would be
  // `textBorderColor`/`textBorderWidth`). Painted with the theme background,
  // that box rendered as a 1px hairline cutting across tiles — white in light
  // theme, near-black in dark — and it landed on fractional coordinates, so it
  // moved or vanished with any layout change, which made it look like a
  // rasterisation artifact. Introduced upstream in Superset 6.0.0; 4.1.x had no
  // label border and no hairline.
  const labelProps = {
    color: theme.colorText,
  };
  const traverse = (treeNodes: TreeNode[], path: string[], depth = 0) =>
    treeNodes.map(treeNode => {
      const { name: nodeName, value, groupBy } = treeNode;
      const name = formatSeriesName(nodeName, {
        timeFormatter: getTimeFormatter(dateFormat),
        ...(coltypeMapping[groupBy] && {
          coltype: coltypeMapping[groupBy],
        }),
      });
      const newPath = path.concat(name);
      // When hierarchicalColor is on, only top-level nodes (depth === 0)
      // carry an explicit color from the scheme — deeper nodes omit `color`
      // so ECharts inherits the parent hue and varies saturation per item.
      const assignOwnColor = !hierarchicalColor || depth === 0;
      let item: TreemapSeriesNodeItemOption = {
        name,
        value,
        colorSaturation: hierarchicalColor
          ? HIERARCHICAL_COLOR_SATURATION
          : COLOR_SATURATION,
        itemStyle: {
          borderColor: BORDER_COLOR,
          ...(assignOwnColor && { color: colorFn(name, sliceId) }),
          borderWidth: BORDER_WIDTH,
          gapWidth: GAP_WIDTH,
        },
      };
      if (treeNode.children?.length) {
        item = {
          ...item,
          children: traverse(treeNode.children, newPath, depth + 1),
        };
      } else {
        const joinedName = newPath.join(',');
        // map(joined_name: [columnLabel_1, columnLabel_2, ...])
        columnsLabelMap.set(joinedName, newPath);
        if (
          filterState.selectedValues &&
          !filterState.selectedValues.includes(joinedName)
        ) {
          item = {
            ...item,
            itemStyle: {
              colorAlpha: OpacityEnum.SemiTransparent,
              color: theme.colorText,
              borderColor: theme.colorBgBase,
              borderWidth: 2,
            },
            label: {
              ...labelProps,
            },
          };
        }
      }
      return item;
    });

  const transformedData: TreemapSeriesNodeItemOption[] = [
    {
      name: metricLabel,
      colorSaturation: COLOR_SATURATION,
      itemStyle: {
        borderColor: BORDER_COLOR,
        color: colorFn(`${metricLabel}`, sliceId),
        borderWidth: BORDER_WIDTH,
        gapWidth: GAP_WIDTH,
      },
      upperLabel: {
        show: false,
      },
      children: traverse(treeData, []),
    },
  ];

  // set a default color when metric values are 0 over all.
  const levels = [
    {
      upperLabel: {
        show: false,
      },
      label: {
        show: false,
      },
      itemStyle: {
        color: theme.colorPrimary,
      },
    },
  ];

  const series: TreemapSeriesOption[] = [
    {
      type: 'treemap',
      width: '100%',
      height: '100%',
      nodeClick: undefined,
      roam: !dashboardId,
      breadcrumb: {
        show: false,
        emptyItemWidth: 25,
      },
      emphasis: {
        label: {
          ...labelProps,
          show: true,
        },
      },
      levels,
      label: {
        ...labelProps,
        show: showLabels,
        position: labelPosition,
        formatter,
        fontSize: LABEL_FONTSIZE,
      },
      upperLabel: {
        ...labelProps,
        show: showUpperLabels,
        formatter,
        textBorderColor: 'transparent',
        fontSize: LABEL_FONTSIZE,
      },
      data: transformedData,
    },
  ];

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      ...getDefaultTooltip(refs),
      show: !inContextMenu,
      trigger: 'item',
      formatter: (params: any) =>
        formatTooltip({
          params,
          numberFormatter,
        }),
    },
    series,
  };
  return {
    formData,
    width,
    height,
    echartOptions,
    setDataMask,
    emitCrossFilters,
    labelMap: Object.fromEntries(columnsLabelMap),
    groupby,
    selectedValues: filterState.selectedValues || [],
    onContextMenu,
    refs,
    coltypeMapping,
  };
}
