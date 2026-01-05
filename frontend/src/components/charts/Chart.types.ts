/**
 * Common chart component types
 */

export interface ChartData {
  dates: string[];
  values: number[];
}

export interface ChartProps {
  data: ChartData;
  title?: string;
  height?: number;
}

export interface MultiSeriesChartProps {
  series: {
    name: string;
    data: ChartData;
    color?: string;
  }[];
  title?: string;
  height?: number;
}
