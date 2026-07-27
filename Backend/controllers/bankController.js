const db = require('../db');
const { catchAsync } = require('../middleware/errorHandler');

const getBanks = catchAsync(async (req, res) => {
  const result = await db.query('SELECT * FROM banks ORDER BY name ASC');
  res.json(result.rows);
});

module.exports = { getBanks };