import React, { useState } from 'react';
import { Target, Calendar, Plus, Check, ShieldAlert, Sparkles, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { budgetsApi, categoriesApi } from '../services/api';

export default function Budgets({ 
  budgetPlans, 
  setBudgetPlans, 
  categories, 
  setCategories, 
  transactions,
  balance = 0,
  onDataRefresh
}) {
  // Wizard state parameters
  const [step, setStep] = useState(1); // Step 1: Details, Step 2: Allocations
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPool, setTotalPool] = useState('');

  // Selected categories list and their sub-allocations
  const [selectedCats, setSelectedCats] = useState({}); // e.g. { "Food & Drinks": 5000, "Groceries": 8000 }
  
  // Custom Category Creator inside Wizard
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🌟');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  // Find active plan
  const activePlan = budgetPlans.find(p => p.active);
  const archivedPlans = budgetPlans.filter(p => !p.active);

  // Helper to compute actual spent in a plan range
  const calculatePlanSpent = (plan) => {
    if (!plan || !plan.startDate || !plan.endDate) return { overallSpent: 0, categoryBreakdown: [] };
    const startStr = String(plan.startDate).split('T')[0];
    const endStr = String(plan.endDate).split('T')[0];
    
    const planTx = (transactions || []).filter(t => {
      if (!t || !t.date) return false;
      const txDateStr = String(t.date).split('T')[0];
      return txDateStr >= startStr && txDateStr <= endStr;
    });

    let overallSpent = 0;
    const categoryBreakdown = Object.entries(plan.allocations || {}).map(([catName, limit]) => {
      const spent = planTx
        .filter(t => t.type === 'expense' && t.category === catName)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      overallSpent += spent;
      return { category: catName, limit, spent };
    });

    return { overallSpent, categoryBreakdown };
  };

  // Add custom category on-the-fly inside the wizard
  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      alert('Category already exists!');
      return;
    }

    try {
      await categoriesApi.upsert({
        name: newCatName.trim(),
        icon: newCatIcon.trim() || '🌟',
        color: newCatColor,
        type: 'expense'
      });

      if (onDataRefresh) {
        await onDataRefresh();
      }

      // Automatically select it in the allocations checklist
      setSelectedCats(prev => ({
        ...prev,
        [newCatName.trim()]: 1000 // default initial allocation
      }));

      // Reset inputs
      setNewCatName('');
      setNewCatIcon('🌟');
      setNewCatColor('#3b82f6');
      setShowAddCat(false);
    } catch (err) {
      alert(`Failed to add custom category: ${err.message}`);
    }
  };

  // Handle checking / unchecking a category in Wizard Step 2
  const handleToggleCategory = (catName) => {
    setSelectedCats(prev => {
      const updated = { ...prev };
      if (updated[catName] !== undefined) {
        delete updated[catName];
      } else {
        updated[catName] = 1000; // default starting limit allocation
      }
      return updated;
    });
  };

  const handleAllocationValueChange = (catName, value) => {
    setSelectedCats(prev => ({
      ...prev,
      [catName]: Math.max(0, parseInt(value) || 0)
    }));
  };

  // Compute allocation math
  const totalAllocated = Object.values(selectedCats).reduce((sum, val) => sum + val, 0);
  const poolVal = parseFloat(totalPool) || 0;
  const unallocatedRemaining = poolVal - totalAllocated;

  const handleNextStep = () => {
    if (!planName || !startDate || !endDate || !totalPool) {
      alert('Please fill out all plan configuration details.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start Date cannot be after End Date.');
      return;
    }
    setStep(2);
  };

  const handleCreatePlan = async () => {
    if (totalAllocated === 0) {
      alert('Please allocate budget to at least one category.');
      return;
    }
    if (unallocatedRemaining < 0) {
      alert('You have allocated more than your total pool! Please adjust your values.');
      return;
    }

    try {
      await budgetsApi.create({
        name: planName,
        start_date: startDate,
        end_date: endDate,
        total_pool: poolVal,
        allocations: selectedCats
      });

      // Reset wizard
      setPlanName('');
      setStartDate('');
      setEndDate('');
      setTotalPool('');
      setSelectedCats({});
      setStep(1);
      alert('Custom budget plan created and activated!');

      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      alert(`Failed to create budget plan: ${err.message}`);
    }
  };

  const handleDeletePlan = async (id) => {
    if (confirm('Are you sure you want to delete this budget plan?')) {
      try {
        await budgetsApi.remove(id);
        if (onDataRefresh) {
          await onDataRefresh();
        }
      } catch (err) {
        alert(`Failed to delete budget plan: ${err.message}`);
      }
    }
  };

  const getCategoryConfig = (catName) => {
    return categories.find(c => c.name === catName) || { color: '#64748b', icon: '📝' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Active Plan Detail View */}
      <div className="glass-card">
        <h2 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target className="md-primary" />
          <span>Active Budget Plan</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Your active allocations for this timeframe. Transactions are matched dynamically based on date ranges.
        </p>

        {activePlan ? (
          <div>
            {(() => {
              const { overallSpent, categoryBreakdown } = calculatePlanSpent(activePlan);
              const isOverPool = overallSpent > activePlan.totalPool;
              const poolPercent = Math.min((overallSpent / activePlan.totalPool) * 100, 100);
              
              // Calculate countdown
              const today = new Date('2026-07-16');
              const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const cleanEnd = new Date(activePlan.endDate);
              const daysLeft = Math.ceil((cleanEnd - cleanToday) / (1000 * 60 * 60 * 24));
              const isPast = daysLeft < 0;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Plan Overview Card */}
                  <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>{activePlan.name}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <Calendar size={14} />
                          <span>{activePlan.startDate} to {activePlan.endDate}</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          background: isPast ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-accent)', 
                          color: isPast ? 'var(--color-danger)' : 'var(--text-secondary)', 
                          padding: '4px 10px', 
                          borderRadius: '20px',
                          fontWeight: '700'
                        }}>
                          {isPast ? 'Expired' : `${daysLeft} days remaining`}
                        </span>
                        <button 
                          onClick={() => handleDeletePlan(activePlan.id)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px', borderRadius: '4px' }}
                          title="Delete Plan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                      <span>Spent Pool: Rs. {overallSpent.toLocaleString()}</span>
                      <span>Total Pool: Rs. {activePlan.totalPool.toLocaleString()}</span>
                    </div>

                    <div style={{ background: 'var(--bg-accent)', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <div style={{ 
                        width: `${poolPercent}%`, 
                        background: isOverPool ? 'var(--color-danger)' : 'var(--color-primary)', 
                        height: '100%', 
                        borderRadius: '6px' 
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>
                        {isOverPool ? `Overspent by Rs. ${Math.abs(activePlan.totalPool - overallSpent).toLocaleString()}` : `Rs. ${(activePlan.totalPool - overallSpent).toLocaleString()} available`}
                      </span>
                      <span>{Math.round(poolPercent)}% depleted</span>
                    </div>
                  </div>

                  {/* Sub-allocations category progress list */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {categoryBreakdown.map(c => {
                      const catConfig = getCategoryConfig(c.category);
                      const percent = Math.min((c.spent / c.limit) * 100, 100);
                      const isOver = c.spent > c.limit;

                      return (
                        <div 
                          key={c.category} 
                          style={{ 
                            padding: '16px', 
                            background: 'var(--bg-primary)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--border-radius-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{catConfig.icon}</span>
                              <span>{c.category}</span>
                            </strong>
                            <span style={{ 
                              fontSize: '10px', 
                              background: isOver ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-accent)', 
                              color: isOver ? 'var(--color-danger)' : 'var(--text-secondary)',
                              padding: '2px 6px', 
                              borderRadius: '12px', 
                              fontWeight: '700' 
                            }}>
                              {Math.round(percent)}% used
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span>Spent: Rs. {c.spent}</span>
                            <span>Limit: Rs. {c.limit}</span>
                          </div>
                          <div style={{ background: 'var(--bg-accent)', height: '6px', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div style={{ 
                              width: `${percent}%`, 
                              background: isOver ? 'var(--color-danger)' : catConfig.color, 
                              height: '100%', 
                              borderRadius: '3px' 
                            }}></div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: isOver ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                            {isOver ? `Over by Rs. ${Math.abs(c.limit - c.spent)}` : `Rs. ${c.limit - c.spent} left`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No active budget plan is currently configured. Use the wizard below to set one up!
          </div>
        )}
      </div>

      {/* Wizard Form: Create New Budget Plan */}
      <div className="glass-card">
        <h2 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles className="md-tertiary" />
          <span>Setup Custom Budget Plan</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Start a new plan with custom dates, fund limits, and allocated categories.
        </p>

        {/* Step Indicator Header */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '4px', background: step >= 1 ? 'var(--color-primary)' : 'var(--bg-accent)', borderRadius: '2px' }}></div>
          <div style={{ flex: 1, height: '4px', background: step >= 2 ? 'var(--color-primary)' : 'var(--bg-accent)', borderRadius: '2px' }}></div>
        </div>

        {step === 1 ? (
          /* Step 1: Config Plan Details */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Plan Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Household July or Pokhara Getaway" 
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Total Budget Pool (Rs.) — Net Cash Available: <strong style={{ color: 'var(--color-primary)' }}>Rs. {balance.toLocaleString()}</strong>
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 50000" 
                  value={totalPool}
                  onChange={e => setTotalPool(e.target.value)}
                />
                {parseFloat(totalPool) > balance && (
                  <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ Pool exceeds your available Net Cash Value by Rs. {(parseFloat(totalPool) - balance).toLocaleString()}!
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleNextStep} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '12px' }}
            >
              <span>Next: Allocate Pool</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          /* Step 2: Categorization & Allocations Checklist */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Live Pool Allocation Stats Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Allocated Balance</span>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Rs. {totalAllocated.toLocaleString()} / Rs. {poolVal.toLocaleString()}
                </h4>
              </div>
              <div>
                {unallocatedRemaining > 0 ? (
                  <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                    Rs. {unallocatedRemaining.toLocaleString()} Left to Allocate
                  </span>
                ) : unallocatedRemaining === 0 ? (
                  <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                    ✓ Pool Fully Allocated
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={12} />
                    Over-allocated by Rs. {Math.abs(unallocatedRemaining).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Checklist of Categories & Limits Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Select plan categories and adjust limits:</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {categories.map(cat => {
                  const isChecked = selectedCats[cat.name] !== undefined;
                  return (
                    <div 
                      key={cat.name} 
                      style={{ 
                        padding: '14px', 
                        background: isChecked ? 'var(--bg-secondary)' : 'var(--bg-primary)', 
                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', 
                        borderRadius: 'var(--border-radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleToggleCategory(cat.name)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span>{cat.icon} {cat.name}</span>
                        </label>
                        {isChecked && (
                          <span style={{ fontSize: '14px', fontWeight: '800', color: cat.color }}>
                            Rs. {selectedCats[cat.name]}
                          </span>
                        )}
                      </div>

                      {isChecked && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input 
                            type="range" 
                            min="500" 
                            max={totalPool} 
                            step="500"
                            value={selectedCats[cat.name]}
                            onChange={e => handleAllocationValueChange(cat.name, e.target.value)}
                            style={{ cursor: 'pointer', height: '6px', padding: 0 }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                            <span>Min: Rs. 500</span>
                            <span>Max: Pool Limit</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inner Wizard form: Add Custom Category on-the-fly */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              {!showAddCat ? (
                <button 
                  type="button" 
                  onClick={() => setShowAddCat(true)}
                  style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} />
                  <span>Create Custom Category for this period</span>
                </button>
              ) : (
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>🆕 Add Custom Category (Will be remembered)</h4>
                  <form onSubmit={handleCreateCustomCategory} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Category Name" 
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      style={{ flex: 2, padding: '8px 12px', fontSize: '12px' }}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Emoji" 
                      value={newCatIcon}
                      onChange={e => setNewCatIcon(e.target.value)}
                      style={{ width: '60px', padding: '8px 12px', fontSize: '12px', textAlign: 'center' }}
                    />
                    <input 
                      type="color" 
                      value={newCatColor} 
                      onChange={e => setNewCatColor(e.target.value)}
                      style={{ width: '40px', height: '32px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }}>
                      Add &amp; Check
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddCat(false)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Step Navigation Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="btn-primary" 
                style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ChevronLeft size={16} />
                <span>Back Details</span>
              </button>
              <button 
                type="button" 
                onClick={handleCreatePlan} 
                className="btn-primary" 
                disabled={unallocatedRemaining < 0 || totalAllocated === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: (unallocatedRemaining < 0 || totalAllocated === 0) ? 0.5 : 1 }}
              >
                <Check size={16} />
                <span>Save &amp; Activate Plan</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Archived Plans History list */}
      <div className="glass-card">
        <h2 style={{ fontWeight: '800', fontSize: '1.125rem', marginBottom: '4px' }}>📁 Archived Budget Plans</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Historical performance of your past budgets.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {archivedPlans.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px' }}>No archived plans.</span>
          ) : (
            archivedPlans.map(p => {
              const { overallSpent } = calculatePlanSpent(p);
              const isOver = overallSpent > p.totalPool;
              const savings = p.totalPool - overallSpent;
              
              return (
                <div 
                  key={p.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 20px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: 'var(--border-radius-sm)', 
                    border: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{p.name}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.startDate} to {p.endDate} • Budget: Rs. {p.totalPool.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: '700' }}>Spent: Rs. {overallSpent.toLocaleString()}</span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        color: isOver ? 'var(--color-danger)' : 'var(--color-primary)' 
                      }}>
                        {isOver ? `Over limit by Rs. ${Math.abs(savings).toLocaleString()}` : `Saved Rs. ${savings.toLocaleString()}`}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        // Reactivate this plan
                        setBudgetPlans(budgetPlans.map(item => ({
                          ...item,
                          active: item.id === p.id
                        })));
                        alert(`Reactivated plan "${p.name}"`);
                      }}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                    >
                      Reactivate
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(p.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      title="Delete Archived Plan"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
