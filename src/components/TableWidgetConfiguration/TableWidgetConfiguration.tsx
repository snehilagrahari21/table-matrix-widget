import { useState, useEffect } from 'react';
import { TextInput, CounterInput } from '@faclon-labs/design-sdk';
import { TableWidgetEnvelope, TableWidgetUIConfig } from '../../iosense-sdk/types';
import './TableWidgetConfiguration.css';

interface TableWidgetConfigurationProps {
  config: TableWidgetEnvelope | undefined;
  authentication?: string;
  onChange: (config: TableWidgetEnvelope) => void;
}

const VARIABLE_REGEX = /^\{\{(.+)\}\}$/;

function buildDynamicBindingPathList(uiConfig: unknown): Array<{ key: string; topic: string }> {
  const paths: Array<{ key: string; topic: string }> = [];

  function walk(obj: unknown, currentPath: string): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string') {
      const match = VARIABLE_REGEX.exec(obj.trim());
      if (match) paths.push({ key: currentPath, topic: match[1] });
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => walk(item, `${currentPath}[${index}]`));
      return;
    }
    if (typeof obj === 'object') {
      Object.entries(obj as Record<string, unknown>).forEach(([key, val]) => {
        walk(val, currentPath ? `${currentPath}.${key}` : key);
      });
    }
  }

  walk(uiConfig, '');
  return paths;
}

function buildEnvelope(
  existing: TableWidgetEnvelope | undefined,
  uiConfig: TableWidgetUIConfig,
  title: string,
): TableWidgetEnvelope {
  return {
    _id: existing?._id ?? `widget_${Date.now()}`,
    type: 'TableWidget',
    general: { title },
    uiConfig,
    dynamicBindingPathList: buildDynamicBindingPathList(uiConfig),
  };
}

export function TableWidgetConfiguration({
  config,
  onChange,
}: TableWidgetConfigurationProps) {
  const [title, setTitle] = useState<string>(config?.uiConfig.title ?? '');
  const [rows, setRows] = useState<number>(config?.uiConfig.rows ?? 10);
  const [columns, setColumns] = useState<number>(config?.uiConfig.columns ?? 10);
  const [widgetWidth, setWidgetWidth] = useState<number>(config?.uiConfig.widgetWidth ?? 700);
  const [widgetHeight, setWidgetHeight] = useState<number>(config?.uiConfig.widgetHeight ?? 700);

  // Sync state when an existing config is loaded (e.g. switching widgets)
  useEffect(() => {
    if (config) {
      setTitle(config.uiConfig.title);
      setRows(config.uiConfig.rows);
      setColumns(config.uiConfig.columns);
      setWidgetWidth(config.uiConfig.widgetWidth ?? 700);
      setWidgetHeight(config.uiConfig.widgetHeight ?? 700);
    }
  }, [config?._id]);

  // Emit initial envelope on mount so App.tsx gets config immediately
  useEffect(() => {
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit(overrides?: Partial<{ title: string; rows: number; columns: number; widgetWidth: number; widgetHeight: number }>) {
    const resolved = {
      title: overrides?.title ?? title,
      rows: overrides?.rows ?? rows,
      columns: overrides?.columns ?? columns,
      widgetWidth: overrides?.widgetWidth ?? widgetWidth,
      widgetHeight: overrides?.widgetHeight ?? widgetHeight,
    };

    const uiConfig: TableWidgetUIConfig = {
      title: resolved.title,
      rows: resolved.rows,
      columns: resolved.columns,
      freezeRows: 0,
      freezeColumns: 0,
      widgetWidth: resolved.widgetWidth,
      widgetHeight: resolved.widgetHeight,
      style: { card: { wrapInCard: false, bg: '' } },
    };

    onChange(buildEnvelope(config, uiConfig, resolved.title));
  }

  return (
    <div className="wt-config">
      <div className="wt-config__header">
        <span className="wt-config__title LabelMediumDefault">TableWidget</span>
      </div>

      <div className="wt-config__body">
        <TextInput
          label="Widget Title"
          placeholder="Enter title (leave empty to hide)"
          value={title}
          onChange={({ value }: { name: string; value: string }) => {
            setTitle(value);
            emit({ title: value });
          }}
        />

        <p className="wt-config__section-title">Grid Size</p>

        <div className="wt-config__row">
          <CounterInput
            label="Rows"
            value={rows}
            min={1}
            max={100}
            step={1}
            onChange={({ value }: { name: string; value: number | null }) => {
              const next = value ?? 1;
              setRows(next);
              emit({ rows: next });
            }}
          />

          <CounterInput
            label="Columns"
            value={columns}
            min={1}
            max={50}
            step={1}
            onChange={({ value }: { name: string; value: number | null }) => {
              const next = value ?? 1;
              setColumns(next);
              emit({ columns: next });
            }}
          />
        </div>

        <p className="wt-config__section-title">Widget Size</p>

        <div className="wt-config__row">
          <CounterInput
            label="Width (px)"
            value={widgetWidth}
            min={200}
            max={3000}
            step={10}
            onChange={({ value }: { name: string; value: number | null }) => {
              const next = value ?? 700;
              setWidgetWidth(next);
              emit({ widgetWidth: next });
            }}
          />
          <CounterInput
            label="Height (px)"
            value={widgetHeight}
            min={200}
            max={3000}
            step={10}
            onChange={({ value }: { name: string; value: number | null }) => {
              const next = value ?? 700;
              setWidgetHeight(next);
              emit({ widgetHeight: next });
            }}
          />
        </div>
      </div>
    </div>
  );
}
