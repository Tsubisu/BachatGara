const { parseSMS } = require('../utils/smsParser');

describe('BachatGara Nepalese Bank SMS Parser Utility', () => {

  describe('Nabil Bank', () => {
    test('parses debit SMS accurately', () => {
      const sender = 'NABIL';
      const body = 'A/C *1234 has been debited by NPR 1,500.50 Info: Fonepay Merchant Payment.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(1500.50);
      expect(result.accountMask).toBe('*1234');
      expect(result.institution).toBe('Nabil Bank');
      expect(result.description).toBe('Fonepay Merchant Payment');
    });

    test('parses credit SMS accurately', () => {
      const sender = '34400';
      const body = 'A/C *5678 is credited with Rs. 25,000.00 Info: Salary Deposit.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('income');
      expect(result.amount).toBe(25000);
      expect(result.accountMask).toBe('*5678');
      expect(result.institution).toBe('Nabil Bank');
    });
  });

  describe('NMB Bank', () => {
    test('parses fund transfer debit', () => {
      const sender = 'NMB';
      const body = 'Fund transfer to Ram Sharma NPR 3,000.00 has been debited from A/C *9999';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(3000);
      expect(result.accountMask).toBe('*9999');
      expect(result.institution).toBe('NMB Bank');
      expect(result.description).toBe('Fund transfer to Ram Sharma');
    });

    test('parses exact NMB Bank successful fund transfer format', () => {
      const sender = '37447';
      const body = 'Fund transfer of NPR 100.00 to A/C 2860701***296 was successful on 21-Jul-2026 12:28:06 If you have not done this transfer please contact us immediately.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(100);
      expect(result.accountMask).toBe('2860701***296');
      expect(result.institution).toBe('NMB Bank');
      expect(result.description).toBe('Fund transfer to A/C 2860701***296');
    });
  });

  describe('Global IME Bank', () => {
    test('parses debit SMS', () => {
      const sender = 'GBIME';
      const body = 'A/C *4321 has been debited by NPR 500 for Mobile Topup.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(500);
      expect(result.accountMask).toBe('*4321');
      expect(result.institution).toBe('Global IME Bank');
    });
  });

  describe('NIC Asia Bank', () => {
    test('parses debit SMS with Remarks', () => {
      const sender = 'NICASIA';
      const body = 'A/C *1111 has been debited for NPR 4,200.00 Remarks: Supermarket Purchase.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(4200);
      expect(result.accountMask).toBe('*1111');
      expect(result.institution).toBe('NIC Asia Bank');
    });
  });

  describe('Universal Fallback Bank Parser', () => {
    test('parses debit SMS for unknown bank shortcode', () => {
      const sender = '99999';
      const body = 'A/C *7777 has been debited by NPR 1,200 for Restaurant Bill.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(1200);
      expect(result.accountMask).toBe('*7777');
      expect(result.institution).toBe('99999');
    });

    test('parses Account / Acc / NRs variations cleanly', () => {
      const sender = 'NEPALBANK';
      const body = 'Your Account *8888 has been debited with NRs. 3,500.00 for QR Merchant Payment.';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(3500);
      expect(result.accountMask).toBe('*8888');
      expect(result.institution).toBe('NEPALBANK');
    });
  });

  describe('Smart Combination Parser', () => {
    test('parses NMB yasa wallet load for esewa', () => {
      const sender = 'NMB';
      const body = 'my nmb yasa wallet load for esewa 500 amount is completed';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(500);
      expect(result.institution).toBe('NMB Bank');
      expect(result.description).toBe('eSewa Wallet Load / Payment');
    });

    test('parses payment successful to esewa with amount', () => {
      const sender = '34488';
      const body = 'payment successful to esewa with NPR 500';
      const result = parseSMS(sender, body);

      expect(result).not.toBeNull();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(500);
      expect(result.description).toBe('eSewa Wallet Load / Payment');
    });
  });

  describe('Non-bank / Spam / OTP Filtering', () => {
    test('returns null for OTP message', () => {
      const sender = 'NABIL';
      const body = 'Your verification code / OTP for Nabil Online Banking is 549102.';
      const result = parseSMS(sender, body);

      expect(result).toBeNull();
    });

    test('returns null for personal chat text', () => {
      const sender = '+9779801234567';
      const body = 'Hey, are we still meeting for lunch today?';
      const result = parseSMS(sender, body);

      expect(result).toBeNull();
    });
  });

});
