const fs = require('fs');
const path = require('path');
const db = require('./db');

const bankList = [
  { name: 'Agriculture Development Bank', filename: 'AgriculturalDevelopmentBank.jfif' },
  { name: 'Citizens Bank International', filename: 'CitizensBank.png' },
  { name: 'Everest Bank', filename: 'EverestBank.jpg' },
  { name: 'Global IME Bank', filename: 'GlobalIME.png' },
  { name: 'Himalayan Bank', filename: 'HimalayanBank.jfif' },
  { name: 'Kumari Bank', filename: 'KumariBank.jfif' },
  { name: 'Laxmi Sunrise Bank', filename: 'LaxmiSunrise.png' },
  { name: 'Machhapuchchhre Bank', filename: 'MachhapuchreBank.png' },
  { name: 'NIC Asia Bank', filename: 'NIC_ASIA.jfif' },
  { name: 'NMB Bank', filename: 'NMB.jfif' },
  { name: 'Nabil Bank', filename: 'NabilBank.jfif' },
  { name: 'Nepal Bank', filename: 'NepalBankLimited.jfif' },
  { name: 'Nepal Investment Mega Bank', filename: 'NepalInvestmentMegaBannk.jfif' },
  { name: 'Prabhu Bank', filename: 'PrabhuBank.png' },
  { name: 'Prime Commercial Bank', filename: 'Prime.jfif' },
  { name: 'Rastriya Banijya Bank', filename: 'RastriyaBanikya.png' },
  { name: 'Sanima Bank', filename: 'SanimaBank.png' },
  { name: 'Siddhartha Bank', filename: 'SiddharthaBank.png' },
  { name: 'Standard Chartered Bank', filename: 'StandareCharteredBank.png' },
];

function getImageDataUri(filename) {
  const rootBankLogoDir = path.join(__dirname, '..', 'BankLogo');
  const targetPath = path.join(rootBankLogoDir, filename);

  if (fs.existsSync(targetPath)) {
    const ext = path.extname(filename).toLowerCase();
    let mime = 'image/jpeg';
    if (ext === '.png') mime = 'image/png';
    else if (ext === '.svg') mime = 'image/svg+xml';
    else if (ext === '.jpg' || ext === '.jpeg' || ext === '.jfif') mime = 'image/jpeg';

    const buffer = fs.readFileSync(targetPath);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  const defaultBankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(defaultBankSvg).toString('base64')}`;
}

async function seedBanks(force = false) {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE banks ALTER COLUMN logo_url TYPE TEXT;`);

    if (!force && require.main !== module) {
      const countResult = await db.query(`SELECT COUNT(*) FROM banks;`);
      const count = parseInt(countResult.rows[0].count, 10);
      if (count >= bankList.length) {
        return;
      }
    }

    const canonicalNames = bankList.map(b => b.name);
    canonicalNames.push('Cash');

    await db.query(
      `DELETE FROM banks WHERE NOT (name = ANY($1::text[]))`,
      [canonicalNames]
    );

    for (const b of bankList) {
      const logoDataUri = getImageDataUri(b.filename);
      await db.query(
        `INSERT INTO banks (name, logo_url)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET logo_url = EXCLUDED.logo_url`,
        [b.name, logoDataUri]
      );
    }

    await db.query(
      `INSERT INTO banks (name, logo_url)
       VALUES ('Cash', NULL)
       ON CONFLICT (name) DO NOTHING`
    );

    await db.query(`
      UPDATE accounts a
      SET logo_url = b.logo_url
      FROM banks b
      WHERE (
        LOWER(a.name) = LOWER(b.name) OR
        LOWER(b.name) LIKE '%' || LOWER(a.name) || '%' OR
        LOWER(a.name) LIKE '%' || LOWER(b.name) || '%'
      );
    `);

  } catch (err) {
    console.error('❌ Failed to seed banks:', err.message);
  }
}

if (require.main === module) {
  seedBanks(true).then(() => process.exit(0));
}

module.exports = { seedBanks };