const alertRepo = require('../repositories/alertRepository');
const accountRepo = require('../repositories/accountRepository');
const categoryRepo = require('../repositories/categoryRepository');
const txRepo = require('../repositories/transactionRepository');
const { parseSMS } = require('../utils/smsParser');
const AppError = require('../utils/AppError');
const db = require('../db');

const listAlerts = (userId) => alertRepo.findUnresolvedByUser(userId);

const syncAlert = async (userId, { sender, body, timestamp }) => {
  const divider = '='.repeat(60);
  console.log(`\n${divider}`);
  console.log(`[SMS BACKEND] 📩 STEP 1: Incoming SMS Received`);
  console.log(`  ► Associated User ID : ${userId}`);
  console.log(`  ► Sender Header/Num  : ${sender}`);
  console.log(`  ► Raw SMS Content    : "${body}"`);
  console.log(`  ► Timestamp Received : ${timestamp || 'N/A (using server time)'}`);

  const parsed = parseSMS(sender, body);
  if (!parsed) {
    console.log(`[SMS BACKEND] ❌ STEP 2: SMS Parsing Failed! Unrecognized format.`);
    console.log(`  ► Reason: No bank parser rules matched sender "${sender}" and body content.`);
    console.log(`${divider}\n`);
    throw new AppError('Unrecognized SMS pattern — could not extract financial data.', 422);
  }

  console.log(`[SMS BACKEND] ✅ STEP 2: SMS Parsed Successfully`);
  console.log(`  ► Institution   : ${parsed.institution}`);
  console.log(`  ► Transaction   : ${parsed.type.toUpperCase()}`);
  console.log(`  ► Amount        : NPR ${parsed.amount}`);
  console.log(`  ► Account Mask  : ${parsed.accountMask || 'N/A'}`);
  console.log(`  ► Description   : ${parsed.description || 'N/A'}`);

  const accounts = await accountRepo.findAllByUser(userId);
  const accountCount = accounts ? accounts.length : 0;
  console.log(`[SMS BACKEND] 🔍 STEP 3: User Bank Account Lookup`);
  console.log(`  ► Total Configured Accounts for User ${userId}: ${accountCount}`);
  if (accounts && accounts.length > 0) {
    accounts.forEach((acc, idx) => {
      console.log(`     [Account ${idx + 1}] Name: "${acc.name}", Mask: "${acc.account_mask || 'None'}", Type: ${acc.type}`);
    });
  }

  if (!accounts || accounts.length === 0) {
    console.log(`[SMS BACKEND] ⚠️ STEP 3 FAILED: User ${userId} has NO bank accounts added in BachatGara!`);
    console.log(`${divider}\n`);
    throw new AppError('No bank accounts configured. Please add your bank account in Account Settings first.', 400);
  }

  const tickerAliases = {
    'adbl': 'agriculture development bank',
    'czbil': 'citizens bank',
    'ebl': 'everest bank',
    'gbime': 'global ime bank',
    'hbl': 'himalayan bank',
    'kbl': 'kumari bank',
    'kumari': 'kumari bank',
    'lsb': 'laxmi sunrise bank',
    'lsbl': 'laxmi sunrise bank',
    'mbl': 'machhapuchchhre bank',
    'nabil': 'nabil bank',
    'nbl': 'nepal bank',
    'nimb': 'nepal investment mega bank',
    'nsbl': 'nepal sbi bank',
    'nica': 'nic asia bank',
    'nicasia': 'nic asia bank',
    'nmb': 'nmb bank',
    'prvu': 'prabhu bank',
    'prabhu': 'prabhu bank',
    'pcbl': 'prime commercial bank',
    'prime': 'prime commercial bank',
    'rbbl': 'rastriya banijya bank',
    'rbb': 'rastriya banijya bank',
    'sanima': 'sanima bank',
    'sbl': 'siddhartha bank',
    'scb': 'standard chartered bank'
  };

  let matchedAccount = accounts.find(a => {
    if (parsed.accountMask && a.account_mask) {
      const cleanMask = a.account_mask.replace(/[*#]/g, '').toLowerCase();
      const cleanParsedMask = parsed.accountMask.replace(/[*#]/g, '').toLowerCase();
      if (cleanMask && cleanParsedMask && (cleanMask.includes(cleanParsedMask) || cleanParsedMask.includes(cleanMask))) {
        return true;
      }
    }
    const accountName = a.name.toLowerCase();
    const instName = parsed.institution.toLowerCase();
    const aliasName = tickerAliases[instName] || instName;

    return accountName.includes(instName) || instName.includes(accountName) ||
           accountName.includes(aliasName) || aliasName.includes(accountName);
  });

  if (!matchedAccount && accounts.length === 1) {
    matchedAccount = accounts[0];
    console.log(`[SMS BACKEND] ℹ️ Single-Account Fallback Applied: Associated SMS with user's only account "${matchedAccount.name}".`);
  }

  if (!matchedAccount) {
    console.log(`[SMS BACKEND] ⚠️ STEP 3 MATCH RESULT: NO MATCHING ACCOUNT`);
    console.log(`  ► Reason: Parsed institution "${parsed.institution}" (mask: "${parsed.accountMask || 'N/A'}") does not match any of the ${accountCount} user account(s).`);
    console.log(`  ► Action: Alert ignored (not queued).`);
    console.log(`${divider}\n`);
    return {
      status: 'ignored',
      message: `Ignored SMS alert from ${parsed.institution} because this bank account is not added in your Account Settings.`,
    };
  }

  console.log(`[SMS BACKEND] ✅ STEP 3 MATCH RESULT: MATCH FOUND!`);
  console.log(`  ► Matched Account Name : "${matchedAccount.name}" (ID: ${matchedAccount.id})`);

  const createdAlert = await alertRepo.create(userId, {
    timestamp,
    sender,
    raw_body: body,
    bank_name: matchedAccount.name,
    amount: parsed.amount,
    type: parsed.type === 'expense' ? 'debit' : 'credit',
  });

  console.log(`[SMS BACKEND] 💾 STEP 4: SMS Alert Saved in Database & Queued for User`);
  console.log(`  ► Alert ID      : ${createdAlert.id}`);
  console.log(`  ► Status        : Pending Resolution (Unresolved)`);
  console.log(`${divider}\n`);

  return createdAlert;
};

const resolveAlert = async (alertId, userId, { description, category_name, is_transfer, dest_account_id, service_fee }) => {
  const alert = await alertRepo.findById(alertId, userId);
  if (!alert) throw new AppError('Alert not found.', 404);
  if (alert.resolved) throw new AppError('Alert is already resolved.', 400);

  const accounts = await accountRepo.findAllByUser(userId);
  const sourceAccount = accounts.find(a => a.name.toLowerCase() === alert.bank_name.toLowerCase())
    || accounts[0];
  if (!sourceAccount) throw new AppError('No tracked accounts configured.', 400);

  let categoryId = null;
  if (category_name) {
    const cat = await categoryRepo.findByName(category_name, userId);
    if (cat) categoryId = cat.id;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (is_transfer && alert.type === 'debit') {
      if (!dest_account_id) throw new AppError('Destination account is required for a transfer.', 400);

      await client.query(
        `INSERT INTO transactions (user_id, source_account_id, destination_account_id, amount, description, date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, sourceAccount.id, dest_account_id, alert.amount, description, alert.timestamp]
      );

      if (service_fee > 0) {
        const feeCat = await categoryRepo.findByNameGlobal('Bank Fees / Charges');
        await client.query(
          `INSERT INTO transactions (user_id, source_account_id, category_id, amount, description, date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, sourceAccount.id, feeCat?.id || null, service_fee, 'Transfer Fee', alert.timestamp]
        );
      }
    } else {
      if (alert.type === 'debit') {
        await client.query(
          `INSERT INTO transactions (user_id, source_account_id, category_id, amount, description, date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, sourceAccount.id, categoryId, alert.amount, description, alert.timestamp]
        );
      } else {
        await client.query(
          `INSERT INTO transactions (user_id, destination_account_id, category_id, amount, description, date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, sourceAccount.id, categoryId, alert.amount, description, alert.timestamp]
        );
      }
    }

    await client.query('UPDATE sms_alerts SET resolved = true WHERE id = $1', [alertId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const discardAlert = async (alertId, userId) => {
  const deleted = await alertRepo.remove(alertId, userId);
  if (!deleted) throw new AppError('Alert not found or unauthorized.', 404);
};

module.exports = { listAlerts, syncAlert, resolveAlert, discardAlert };
