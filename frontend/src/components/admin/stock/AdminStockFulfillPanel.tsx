'use client';

import { useState } from 'react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { showAdminError, showAdminSuccess } from '../../../lib/admin/admin-toast';
import { adminStockUnitsService } from '../../../services/admin/admin-stock-units-service';
import { toStockUnitClientError } from '../../../utils/admin/stock/stock-unit-errors';
import type { StockScanResult } from '../../../utils/admin/stock/stock-unit-types';
import { AdminStockScanner } from './AdminStockScanner';

type AdminStockFulfillPanelProps = {
  onSource: (source: 'nest' | 'preview') => void;
};

export function AdminStockFulfillPanel({ onSource }: AdminStockFulfillPanelProps) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StockScanResult | null>(null);

  const submit = async () => {
    setBusy(true);
    try {
      const next = await adminStockUnitsService.fulfill(code);
      setResult(next);
      onSource(next.source);
      showAdminSuccess('Marked sold', `${next.unit.code} left stock.`);
      setCode('');
    } catch (error) {
      setResult(null);
      showAdminError('Fulfill failed', toStockUnitClientError(error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-stock-panel">
      <p className="admin-stock-lede">
        Pack-table scan. No SKU picker — the bottle was bound on activate. Online orders should go
        through this scan, not a silent stock decrement.
      </p>
      <AdminStockScanner disabled={busy} onScan={setCode} />
      <TextField value={code} onChange={setCode}>
        <Label>Code</Label>
        <Input autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Paste or scan" />
      </TextField>
      <Button variant="primary" isDisabled={busy || !code.trim()} onPress={() => void submit()}>
        Mark sold
      </Button>
      {result ? (
        <p className="admin-stock-result">
          {result.unit.code} → <strong>{result.unit.status}</strong>
        </p>
      ) : null}
    </div>
  );
}
