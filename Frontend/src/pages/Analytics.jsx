import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';

export default function Analytics({ transactions = [], budgetPlans = [], categories = [], trackedAccounts = [], netSavingsPool = 0 }) {
  
  // Dynamic Date Filter States
  const [period, setPeriod] = useState('All'); // '7d', '30d', 'thisMonth', 'All', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Use actual current date so date filters work correctly for all users
  const today = new Date();

  // 1. Dynamic Date Range Filter logic
  const getFilteredTransactions = () => {
    return (transactions || []).filter(t => {
      const txDate = new Date(t.date);
      if (isNaN(txDate.getTime())) return true;

      // Ensure clean date comparison (ignoring time component)
      const cleanTxDate = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
      const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (period === '7d') {
        const diffTime = cleanToday - cleanTxDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }
      if (period === '30d') {
        const diffTime = cleanToday - cleanTxDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }
      if (period === 'thisMonth') {
        return cleanTxDate.getFullYear() === cleanToday.getFullYear() && 
               cleanTxDate.getMonth() === cleanToday.getMonth();
      }
      if (period === 'custom') {
        let match = true;
        if (customStart) {
          const startDate = new Date(customStart);
          const cleanStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          match = match && cleanTxDate >= cleanStart;
        }
        if (customEnd) {
          const endDate = new Date(customEnd);
          const cleanEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          match = match && cleanTxDate <= cleanEnd;
        }
        return match;
      }
      return true; // 'All'
    });
  };

  const filteredTx = getFilteredTransactions();

  // Helper to calculate active calendar days in selected period
  const getDaysCount = () => {
    if (period === '7d') return 7;
    if (period === '30d') return 30;
    if (period === 'thisMonth') {
      return today.getDate(); // Days elapsed in this month
    }
    if (period === 'custom') {
      if (customStart && customEnd) {
        const diff = new Date(customEnd) - new Date(customStart);
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
      }
    }
    
    // Default/All time: days between first and last transactions
    if (filteredTx.length <= 1) return 1;
    const dates = filteredTx.map(t => new Date(t.date).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const diff = max - min;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const activeDays = getDaysCount();

  // 2. Calculate New & Extended Analytic Measures
  const totalInflow = filteredTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const periodNetSavings = totalInflow - totalOutflow;
  
  // Measure A: Savings Rate %
  const savingsRate = totalInflow > 0 ? Math.round((periodNetSavings / totalInflow) * 100) : 0;

  // Measure B: Average Daily Spending
  const avgDailySpending = Math.round(totalOutflow / activeDays);

  // Measure C: Expense-to-Income Ratio
  const expenseToIncomeRatio = totalInflow > 0 ? Math.round((totalOutflow / totalInflow) * 100) : 0;

  // 3. Prep Chart Datasets on the filtered transactions

  // A) Cash Flow Chart Data
  const dailyDataMap = {};
  filteredTx.forEach(t => {
    const dateStr = t.date;
    if (!dailyDataMap[dateStr]) {
      dailyDataMap[dateStr] = { date: dateStr, Inflow: 0, Outflow: 0 };
    }
    if (t.type === 'income') {
      dailyDataMap[dateStr].Inflow += t.amount;
    } else {
      dailyDataMap[dateStr].Outflow += t.amount;
    }
  });
  const cashFlowData = Object.values(dailyDataMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // B) Spending Breakdown (Pie)
  const expenseBreakdown = {};
  filteredTx.filter(t => t.type === 'expense').forEach(t => {
    if (!expenseBreakdown[t.category]) {
      expenseBreakdown[t.category] = 0;
    }
    expenseBreakdown[t.category] += t.amount;
  });
  const spendingData = Object.entries(expenseBreakdown).map(([category, amount]) => {
    const catConfig = categories.find(c => c.name === category) || { color: '#64748b' };
    return {
      name: category,
      value: amount,
      color: catConfig.color
    };
  });

  // C) Budget vs Actual (Based on active budget plan allocations and transactions inside plan range)
  const activePlan = budgetPlans.find(p => p.active);
  const budgetVsActualData = activePlan 
    ? Object.entries(activePlan.allocations).map(([category, limit]) => {
        // Calculate actual spent strictly within plan dates
        const start = new Date(activePlan.startDate);
        const end = new Date(activePlan.endDate);
        const planTx = transactions.filter(t => {
          const txDate = new Date(t.date);
          const cleanTx = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
          return cleanTx >= start && cleanTx <= end;
        });
        const spent = planTx
          .filter(t => t.type === 'expense' && t.category === category)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: category,
          Limit: limit,
          Spent: spent
        };
      })
    : [];

  // D) Trends (Running Ledger Balance on filtered items)
  const sortedTx = [...filteredTx].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningBalance = 0;
  const trendData = sortedTx.map(t => {
    if (t.type === 'income') {
      runningBalance += t.amount;
    } else {
      runningBalance -= t.amount;
    }
    return {
      date: t.date,
      "Net Value": runningBalance
    };
  });
  const aggregatedTrendMap = {};
  trendData.forEach(p => {
    aggregatedTrendMap[p.date] = p["Net Value"];
  });
  const cleanTrendData = Object.entries(aggregatedTrendMap).map(([date, val]) => ({
    date,
    "Net Value": val
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Title & Interactive Period Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text-primary)' }}>📊 Financial Insights &amp; Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Interactive reporting charts dynamically filtered by your chosen calendar cycle.
          </p>
        </div>
        
        {/* Dynamic Period Selector Control */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-premium)' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Period:</span>
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)} 
            style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
          >
            <option value="All">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <input 
                type="date" 
                value={customStart} 
                onChange={e => setCustomStart(e.target.value)} 
                style={{ width: '130px', padding: '6px 8px', fontSize: '12px' }}
                title="Start Date"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={e => setCustomEnd(e.target.value)} 
                style={{ width: '130px', padding: '6px 8px', fontSize: '12px' }}
                title="End Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Key Analytics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Total Period Savings */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Period Savings</span>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: periodNetSavings < 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            Rs. {periodNetSavings.toLocaleString()}
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net earnings minus outflows</span>
        </div>

        {/* Card 2: Savings Rate */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-secondary)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Savings Rate</span>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: savingsRate < 0 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
            {savingsRate}%
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Percentage of income saved</span>
        </div>

        {/* Card 3: Average Daily Spending */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-tertiary)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Avg Daily Spending</span>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px' }}>
            Rs. {avgDailySpending.toLocaleString()}
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Across {activeDays} active days</span>
        </div>

        {/* Card 4: Expense-to-Income Ratio */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-danger)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Expense Ratio</span>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: expenseToIncomeRatio > 100 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            {expenseToIncomeRatio}%
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Spent out of total income</span>
        </div>

        {/* Card 5: Net Savings Pool */}
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-secondary)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Net Savings Pool</span>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--color-primary)' }}>
            Rs. {netSavingsPool.toLocaleString()}
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Locked savings reserves</span>
        </div>

      </div>

      {/* Grid containing Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* Cash Flow Chart */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '15px' }}>💵 Cash Flow (Inflow vs Outflow)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {cashFlowData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No cash flow inputs in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: '11px' }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Legend tick={{ fontSize: '12px' }} />
                  <Bar dataKey="Inflow" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outflow" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Spending Breakdown (Pie Chart) */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '15px' }}>🍔 Spending Breakdown (Category Distribution)</h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {spendingData.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)' }}>No expense logs to chart in this period.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `Rs. ${value.toLocaleString()}`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '15px' }}>🎯 Target Limit vs Actual Spend (For Active Plan)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {activePlan ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActualData} layout="vertical">
                  <CartesianGrid strokeDasharray="0" stroke="var(--border-color)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: '11px' }} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tick={{ fontSize: '11px' }} width={100} />
                  <Tooltip 
                    formatter={(value) => `Rs. ${value.toLocaleString()}`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Legend tick={{ fontSize: '12px' }} />
                  <Bar dataKey="Limit" fill="var(--bg-accent)" stroke="var(--border-color)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Spent" fill="var(--color-tertiary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No active budget plan configured.
              </div>
            )}
          </div>
        </div>

        {/* Financial Trends Line */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '15px' }}>📈 Net Asset Trend Line (Running Ledger Balance)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {cleanTrendData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No active records to plot trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cleanTrendData}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: '11px' }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: '11px' }} />
                  <Tooltip 
                    formatter={(value) => `Rs. ${value.toLocaleString()}`}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Legend tick={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Net Value" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Bank Account Balances Breakdown */}
      {trackedAccounts.length > 0 && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', fontWeight: '700', fontSize: '15px' }}>🏦 Bank Account Balances</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {trackedAccounts.map(acc => {
              const total = trackedAccounts.reduce((s, a) => s + a.balance, 0);
              const percent = total > 0 ? Math.round((acc.balance / total) * 100) : 0;
              return (
                <div key={acc.id} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>🏛 {acc.bankName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{percent}% of total</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-primary)' }}>Rs. {acc.balance.toLocaleString()}</span>
                  <div style={{ background: 'var(--bg-accent)', height: '6px', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${percent}%`, background: 'var(--color-primary)', height: '100%', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mask: {acc.accountMask}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--bg-accent)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Cash Value (All Accounts)</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Rs. {trackedAccounts.reduce((s, a) => s + a.balance, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
