'use client';

import { useState } from 'react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { Download, Printer } from 'lucide-react';
import { showAdminError, showAdminSuccess } from '../../../lib/admin/admin-toast';
import { adminStockUnitsService } from '../../../services/admin/admin-stock-units-service';
import { downloadCsv, printQrSheet, stockUnitsToCsv } from '../../../utils/admin/stock/stock-print-export';
import { qrSvg } from '../../../utils/admin/stock/qr-svg';
import { MAX_PRINT_BATCH, MIN_PRINT_BATCH } from '../../../utils/admin/stock/stock-preview-store';
import { toStockUnitClientError } from '../../../utils/admin/stock/stock-unit-errors';
import type { StockPrintBatch, StockUnit } from '../../../utils/admin/stock/stock-unit-types';

type AdminStockPrintPanelProps = {
  onSource: (source: 'nest' | 'preview') => void;
};

export function AdminStockPrintPanel({ onSource }: AdminStockPrintPanelProps) {
  const [size, setSize] = useState(12);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<StockPrintBatch | null>(null);

  const generate = async () => {
    setBusy(true);
    try {
      const next = await adminStockUnitsService.printBatch(size);
      setBatch(next);
      onSource(next.source);
      showAdminSuccess(
        `Printed ${next.units.length} blank codes`,
        'SKU is bound later, on activate.',
      );
    } catch (error) {
      showAdminError('Could not print batch', toStockUnitClientError(error).message);
    } finally {
      setBusy(false);
    }
  };

  const units: StockUnit[] = batch?.units ?? [];

  return (
    <div className="admin-stock-panel">
      <p className="admin-stock-lede">
        Request blank unique codes for the print shop. Do not pick a flavour here — that happens when
        the label is scanned onto a bottle.
      </p>
      <div className="admin-stock-print-form">
        <TextField
          className="admin-stock-print-form__size"
          value={String(size)}
          onChange={(value) => {
            const parsed = Number(value);
            setSize(Number.isNaN(parsed) ? MIN_PRINT_BATCH : parsed);
          }}
        >
          <Label>Batch size</Label>
          <Input type="number" min={MIN_PRINT_BATCH} max={MAX_PRINT_BATCH} inputMode="numeric" />
        </TextField>
        <Button variant="primary" isDisabled={busy} onPress={() => void generate()}>
          Generate codes
        </Button>
      </div>
      {units.length > 0 ? (
        <div className="admin-stock-print-result">
          <div className="admin-stock-print-result__actions">
            <Button
              variant="secondary"
              onPress={() =>
                downloadCsv(`tabasamu-stock-${batch?.batchId ?? 'batch'}.csv`, stockUnitsToCsv(units))
              }
            >
              <Download size={16} aria-hidden />
              Download CSV
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                try {
                  printQrSheet(units);
                } catch (error) {
                  showAdminError('Print blocked', error instanceof Error ? error.message : 'Allow pop-ups.');
                }
              }}
            >
              <Printer size={16} aria-hidden />
              Print QR sheet
            </Button>
          </div>
          <ul className="admin-stock-code-grid">
            {units.map((unit) => (
              <li key={unit.id} className="admin-stock-code-card">
                <div
                  className="admin-stock-code-card__qr"
                  dangerouslySetInnerHTML={{ __html: qrSvg(unit.code, 3) }}
                />
                <code>{unit.code}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
