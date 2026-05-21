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
  AnnotationSourceType,
  AnnotationStyle,
  AnnotationType,
  ChartProps,
  IntervalAnnotationLayer,
  supersetTheme,
  VizType,
} from '@superset-ui/core';
import {
  LegendOrientation,
  LegendType,
  EchartsTimeseriesSeriesType,
} from '../../src';
import transformProps from '../../src/MixedTimeseries/transformProps';
import {
  EchartsMixedTimeseriesFormData,
  EchartsMixedTimeseriesProps,
} from '../../src/MixedTimeseries/types';
import { OrientationType } from '../../src/Timeseries/types';

const formData: EchartsMixedTimeseriesFormData = {
  annotationLayers: [],
  area: false,
  areaB: false,
  legendMargin: null,
  logAxis: false,
  logAxisSecondary: false,
  markerEnabled: false,
  markerEnabledB: false,
  markerSize: 0,
  markerSizeB: 0,
  minorSplitLine: false,
  minorTicks: false,
  opacity: 0,
  opacityB: 0,
  orderDesc: false,
  orderDescB: false,
  richTooltip: false,
  rowLimit: 0,
  rowLimitB: 0,
  legendOrientation: LegendOrientation.Top,
  legendType: LegendType.Scroll,
  showLegend: false,
  showValue: false,
  showValueB: false,
  stack: true,
  stackB: true,
  truncateYAxis: false,
  truncateYAxisSecondary: false,
  xAxisLabelRotation: 0,
  xAxisTitle: '',
  xAxisTitleMargin: 0,
  yAxisBounds: [undefined, undefined],
  yAxisBoundsSecondary: [undefined, undefined],
  yAxisTitle: '',
  yAxisTitleMargin: 0,
  yAxisTitlePosition: '',
  yAxisTitleSecondary: '',
  zoomable: false,
  colorScheme: 'bnbColors',
  datasource: '3__table',
  x_axis: 'ds',
  metrics: ['sum__num'],
  metricsB: ['sum__num'],
  groupby: ['gender'],
  groupbyB: ['gender'],
  seriesType: EchartsTimeseriesSeriesType.Line,
  seriesTypeB: EchartsTimeseriesSeriesType.Bar,
  viz_type: VizType.MixedTimeseries,
  forecastEnabled: false,
  forecastPeriods: [],
  forecastInterval: 0,
  forecastSeasonalityDaily: 0,
};

const queriesData = [
  {
    data: [
      { boy: 1, girl: 2, ds: 599616000000 },
      { boy: 3, girl: 4, ds: 599916000000 },
    ],
    label_map: {
      ds: ['ds'],
      boy: ['boy'],
      girl: ['girl'],
    },
  },
  {
    data: [
      { boy: 1, girl: 2, ds: 599616000000 },
      { boy: 3, girl: 4, ds: 599916000000 },
    ],
    label_map: {
      ds: ['ds'],
      boy: ['boy'],
      girl: ['girl'],
    },
  },
];

const chartPropsConfig = {
  formData,
  width: 800,
  height: 600,
  queriesData,
  theme: supersetTheme,
};

it('should transform chart props for viz with showQueryIdentifiers=false', () => {
  const chartPropsConfigWithoutIdentifiers = {
    ...chartPropsConfig,
    formData: {
      ...formData,
      showQueryIdentifiers: false,
    },
  };
  const chartProps = new ChartProps(chartPropsConfigWithoutIdentifiers);
  const transformed = transformProps(chartProps as EchartsMixedTimeseriesProps);

  // Check that series IDs don't include query identifiers
  const seriesIds = (transformed.echartOptions.series as any[]).map(
    (s: any) => s.id,
  );
  expect(seriesIds).toContain('sum__num, girl');
  expect(seriesIds).toContain('sum__num, boy');
  expect(seriesIds).not.toContain('sum__num (Query A), girl');
  expect(seriesIds).not.toContain('sum__num (Query A), boy');
  expect(seriesIds).not.toContain('sum__num (Query B), girl');
  expect(seriesIds).not.toContain('sum__num (Query B), boy');

  // Check that series name include query identifiers
  const seriesName = (transformed.echartOptions.series as any[]).map(
    (s: any) => s.name,
  );
  expect(seriesName).toContain('sum__num, girl');
  expect(seriesName).toContain('sum__num, boy');
  expect(seriesName).not.toContain('sum__num (Query A), girl');
  expect(seriesName).not.toContain('sum__num (Query A), boy');
  expect(seriesName).not.toContain('sum__num (Query B), girl');
  expect(seriesName).not.toContain('sum__num (Query B), boy');

  expect((transformed.echartOptions.legend as any).data).toEqual([
    'sum__num, girl',
    'sum__num, boy',
    'sum__num, girl',
    'sum__num, boy',
  ]);
});

