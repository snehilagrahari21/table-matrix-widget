export interface DataEntry {
  key: string;
  value: string | number | null;
}

export interface Duration {
  id: string;
  label?: string;
  x?: number;
  xPeriod: string;
}

export interface TimeConfig {
  timezone: string;
  type: 'local' | 'fixed' | string;
  startTime: number | null;
  endTime: number | null;
  defaultDuration: string;
  allDurations: Duration[];
  defaultPeriodicity: 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export type WidgetEvent =
  | { type: 'TIME_CHANGE'; payload: { startTime: string; endTime: string; periodicity: string } }
  | { type: 'FILTER_CHANGE'; payload: Record<string, unknown> };

export type TextAlign = 'left' | 'center' | 'right';
export type NumberFormat = 'general' | 'number' | 'percent' | 'currency' | 'integer';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type BorderWidth = 1 | 2 | 3;

export interface CellBorderSide {
  enabled: boolean;
  color: string;        // CSS hex, default '#cccccc'
  style: BorderStyle;   // default 'solid'
  width: BorderWidth;   // default 1
}

export interface CellBorders {
  top: CellBorderSide;
  right: CellBorderSide;
  bottom: CellBorderSide;
  left: CellBorderSide;
}

export interface CellFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;           // default 13
  textAlign: TextAlign;       // default 'left'
  numberFormat: NumberFormat; // default 'general'
  textColor: string;          // CSS hex or '' (inherits)
  cellColor: string;          // CSS hex or '' (transparent)
  borders: CellBorders;
}

export interface CellData {
  value: string;
  format: CellFormat;
}

export interface TableWidgetUIConfig {
  title: string;
  rows: number;
  columns: number;
  freezeRows: number;
  freezeColumns: number;
  widgetWidth: number;
  widgetHeight: number;
  style: {
    card: { wrapInCard: boolean; bg: string };
  };
}

export interface TableWidgetEnvelope {
  _id: string;
  type: 'TableWidget';
  general: { title: string };
  timeConfig?: TimeConfig;
  uiConfig: TableWidgetUIConfig;
  dynamicBindingPathList: Array<{ key: string; topic: string }>;
}
