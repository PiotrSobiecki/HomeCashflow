import { useState, useEffect } from "react";
import {
  Trash2,
  Zap,
  LogOut,
  User,
  Loader2,
  Cloud,
  UserX,
  AlertTriangle,
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
import { ConfirmDialog } from "./ConfirmDialog";
import { ActivityHistory } from "./ActivityHistory";

export const Dashboard = () => {
  const { user, signOut, isGuest } = useAuth();
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
    activityLog,
    MONTHS,
    CURRENT_YEAR,
    getCurrentMonth,
    loading,
    saving,
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

  const handleSignOut = async () => {
    await signOut();
  };

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
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HomeCashflow</h1>
                <p className="text-xs text-slate-400">
                  Zarządzaj finansami inteligentnie
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
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

              {/* User info */}
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isGuest ? "bg-amber-500/20" : "bg-slate-800/50"}`}
              >
                {isGuest ? (
                  <UserX className="w-4 h-4 text-amber-400" />
                ) : (
                  <User className="w-4 h-4 text-indigo-400" />
                )}
                <span
                  className={`text-sm ${isGuest ? "text-amber-300" : "text-slate-300"}`}
                >
                  {isGuest ? "Gość" : user?.name || user?.email?.split("@")[0]}
                </span>
              </div>

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

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                title={isGuest ? "Zaloguj się" : "Wyloguj się"}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">
                  {isGuest ? "Zaloguj" : "Wyloguj"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

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
        />
        <SavingsAccounts
          accounts={savingsAccounts}
          totalSavings={totalSavingsAccounts}
          addAccount={addSavingsAccount}
          updateAccount={updateSavingsAccount}
          deleteAccount={deleteSavingsAccount}
        />
        <GuiltFreeBurn
          guiltFreeBurn={guiltFreeBurn}
          savingsGoalData={savingsGoalData}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeSection
            incomes={currentMonthData.incomes}
            addIncome={addIncome}
            updateIncome={updateIncome}
            deleteIncome={deleteIncome}
          />
          <ExpenseSection
            expenses={currentMonthData.expenses}
            addExpense={addExpense}
            updateExpense={updateExpense}
            deleteExpense={deleteExpense}
            selectedMonth={selectedMonth}
          />
        </div>
        <YearlySummary
          yearlySummary={yearlySummary}
          monthlySummaries={monthlySummaries}
          year={CURRENT_YEAR}
        />
        <ActivityHistory entries={activityLog} MONTHS={MONTHS} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            HomeCashflow © {CURRENT_YEAR} •{" "}
            {isGuest
              ? "Dane zapisywane lokalnie w przeglądarce"
              : "Dane bezpiecznie przechowywane w chmurze"}
          </p>
        </div>
      </footer>
    </div>
  );
};
