const alertService = require('../services/alertService');
const alertRepo = require('../repositories/alertRepository');
const accountRepo = require('../repositories/accountRepository');
const AppError = require('../utils/AppError');

jest.mock('../repositories/alertRepository');
jest.mock('../repositories/accountRepository');

describe('alertService.syncAlert', () => {
  const userId = 42;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully syncs bank alert when user has matching bank account', async () => {
    accountRepo.findAllByUser.mockResolvedValue([
      { id: 10, user_id: userId, name: 'Nabil Bank', account_mask: '*1234', type: 'bank' }
    ]);

    alertRepo.create.mockResolvedValue({
      id: 101,
      user_id: userId,
      bank_name: 'Nabil Bank',
      amount: 1500,
      type: 'debit',
      resolved: false
    });

    const result = await alertService.syncAlert(userId, {
      sender: 'NABIL',
      body: 'A/C *1234 has been debited by NPR 1,500. Info: Supermarket.',
      timestamp: '2026-07-21 12:00:00'
    });

    expect(accountRepo.findAllByUser).toHaveBeenCalledWith(userId);
    expect(alertRepo.create).toHaveBeenCalledWith(userId, expect.objectContaining({
      bank_name: 'Nabil Bank',
      amount: 1500,
      type: 'debit'
    }));
    expect(result.id).toBe(101);
  });

  test('throws 422 for unrecognized SMS pattern', async () => {
    await expect(alertService.syncAlert(userId, {
      sender: 'NABIL',
      body: 'Hello world this is not a transaction sms',
      timestamp: '2026-07-21 12:00:00'
    })).rejects.toThrow(AppError);
  });

  test('throws 400 when user has no bank accounts configured', async () => {
    accountRepo.findAllByUser.mockResolvedValue([]);

    await expect(alertService.syncAlert(userId, {
      sender: 'NABIL',
      body: 'A/C *1234 has been debited by NPR 1,500. Info: Grocery.',
      timestamp: '2026-07-21 12:00:00'
    })).rejects.toThrow(AppError);
  });

  test('returns status ignored when SMS bank does not match user configured accounts', async () => {
    accountRepo.findAllByUser.mockResolvedValue([
      { id: 20, user_id: userId, name: 'Sanima Bank', account_mask: '*9999', type: 'bank' },
      { id: 21, user_id: userId, name: 'Global IME Bank', account_mask: '*8888', type: 'bank' }
    ]);

    const result = await alertService.syncAlert(userId, {
      sender: 'NABIL',
      body: 'A/C *1234 has been debited by NPR 1,500. Info: Grocery.',
      timestamp: '2026-07-21 12:00:00'
    });

    expect(result.status).toBe('ignored');
    expect(result.message).toContain('Ignored SMS alert from Nabil Bank');
    expect(alertRepo.create).not.toHaveBeenCalled();
  });

  test('applies single-account fallback when user has only 1 configured account', async () => {
    accountRepo.findAllByUser.mockResolvedValue([
      { id: 20, user_id: userId, name: 'Sanima Bank', account_mask: '*9999', type: 'bank' }
    ]);

    alertRepo.create.mockResolvedValue({
      id: 102,
      user_id: userId,
      bank_name: 'Sanima Bank',
      amount: 1500,
      type: 'debit',
      resolved: false
    });

    const result = await alertService.syncAlert(userId, {
      sender: 'NABIL',
      body: 'A/C *1234 has been debited by NPR 1,500. Info: Grocery.',
      timestamp: '2026-07-21 12:00:00'
    });

    expect(result.id).toBe(102);
    expect(alertRepo.create).toHaveBeenCalledWith(userId, expect.objectContaining({
      bank_name: 'Sanima Bank'
    }));
  });
});
