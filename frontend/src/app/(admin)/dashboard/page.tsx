'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Clock3 } from 'lucide-react';
import { Tabs } from '@heroui/react';
import { useAdminAuth } from '../../../components/admin/AdminAuthProvider';
import { AdminDashboardActivityTab } from '../../../components/admin/dashboard/AdminDashboardActivityTab';
import { AdminDashboardOverviewTab } from '../../../components/admin/dashboard/AdminDashboardOverviewTab';
import { AdminDashboardWelcome } from '../../../components/admin/dashboard/AdminDashboardWelcome';

export type AdminDashboardTabKey = 'overview' | 'activity';

function resolveDashboardTab(value: string | null): AdminDashboardTabKey {
  return value === 'activity' ? 'activity' : 'overview';
}

function DashboardPageContent() {
  const { authChecker } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminDashboardTabKey>(() =>
    resolveDashboardTab(searchParams.get('tab')),
  );

  useEffect(() => {
    authChecker();
  }, [authChecker]);

  useEffect(() => {
    setActiveTab(resolveDashboardTab(searchParams.get('tab')));
  }, [searchParams]);

  const handleTabChange = useCallback(
    (key: React.Key) => {
      const tab = resolveDashboardTab(String(key));
      setActiveTab(tab);
      router.replace(`/dashboard?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  return (
    <div className="flex h-[calc(100vh-4.25rem)] min-h-0 flex-col overflow-hidden pb-4">
      <AdminDashboardWelcome />
      <div className="admin-dashboard-card mx-auto -mt-14 flex min-h-0 w-full max-w-[calc(88vw-2rem)] flex-1 flex-col rounded-b-lg rounded-t-xl bg-white px-1 pt-1 shadow-md">
        <Tabs
          className="admin-dashboard-tabs"
          selectedKey={activeTab}
          variant="secondary"
          onSelectionChange={handleTabChange}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Dashboard sections">
              <Tabs.Tab id="overview">
                <span className="admin-dashboard-tabs__tab-content">
                  <BarChart3 size={16} aria-hidden />
                  Overview
                </span>
              </Tabs.Tab>
              <Tabs.Tab id="activity">
                <span className="admin-dashboard-tabs__tab-content">
                  <Clock3 size={16} aria-hidden />
                  Recent activity
                </span>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="overview">
            <div className="admin-dashboard-tabs__panel-body">
              <AdminDashboardOverviewTab />
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="activity">
            <div className="admin-dashboard-tabs__panel-body">
              <AdminDashboardActivityTab />
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
