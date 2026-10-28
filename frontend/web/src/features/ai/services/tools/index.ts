import type { AiToolRegistry } from '../toolRegistry';
import { getFinancialSnapshotTool } from './getFinancialSnapshot';
import { convertCurrencyTool } from './convertCurrency';
import { listAccountsTool } from './listAccounts';
import { listCategoriesTool } from './listCategories';
import { listLoansTool } from './listLoans';
import { getLoanProgressTool } from './getLoanProgress';
import { simulateLoanExtraPaymentTool } from './simulateLoanExtraPayment';
import { listTransactionsTool } from './listTransactions';
import { getYearlyIncomeAndSpendingTool } from './getYearlyIncomeAndSpending';
import { getCategoryPerformanceTool } from './getCategoryPerformance';
import { getDashboardSummaryTool } from './getDashboardSummary';
import { getCycleAnalyticsTool } from './getCycleAnalytics';
import { getCategoryTrendTool } from './getCategoryTrend';
import { getCycleReportTool } from './getCycleReport';
import { listBudgetCyclesTool } from './listBudgetCycles';
import { getCyclePlanTool } from './getCyclePlan';
import { listCardsTool } from './listCards';
import { listSupportedBanksTool } from './listSupportedBanks';
import { listCardStatementsTool } from './listCardStatements';
import { getCardDetailsTool } from './getCardDetails';
import { listReconciliationsTool } from './listReconciliations';
import { getNotificationSettingsTool } from './getNotificationSettings';
import { getPushNotificationStatusTool } from './getPushNotificationStatus';
import { listPendingTransactionsTool } from './listPendingTransactions';
import { getRecentActivityTool } from './getRecentActivity';
import { listMyHouseholdsTool } from './listMyHouseholds';
import { listHouseholdMembersTool } from './listHouseholdMembers';
import { listPendingJoinRequestsTool } from './listPendingJoinRequests';
import { listMessageConnectionsTool } from './listMessageConnections';
import { renderChartTool } from './renderChart';
import { listMemoriesTool } from './listMemories';
import { rememberUserContextTool } from './rememberUserContext';
import { forgetUserMemoryTool } from './forgetUserMemory';
import { createAccountTool } from './createAccount';
import { updateAccountTool } from './updateAccount';
import { createCategoryTool } from './createCategory';
import { updateCategoryTool } from './updateCategory';
import { createTransactionTool } from './createTransaction';
import { voidTransactionTool } from './voidTransaction';
import { updateTransactionTool } from './updateTransaction';
import { createDebitCardTool } from './createDebitCard';
import { createCreditCardTool } from './createCreditCard';
import { updateCardTool } from './updateCard';
import { deleteCardStatementTool } from './deleteCardStatement';
import { createBudgetCycleTool } from './createBudgetCycle';
import { createLoanTool } from './createLoan';
import { updateLoanTool } from './updateLoan';
import { recordLoanPaymentTool } from './recordLoanPayment';
import { updateBudgetCycleStatusTool } from './updateBudgetCycleStatus';
import { saveBudgetAllocationTool } from './saveBudgetAllocation';
import { saveBudgetAllocationsBatchTool } from './saveBudgetAllocationsBatch';
import { saveExpectedIncomeTool } from './saveExpectedIncome';
import { payCreditCardTool } from './payCreditCard';
import { updateNotificationSettingsTool } from './updateNotificationSettings';
import { approvePendingTransactionTool } from './approvePendingTransaction';
import { discardPendingTransactionTool } from './discardPendingTransaction';
import { listResolvedPendingTransactionsTool } from './listResolvedPendingTransactions';
import { restoreDiscardedPendingTransactionTool } from './restoreDiscardedPendingTransaction';
import { reconcileAccountTool } from './reconcileAccount';
import { updateHouseholdBaseCurrencyTool } from './updateHouseholdBaseCurrency';
import { createHouseholdTool } from './createHousehold';
import { switchHouseholdTool } from './switchHousehold';
import { requestHouseholdJoinTool } from './requestHouseholdJoin';
import { decideHouseholdJoinRequestTool } from './decideHouseholdJoinRequest';
import { leaveHouseholdTool } from './leaveHousehold';
import { createMessageConnectionTool } from './createMessageConnection';
import { revokeMessageConnectionTool } from './revokeMessageConnection';
import { enablePushNotificationsTool } from './enablePushNotifications';
import { disablePushNotificationsTool } from './disablePushNotifications';

