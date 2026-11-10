'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Tabs } from '@heroui/react';
import { Ban, PackageCheck, QrCode, ScanLine } from 'lucide-react';
import { useAdminAuth } from '../AdminAuthProvider';
import { AdminStockActivatePanel } from './AdminStockActivatePanel';
import { AdminStockFulfillPanel } from './AdminStockFulfillPanel';
import { AdminStockPrintPanel } from './AdminStockPrintPanel';
import { AdminStockVoidPanel } from './AdminStockVoidPanel';

export type AdminStockTabKey = 'print' | 'activate' | 'fulfill' | 'void';

export function AdminStockPageContent() {
  const { authChecker } = useAdminAuth();
  const [tab, setTab] = useState<AdminStockTabKey>('print');
  const [source, setSource] = useState<'nest' | 'preview' | null>(null);

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  const onSource = useCallback((next: 'nest' | 'preview') => {
    setSource(next);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4.25rem)] min-h-0 flex-col overflow-hidden bg-white">
      <div className="admin-stock-card flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        <div className="admin-stock-toolbar">
          <h2 className="admin-stock-toolbar__title">Stock scan</h2>
        </div>
        {source === 'preview' ? (
          <Alert status="warning" className="admin-stock-banner">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Preview store</Alert.Title>
              <Alert.Description>
                Nest stock APIs are not up yet. This tab is using a session store so you can walk
                print → activate → fulfill / void.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Tabs
          className="admin-dashboard-tabs admin-stock-tabs"
          selectedKey={tab}
          variant="secondary"
          onSelectionChange={(key) => setTab(String(key) as AdminStockTabKey)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Stock scan jobs">
              <Tabs.Tab id="print">
                <span className="admin-dashboard-tabs__tab-content">
                  <QrCode size={16} aria-hidden />
                  Print
                </span>
              </Tabs.Tab>
              <Tabs.Tab id="activate">
                <span className="admin-dashboard-tabs__tab-content">
                  <ScanLine size={16} aria-hidden />
                  Activate
                </span>
              </Tabs.Tab>
              <Tabs.Tab id="fulfill">
                <span className="admin-dashboard-tabs__tab-content">
                  <PackageCheck size={16} aria-hidden />
                  Fulfill
                </span>
              </Tabs.Tab>
              <Tabs.Tab id="void">
                <span className="admin-dashboard-tabs__tab-content">
                  <Ban size={16} aria-hidden />
                  Void
                </span>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="print">
            <div className="admin-stock-tabs__panel">
              <AdminStockPrintPanel onSource={onSource} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="activate">
            <div className="admin-stock-tabs__panel">
              <AdminStockActivatePanel onSource={onSource} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="fulfill">
            <div className="admin-stock-tabs__panel">
              <AdminStockFulfillPanel onSource={onSource} />
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="void">
            <div className="admin-stock-tabs__panel">
              <AdminStockVoidPanel onSource={onSource} />
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}
