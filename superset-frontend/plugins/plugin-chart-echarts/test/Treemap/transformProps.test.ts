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
  ChartProps,
  getNumberFormatter,
  NumberFormats,
  supersetTheme,
} from '@superset-ui/core';
import { EchartsTreemapChartProps } from '../../src/Treemap/types';
import transformProps, {
  formatTooltip,
} from '../../src/Treemap/transformProps';

describe('Treemap transformProps', () => {
  const formData = {
    colorScheme: 'bnbColors',
    datasource: '3__table',
    granularity_sqla: 'ds',
    metric: 'sum__num',
    groupby: ['foo', 'bar'],
  };
  const chartProps = new ChartProps({
    formData,
    width: 800,
    height: 600,
    queriesData: [
      {
        data: [
          { foo: 'Sylvester', bar: 'bar1', sum__num: 10 },
          { foo: 'Arnold', bar: 'bar2', sum__num: 2.5 },
        ],
      },
    ],
    theme: supersetTheme,
  });

  it('should transform chart props for viz', () => {
    expect(transformProps(chartProps as EchartsTreemapChartProps)).toEqual(
      expect.objectContaining({
        width: 800,
        height: 600,
        echartOptions: expect.objectContaining({
          series: [
            expect.objectContaining({
              data: expect.arrayContaining([
                expect.objectContaining({
                  name: 'sum__num',
                  children: expect.arrayContaining([
                    expect.objectContaining({
                      name: 'Sylvester',
                      children: expect.arrayContaining([
                        expect.objectContaining({
                          name: 'bar1',
                          value: 10,
                        }),
                      ]),
                    }),
                  ]),
                }),
              ]),
            }),
          ],
        }),
      }),
    );
  });
});

describe('Treemap formatTooltip', () => {
  const numberFormatter = getNumberFormatter(NumberFormats.SMART_NUMBER);

  // simulate ECharts' treePathInfo: index 0 is the root wrapper (whose
  // value is the global total), intermediate indices are parent groups,
  // and the last index is the node currently being hovered.
  const buildParams = (
    treePathInfo: { name: string; value: number }[],
  ): any => ({
    value: treePathInfo[treePathInfo.length - 1].value,
    treePathInfo,
  });

  it('shows the global percentage alongside the parent percentage on a nested node', () => {
    const params = buildParams([
      { name: 'count(*)', value: 1000 }, // root / global total
      { name: 'Alimentos y bebidas', value: 330 }, // parent industry
      { name: 'Minimarket', value: 75 }, // hovered segment
    ]);

    const html = formatTooltip({ params, numberFormatter });

    expect(html).toContain('Alimentos y bebidas');
    expect(html).toContain('Minimarket');
    // 75 / 330 ≈ 22.73% (parent industry)
    expect(html).toContain('22.73%');
    // 75 / 1000 = 7.50% (global total)
    expect(html).toContain('7.50%');
    expect(html).toContain('% del total');
  });

  it('still renders the global percentage row on top-level nodes (parent === root)', () => {
    const params = buildParams([
      { name: 'count(*)', value: 1000 },
      { name: 'Alimentos y bebidas', value: 330 }, // hovered industry — its parent IS the root
    ]);

    const html = formatTooltip({ params, numberFormatter });

    expect(html).toContain('Alimentos y bebidas');
    expect(html).toContain('% del total');
    // both percents are 330/1000 = 33.00% — must appear twice (parent row + global row)
    const matches = html.match(/33\.00%/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('omits the global percentage row when the root total is zero', () => {
    const params = buildParams([
      { name: 'count(*)', value: 0 },
      { name: 'Empty group', value: 0 },
    ]);

    const html = formatTooltip({ params, numberFormatter });

    expect(html).not.toContain('% del total');
  });
});

describe('Treemap hierarchical color', () => {
  const baseData = [
    { foo: 'IndustriaA', bar: 'segA1', sum__num: 10 },
    { foo: 'IndustriaA', bar: 'segA2', sum__num: 5 },
    { foo: 'IndustriaB', bar: 'segB1', sum__num: 3 },
  ];
  const baseFormData = {
    colorScheme: 'bnbColors',
    datasource: '3__table',
    granularity_sqla: 'ds',
    metric: 'sum__num',
    groupby: ['foo', 'bar'],
  };

  const buildChartProps = (overrides: Record<string, unknown> = {}) =>
    new ChartProps({
      formData: { ...baseFormData, ...overrides },
      width: 800,
      height: 600,
      queriesData: [{ data: baseData }],
      theme: supersetTheme,
    }) as EchartsTreemapChartProps;

  // Drill into the rendered tree: ECharts data[0] is the metric-label root
  // wrapper; its `children` are the top-level groupby nodes (the industries),
  // and their `children` are the leaves (the segments).
  const getNodes = (chartProps: EchartsTreemapChartProps) => {
    const result = transformProps(chartProps);
    const series = (result.echartOptions as any).series[0];
    const root = series.data[0];
    const topLevel = root.children ?? [];
    const leaves = topLevel.flatMap((n: any) => n.children ?? []);
    return { topLevel, leaves };
  };

  it('default (hierarchical_color off): every node carries its own color', () => {
    const { topLevel, leaves } = getNodes(buildChartProps());

    expect(topLevel.length).toBeGreaterThan(0);
    expect(leaves.length).toBeGreaterThan(0);
    expect(topLevel.every((n: any) => n.itemStyle?.color)).toBe(true);
    expect(leaves.every((n: any) => n.itemStyle?.color)).toBe(true);
  });

  it('on: top-level nodes get colors, leaves omit color so ECharts inherits from parent', () => {
    const { topLevel, leaves } = getNodes(
      buildChartProps({ hierarchicalColor: true }),
    );

    expect(topLevel.length).toBeGreaterThan(0);
    expect(leaves.length).toBeGreaterThan(0);
    // top-level nodes still receive a color from the scheme
    expect(topLevel.every((n: any) => n.itemStyle?.color)).toBe(true);
    // leaves intentionally omit color so ECharts inherits from the parent
    expect(leaves.every((n: any) => n.itemStyle?.color === undefined)).toBe(
      true,
    );
    // wider saturation range applied everywhere to make the variation visible
    expect(topLevel.every((n: any) => n.colorSaturation[0] === 0.3)).toBe(true);
    expect(leaves.every((n: any) => n.colorSaturation[1] === 0.9)).toBe(true);
  });

  it('on with single groupby level: top-level nodes still receive a color (no breakage)', () => {
    const { topLevel, leaves } = getNodes(
      buildChartProps({ hierarchicalColor: true, groupby: ['foo'] }),
    );

    expect(topLevel.length).toBeGreaterThan(0);
    expect(leaves.length).toBe(0);
    expect(topLevel.every((n: any) => n.itemStyle?.color)).toBe(true);
  });
});
