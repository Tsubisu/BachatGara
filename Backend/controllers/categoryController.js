const categoryService = require('../services/categoryService');
const { catchAsync } = require('../middleware/errorHandler');

const list = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories(req.user.id);
  res.json(categories);
});

const upsert = catchAsync(async (req, res) => {
  const category = await categoryService.upsertCategory(req.user.id, req.body);
  res.status(200).json(category);
});

module.exports = {
  list,
  upsert,
};
