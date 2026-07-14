import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { AppLayout } from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import TemplateListPage from './pages/TemplateListPage';
import TemplateCreatePage from './pages/TemplateCreatePage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import BatchGeneratePage from './pages/BatchGeneratePage';
import CouponListPage from './pages/CouponListPage';
import IssuePage from './pages/IssuePage';
import IssueRecordsPage from './pages/IssueRecordsPage';
import MerchantWalletPage from './pages/MerchantWalletPage';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          {/* Merchant Wallet — standalone */}
          <Route path="/merchant/wallet" element={<MerchantWalletPage />} />

          {/* Admin routes */}
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="templates" element={<TemplateListPage />} />
            <Route path="templates/new" element={<TemplateCreatePage />} />
            <Route path="templates/:id" element={<TemplateDetailPage />} />
            <Route path="templates/:id/generate" element={<BatchGeneratePage />} />
            <Route path="coupons" element={<CouponListPage />} />
            <Route path="issue" element={<IssuePage />} />
            <Route path="records" element={<IssueRecordsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
