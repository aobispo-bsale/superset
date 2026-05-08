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
import { ChartProps, supersetTheme } from '@superset-ui/core';
import transformProps, {
  parseNodeOrder,
} from '../../src/Sankey/transformProps';
import { SankeyChartProps, SankeyFormData } from '../../src/Sankey/types';

describe('parseNodeOrder', () => {
  it('returns empty Map for undefined input', () => {
    expect(parseNodeOrder(undefined).size).toBe(0);
  });

  it('returns empty Map for empty string', () => {
    expect(parseNodeOrder('').size).toBe(0);
  });

  it('returns empty Map for whitespace-only string', () => {
    expect(parseNodeOrder('   \n  ').size).toBe(0);
  });

  it('parses comma-separated names with positions', () => {
    const result = parseNodeOrder('Lead,Demo,Cotizado');
    expect(Array.from(result.entries())).toEqual([
      ['Lead', 0],
      ['Demo', 1],
      ['Cotizado', 2],
    ]);
  });

  it('trims whitespace around each entry', () => {
    const result = parseNodeOrder('  Lead , Demo  ,  Cotizado ');
    expect(Array.from(result.entries())).toEqual([
      ['Lead', 0],
      ['Demo', 1],
      ['Cotizado', 2],
    ]);
  });

  it('preserves first occurrence of duplicates', () => {
    const result = parseNodeOrder('Lead,Demo,Lead,Cotizado');
    expect(Array.from(result.entries())).toEqual([
      ['Lead', 0],
      ['Demo', 1],
      ['Cotizado', 2],
    ]);
  });

  it('filters empty entries from trailing commas', () => {
    expect(parseNodeOrder('Lead,,Demo,').size).toBe(2);
  });
});

describe('Sankey transformProps', () => {
  const baseFormData: SankeyFormData = {
    colorScheme: 'bnbColors',
    datasource: '1__table',
    metric: 'sum__num',
    source: 'src_col',
    target: 'tgt_col',
    viz_type: 'sankey_v2',
  } as SankeyFormData;

  const baseQueriesData = [
    {
      data: [
        { src_col: 'Lead', tgt_col: 'Demo', sum__num: 10 },
        { src_col: 'Demo', tgt_col: 'Cotizado', sum__num: 5 },
      ],
    },
  ];

  const buildChartProps = (
    overrides: Partial<SankeyFormData> = {},
  ): SankeyChartProps =>
    new ChartProps({
      formData: { ...baseFormData, ...overrides },
      width: 800,
      height: 600,
      queriesData: baseQueriesData,
      theme: supersetTheme,
      hooks: {},
    }) as SankeyChartProps;

  it('omits nodeSort when nodeOrder is missing (backward compatibility)', () => {
    const result = transformProps(buildChartProps());
    const { series } = result.echartOptions as any;
    expect(series.nodeSort).toBeUndefined();
  });

  it('omits nodeSort when nodeOrder is empty string', () => {
    const result = transformProps(buildChartProps({ nodeOrder: '' }));
    const { series } = result.echartOptions as any;
    expect(series.nodeSort).toBeUndefined();
  });

  it('applies nodeSort respecting custom order when nodeOrder is set', () => {
    const result = transformProps(
      buildChartProps({ nodeOrder: 'Cotizado,Demo,Lead' }),
    );
    const { series } = result.echartOptions as any;
    expect(series.nodeSort).toBeInstanceOf(Function);

    const sorter = series.nodeSort as (a: any, b: any) => number;
    expect(sorter({ name: 'Cotizado' }, { name: 'Lead' })).toBeLessThan(0);
    expect(sorter({ name: 'Lead' }, { name: 'Demo' })).toBeGreaterThan(0);
  });

  it('sends unlisted nodes to the end via Infinity fallback', () => {
    const result = transformProps(buildChartProps({ nodeOrder: 'Lead,Demo' }));
    const { series } = result.echartOptions as any;
    const sorter = series.nodeSort as (a: any, b: any) => number;

    expect(sorter({ name: 'Perdido' }, { name: 'Lead' })).toBeGreaterThan(0);
    expect(sorter({ name: 'Demo' }, { name: 'Perdido' })).toBeLessThan(0);
  });

  it('treats whitespace-only nodeOrder as no order applied', () => {
    const result = transformProps(buildChartProps({ nodeOrder: '   ,  ,  ' }));
    const { series } = result.echartOptions as any;
    expect(series.nodeSort).toBeUndefined();
  });
});
