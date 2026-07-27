-- BachatGara Normalized & Optimized Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    theme VARCHAR(50) DEFAULT 'dark',
    profile_name VARCHAR(100),
    avatar_url VARCHAR(255),
    net_savings NUMERIC(12, 2) DEFAULT 0.00,
    gateway_last_seen TIMESTAMP DEFAULT NULL,  -- Updated by Android app heartbeat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE (Hierarchical / Parent-Child Category Normalization)
-- Supports global system categories (user_id is NULL) and custom user categories.
-- parent_category_id enables subcategories (e.g., "Food" -> "Groceries" / "Restaurants").
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) DEFAULT 'tag',
    color VARCHAR(50) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name, type, parent_category_id)
);

-- 3. ACCOUNTS TABLE (Normalized Payment Sources, e.g., Cash, Bank Accounts, Wallets)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_mask VARCHAR(50),
    type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'bank', 'wallet', 'other')),
    currency VARCHAR(10) DEFAULT 'NPR',
    balance NUMERIC(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name)
);

-- 4. TRANSACTIONS TABLE (Unified Financial Ledger - Double-Entry Ledger Style)
-- - Expense: source_account_id is NOT NULL, destination_account_id is NULL.
-- - Income: source_account_id is NULL, destination_account_id is NOT NULL.
-- - Transfer: Both source_account_id and destination_account_id are NOT NULL.
-- This removes the redundant 'type' column, satisfying 3NF.
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Prevent empty transactions and self-transfers
    CONSTRAINT chk_transaction_accounts CHECK (source_account_id IS NOT NULL OR destination_account_id IS NOT NULL),
    CONSTRAINT chk_different_accounts CHECK (source_account_id IS NULL OR destination_account_id IS NULL OR source_account_id != destination_account_id)
);

-- 5. BUDGET PLANS & ALLOCATIONS TABLES (Replaces static monthly budgets)
CREATE TABLE IF NOT EXISTS budget_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_pool NUMERIC(12, 2) NOT NULL CHECK (total_pool >= 0),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES budget_plans(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    amount_limit NUMERIC(12, 2) NOT NULL CHECK (amount_limit >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (plan_id, category_name)
);

-- 6. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount >= 0),
    target_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SAVINGS CONTRIBUTIONS TABLE (Mapping junction table)
-- Normalizes savings progress by linking savings goals directly to the transactions ledger.
CREATE TABLE IF NOT EXISTS savings_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. SUBSCRIPTIONS TABLE (References funding source account)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    next_billing_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. SMS ALERTS TABLE (Queue from Android App)
CREATE TABLE IF NOT EXISTS sms_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sender VARCHAR(50) NOT NULL,
    raw_body TEXT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Global Categories
-- Incomes
INSERT INTO categories (id, user_id, name, type, icon, color) VALUES
(uuid_generate_v4(), NULL, 'Salary', 'income', '💼', '#10b981'),
(uuid_generate_v4(), NULL, 'Freelance', 'income', '💻', '#14b8a6'),
(uuid_generate_v4(), NULL, 'Investments', 'income', '📈', '#f59e0b'),
(uuid_generate_v4(), NULL, 'Gifts/Other', 'income', '🎁', '#ec4899')
ON CONFLICT DO NOTHING;

-- Expenses
INSERT INTO categories (id, user_id, name, type, icon, color) VALUES
(uuid_generate_v4(), NULL, 'Food & Drinks', 'expense', '🍔', '#f59e0b'),
(uuid_generate_v4(), NULL, 'Rent & Housing', 'expense', '🏠', '#3b82f6'),
(uuid_generate_v4(), NULL, 'Transportation', 'expense', '🚗', '#10b981'),
(uuid_generate_v4(), NULL, 'Entertainment', 'expense', '🍿', '#ec4899'),
(uuid_generate_v4(), NULL, 'Groceries', 'expense', '🛒', '#8b5cf6'),
(uuid_generate_v4(), NULL, 'Utilities & Bills', 'expense', '⚡', '#06b6d4'),
(uuid_generate_v4(), NULL, 'Insurance/Health', 'expense', '🏥', '#ec4899'),
(uuid_generate_v4(), NULL, 'Bank Fees / Charges', 'expense', '🏦', '#64748b'),
(uuid_generate_v4(), NULL, 'Other', 'expense', '📝', '#64748b')
ON CONFLICT DO NOTHING;

-- 10. OTPS TABLE (Temporary authentication tokens for registration and password reset)
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Query Optimization
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_source_acc ON transactions(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dest_acc ON transactions(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_plans_user ON budget_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_plan ON budget_allocations(plan_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal ON savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_alerts_user ON sms_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);

-- 10. TRIGGERS TO AUTOMATICALLY SYNC ACCOUNT BALANCES
CREATE OR REPLACE FUNCTION sync_account_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverse impact of old transaction (on UPDATE or DELETE)
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        -- If it was an expense or transfer, add the amount back to source account
        IF OLD.source_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.source_account_id;
        END IF;
        -- If it was an income or transfer, subtract the amount from destination account
        IF OLD.destination_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.destination_account_id;
        END IF;
    END IF;

    -- Apply impact of new transaction (on INSERT or UPDATE)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- If it is an expense or transfer, subtract the amount from source account
        IF NEW.source_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.source_account_id;
        END IF;
        -- If it is an income or transfer, add the amount to destination account
        IF NEW.destination_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.destination_account_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_account_balances
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION sync_account_balances();

