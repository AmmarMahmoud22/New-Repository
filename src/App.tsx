import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Header } from './components/common/Header';
import { PinModal } from './components/common/PinModal';
import { DailyDashboardModal } from './components/dashboard/DailyDashboardModal';
import { PosCheckout } from './components/pos/PosCheckout';
import { InstallmentManager } from './components/installments/InstallmentManager';
import { KpiCommissionsView } from './components/kpi/KpiCommissionsView';
import { ShiftTreasuryView } from './components/shift/ShiftTreasuryView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { InventoryManager } from './components/inventory/InventoryManager';
import { EmployeeManager } from './components/employees/EmployeeManager';
import { PromotionsManager } from './components/promotions/PromotionsManager';
import { CustomerManager } from './components/customers/CustomerManager';
import { SupplierManager } from './components/suppliers/SupplierManager';
import { TreasuryAccountsView } from './components/treasury/TreasuryAccountsView';
import { DataResetView } from './components/reset/DataResetView';
import { ReportsView } from './components/reports/ReportsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('pos');
  const [showDailyDashboard, setShowDailyDashboard] = useState(true);

  // Shared state for jumping from POS to Installments
  const [prefilledInstallmentTotal, setPrefilledInstallmentTotal] = useState<number>(0);
  const [prefilledInstallmentSummary, setPrefilledInstallmentSummary] = useState<string>('');

  // Manager PIN modal state
  const [pinModalState, setPinModalState] = useState<{
    isOpen: boolean;
    actionTitle: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    actionTitle: '',
    onSuccess: () => {},
  });

  const handleOpenPinModal = (actionTitle: string, onSuccess: () => void) => {
    setPinModalState({
      isOpen: true,
      actionTitle,
      onSuccess,
    });
  };

  const handleClosePinModal = () => {
    setPinModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleNavigateToInstallments = (cartTotal: number, itemsSummary: string) => {
    setPrefilledInstallmentTotal(cartTotal);
    setPrefilledInstallmentSummary(itemsSummary);
    setActiveTab('installments');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Central Header with Clean Brand AKHEN */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPinModal={handleOpenPinModal}
        onOpenDailyDashboard={() => setShowDailyDashboard(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          <PosCheckout
            onOpenPinModal={handleOpenPinModal}
            onNavigateToInstallments={handleNavigateToInstallments}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'promotions' && (
          <PromotionsManager onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'suppliers' && (
          <SupplierManager onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'treasury' && (
          <TreasuryAccountsView onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'reports' && (
          <ReportsView onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'customers' && (
          <CustomerManager onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'employees' && (
          <EmployeeManager onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'installments' && (
          <InstallmentManager
            initialTotal={prefilledInstallmentTotal}
            initialItemsSummary={prefilledInstallmentSummary}
          />
        )}

        {activeTab === 'kpi' && (
          <KpiCommissionsView onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'shift' && (
          <ShiftTreasuryView onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'audit' && (
          <AuditLogsView onOpenPinModal={handleOpenPinModal} />
        )}

        {activeTab === 'reset' && (
          <DataResetView onOpenPinModal={handleOpenPinModal} />
        )}
      </main>

      {/* Central Manager PIN Verification Modal */}
      <PinModal
        isOpen={pinModalState.isOpen}
        actionTitle={pinModalState.actionTitle}
        onSuccess={pinModalState.onSuccess}
        onClose={handleClosePinModal}
      />

      {/* Daily Executive Summary Dashboard Modal */}
      <DailyDashboardModal
        isOpen={showDailyDashboard}
        onClose={() => setShowDailyDashboard(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowDailyDashboard(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
