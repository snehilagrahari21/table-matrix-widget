import { useRef } from 'react';
import { Button } from '@faclon-labs/design-sdk';
import { DataEntry, WidgetEvent, TableWidgetUIConfig } from '../../iosense-sdk/types';
import { CellDataStore } from './CellDataStore';
import { VirtualGrid } from './VirtualGrid';
import './TableWidget.css';

interface TableWidgetProps {
  config: TableWidgetUIConfig;
  data: DataEntry[];
  onEvent: (event: WidgetEvent) => void;
}

export function TableWidget({ config, onEvent }: TableWidgetProps) {
  const storeRef = useRef<CellDataStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new CellDataStore();
  }

  function handleExport() {
    onEvent({ type: 'FILTER_CHANGE', payload: { action: 'export' } });
  }

  const showHeader = config.title.trim() !== '';

  return (
    <div className="tw-widget">
      {showHeader && (
        <div className="tw-header">
          <h3 className="tw-title">{config.title}</h3>
        </div>
      )}

      <div className="tw-toolbar">
        <div className="tw-toolbar-spacer" />
        <Button
          variant="Secondary"
          size="Small"
          label="Export"
          onClick={handleExport}
        />
      </div>

      <div className="tw-table-section">
        <VirtualGrid
          rows={config.rows}
          columns={config.columns}
          freezeRows={config.freezeRows}
          freezeColumns={config.freezeColumns}
          store={storeRef.current}
        />
      </div>
    </div>
  );
}
