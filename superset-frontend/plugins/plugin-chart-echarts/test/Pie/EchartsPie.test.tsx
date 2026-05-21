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
import { render } from '@testing-library/react';
import EchartsPie from '../../src/Pie/EchartsPie';
import { PieChartTransformedProps } from '../../src/Pie/types';
import { EventHandlers } from '../../src/types';

// ---------------------------------------------------------------------------
// Capture slot — written by the Echart mock on each render.
// Prefixed with "mock" so jest.mock() hoisting allows it.
// ---------------------------------------------------------------------------
const mockCapturedProps: { eventHandlers?: EventHandlers } = {};

// ---------------------------------------------------------------------------
// Mock the heavy Echart wrapper so tests never touch ECharts DOM / Redux.
// Plain function component avoids React.forwardRef in the factory scope.
// ---------------------------------------------------------------------------
jest.mock('../../src/components/Echart', () => ({
  __esModule: true,
  // eslint-disable-next-line react/display-name
  default(props: any) {
    mockCapturedProps.eventHandlers = props.eventHandlers;
    return null;
  },
}));

// ---------------------------------------------------------------------------
// Minimal props factory — only the fields EchartsPie actually reads
// ---------------------------------------------------------------------------
function buildProps(
  overrides: Partial<PieChartTransformedProps> = {},
): PieChartTransformedProps {
  return {
    height: 400,
    width: 600,
    echartOptions: {},
    selectedValues: {},
    refs: {},
    formData: {
      colorScheme: 'bnbColors',
      datasource: '3__table',
      granularity_sqla: 'ds',
      metric: 'sum__num',
      groupby: [],
      viz_type: 'my_viz',
      donut: false,
      innerRadius: 30,
      labelLine: false,
      labelType: 'key' as any,
      labelTemplate: null,
      labelsOutside: true,
      numberFormat: 'SMART_NUMBER',
      outerRadius: 70,
      showLabels: true,
      showLabelsThreshold: 5,
      dateFormat: 'smart_date',
      roseType: null,
      thresholdForOther: 0,
      legendMargin: null,
      legendOrientation: 'top' as any,
      legendType: 'scroll' as any,
      showLegend: true,
    },
    groupby: [],
    labelMap: {},
    setDataMask: jest.fn(),
    emitCrossFilters: false,
    coltypeMapping: {},
    ...overrides,
  } as unknown as PieChartTransformedProps;
}

// ---------------------------------------------------------------------------
// Cycle 4: event handler wiring assertions
// ---------------------------------------------------------------------------
describe('EchartsPie — legend event handler wiring', () => {
  beforeEach(() => {
    mockCapturedProps.eventHandlers = undefined;
  });

  it('task 4.1 — passes legendselectchanged, legendselectall, legendinverseselect handlers to Echart wrapper', () => {
    render(<EchartsPie {...buildProps()} />);

    const { eventHandlers } = mockCapturedProps;
    expect(eventHandlers).toBeDefined();
    expect(eventHandlers).toHaveProperty('legendselectchanged');
    expect(eventHandlers).toHaveProperty('legendselectall');
    expect(eventHandlers).toHaveProperty('legendinverseselect');
  });

  it('task 4.2 — calls onLegendStateChanged with payload.selected when legendselectchanged fires', () => {
    const onLegendStateChanged = jest.fn();
    render(<EchartsPie {...buildProps({ onLegendStateChanged })} />);

    const { eventHandlers } = mockCapturedProps;
    expect(eventHandlers).toBeDefined();
    const selectedMap = { A: true, B: false };
    eventHandlers!.legendselectchanged({ selected: selectedMap });

    expect(onLegendStateChanged).toHaveBeenCalledTimes(1);
    expect(onLegendStateChanged).toHaveBeenCalledWith(selectedMap);
  });

  it('task 4.2b — calls onLegendStateChanged with payload.selected when legendselectall fires', () => {
    const onLegendStateChanged = jest.fn();
    render(<EchartsPie {...buildProps({ onLegendStateChanged })} />);

    const selectedMap = { A: true, B: true };
    mockCapturedProps.eventHandlers!.legendselectall({ selected: selectedMap });

    expect(onLegendStateChanged).toHaveBeenCalledWith(selectedMap);
  });

  it('task 4.2c — calls onLegendStateChanged with payload.selected when legendinverseselect fires', () => {
    const onLegendStateChanged = jest.fn();
    render(<EchartsPie {...buildProps({ onLegendStateChanged })} />);

    const selectedMap = { A: false, B: true };
    mockCapturedProps.eventHandlers!.legendinverseselect({
      selected: selectedMap,
    });

    expect(onLegendStateChanged).toHaveBeenCalledWith(selectedMap);
  });

  it('task 4.2d — does not throw when onLegendStateChanged is undefined and legend event fires', () => {
    render(<EchartsPie {...buildProps({ onLegendStateChanged: undefined })} />);

    expect(() => {
      mockCapturedProps.eventHandlers!.legendselectchanged({
        selected: { A: false },
      });
    }).not.toThrow();
  });
});
