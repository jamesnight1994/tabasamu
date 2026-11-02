'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Label, ListBox, Select, TextField } from '@heroui/react';
import { showAdminError, showAdminSuccess } from '../../../lib/admin/admin-toast';
import { adminStockUnitsService } from '../../../services/admin/admin-stock-units-service';
import { skuOptionLabel } from '../../../utils/admin/stock/stock-sku-options';
import { toStockUnitClientError } from '../../../utils/admin/stock/stock-unit-errors';
import type { StockScanResult, StockSkuOption } from '../../../utils/admin/stock/stock-unit-types';
import { AdminStockScanner } from './AdminStockScanner';

type AdminStockActivatePanelProps = {
  onSource: (source: 'nest' | 'preview') => void;
};

export function AdminStockActivatePanel({ onSource }: AdminStockActivatePanelProps) {
  const [code, setCode] = useState('');
  const [variantId, setVariantId] = useState('');
  const [skus, setSkus] = useState<StockSkuOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StockScanResult | null>(null);

  useEffect(() => {
    void adminStockUnitsService.listSkuOptions().then((options) => {
      setSkus(options);
      const last = adminStockUnitsService.lastSku();
      if (last && options.some((option) => option.variantId === last)) {
        setVariantId(last);
      }
    });
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const next = await adminStockUnitsService.activate(code, variantId);
      setResult(next);
      onSource(next.source);
      showAdminSuccess('Bottle in stock', `${next.unit.code} is bound and in_stock.`);
      setCode('');
    } catch (error) {
      setResult(null);
      showAdminError('Activate failed', toStockUnitClientError(error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-stock-panel">
      <p className="admin-stock-lede">
        Scan a printed label, pick the flavour / SKU, then bind. Nest only receives the code string —
        the camera stays on this phone.
      </p>
      <AdminStockScanner disabled={busy} onScan={setCode} />
      <TextField value={code} onChange={setCode}>
        <Label>Code</Label>
        <Input autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Paste or scan" />
      </TextField>
      <Select
        selectedKey={variantId || undefined}
        onSelectionChange={(key) => setVariantId(String(key ?? ''))}
      >
        <Label>Product / SKU</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={skus}>
            {(item) => (
              <ListBox.Item id={item.variantId} textValue={skuOptionLabel(item)}>
                {skuOptionLabel(item)}
              </ListBox.Item>
            )}
          </ListBox>
        </Select.Popover>
      </Select>
      <Button variant="primary" isDisabled={busy || !code.trim() || !variantId} onPress={() => void submit()}>
        Activate to in stock
      </Button>
      {result ? (
        <p className="admin-stock-result">
          {result.unit.code} → <strong>{result.unit.status}</strong>
        </p>
      ) : null}
    </div>
  );
}
