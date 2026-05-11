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