it('should transform chart props for viz with showQueryIdentifiers=true', () => {
  const chartPropsConfigWithIdentifiers = {
    ...chartPropsConfig,
    formData: {
      ...formData,
      showQueryIdentifiers: true,
    },
  };
  const chartProps = new ChartProps(chartPropsConfigWithIdentifiers);
  const transformed = transformProps(chartProps as EchartsMixedTimeseriesProps);

  // Check that series IDs include query identifiers
  const seriesIds = (transformed.echartOptions.series as any[]).map(
    (s: any) => s.id,
  );
  expect(seriesIds).toContain('sum__num (Query A), girl');
  expect(seriesIds).toContain('sum__num (Query A), boy');
  expect(seriesIds).toContain('sum__num (Query B), girl');
  expect(seriesIds).toContain('sum__num (Query B), boy');
  expect(seriesIds).not.toContain('sum__num, girl');
  expect(seriesIds).not.toContain('sum__num, boy');

  // Check that series name include query identifiers
  const seriesName = (transformed.echartOptions.series as any[]).map(
    (s: any) => s.name,
  );
  expect(seriesName).toContain('sum__num (Query A), girl');
  expect(seriesName).toContain('sum__num (Query A), boy');
  expect(seriesName).toContain('sum__num (Query B), girl');
  expect(seriesName).toContain('sum__num (Query B), boy');
  expect(seriesName).not.toContain('sum__num, girl');
  expect(seriesName).not.toContain('sum__num, boy');

  expect((transformed.echartOptions.legend as any).data).toEqual([
    'sum__num (Query A), girl',
    'sum__num (Query A), boy',
    'sum__num (Query B), girl',
    'sum__num (Query B), boy',
  ]);
});

it('legend margin: top orientation sets grid.top correctly', () => {
  const chartPropsConfigWithoutIdentifiers = {
    ...chartPropsConfig,
    formData: {
      ...formData,
      legendMargin: 250,
      showLegend: true,
    },
  };
  const chartProps = new ChartProps(chartPropsConfigWithoutIdentifiers);
  const transformed = transformProps(chartProps as EchartsMixedTimeseriesProps);

  expect((transformed.echartOptions.grid as any).top).toEqual(270);
});

it('legend margin: bottom orientation sets grid.bottom correctly', () => {
  const chartPropsConfigWithoutIdentifiers = {
    ...chartPropsConfig,
    formData: {
      ...formData,
      legendMargin: 250,
      showLegend: true,
      legendOrientation: LegendOrientation.Bottom,
    },
  };
  const chartProps = new ChartProps(chartPropsConfigWithoutIdentifiers);
  const transformed = transformProps(chartProps as EchartsMixedTimeseriesProps);

  expect((transformed.echartOptions.grid as any).bottom).toEqual(270);
});

it('legend margin: left orientation sets grid.left correctly', () => {
  const chartPropsConfigWithoutIdentifiers = {
    ...chartPropsConfig,
    formData: {
      ...formData,
      legendMargin: 250,
      showLegend: true,
      legendOrientation: LegendOrientation.Left,
    },
  };
  const chartProps = new ChartProps(chartPropsConfigWithoutIdentifiers);
  const transformed = transformProps(chartProps as EchartsMixedTimeseriesProps);

  expect((transformed.echartOptions.grid as any).left).toEqual(270);
});

it('legend margin: right orientation sets grid.right correctly', () => {
  const chartPropsConfigWithoutIdentifiers = {
    ...chartPropsConfig,
    formData: {
      ...formData,
      legendMargin: 270,
      showLegend: true,
      legendOrientation: LegendOrientation.Right,
    },
  };
  const chartProps = new ChartProps(chartPropsConfigWithoutIdentifiers);
  const transformed = transformProps(chartProps as EchartsMixedTimeseriesProps);

  expect((transformed.echartOptions.grid as any).right).toEqual(270);
});

