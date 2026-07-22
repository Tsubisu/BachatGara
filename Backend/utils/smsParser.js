/**
 * BachatGara Nepalese Bank SMS Parser Utility
 * Parses transaction SMS alerts from all major Nepalese Commercial & Development Banks.
 * Supports alphanumeric sender IDs (e.g. NABIL, NIMB, NICASIA, NMB, GLOBAL) and 
 * numeric shortcodes (e.g. 34001, 34400, 31003, 35001, 32244, 5712, 36001, 34343, 35555).
 * Digital wallets (eSewa, Khalti) are excluded as per tracking requirements.
 */

const bankConfigs = [
  {
    name: 'NMB Bank',
    senderPatterns: [/nmb/i, /^37447$/, /^34001$/],
    rules: [
      {
        regex: /Fund\s+transfer\s+of\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+(to|from)\s+(?:A\/C|Account|Acc|A\/c|Ac)?\s*([X*#\d]+)?/i,
        process: (m) => {
          const isExpense = m[2].toLowerCase() === 'to';
          return {
            amount: parseFloat(m[1].replace(/,/g, '')),
            type: isExpense ? 'expense' : 'income',
            accountMask: m[3] || null,
            description: m[3] ? `Fund transfer ${m[2].toLowerCase() === 'to' ? 'to' : 'from'} A/C ${m[3]}` : 'NMB Bank Fund Transfer'
          };
        }
      },
      {
        regex: /(?:Fund\s+transfer\s+to\s+(.*?)(?:\s+A\/C)?\s+)?(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+(?:has\s+been\s+)?debited\s+from\s+(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[3],
          description: m[1] ? `Fund transfer to ${m[1].trim()}` : 'Debit from NMB Bank'
        })
      },
      {
        regex: /(?:(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+credited\s+by\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+))|(?:Fund\s+transfer\s+of\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+received\s+from\s+(.*?)(?:\s+to|\.|$))/i,
        type: 'income',
        process: (m) => {
          const amt = m[2] || m[3];
          const senderName = m[4] ? `From ${m[4].trim()}` : 'Credit to NMB Bank';
          return {
            amount: parseFloat(amt.replace(/,/g, '')),
            accountMask: m[1] || null,
            description: senderName
          };
        }
      }
    ]
  },
  {
    name: 'Nabil Bank',
    senderPatterns: [/nabil/i, /^34488$/, /^32222$/, /^34400$/],
    rules: [
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+(?:is|has\s+been)\s+debited\s+(?:by|with|for)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bInfo:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Debit from Nabil Bank'
        })
      },
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+(?:is|has\s+been)\s+credited\s+(?:by|with|for)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bInfo:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Credit to Nabil Bank'
        })
      }
    ]
  },
  {
    name: 'Global IME Bank',
    senderPatterns: [/global/i, /gbime/i, /^31003$/],
    rules: [
      {
        regex: /(?:debited\s+(?:by|for|with)?\s*(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+(?:from|for|towards)\s+(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+))|(?:(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+has\s+been\s+debited\s+by\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:\s+for\s+(.*?)(?:\.|$)|$))/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat((m[1] || m[4]).replace(/,/g, '')),
          accountMask: m[2] || m[3],
          description: m[5] ? `Payment for ${m[5].trim()}` : 'Debit from Global IME Bank'
        })
      },
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+has\s+been\s+credited\s+(?:with|by)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:\s+for\s+(.*?)(?:\.|$)|$)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Credit to Global IME Bank'
        })
      }
    ]
  },
  {
    name: 'NIC Asia Bank',
    senderPatterns: [/nicasia/i, /nica/i, /^32244$/],
    rules: [
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+(?:has\s+been\s+)?debited\s+(?:by|for)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bRemarks:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Debit from NIC Asia'
        })
      },
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+(?:has\s+been\s+)?credited\s+(?:by|for)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bRemarks:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Credit to NIC Asia'
        })
      }
    ]
  },
  {
    name: 'Nepal Investment Mega Bank',
    senderPatterns: [/nimb/i, /^35001$/],
    rules: [
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+is\s+debited\s+with\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bRef:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? `Ref: ${m[3].trim()}` : 'Debit from NIMB'
        })
      },
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+is\s+credited\s+with\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bRef:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? `Ref: ${m[3].trim()}` : 'Credit to NIMB'
        })
      }
    ]
  },
  {
    name: 'Prabhu Bank',
    senderPatterns: [/prabhu/i, /prvu/i, /^36001$/],
    rules: [
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+debited\s+by\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:\s+towards\s+(.*?)(?:\.|$)|$)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Debit from Prabhu Bank'
        })
      },
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+credited\s+by\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:\s+towards\s+(.*?)(?:\.|$)|$)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Credit to Prabhu Bank'
        })
      }
    ]
  },
  {
    name: 'Sanima Bank',
    senderPatterns: [/sanima/i, /^35555$/],
    rules: [
      {
        regex: /(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+debited\s+from\s+(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)(?:\s+for\s+(.*?)(?:\.|$)|$)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[1].replace(/,/g, '')),
          accountMask: m[2],
          description: m[3] ? m[3].trim() : 'Debit from Sanima Bank'
        })
      },
      {
        regex: /(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+credited\s+to\s+(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)(?:\s+for\s+(.*?)(?:\.|$)|$)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[1].replace(/,/g, '')),
          accountMask: m[2],
          description: m[3] ? m[3].trim() : 'Credit to Sanima Bank'
        })
      }
    ]
  },
  {
    name: 'Siddhartha Bank',
    senderPatterns: [/sbl/i, /siddhartha/i, /^34343$/],
    rules: [
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+debited\s+by\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bInfo:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Debit from Siddhartha Bank'
        })
      },
      {
        regex: /(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)\s+credited\s+by\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\bInfo:\s*(.*?)(?:\.|$)|.*)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[2].replace(/,/g, '')),
          accountMask: m[1],
          description: m[3] ? m[3].trim() : 'Credit to Siddhartha Bank'
        })
      }
    ]
  },
  {
    name: 'Kumari Bank',
    senderPatterns: [/kumari/i, /kbl/i, /^5712$/],
    rules: [
      {
        regex: /(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+debited\s+from\s+(?:your\s+)?(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)(?:\s+for\s+(.*?)(?:\.|$)|$)/i,
        type: 'expense',
        process: (m) => ({
          amount: parseFloat(m[1].replace(/,/g, '')),
          accountMask: m[2],
          description: m[3] ? m[3].trim() : 'Debit from Kumari Bank'
        })
      },
      {
        regex: /(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+credited\s+to\s+(?:your\s+)?(?:A\/C|Account|Acc|A\/c|Ac)\s*([X*#\d]+)(?:\s+for\s+(.*?)(?:\.|$)|$)/i,
        type: 'income',
        process: (m) => ({
          amount: parseFloat(m[1].replace(/,/g, '')),
          accountMask: m[2],
          description: m[3] ? m[3].trim() : 'Credit to Kumari Bank'
        })
      }
    ]
  },
  {
    name: 'Agriculture Development Bank',
    senderPatterns: [/adbl/i, /^32425$/],
    rules: []
  },
  {
    name: 'Citizens Bank International',
    senderPatterns: [/czbil/i, /citizen/i, /^37788$/],
    rules: []
  },
  {
    name: 'Everest Bank',
    senderPatterns: [/ebl/i, /everest/i],
    rules: []
  },
  {
    name: 'Himalayan Bank',
    senderPatterns: [/hbl/i, /himalayan/i],
    rules: []
  },
  {
    name: 'Laxmi Sunrise Bank',
    senderPatterns: [/lsb/i, /lsbl/i, /laxmi/i],
    rules: []
  },
  {
    name: 'Machhapuchchhre Bank',
    senderPatterns: [/mbl/i, /machhapuchchhre/i],
    rules: []
  },
  {
    name: 'Nepal Bank',
    senderPatterns: [/nbl/i, /^33232$/],
    rules: []
  },
  {
    name: 'Nepal SBI Bank',
    senderPatterns: [/nsbl/i, /sbi/i],
    rules: []
  },
  {
    name: 'Prime Commercial Bank',
    senderPatterns: [/pcbl/i, /prime/i],
    rules: []
  },
  {
    name: 'Rastriya Banijya Bank',
    senderPatterns: [/rbbl/i, /rbb/i, /^2022$/, /^32022$/],
    rules: []
  },
  {
    name: 'Standard Chartered Bank',
    senderPatterns: [/scb/i, /standard/i],
    rules: []
  }
];

// Universal Fallback Bank Parser Rules
// Applies to any bank shortcode or text sender ID not explicitly listed above
const universalBankRules = [
  // Rule A: "A/C / Account / Acc XXXX has been debited/credited/withdrawn/deposited with/by/for NPR 1,000"
  {
    regex: /(?:A\/C|Account|Acc|A\/c|Ac|Acct|Account No|A\/C No\.?)\s*([X*#\d]+)?\s*(?:has\s+been|is)?\s*(debited|credited|withdrawn|deposited|transferred|paid)\s+(?:by|with|for|from|to)?\s*(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)(?:.*?\b(?:for|Info:|Remarks:|towards|ref:)\s*(.*?)(?:\.|$)|.*)/i,
    process: (m, sender) => {
      const action = m[2].toLowerCase();
      const isExpense = ['debited', 'withdrawn', 'transferred', 'paid'].includes(action);
      return {
        amount: parseFloat(m[3].replace(/,/g, '')),
        type: isExpense ? 'expense' : 'income',
        accountMask: m[1] || null,
        description: m[4] && m[4].trim() ? m[4].trim() : `${isExpense ? 'Debit' : 'Credit'} alert from ${sender}`
      };
    }
  },
  // Rule B: "NPR 1,000 debited/credited/withdrawn/deposited from/to A/C / Account XXXX"
  {
    regex: /(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+(debited|credited|withdrawn|deposited|transferred|paid)\s+(?:from|to|in|for)\s+(?:A\/C|Account|Acc|A\/c|Ac|Acct|Account No)?\s*([X*#\d]+)?(?:.*?\b(?:for|Info:|Remarks:|towards|ref:)\s*(.*?)(?:\.|$)|.*)/i,
    process: (m, sender) => {
      const action = m[2].toLowerCase();
      const isExpense = ['debited', 'withdrawn', 'transferred', 'paid'].includes(action);
      return {
        amount: parseFloat(m[1].replace(/,/g, '')),
        type: isExpense ? 'expense' : 'income',
        accountMask: m[3] || null,
        description: m[4] && m[4].trim() ? m[4].trim() : `${isExpense ? 'Debit' : 'Credit'} alert from ${sender}`
      };
    }
  },
  // Rule C: "Debit/Credit/Withdrawal/Deposit of NPR 1,000 from/to A/C XXXX"
  {
    regex: /(Debit|Credit|Withdrawal|Deposit)\s+(?:of\s+)?(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+(?:from|to|in|for)?\s+(?:A\/C|Account|Acc|A\/c|Ac)?\s*([X*#\d]+)?(?:.*?\b(?:for|Info:|Remarks:|towards|ref:)\s*(.*?)(?:\.|$)|.*)/i,
    process: (m, sender) => {
      const action = m[1].toLowerCase();
      const isExpense = ['debit', 'withdrawal'].includes(action);
      return {
        amount: parseFloat(m[2].replace(/,/g, '')),
        type: isExpense ? 'expense' : 'income',
        accountMask: m[3] || null,
        description: m[4] && m[4].trim() ? m[4].trim() : `${isExpense ? 'Debit' : 'Credit'} alert from ${sender}`
      };
    }
  },
  // Rule D: "Paid/Transferred NPR 1,000 to XXX via Fonepay/ConnectIPS/IBFT"
  {
    regex: /(?:Paid|Transferred|Sent)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+to\s+(.*?)(?:\s+(?:via|ref:|\.|$))/i,
    type: 'expense',
    process: (m, sender) => ({
      amount: parseFloat(m[1].replace(/,/g, '')),
      accountMask: null,
      description: `Payment to ${m[2].trim()} (${sender})`
    })
  },
  // Rule E: "Received NPR 1,000 from XXX"
  {
    regex: /(?:Received)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+from\s+(.*?)(?:\s+(?:via|ref:|\.|$))/i,
    type: 'income',
    process: (m, sender) => ({
      amount: parseFloat(m[1].replace(/,/g, '')),
      accountMask: null,
      description: `Received from ${m[2].trim()} (${sender})`
    })
  },
  // Rule F: Catch-all fallback for any financial bank alert containing debit/credit/withdrawn/deposited and amount
  {
    regex: /(debited|credited|withdrawn|deposited|transferred|paid|received)\s+(?:.*?\b)?(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)/i,
    process: (m, sender) => {
      const action = m[1].toLowerCase();
      const isExpense = ['debited', 'withdrawn', 'transferred', 'paid'].includes(action);
      return {
        amount: parseFloat(m[2].replace(/,/g, '')),
        type: isExpense ? 'expense' : 'income',
        accountMask: null,
        description: `${isExpense ? 'Debit' : 'Credit'} alert from ${sender}`
      };
    }
  },
  // Rule G: "Fund transfer of NPR 1,000 to/from A/C XXXX was successful"
  {
    regex: /Fund\s+transfer\s+of\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+(to|from)\s+(?:A\/C|Account|Acc|A\/c|Ac)?\s*([X*#\d]+)?(?:\s+(?:was\s+successful|successful|completed))?/i,
    process: (m, sender) => {
      const direction = m[2].toLowerCase();
      const isExpense = direction === 'to';
      return {
        amount: parseFloat(m[1].replace(/,/g, '')),
        type: isExpense ? 'expense' : 'income',
        accountMask: m[3] || null,
        description: m[3] ? `Fund transfer ${direction === 'to' ? 'to' : 'from'} A/C ${m[3]}` : `Fund transfer alert from ${sender}`
      };
    }
  }
];

/**
 * Smart combination parser:
 * Dynamically extracts Amount, Transaction Type (expense/income), Account Mask, and Context
 * from ANY bank SMS pattern regardless of sentence structure or wording.
 */
function parseSmartCombination(sender, body, matchedBank) {
  const cleanSender = sender.toString().trim();
  const cleanBody = body.trim();

  // 1. Ignore OTPs and Security Codes
  if (/(verification code|OTP|reset password|security code|login code)/i.test(cleanBody)) {
    return null;
  }

  // 2. Extract Amount
  let amount = null;
  // Match currency prefix (NPR 500, NRs 500, Rs. 500.00)
  const currencyMatch = cleanBody.match(/(?:NPR|Rs\.?|NRs\.?)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (currencyMatch) {
    amount = parseFloat(currencyMatch[1].replace(/,/g, ''));
  } else {
    // Match number before/after amount keywords (e.g., "esewa 500 amount is completed", "amount 500")
    const amountKeywordMatch = cleanBody.match(/(?:amount|with|for|of|is)\s*(?:NPR|Rs\.?|NRs\.?)?\s*([0-9,]+(?:\.[0-9]{1,2})?)|([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:amount|npr|rs\.?)/i);
    if (amountKeywordMatch) {
      const val = amountKeywordMatch[1] || amountKeywordMatch[2];
      amount = parseFloat(val.replace(/,/g, ''));
    }
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return null; // Not a financial transaction SMS with valid amount
  }

  // 3. Determine Transaction Type
  const isIncome = /(credited|credit|received|deposited|deposit|refunded|refund|cashback|added to)/i.test(cleanBody);
  const isExpense = /(debited|debit|paid|spent|withdrawn|withdrawal|transferred|transfer|sent|load|payment|purchased|charge|fee|successful|completed)/i.test(cleanBody);

  let type = 'expense';
  if (isIncome && !isExpense) {
    type = 'income';
  } else if (isIncome && isExpense) {
    if (/credited/i.test(cleanBody) || /received/i.test(cleanBody) || /deposited/i.test(cleanBody)) {
      type = 'income';
    }
  }

  // 4. Extract Account Mask if present
  let accountMask = null;
  const maskMatch = cleanBody.match(/(?:A\/C|Account|Acc|A\/c|Ac|Card|A\/C No\.?)\s*([X*#\d]{4,20})/i);
  if (maskMatch) {
    accountMask = maskMatch[1];
  } else {
    const standaloneMaskMatch = cleanBody.match(/\b([0-9]*[*#X]{2,}[0-9]+)\b/i);
    if (standaloneMaskMatch) {
      accountMask = standaloneMaskMatch[1];
    }
  }

  // 5. Build Contextual Description
  let description = '';
  if (/esewa/i.test(cleanBody)) {
    description = 'eSewa Wallet Load / Payment';
  } else if (/khalti/i.test(cleanBody)) {
    description = 'Khalti Wallet Load / Payment';
  } else if (/fonepay/i.test(cleanBody)) {
    description = 'Fonepay Merchant Payment';
  } else if (/connectips/i.test(cleanBody)) {
    description = 'connectIPS Transfer';
  } else {
    description = cleanBody.length > 60 ? cleanBody.substring(0, 57) + '...' : cleanBody;
  }

  return {
    amount,
    type,
    accountMask,
    description,
    institution: matchedBank ? matchedBank.name : cleanSender,
    accountType: 'bank'
  };
}

/**
 * Parses an incoming bank SMS text and sender ID
 * @param {string} sender - SMS sender ID (e.g. 'NABIL', '34001', '5712')
 * @param {string} body - SMS message content
 * @returns {object|null} Parsed transaction object or null
 */
function parseSMS(sender, body) {
  if (!sender || !body) return null;

  const cleanSender = sender.toString().trim();
  const cleanBody = body.trim();

  // 1. Try bank-specific matching
  const matchedBank = bankConfigs.find(b =>
    b.senderPatterns.some(pattern => pattern.test(cleanSender))
  );

  if (matchedBank) {
    for (const rule of matchedBank.rules) {
      const match = cleanBody.match(rule.regex);
      if (match) {
        const result = rule.process(match, cleanSender);
        return {
          ...result,
          type: result.type || rule.type,
          institution: matchedBank.name,
          accountType: 'bank'
        };
      }
    }
  }

  // 2. Try universal fallback rules for any other Nepalese Bank / shortcode
  for (const rule of universalBankRules) {
    const match = cleanBody.match(rule.regex);
    if (match) {
      const result = rule.process(match, cleanSender);
      return {
        ...result,
        type: result.type || rule.type,
        institution: matchedBank ? matchedBank.name : cleanSender,
        accountType: 'bank'
      };
    }
  }

  // 3. Smart Combination Fallback: Dynamically extract amount, type, mask, and context
  return parseSmartCombination(cleanSender, cleanBody, matchedBank);
}

module.exports = {
  parseSMS,
  bankConfigs
};