export const aiToolDefinitions: AiToolRegistry = {
  getFinancialSnapshot: getFinancialSnapshotTool,
  convertCurrency: convertCurrencyTool,
  listAccounts: listAccountsTool,
  listCategories: listCategoriesTool,
  listLoans: listLoansTool,
  getLoanProgress: getLoanProgressTool,
  simulateLoanExtraPayment: simulateLoanExtraPaymentTool,
  listTransactions: listTransactionsTool,
  getYearlyIncomeAndSpending: getYearlyIncomeAndSpendingTool,
  getCategoryPerformance: getCategoryPerformanceTool,
  getDashboardSummary: getDashboardSummaryTool,
  getCycleAnalytics: getCycleAnalyticsTool,
  getCategoryTrend: getCategoryTrendTool,
  getCycleReport: getCycleReportTool,
  listBudgetCycles: listBudgetCyclesTool,
  getCyclePlan: getCyclePlanTool,
  listCards: listCardsTool,
  listSupportedBanks: listSupportedBanksTool,
  listCardStatements: listCardStatementsTool,
  getCardDetails: getCardDetailsTool,
  listReconciliations: listReconciliationsTool,
  getNotificationSettings: getNotificationSettingsTool,
  getPushNotificationStatus: getPushNotificationStatusTool,
  listPendingTransactions: listPendingTransactionsTool,
  getRecentActivity: getRecentActivityTool,
  listMyHouseholds: listMyHouseholdsTool,
  listHouseholdMembers: listHouseholdMembersTool,
  listPendingJoinRequests: listPendingJoinRequestsTool,
  listMessageConnections: listMessageConnectionsTool,
  renderChart: renderChartTool,
  listMemories: listMemoriesTool,
  rememberUserContext: rememberUserContextTool,
  forgetUserMemory: forgetUserMemoryTool,
  createAccount: createAccountTool,
  updateAccount: updateAccountTool,
  createCategory: createCategoryTool,
  updateCategory: updateCategoryTool,
  createTransaction: createTransactionTool,
  voidTransaction: voidTransactionTool,
  updateTransaction: updateTransactionTool,
  createDebitCard: createDebitCardTool,
  createCreditCard: createCreditCardTool,
  updateCard: updateCardTool,
  deleteCardStatement: deleteCardStatementTool,
  createBudgetCycle: createBudgetCycleTool,
  createLoan: createLoanTool,
  updateLoan: updateLoanTool,
  recordLoanPayment: recordLoanPaymentTool,
  updateBudgetCycleStatus: updateBudgetCycleStatusTool,
  saveBudgetAllocation: saveBudgetAllocationTool,
  saveBudgetAllocationsBatch: saveBudgetAllocationsBatchTool,
  saveExpectedIncome: saveExpectedIncomeTool,
  payCreditCard: payCreditCardTool,
  updateNotificationSettings: updateNotificationSettingsTool,
  approvePendingTransaction: approvePendingTransactionTool,
  discardPendingTransaction: discardPendingTransactionTool,
  listResolvedPendingTransactions: listResolvedPendingTransactionsTool,
  restoreDiscardedPendingTransaction: restoreDiscardedPendingTransactionTool,
  reconcileAccount: reconcileAccountTool,
  updateHouseholdBaseCurrency: updateHouseholdBaseCurrencyTool,
  createHousehold: createHouseholdTool,
  switchHousehold: switchHouseholdTool,
  requestHouseholdJoin: requestHouseholdJoinTool,
  decideHouseholdJoinRequest: decideHouseholdJoinRequestTool,
  leaveHousehold: leaveHouseholdTool,
  createMessageConnection: createMessageConnectionTool,
  revokeMessageConnection: revokeMessageConnectionTool,
  enablePushNotifications: enablePushNotificationsTool,
  disablePushNotifications: disablePushNotificationsTool,
};
