import { useMemo } from 'react';
import { Flame, Sparkles, TrendingDown, TrendingUp, Calendar, Zap, PartyPopper, Target, Lock } from 'lucide-react';

const formatCurrency = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const formatCurrencyPrecise = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

/** Propozycje „Pomysł na dziś” — losowane stabilnie w obrębie dnia (seed). */
const IDEA_TIER_HIGH = [
  'Możesz pozwolić sobie na lunch w restauracji albo wyjście do kina — bez dramatu w Excelu.',
  'Burger „premium” z frytkami: oficjalnie uznajemy to za inwestycję w dobre samopoczucie.',
  'Sushi „dla dwojga” (czyli dla jednej osoby, ale uczciwie).',
  'Kraft w pubie i udawanie, że rozpoznajesz nuty chmielu — pełen szacunek.',
  'Escape room: płacisz, żeby ktoś zamknął Cię w pokoju. Logika budżetu się zgadza.',
  'Deser, który na Instagramie wygląda lepiej niż smakuje — i nic złego się nie stało.',
  'Kolacja w miejscu, gdzie kelner mówi „smacznego” jakby to była prawda objawiona.',
  'Bilet na stand-up: śmiejesz się legalnie z cudzych problemów finansowych.',
];

const IDEA_TIER_MID = [
  'Idealna kwota na kawę speciality i ciacho tak duże, że liczy się jak lunch.',
  'Mały prezent „bo zasłużyłem” — nawet jeśli tylko Ty o tym wiesz.',
  'Pizza na wynos + odcinek serialu = wellness według nauk ścisłych.',
  'Bubble tea z dodatkami, których nazwy nie umiesz wymówić.',
  'Gorąca czekolada z bitą śmietaną — zimowa odmiana „jestem dorosły”.',
  'Losowy drobiazg z półki „niepotrzebne ale urocze”.',
  'Kawa i pączek: duet, który przetrwał kryzysy gorsze od Twojego budżetu.',
  'Wejściówka do muzeum, żeby poczuć się intelektualnie przy okazji wydatku.',
];

const IDEA_TIER_LOW = [
  'Wystarczy na kawę na mieście i przekąskę, która udaje zdrową.',
  'Zapiekanka poziom hard + spacer, żeby złapać kroki i alibi.',
  'Lody w wafelku (nie kubek — to już luksus, wiemy).',
  'Pączek z piekarni, gdzie kolejka jest dłuższa niż Twoja lista zadań.',
  'Mała paczka chipsów „na raz” — wszyscy wiemy, jak to się kończy.',
  'Kawa z automatu — gorący kubek, parę złotych i zero snobizmu jak w kawiarni speciality.',
];

const IDEA_TIER_HOME = [
  'Dzień na domowe przyjemności: film, książka z półki „przeczytam kiedyś”, herbata w ulubionym kubku.',
  'Netflix i popcorn z mikrofalówki — kino bez kolejki i bez nachosów po 40 zł.',
  'Scroll TikToka z poczuciem, że to oficjalnie self-care.',
  'Gorąca czekolada i koc — wersja „jestem w spa”, tylko taniej.',
  'Gratis: spacer, playlista i udawanie, że to był plan na cały dzień.',
  'Herbata + ciastko z wczoraj — zero food waste, pełen moralny high ground.',
  'YouTube „tylko jeden odcinek” — klasyczny żart, ale budżet bezpieczny.',
];

const GOAL_SAFE_LINES = [
  ' A cel oszczędności jest bezpieczny! 🎯',
  ' Przy okazji: cel oszczędnościowy dalej się nie boi. 🎯',
  ' Cel oszczędnościowy przytula Cię z dystansu — wszystko pod kontrolą. 🎯',
  ' Oszczędzanie: nie płacze, tylko kiwa głową z aprobatą. 🎯',
];

function pickDailyLine(lines, seed) {
  if (!lines.length) return '';
  const i = Math.abs(seed) % lines.length;
  return lines[i];
}

