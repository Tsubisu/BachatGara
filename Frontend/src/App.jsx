import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import PageWrapper from './components/PageWrapper';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Subscriptions from './pages/Subscriptions';
import SettingsLayout from './pages/settings/SettingsLayout';
import ProfileSettings from './pages/settings/ProfileSettings';
import ThemeSettings from './pages/settings/ThemeSettings';
import AccountSettings from './pages/settings/AccountSettings';
import CategorySettings from './pages/settings/CategorySettings';
import GatewaySettings from './pages/settings/GatewaySettings';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyResetOtp from './pages/VerifyResetOtp';

import {
  getToken, clearToken, clearUser, getUser,
  accountsApi, transactionsApi, budgetsApi,
  goalsApi, subscriptionsApi, alertsApi, profileApi, categoriesApi
} from './services/api';

const defaultCategories = [
  { name: 'Food & Drinks', color: '#f59e0b', icon: '🍔' },
  { name: 'Rent & Housing', color: '#3b82f6', icon: '🏠' },
  { name: 'Transportation', color: '#10b981', icon: '🚗' },
  { name: 'Entertainment', color: '#ec4899', icon: '🍿' },
  { name: 'Groceries', color: '#8b5cf6', icon: '🛒' },
  { name: 'Utilities & Bills', color: '#06b6d4', icon: '⚡' },
  { name: 'Salary', color: '#10b981', icon: '💼' },
  { name: 'Freelance', color: '#14b8a6', icon: '💻' },
  { name: 'Investments', color: '#f59e0b', icon: '📈' },
  { name: 'Bank Fees / Charges', color: '#64748b', icon: '🏦' },
  { name: 'Other', color: '#64748b', icon: '📝' },
];