// ---------------------------------------------------------------------------
// Cycle 1 — Vertical baseline regression (Scenarios 1 & 2)
// ---------------------------------------------------------------------------
describe('horizontal orientation', () => {
  it('Scenario 1: defaults to Vertical when orientation is omitted — xAxis is scalar, yAxis is length-2 array, no xAxisIndex on series', () => {
    // orientation field omitted entirely — DEFAULT_FORM_DATA must supply Vertical
    const chartProps = new ChartProps(chartPropsConfig);
    const transformed = transformProps(
      chartProps as EchartsMixedTimeseriesProps,
    );
    const opts = transformed.echartOptions as any;

    // xAxis must be a scalar object (not an array)
    expect(Array.isArray(opts.xAxis)).toBe(false);
    expect(typeof opts.xAxis).toBe('object');

    // yAxis must be a length-2 array
    expect(Array.isArray(opts.yAxis)).toBe(true);
    expect(opts.yAxis.length).toBe(2);

    // every series has yAxisIndex (not xAxisIndex)
    const allSeries: any[] = opts.series;
    allSeries.forEach((s: any) => {
      expect('yAxisIndex' in s || !('xAxisIndex' in s)).toBe(true);
      expect('xAxisIndex' in s).toBe(false);
    });
  });

  it('Scenario 2: explicit OrientationType.Vertical produces same axis structure as omitted orientation', () => {
    const defaultChartProps = new ChartProps(chartPropsConfig);
    const defaultTransformed = transformProps(
      defaultChartProps as EchartsMixedTimeseriesProps,
    );
    const defaultOpts = defaultTransformed.echartOptions as any;

    const verticalChartProps = new ChartProps({
      ...chartPropsConfig,
      formData: { ...formData, orientation: OrientationType.Vertical },
    });
    const verticalTransformed = transformProps(
      verticalChartProps as EchartsMixedTimeseriesProps,
    );
    const verticalOpts = verticalTransformed.echartOptions as any;

    // Both must have scalar xAxis
    expect(Array.isArray(verticalOpts.xAxis)).toBe(false);
    // Both must have length-2 yAxis
    expect(Array.isArray(verticalOpts.yAxis)).toBe(true);
    expect(verticalOpts.yAxis.length).toBe(2);

    // Axis type must match between default and explicit vertical
    expect(verticalOpts.xAxis.type).toEqual(defaultOpts.xAxis.type);
    expect(verticalOpts.yAxis[0].type).toEqual(defaultOpts.yAxis[0].type);
    expect(verticalOpts.yAxis[1].type).toEqual(defaultOpts.yAxis[1].type);
  });

  // ---------------------------------------------------------------------------
  // Cycle 2 — Axis swap structure (Scenarios 3, 4, 6)
  // ---------------------------------------------------------------------------
  it('Scenario 3: orientation=Horizontal swaps axes — yAxis is scalar category, xAxis is length-2 value array', () => {
    const chartProps = new ChartProps({
      ...chartPropsConfig,
      formData: { ...formData, orientation: OrientationType.Horizontal },
    });
    const transformed = transformProps(
      chartProps as EchartsMixedTimeseriesProps,
    );
    const opts = transformed.echartOptions as any;

    // xAxis must become a length-2 array
    expect(Array.isArray(opts.xAxis)).toBe(true);
    expect(opts.xAxis.length).toBe(2);

    // Both value axes
    expect(opts.xAxis[0].type).toBe('value');
    expect(opts.xAxis[1].type).toBe('value');

    // yAxis must become a scalar category axis
    expect(Array.isArray(opts.yAxis)).toBe(false);
    expect(opts.yAxis.type).toBe('category');
  });

  it('Scenario 4: xAxis[0].position="bottom" (primary) and xAxis[1].position="top" (secondary) in horizontal mode', () => {
    const chartProps = new ChartProps({
      ...chartPropsConfig,
      formData: { ...formData, orientation: OrientationType.Horizontal },
    });
    const transformed = transformProps(
      chartProps as EchartsMixedTimeseriesProps,
    );
    const opts = transformed.echartOptions as any;

    expect(opts.xAxis[0].position).toBe('bottom');
    expect(opts.xAxis[1].position).toBe('top');
    expect(opts.xAxis[0].position).not.toBe('left');
    expect(opts.xAxis[0].position).not.toBe('right');
    expect(opts.xAxis[1].position).not.toBe('left');
    expect(opts.xAxis[1].position).not.toBe('right');
  });

  it('Scenario 6: grid padding swaps — left wider than bottom in horizontal mode vs vertical baseline', () => {
    // Vertical baseline: legend on left to force non-trivial padding
    const verticalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        showLegend: true,
        legendOrientation: LegendOrientation.Left,
        legendMargin: 100,
      },
    });
    const verticalTransformed = transformProps(
      verticalProps as EchartsMixedTimeseriesProps,
    );
    const verticalGrid = (verticalTransformed.echartOptions as any).grid;

    const horizontalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        showLegend: true,
        legendOrientation: LegendOrientation.Left,
        legendMargin: 100,
      },
    });
    const horizontalTransformed = transformProps(
      horizontalProps as EchartsMixedTimeseriesProps,
    );
    const horizontalGrid = (horizontalTransformed.echartOptions as any).grid;

    // In horizontal mode, left and bottom padding values should be swapped
    // relative to the vertical baseline from the same getPadding call
    expect(horizontalGrid.left).toEqual(verticalGrid.bottom);
    expect(horizontalGrid.bottom).toEqual(verticalGrid.left);
  });

  // ---------------------------------------------------------------------------
  // Cycle 3 — Series axisIndex rename (Scenario 5)
  // ---------------------------------------------------------------------------
  it('Scenario 5: every series has xAxisIndex (not yAxisIndex) in horizontal mode', () => {
    const chartProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        // Explicitly set yAxisIndexB=1 so secondary series get index 1
        yAxisIndexB: 1,
      },
    });
    const transformed = transformProps(
      chartProps as EchartsMixedTimeseriesProps,
    );
    const opts = transformed.echartOptions as any;
    const allSeries: any[] = opts.series;

    // Every series must have xAxisIndex — not yAxisIndex
    allSeries.forEach((s: any) => {
      expect('xAxisIndex' in s).toBe(true);
      expect('yAxisIndex' in s).toBe(false);
      expect(s.xAxisIndex === 0 || s.xAxisIndex === 1).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Cycle 4 — Tooltip xValue index + label.position (Scenarios 8, 11)
  // ---------------------------------------------------------------------------
  it('Scenario 8: tooltip header contains category string (not numeric index) in horizontal mode', () => {
    // In horizontal mode value[0] is the numeric metric and value[1] is the
    // category label. The tooltip header must show value[1], not value[0].
    const chartProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        richTooltip: false,
      },
    });
    const transformed = transformProps(
      chartProps as EchartsMixedTimeseriesProps,
    );
    const tooltipFormatter = (transformed.echartOptions as any).tooltip
      .formatter;

    // Simulate an ECharts tooltip param where value[0]=numeric, value[1]=category
    const mockParam = {
      seriesId: 'sum__num, boy',
      seriesName: 'sum__num, boy',
      marker: '<span>●</span>',
      value: [42, 'Category A'],
    };
    const html: string = tooltipFormatter(mockParam);
    // The tooltip header (bold title span) must show the category string,
    // not the numeric value. We verify the bold header text contains the
    // category label. (The number 42 may appear in the table body as the
    // metric value — that is correct behavior and not a regression.)
    expect(html).toContain('Category A');
    // Confirm 'Category A' is in the bold header, not only in the body
    const headerMatch = html.match(
      /<span style="font-weight: 700[^"]*">([^<]*)<\/span>/,
    );
    expect(headerMatch?.[1]).toBe('Category A');
  });

  it('Scenario 11: bar series label.position is "right" in horizontal, "top" in vertical', () => {
    // Query A = Line (no label position requirement), Query B = Bar
    const verticalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        seriesTypeB: EchartsTimeseriesSeriesType.Bar,
        showValueB: true,
      },
    });
    const verticalTransformed = transformProps(
      verticalProps as EchartsMixedTimeseriesProps,
    );
    const verticalSeries: any[] = (verticalTransformed.echartOptions as any)
      .series;
    const verticalBarSeries = verticalSeries.find((s: any) => s.type === 'bar');
    expect(verticalBarSeries?.label?.position).toBe('top');

    const horizontalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        seriesTypeB: EchartsTimeseriesSeriesType.Bar,
        showValueB: true,
      },
    });
    const horizontalTransformed = transformProps(
      horizontalProps as EchartsMixedTimeseriesProps,
    );
    const horizontalSeries: any[] = (horizontalTransformed.echartOptions as any)
      .series;
    const horizontalBarSeries = horizontalSeries.find(
      (s: any) => s.type === 'bar',
    );
    expect(horizontalBarSeries?.label?.position).toBe('right');
  });

  // ---------------------------------------------------------------------------
  // Cycle 5 — Stacked + dataZoom + annotations (Scenarios 7, 10, 9)
  // ---------------------------------------------------------------------------
  it('Scenario 7: stacked horizontal — extractSeries receives isHorizontal and stacked bars have label.position right', () => {
    // Fixture: stack=true on both queries, showValue=true so label.position is set
    const chartProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        stack: true,
        stackB: true,
        showValue: true,
        showValueB: true,
        seriesType: EchartsTimeseriesSeriesType.Bar,
        seriesTypeB: EchartsTimeseriesSeriesType.Bar,
      },
    });
    const transformed = transformProps(
      chartProps as EchartsMixedTimeseriesProps,
    );
    const opts = transformed.echartOptions as any;

    // All bar series in horizontal mode must have label.position 'right'
    const barSeries: any[] = (opts.series as any[]).filter(
      (s: any) => s.type === 'bar',
    );
    expect(barSeries.length).toBeGreaterThan(0);
    barSeries.forEach((s: any) => {
      expect(s.label?.position).toBe('right');
    });
  });

  it('Scenario 10: dataZoom yAxisIndex=0 in horizontal mode; undefined in vertical', () => {
    const horizontalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        zoomable: true,
      },
    });
    const horizontalTransformed = transformProps(
      horizontalProps as EchartsMixedTimeseriesProps,
    );
    const horizontalDataZoom = (horizontalTransformed.echartOptions as any)
      .dataZoom;
    expect(Array.isArray(horizontalDataZoom)).toBe(true);
    expect(horizontalDataZoom.length).toBeGreaterThan(0);
    expect(horizontalDataZoom[0].yAxisIndex).toBe(0);

    const verticalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        zoomable: true,
      },
    });
    const verticalTransformed = transformProps(
      verticalProps as EchartsMixedTimeseriesProps,
    );
    const verticalDataZoom = (verticalTransformed.echartOptions as any)
      .dataZoom;
    expect(Array.isArray(verticalDataZoom)).toBe(true);
    expect(verticalDataZoom.length).toBeGreaterThan(0);
    expect(verticalDataZoom[0].yAxisIndex).toBeUndefined();
  });

  it('Scenario 9: interval annotation markArea bound to yAxis (not xAxis) in horizontal mode', () => {
    const intervalLayer: IntervalAnnotationLayer = {
      annotationType: AnnotationType.Interval,
      name: 'My Interval',
      show: true,
      showLabel: false,
      sourceType: AnnotationSourceType.Table,
      titleColumn: '',
      timeColumn: 'start',
      intervalEndColumn: 'end',
      descriptionColumns: [],
      style: AnnotationStyle.Dashed,
      value: 'interval-annotation-id',
    };
    const intervalAnnotationData = {
      'My Interval': {
        columns: ['start', 'end'],
        records: [{ start: 0, end: 1000 }],
      },
    };
    // annotation_data must be embedded in queriesData[0] — that is where
    // getAnnotationData() reads it from.
    const queriesDataWithAnnotation = [
      {
        ...queriesData[0],
        annotation_data: intervalAnnotationData,
      },
      queriesData[1],
    ];

    // Horizontal: markArea data items must use yAxis keys
    const horizontalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        orientation: OrientationType.Horizontal,
        annotationLayers: [intervalLayer],
      },
      queriesData: queriesDataWithAnnotation,
    });
    const horizontalTransformed = transformProps(
      horizontalProps as EchartsMixedTimeseriesProps,
    );
    const hSeries: any[] = horizontalTransformed.echartOptions.series as any[];
    const hIntervalSeries = hSeries.find(s =>
      String(s.id).startsWith('Interval'),
    );
    expect(hIntervalSeries).toBeDefined();
    const hMarkAreaData = hIntervalSeries.markArea?.data?.[0];
    expect(hMarkAreaData).toBeDefined();
    // In horizontal mode the mark uses yAxis, not xAxis
    expect('yAxis' in hMarkAreaData[0]).toBe(true);
    expect('xAxis' in hMarkAreaData[0]).toBe(false);

    // Vertical: markArea data items must use xAxis keys
    const verticalProps = new ChartProps({
      ...chartPropsConfig,
      formData: {
        ...formData,
        annotationLayers: [intervalLayer],
      },
      queriesData: queriesDataWithAnnotation,
    });
    const verticalTransformed = transformProps(
      verticalProps as EchartsMixedTimeseriesProps,
    );
    const vSeries: any[] = verticalTransformed.echartOptions.series as any[];
    const vIntervalSeries = vSeries.find(s =>
      String(s.id).startsWith('Interval'),
    );
    expect(vIntervalSeries).toBeDefined();
    const vMarkAreaData = vIntervalSeries.markArea?.data?.[0];
    expect(vMarkAreaData).toBeDefined();
    // In vertical mode the mark uses xAxis, not yAxis
    expect('xAxis' in vMarkAreaData[0]).toBe(true);
    expect('yAxis' in vMarkAreaData[0]).toBe(false);
  });
});