export const GuiltFreeBurn = ({ guiltFreeBurn, savingsGoalData }) => {
  const { dailyLimit, baseDailyLimit, todaySpent, guiltFreeFunds, daysRemaining, currentDay, totalDays, monthIncome, monthFixedExpenses, monthVariableExpenses, availableAfterFixed, monthlyTarget, spendingStatus, spendingDiff, monthProgress, budgetUsed, hasData, hasGoal } = guiltFreeBurn;

  const dailyIdeaLine = useMemo(() => {
    const d = new Date();
    const seed = (currentDay + d.getMonth() * 31) * 17 + Math.floor(dailyLimit * 3);
    const tier = dailyLimit >= 100 ? IDEA_TIER_HIGH : dailyLimit >= 50 ? IDEA_TIER_MID : dailyLimit >= 20 ? IDEA_TIER_LOW : IDEA_TIER_HOME;
    return pickDailyLine(tier, seed);
  }, [dailyLimit, currentDay]);

  const goalSafeLine = useMemo(() => {
    if (!hasGoal) return '';
    const d = new Date();
    const seed = (currentDay + d.getMonth() * 31) * 23 + 7;
    return pickDailyLine(GOAL_SAFE_LINES, seed);
  }, [hasGoal, currentDay]);

  const getMood = () => {
    if (!hasData) return { emoji: '🎯', message: 'Dodaj przychody, aby odblokować', color: 'slate' };
    if (dailyLimit >= 200) return { emoji: '🎉', message: 'Świetnie ci idzie! Ciesz się życiem!', color: 'emerald' };
    if (dailyLimit >= 100) return { emoji: '☕', message: 'Komfortowy budżet na drobne przyjemności', color: 'cyan' };
    if (dailyLimit >= 50) return { emoji: '🍕', message: 'Wystarczy na małe co nieco', color: 'amber' };
    if (dailyLimit > 0) return { emoji: '💪', message: 'Trzymaj się planu, dasz radę!', color: 'orange' };
    return { emoji: '🔒', message: 'Czas na tryb oszczędzania', color: 'rose' };
  };

  const mood = getMood();
  const colorClasses = {
    emerald: { bg: 'from-emerald-600/30 via-teal-500/20 to-cyan-500/30', border: 'border-emerald-400/40', text: 'text-emerald-300', accent: 'text-emerald-400', iconBg: 'bg-emerald-500/30' },
    cyan: { bg: 'from-cyan-600/30 via-blue-500/20 to-indigo-500/30', border: 'border-cyan-400/40', text: 'text-cyan-300', accent: 'text-cyan-400', iconBg: 'bg-cyan-500/30' },
    amber: { bg: 'from-amber-600/30 via-yellow-500/20 to-orange-500/30', border: 'border-amber-400/40', text: 'text-amber-300', accent: 'text-amber-400', iconBg: 'bg-amber-500/30' },
    orange: { bg: 'from-orange-600/30 via-red-500/20 to-rose-500/30', border: 'border-orange-400/40', text: 'text-orange-300', accent: 'text-orange-400', iconBg: 'bg-orange-500/30' },
    rose: { bg: 'from-rose-600/30 via-pink-500/20 to-red-500/30', border: 'border-rose-400/40', text: 'text-rose-300', accent: 'text-rose-400', iconBg: 'bg-rose-500/30' },
    slate: { bg: 'from-slate-600/30 via-slate-500/20 to-slate-600/30', border: 'border-slate-400/40', text: 'text-slate-300', accent: 'text-slate-400', iconBg: 'bg-slate-500/30' }
  };
  const colors = colorClasses[mood.color];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-2xl p-6 mb-6 shadow-xl`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute top-4 right-8 text-white/10 animate-pulse"><Sparkles className="w-16 h-16" /></div><div className="absolute bottom-4 left-12 text-white/5 animate-pulse"><Flame className="w-12 h-12" /></div></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4"><div className={`${colors.iconBg} p-2 rounded-xl`}><Flame className={`w-5 h-5 ${colors.accent}`} /></div><h3 className="text-lg font-bold text-white">Guilt-Free Burn Tracker</h3><span className="text-2xl ml-auto">{mood.emoji}</span></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <p className={`text-sm ${colors.text} mb-2`}>Dzisiejszy limit na przyjemności{hasGoal && <span className="text-xs opacity-70"> (z uwzględnieniem celu)</span>}:</p>
            <div className="flex items-baseline gap-3"><span className={`text-5xl lg:text-6xl font-black ${colors.accent} tracking-tight`}>{hasData ? formatCurrency(dailyLimit) : '— PLN'}</span><span className="text-slate-400 text-lg">/dzień</span></div>
            {hasData && (
              <p className="text-xs text-slate-400 mt-1">
                Start dnia: <span className="text-slate-300">{formatCurrency(baseDailyLimit)}</span> • Wydane dziś: <span className="text-orange-300">{formatCurrency(todaySpent)}</span>
              </p>
            )}
            {hasData && <p className={`text-sm ${colors.text} mt-2 flex items-center gap-2`}>{spendingStatus === 'under' ? <><TrendingDown className="w-4 h-4 text-emerald-400" /><span>Jesteś <span className="text-emerald-400">{formatCurrencyPrecise(spendingDiff)}</span> poniżej planu!</span></> : <><TrendingUp className="w-4 h-4 text-rose-400" /><span>Przekroczyłeś budżet o <span className="text-rose-400">{formatCurrencyPrecise(spendingDiff)}</span></span></>}</p>}
            <p className={`text-xs ${colors.text} mt-1 opacity-80`}>{mood.message}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:gap-4">
            <div className="bg-slate-800/40 rounded-xl p-3 min-w-[100px]"><div className="flex items-center gap-1.5 mb-1"><Zap className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs text-slate-400 uppercase tracking-wide">Po stałych</span></div><p className="text-lg font-bold text-indigo-300">{hasData ? formatCurrency(availableAfterFixed) : '—'}</p></div>
            {hasGoal && <div className="bg-slate-800/40 rounded-xl p-3 min-w-[100px]"><div className="flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-slate-400 uppercase tracking-wide">Cel mies.</span></div><p className="text-lg font-bold text-amber-300">{formatCurrency(monthlyTarget)}</p></div>}
            <div className="bg-slate-800/40 rounded-xl p-3 min-w-[100px]"><div className="flex items-center gap-1.5 mb-1"><PartyPopper className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs text-slate-400 uppercase tracking-wide">Guilt-free</span></div><p className={`text-lg font-bold ${guiltFreeFunds >= 0 ? 'text-purple-300' : 'text-rose-400'}`}>{hasData ? formatCurrency(guiltFreeFunds) : '—'}</p></div>
            <div className="bg-slate-800/40 rounded-xl p-3 min-w-[100px]"><div className="flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5 text-cyan-400" /><span className="text-xs text-slate-400 uppercase tracking-wide">Dni</span></div><p className="text-lg font-bold text-cyan-300">{daysRemaining} <span className="text-sm font-normal text-slate-400">z {totalDays}</span></p></div>
          </div>
        </div>
        {hasData && <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"><p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Jak to obliczamy:</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><p className="text-slate-500">Przychody</p><p className="text-emerald-400 font-semibold">{formatCurrency(monthIncome)}</p></div><div><p className="text-slate-500">− Wydatki stałe</p><p className="text-rose-400 font-semibold">{formatCurrency(monthFixedExpenses)}</p></div><div><p className="text-slate-500">− Już wydane</p><p className="text-orange-400 font-semibold">{formatCurrency(monthVariableExpenses)}</p></div>{hasGoal && <div><p className="text-slate-500">− Cel oszczędności</p><p className="text-amber-400 font-semibold">{formatCurrency(monthlyTarget)}</p></div>}</div><div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between"><p className="text-slate-400">= Zostaje na {daysRemaining} dni</p><p className={`text-lg font-bold ${guiltFreeFunds >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatCurrency(guiltFreeFunds)}</p></div></div>}
        {hasData && <div className="mt-4 space-y-3"><div><div className="flex justify-between text-xs text-slate-400 mb-1"><span>Postęp miesiąca</span><span>Dzień {currentDay} z {totalDays}</span></div><div className="h-2 bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${monthProgress}%` }} /></div></div><div><div className="flex justify-between text-xs text-slate-400 mb-1"><span>Budżet na przyjemności vs czas</span><span className={budgetUsed <= monthProgress ? 'text-emerald-400' : 'text-amber-400'}>{budgetUsed <= monthProgress ? '✓ W normie' : '⚠ Powyżej planu'}</span></div><div className="h-2 bg-slate-700/50 rounded-full overflow-hidden relative"><div className={`h-full rounded-full transition-all duration-500 ${budgetUsed <= monthProgress ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} style={{ width: `${Math.min(100, budgetUsed)}%` }} /><div className="absolute top-0 h-full w-0.5 bg-white/60" style={{ left: `${monthProgress}%` }} /></div></div></div>}
        {hasData && dailyLimit > 0 && (
          <div className={`mt-4 p-3 rounded-xl bg-slate-800/30 border ${colors.border}`}>
            <p className="text-sm text-slate-300">
              💡 <span className="font-medium">Pomysł na dziś:</span> <span>{dailyIdeaLine}</span>
              {hasGoal && <span className="text-emerald-400/80">{goalSafeLine}</span>}
            </p>
          </div>
        )}
        {hasData && dailyLimit <= 0 && <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30"><p className="text-sm text-rose-300 flex items-center gap-2"><Lock className="w-4 h-4" /><span><span className="font-medium">Budżet na przyjemności wyczerpany.</span> Żeby osiągnąć cel, unikaj dodatkowych wydatków do końca miesiąca.</span></p></div>}
      </div>
    </div>
  );
};
