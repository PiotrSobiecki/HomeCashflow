import { useState, useEffect } from "react";
import {
  Trash2,
  Loader2,
  Cloud,
  AlertTriangle,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useFinanceData } from "../hooks/useFinanceData";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/api";
import { SummaryCard } from "./SummaryCard";
import { MonthSelector } from "./MonthSelector";
import { IncomeSection } from "./IncomeSection";
import { ExpenseSection } from "./ExpenseSection";
import { YearlySummary } from "./YearlySummary";
import { FinancialRunway } from "./FinancialRunway";
import { ForecastChart } from "./ForecastChart";
import { GuiltFreeBurn } from "./GuiltFreeBurn";
import { SavingsGoal } from "./SavingsGoal";
import { SavingsAccounts } from "./SavingsAccounts";
import { HouseholdMembers } from "./HouseholdMembers";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { ConfirmDialog } from "./ConfirmDialog";
import { ConflictDialog } from "./ConflictDialog";
import { ActivityHistory } from "./ActivityHistory";
import { CategoryBudgets } from "./CategoryBudgets";
import { MonthlySummaryModal } from "./MonthlySummaryModal";

export const Dashboard = () => {
  const { user, isGuest } = useAuth();
  /** 0 = zamknięte, 1 = pierwsze ostrzeżenie, 2 = ostateczne potwierdzenie (wyczyść wszystkie dane) */
  const [clearAllStep, setClearAllStep] = useState(0);
  /** null = jeszcze nie wiadomo (zalogowany); tylko właściciel może czyścić wspólne dane w chmurze */
  const [isHouseholdOwner, setIsHouseholdOwner] = useState(null);
  const {
    selectedMonth,
    setSelectedMonth,
    currentMonthData,
    totalIncome,
    totalExpenses,
    fixedExpenses,
    variableExpenses,
    balance,
    yearlySummary,
    monthlySummaries,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllData,
    financialRunway,
    forecastData,
    guiltFreeBurn,
    savingsGoal,
    savingsGoalData,
    updateSavingsGoal,
    savingsAccounts,
    totalSavingsAccounts,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    categoryBudgets,
    categorySpending,
    totalCategoryLimits,
    addCategoryBudget,
    updateCategoryBudget,
    deleteCategoryBudget,
    activityLog,
    clearActivityLog,
    MONTHS,
    CURRENT_YEAR,
    getCurrentMonth,
    loading,
    saving,
    conflict,
    clearConflict,
    refetchFromApi,
  } = useFinanceData();

  useEffect(() => {
    if (isGuest || !user) {
      setIsHouseholdOwner(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/household`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setIsHouseholdOwner(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) setIsHouseholdOwner(!!data.isOwner);
      } catch {
        if (!cancelled) setIsHouseholdOwner(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isGuest, user?.id]);

  const showClearAllButton = isGuest || isHouseholdOwner === true;

  const handleClearAllFinal = () => {
    setClearAllStep(0);
    clearAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Guest mode banner */}
      {isGuest && (
        <div className="bg-amber-500/20 border-b border-amber-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  Tryb demo - dane zapisywane tylko w tej przeglądarce
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-amber-400 hover:text-amber-300 underline"
              >
                Załóż konto, aby zachować dane w chmurze →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <AppHeader
        activeView="budzet"
        extras={
          <>
            {/* Status zapisu */}
            {!isGuest && (
              <div className="flex items-center gap-2 text-xs">
                {saving ? (
                  <>
                    <Cloud className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-amber-400 hidden sm:inline">
                      Zapisywanie...
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 hidden sm:inline">
                      Zapisano
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Reset — tylko gość (local) lub właściciel gospodarstwa (wspólne dane w chmurze) */}
            {showClearAllButton && (
              <button
                type="button"
                onClick={() => setClearAllStep(1)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Wyczyść wszystkie dane"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        }
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="sm:hidden bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("financeflow:add-income"))
              }
              className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl border border-emerald-500/25 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Dodaj przychod
            </button>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("financeflow:add-expense"))
              }
              className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-xl border border-rose-500/25 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Dodaj wydatek
            </button>
          </div>
        </div>
        <div className="hidden sm:flex justify-end text-slate-400 text-sm">
          <button
            type="button"
            onClick={() => {
              const section = document.getElementById("expense-section");
              if (!section) return;
              const targetY =
                section.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({
                top: Math.max(0, targetY),
                behavior: "smooth",
              });
            }}
            className="inline-flex items-center gap-1.5 hover:text-violet-300 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            Dodaj wydatek / przychód
          </button>
        </div>
      </div>

      <ConflictDialog
        open={!!conflict}
        onOverride={conflict?.onOverride ?? clearConflict}
        onCancel={conflict?.onCancel ?? clearConflict}
        resourceLabel={conflict?.resourceLabel}
        yours={conflict?.yours}
        theirs={conflict?.theirs}
      />

      <ConfirmDialog
        open={clearAllStep === 1}
        onClose={() => setClearAllStep(0)}
        onConfirm={() => setClearAllStep(2)}
        title="Wyczyścić wszystkie dane finansowe?"
        description={
          "Zostaną usunięte wszystkie przychody, wydatki, cele oszczędnościowe, wpisy w sekcji Moje oszczędności oraz dane we wszystkich miesiącach. Widoki i podsumowania wrócą do stanu początkowego.\n\n" +
          (isGuest
            ? "Dane zostaną skasowane tylko w tej przeglądarce (localStorage)."
            : "Zmiana zapisze się w chmurze — wszyscy członkowie gospodarstwa stracą te wpisy w udostępnionym budżecie.") +
          "\n\nW kolejnym kroku poprosimy o ostateczne potwierdzenie. Tej operacji nie można cofnąć z poziomu aplikacji."
        }
        confirmLabel="Rozumiem, kontynuuj"
        cancelLabel="Anuluj"
        variant="warning"
      />

      <ConfirmDialog
        open={clearAllStep === 2}
        onClose={() => setClearAllStep(0)}
        onConfirm={handleClearAllFinal}
        title="Ostateczne potwierdzenie"
        description={
          "To ostatnia szansa na anulowanie.\n\n" +
          "Po kliknięciu „Wyczyść bezpowrotnie” wszystkie powyższe dane znikną. Nie ma w aplikacji kosza ani przywracania — chyba że masz własną kopię zapasową."
        }
        confirmLabel="Wyczyść bezpowrotnie"
        cancelLabel="Anuluj"
        variant="danger"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isGuest && <HouseholdMembers />}
        <SavingsGoal
          savingsGoal={savingsGoal}
          savingsGoalData={savingsGoalData}
          updateSavingsGoal={updateSavingsGoal}
          months={MONTHS}
          canEdit={isGuest || isHouseholdOwner === true}
        />
        <GuiltFreeBurn
          guiltFreeBurn={guiltFreeBurn}
          savingsGoalData={savingsGoalData}
        />
        <SavingsAccounts
          accounts={savingsAccounts}
          totalSavings={totalSavingsAccounts}
          addAccount={addSavingsAccount}
          updateAccount={updateSavingsAccount}
          deleteAccount={deleteSavingsAccount}
          currentUserId={user?.id ?? null}
          isOwner={isHouseholdOwner === true}
        />
        <CategoryBudgets
          categoryBudgets={categoryBudgets}
          categorySpending={categorySpending}
          totalCategoryLimits={totalCategoryLimits}
          addCategoryBudget={addCategoryBudget}
          updateCategoryBudget={updateCategoryBudget}
          deleteCategoryBudget={deleteCategoryBudget}
          totalIncome={guiltFreeBurn.monthIncome}
          fixedExpenses={guiltFreeBurn.monthFixedExpenses}
          variableExpenses={guiltFreeBurn.monthVariableExpenses}
          savingsGoalData={savingsGoalData}
          currentUserId={user?.id ?? null}
          isOwner={isHouseholdOwner === true}
        />
        <FinancialRunway financialRunway={financialRunway} />
        <ForecastChart
          forecastData={forecastData}
          currentMonth={getCurrentMonth()}
          year={CURRENT_YEAR}
        />
        <MonthSelector
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          months={MONTHS}
          year={CURRENT_YEAR}
        />
        <SummaryCard
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          fixedExpenses={fixedExpenses}
          variableExpenses={variableExpenses}
          balance={balance}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div id="income-section" className="h-full min-h-0">
            <IncomeSection
              incomes={currentMonthData.incomes}
              addIncome={addIncome}
              updateIncome={updateIncome}
              deleteIncome={deleteIncome}
              currentUserId={user?.id ?? null}
              isOwner={isHouseholdOwner === true}
            />
          </div>
          <div id="expense-section" className="h-full min-h-0">
            <ExpenseSection
              expenses={currentMonthData.expenses}
              addExpense={addExpense}
              updateExpense={updateExpense}
              deleteExpense={deleteExpense}
              categoryBudgets={categoryBudgets}
              currentUserId={user?.id ?? null}
              isOwner={isHouseholdOwner === true}
            />
          </div>
        </div>
        <div className="my-6">
          <MonthlySummaryModal
            embedded
            monthLabel={`${MONTHS[selectedMonth]} ${CURRENT_YEAR}`}
            incomes={currentMonthData.incomes}
            expenses={currentMonthData.expenses}
          />
        </div>
        <YearlySummary
          yearlySummary={yearlySummary}
          monthlySummaries={monthlySummaries}
          year={CURRENT_YEAR}
        />
        <ActivityHistory
          entries={activityLog}
          MONTHS={MONTHS}
          selectedMonth={selectedMonth}
          isGuest={isGuest}
          canClear={isGuest}
          onClear={clearActivityLog}
          currentUserId={user?.id}
          isOwner={isHouseholdOwner === true}
          onAfterUndo={refetchFromApi}
        />
      </main>
      {/* Footer */}
      <AppFooter isGuest={isGuest} year={CURRENT_YEAR} />
    </div>
  );
};