function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('color-theme') || 'mint');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');

  const [transactions, setTransactions] = useState([]);
  const [budgetPlans, setBudgetPlans] = useState([]);
  const [savings, setSavings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [trackedAccounts, setTrackedAccounts] = useState([]);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState([]);
  const [netSavings, setNetSavings] = useState(0);
  const [categories, setCategories] = useState(defaultCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem('color-theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const loadAllData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [
        accsData,
        txData,
        budgetData,
        goalsData,
        subsData,
        alertsData,
        profileData,
        catsData,
      ] = await Promise.all([
        accountsApi.list(),
        transactionsApi.list(),
        budgetsApi.list(),
        goalsApi.list(),
        subscriptionsApi.list(),
        alertsApi.list(),
        profileApi.get(),
        categoriesApi.list(),
      ]);

      setTrackedAccounts(Array.isArray(accsData) ? accsData.map(a => ({
        id: a.id,
        bankName: a.name || 'Bank',
        accountMask: a.account_mask || '',
        balance: parseFloat(a.balance || 0),
        type: a.type,
      })) : []);

      setTransactions(Array.isArray(txData) ? txData.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description || 'Transaction',
        amount: parseFloat(t.amount || 0),
        type: t.source_account_id && !t.destination_account_id ? 'expense' :
              (!t.source_account_id && t.destination_account_id ? 'income' : 'transfer'),
        category: t.category_name || 'Other',
        account: t.source_account_name || t.destination_account_name || 'Unknown',
      })) : []);

      setBudgetPlans(Array.isArray(budgetData) ? budgetData.map(p => ({
        id: p.id,
        name: p.name || 'Budget Plan',
        startDate: p.start_date,
        endDate: p.end_date,
        totalPool: parseFloat(p.total_pool || 0),
        active: p.active,
        allocations: p.allocations || {},
      })) : []);

      setSavings(Array.isArray(goalsData) ? goalsData.map(g => ({
        id: g.id,
        name: g.name || 'Goal',
        target: parseFloat(g.target_amount || 0),
        current: parseFloat(g.current || 0),
        date: g.target_date || null,
      })) : []);

      setSubscriptions(Array.isArray(subsData) ? subsData.map(s => ({
        id: s.id,
        name: s.name || 'Subscription',
        amount: parseFloat(s.amount || 0),
        cycle: s.billing_cycle,
        date: s.next_billing_date,
        account: s.account_name || '',
      })) : []);

      setUnresolvedAlerts(Array.isArray(alertsData) ? alertsData.map(a => ({
        id: a.id,
        timestamp: a.timestamp ? new Date(a.timestamp).toLocaleString('sv').replace('T', ' ') : '',
        rawBody: a.raw_body || '',
        bankName: a.bank_name || 'Bank',
        amount: parseFloat(a.amount || 0),
        type: a.type,
        resolved: a.resolved,
      })) : []);

      setNetSavings(parseFloat(profileData?.net_savings || 0));
      setCategories(Array.isArray(catsData) && catsData.length > 0 ? catsData : defaultCategories);

    } catch (err) {
      console.error('Failed to load app data:', err);
      setDataError(err.message);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  const handleLogout = () => {
    clearToken();
    clearUser();
    window.location.href = '/login';
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const netCashValue = trackedAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={loadAllData} />} />
        <Route path="/register" element={<Register onRegisterSuccess={loadAllData} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={
          <ProtectedRoute>
            <PageWrapper
              theme={theme}
              toggleTheme={toggleTheme}
              balance={netCashValue}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              onLogout={handleLogout}
              user={getUser()}
            >
              <Routes>
                <Route path="/" element={
                  <Dashboard
                    user={getUser()}
                    transactions={transactions}
                    setTransactions={setTransactions}
                    budgetPlans={budgetPlans}
                    setBudgetPlans={setBudgetPlans}
                    balance={netCashValue}
                    categories={categories}
                    trackedAccounts={trackedAccounts}
                    setTrackedAccounts={setTrackedAccounts}
                    unresolvedAlerts={unresolvedAlerts}
                    setUnresolvedAlerts={setUnresolvedAlerts}
                    netSavings={netSavings}
                    setNetSavings={setNetSavings}
                    onDataRefresh={loadAllData}
                  />
                } />
                <Route path="/transactions" element={
                  <Transactions
                    transactions={transactions}
                    setTransactions={setTransactions}
                    categories={categories}
                    trackedAccounts={trackedAccounts}
                    onDataRefresh={loadAllData}
                  />
                } />
                <Route path="/analytics" element={
                  <Analytics
                    transactions={transactions}
                    budgetPlans={budgetPlans}
                    categories={categories}
                  />
                } />
                <Route path="/budgets" element={
                  <Budgets
                    budgetPlans={budgetPlans}
                    setBudgetPlans={setBudgetPlans}
                    categories={categories}
                    transactions={transactions}
                    balance={netCashValue}
                    onDataRefresh={loadAllData}
                  />
                } />
                <Route path="/savings" element={
                  <Savings
                    savings={savings}
                    setSavings={setSavings}
                    netSavings={netSavings}
                    setNetSavings={setNetSavings}
                    trackedAccounts={trackedAccounts}
                    setTrackedAccounts={setTrackedAccounts}
                    balance={netCashValue}
                    onDataRefresh={loadAllData}
                  />
                } />
                <Route path="/subscriptions" element={
                  <Subscriptions
                    subscriptions={subscriptions}
                    setSubscriptions={setSubscriptions}
                    trackedAccounts={trackedAccounts}
                    onDataRefresh={loadAllData}
                  />
                } />
                <Route path="/settings/*" element={
                  <SettingsLayout>
                    <Routes>
                      <Route path="profile" element={<ProfileSettings user={getUser()} onDataRefresh={loadAllData} />} />
                      <Route path="theme" element={<ThemeSettings theme={theme} toggleTheme={toggleTheme} colorTheme={colorTheme} setColorTheme={setColorTheme} />} />
                      <Route path="accounts" element={<AccountSettings trackedAccounts={trackedAccounts} setTrackedAccounts={setTrackedAccounts} onDataRefresh={loadAllData} />} />
                      <Route path="categories" element={<CategorySettings categories={categories} onDataRefresh={loadAllData} />} />
                      <Route path="gateway" element={<GatewaySettings />} />
                      <Route path="*" element={<Navigate to="profile" replace />} />
                    </Routes>
                  </SettingsLayout>
                } />
              </Routes>
            </PageWrapper>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
