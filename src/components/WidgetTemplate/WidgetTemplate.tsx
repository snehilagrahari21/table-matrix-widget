import { DataEntry, WidgetEvent, WidgetTemplateUIConfig } from '../../iosense-sdk/types';
import './WidgetTemplate.css';

interface WidgetTemplateProps {
  config: WidgetTemplateUIConfig;
  data: DataEntry[];
  onEvent: (event: WidgetEvent) => void;
}

// Read a bindable value: resolved data takes priority, config field is the fallback.
function getValue(key: string, config: unknown, data: DataEntry[]): string | number | null {
  const entry = data.find((d) => d.key === key);
  if (entry !== undefined) return entry.value;
  return getValueAtPath(config, key) as string | number | null;
}

function getValueAtPath(obj: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce((acc: unknown, k) => (acc as Record<string, unknown>)?.[k], obj);
}

export function WidgetTemplate({ config, data, onEvent }: WidgetTemplateProps) {
  // Show skeleton while waiting for the mini-engine to resolve bindings.
  if (data.length === 0) {
    return (
      <div className="widget-template widget-template--loading">
        <div className="widget-template__skeleton" />
      </div>
    );
  }

  // TODO: replace with your widget's render logic.
  // Use getValue('your.key', config, data) to read bindable values.
  // Call onEvent({ type: 'TIME_CHANGE', payload: { startTime, endTime, periodicity } })
  // or onEvent({ type: 'FILTER_CHANGE', payload: {} }) on user interactions.

  return (
    <div className="widget-template">
      <p className="widget-template__placeholder">
        WidgetTemplate — replace this with your widget render logic.
      </p>
      <pre className="widget-template__debug">
        {JSON.stringify({ config, data }, null, 2)}
      </pre>
    </div>
  );
}
