'use client';

import { useState } from 'react';
import { Button, Input, Label, TextField } from '@heroui/react';
import { showAdminError, showAdminSuccess } from '../../../lib/admin/admin-toast';
import { adminStockUnitsService } from '../../../services/admin/admin-stock-units-service';
import { toStockUnitClientError } from '../../../utils/admin/stock/stock-unit-errors';
import type { StockScanResult } from '../../../utils/admin/stock/stock-unit-types';
import { AdminStockScanner } from './AdminStockScanner';

type AdminStockVoidPanelProps = {
  onSource: (source: 'nest' | 'preview') => void;
};

export function AdminStockVoidPanel({ onSource }: AdminStockVoidPanelProps) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StockScanResult | null>(null);

  const submit = async () => {
    setBusy(true);
    try {
      const next = await adminStockUnitsService.void(code);
      setResult(next);
      onSource(next.source);
      showAdminSuccess('Label voided', `${next.unit.code} is no longer usable.`);
      setCode('');
    } catch (error) {
      setResult(null);
      showAdminError('Void failed', toStockUnitClientError(error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-stock-panel">
      <p className="admin-stock-lede">
        Void damaged, misprinted, or unused labels. Works on printed or in-stock codes. Sold bottles
        cannot be voided — returns need a new QR.
      </p>
      <AdminStockScanner disabled={busy} onScan={setCode} />
      <TextField value={code} onChange={setCode}>
        <Label>Code</Label>
        <Input autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Paste or scan" />
      </TextField>
      <Button variant="primary" isDisabled={busy || !code.trim()} onPress={() => void submit()}>
        Void label
      </Button>
      {result ? (
        <p className="admin-stock-result">
          {result.unit.code} → <strong>{result.unit.status}</strong>
        </p>
      ) : null}
    </div>
  );
}
