

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
    senderPatterns: [/global/i, /gbime/i],
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

const universalBankRules = [

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

  {
    regex: /(?:Paid|Transferred|Sent)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+to\s+(.*?)(?:\s+(?:via|ref:|\.|$))/i,
    type: 'expense',
    process: (m, sender) => ({
      amount: parseFloat(m[1].replace(/,/g, '')),
      accountMask: null,
      description: `Payment to ${m[2].trim()} (${sender})`
    })
  },

  {
    regex: /(?:Received)\s+(?:NPR|Rs\.?|NRs\.?)\s*([0-9,.]+)\s+from\s+(.*?)(?:\s+(?:via|ref:|\.|$))/i,
    type: 'income',
    process: (m, sender) => ({
      amount: parseFloat(m[1].replace(/,/g, '')),
      accountMask: null,
      description: `Received from ${m[2].trim()} (${sender})`
    })
  },

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

function parseSmartCombination(sender, body, matchedBank) {
  const cleanSender = sender.toString().trim();
  const cleanBody = body.trim();

  if (/(verification code|OTP|reset password|security code|login code)/i.test(cleanBody)) {
    return null;
  }

  let amount = null;

  const currencyMatch = cleanBody.match(/(?:NPR|Rs\.?|NRs\.?)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (currencyMatch) {
    const val = parseFloat(currencyMatch[1].replace(/,/g, ''));
    if (val > 0 && val <= 100000) {
      amount = val;
    }
  }

  if (!amount) {
    const matches = [...cleanBody.matchAll(/(?:amount|with|for|of|is|paid|pay|debited|debit|credited|credit|load|loaded|deposit|deposited|transferred|transfer|received|spent|payment|topup|recharge|by)?\s*(?:NPR|Rs\.?|NRs\.?)?\s*\b([0-9,]+(?:\.[0-9]{1,2})?)\b/gi)];
    for (const m of matches) {
      const candidateStr = (m[1] || '').replace(/,/g, '');
      const candidateVal = parseFloat(candidateStr);
      if (!isNaN(candidateVal) && candidateVal > 0 && candidateVal <= 100000 && !/^(98|97|96)\d{8}$/.test(candidateStr)) {
        amount = candidateVal;
        break;
      }
    }
  }

  if (!amount || isNaN(amount) || amount <= 0 || amount > 100000) {
    return null;
  }

  const isIncome = /(credited|credit|received|deposited|deposit|refunded|refund|cashback|added|inward|topup|income|plus)/i.test(cleanBody);
  const isExpense = /(debited|debit|paid|spent|withdrawn|withdrawal|transferred|transfer|sent|load|loaded|payment|purchased|charge|fee|outward|successful|completed|recharge)/i.test(cleanBody);

  let type = 'expense';
  if (isIncome && !isExpense) {
    type = 'income';
  } else if (isIncome && isExpense) {
    if (/credited|credit|received|deposited|deposit|refunded|cashback/i.test(cleanBody)) {
      type = 'income';
    }
  }

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

  let description = '';
  if (/fonepay/i.test(cleanBody)) {
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

function parseSMS(sender, body) {
  if (!sender || !body) return null;

  const cleanSender = sender.toString().trim();
  const cleanBody = body.trim();

  // Reject telecom, mobile data warnings, and promo messages
  const isTelecomOrPromo = /(ncell|ntc|namaste|smartcell|data usage|buy pack|voice pack|data pack|talk time|ncellapp|\bdial\s*\*)/i.test(cleanBody) ||
                           /^(ncell|ntc|namaste|smartcell)/i.test(cleanSender);
  if (isTelecomOrPromo) return null;

  const matchedBank = bankConfigs.find(b =>
    b.senderPatterns.some(pattern => pattern.test(cleanSender))
  );

  let parsed = null;
  if (matchedBank) {
    for (const rule of matchedBank.rules) {
      const match = cleanBody.match(rule.regex);
      if (match) {
        const result = rule.process(match, cleanSender);
        parsed = {
          ...result,
          type: result.type || rule.type,
          institution: matchedBank.name,
          accountType: 'bank'
        };
        break;
      }
    }
  }

  if (!parsed) {
    for (const rule of universalBankRules) {
      const match = cleanBody.match(rule.regex);
      if (match) {
        const result = rule.process(match, cleanSender);
        parsed = {
          ...result,
          type: result.type || rule.type,
          institution: matchedBank ? matchedBank.name : cleanSender,
          accountType: 'bank'
        };
        break;
      }
    }
  }

  if (!parsed) {
    parsed = parseSmartCombination(cleanSender, cleanBody, matchedBank);
  }

  if (parsed && parsed.amount > 100000) {
    return null;
  }

  return parsed;
}

module.exports = {
  parseSMS,
  bankConfigs
};
