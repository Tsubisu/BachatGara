const categoryRepo = require('../repositories/categoryRepository');

const listCategories = (userId) => categoryRepo.findAllByUser(userId);

const upsertCategory = (userId, categoryData) => categoryRepo.upsertCategory(userId, categoryData);

module.exports = {
  listCategories,
  upsertCategory,
};
