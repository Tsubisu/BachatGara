const goalRepo = require('../repositories/goalRepository');
const accountRepo = require('../repositories/accountRepository');
const txRepo = require('../repositories/transactionRepository');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const listGoals = (userId) => goalRepo.findAllByUser(userId);

const createGoal = (userId, data) => goalRepo.create(userId, data);

const fundGoal = async (goalId, userId, { source_account_id, amount }) => {
  // 1. Validate goal exists for this user
  const goal = await goalRepo.findById(goalId, userId);
  if (!goal) throw new AppError('Savings goal not found.', 404);

  // 2. Validate source account balance
  const account = await accountRepo.findById(source_account_id, userId);
  if (!account) throw new AppError('Source account not found.', 404);
  if (parseFloat(account.balance) < amount) {
    throw new AppError(
      `Insufficient balance in ${account.name}. Available: Rs. ${parseFloat(account.balance).toLocaleString()}`,
      400
    );
  }

  // 3. Create expense transaction (deducted from source account via DB trigger)
  const tx = await txRepo.createExpense(userId, source_account_id, null, amount, 'Savings Goal Funding', new Date().toISOString().split('T')[0]);

  // 4. Link transaction to this goal
  await goalRepo.linkContribution(goalId, tx.id);

  // 5. Update global net_savings
  await userRepo.addToNetSavings(userId, amount);
};

const deleteGoal = async (id, userId) => {
  const deleted = await goalRepo.remove(id, userId);
  if (!deleted) throw new AppError('Goal not found or unauthorized.', 404);
};

module.exports = { listGoals, createGoal, fundGoal, deleteGoal };
