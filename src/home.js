// The home page around the ritual: the "צייר לי שבוע מושלם" button, the "השבוע שלי" card after it,
// the Wednesday check-in, the Thursday 30-second close, and the past weeks.
import { html, useState, Icon, cx } from './lib.js';
import { Check, TaskRow } from './steps.js';
import { Button, Logo, SharkAvatar } from './components.js';
import { Sheet, inputCls } from './ui.js';
import { DayList } from './board.js';
import { USER, DAYS, METRICS, HISTORY, VALUE, WEEK_LABEL, g } from './data.js';
import { fmt, num } from './calc.js';

const NAV = ['בית', 'יומן', 'משימות', 'כספים', 'קבצים', 'לידים'];

// The week card on the home page.
function WeekCard({ s, tasks, focus, drawn, onDraw, onStep, onTask, onLink, onHistory, onBoard }) {
  // One task open at a time: the one the user picked, else the first one not done yet.
  const [pick, setPick] = useState(null);
  if (!drawn)
    return html`<section class="paper rounded-[18px] p-5">
      <div class="mb-3 flex items-center gap-3">
        <${SharkAvatar} size=${48} mood="calm" />
        <div><b class="block font-display text-[19px]">השבוע עוד לא מצויר</b><span class="text-[14px] text-muted">${WEEK_LABEL} · כ-10 דקות</span></div>
      </div>
      <${Button} class="w-full" onClick=${onDraw}><${Icon} name="calendar-range" size=${20} />צייר לי שבוע מושלם<//>
      ${s.streak > 0 && html`<p class="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-bold text-muted"><${Icon} name="flame" size=${16} class="text-warn" />${s.streak} שבועות ברצף. ${g('אל תשבור אותו', 'אל תשברי אותו')}</p>`}
      <button type="button" onClick=${onHistory} class="mt-2 block w-full text-center text-[14px] font-bold text-brand-600 hover:underline cursor-pointer">השבועות הקודמים</button>
    </section>`;
  const done = tasks.filter((t) => s.homeDone[t.id]).length;
  const open = pick === 'none' ? null : pick || tasks.find((t) => !s.homeDone[t.id])?.id;
  const stepsAll = tasks.reduce((n, t) => n + (t.steps || []).length, 0);
  const stepsOn = tasks.reduce((n, t) => n + (s.stepsDone[t.id] || []).filter(Boolean).length, 0);
  return html`<section class="paper rounded-[18px] p-5">
    <div class="mb-1 flex items-center justify-between gap-2">
      <b class="font-display text-[19px]">השבוע שלי</b>
      <span class="inline-flex items-center gap-1 text-[14px] font-bold"><${Icon} name="flame" size=${16} class="text-warn" />${s.streak}</span>
    </div>
    ${focus && html`<p class="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-brand-700"><${Icon} name="crosshair" size=${14} />הפוקוס: ${focus.title}</p>`}
    <div class="mb-1 h-2 overflow-hidden rounded-full bg-canvas ring-1 ring-line"><span class="block h-full rounded-full bg-brand-600 transition-all" style=${{ width: `${stepsAll ? (stepsOn / stepsAll) * 100 : 0}%` }}></span></div>
    <p class="mb-1 text-[13px] text-muted">${stepsOn} מתוך ${stepsAll} צעדים · ${done} מתוך 3 משימות${done === 3 ? '. שבוע מלא!' : ''}</p>
    <div class="flex flex-col">
      ${tasks.map((t) => html`<${TaskRow} key=${t.id} t=${t} sd=${s.stepsDone[t.id]} done=${!!s.homeDone[t.id]} open=${open === t.id} onOpen=${() => setPick(open === t.id ? 'none' : t.id)} onStep=${onStep} onTask=${onTask} onLink=${onLink} meta=${`${DAYS[t.day].short} ${t.at || ''}`} />`)}
    </div>
    <div class="mt-2 flex items-center justify-between gap-2 text-[14px] font-bold text-brand-600">
      <button type="button" onClick=${onBoard} class="hover:underline cursor-pointer">ללוח של השבוע</button>
      <button type="button" onClick=${onDraw} class="hover:underline cursor-pointer">לעדכן את השבוע</button>
      <button type="button" onClick=${onHistory} class="hover:underline cursor-pointer">השבועות הקודמים</button>
    </div>
  </section>`;
}

// A notification as it appears at the top of the home page (and by email).
function Notice({ icon, title, text, action, onClick }) {
  return html`<button type="button" onClick=${onClick} class="rise mb-4 flex w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-start text-white shadow-lg cursor-pointer">
    <${Icon} name=${icon} size=${22} class="text-brand-300" />
    <span class="min-w-0 flex-1"><b class="block text-[16px]">${title}</b><span class="text-[14px] text-white/80">${text}</span></span>
    <span class="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[14px] font-bold text-ink">${action}</span>
  </button>`;
}

export function Home({ s, set, tasks, items, focus, drawn, mode, setMode, onDraw, notify, onStep, onTask, onLink }) {
  const [board, setBoard] = useState(false);
  const done = tasks.filter((t) => s.homeDone[t.id]).length;
  return html`<div class="fb-notebook flex h-dvh flex-col text-ink" dir="rtl">
    <header class="z-20 shrink-0 border-b border-line bg-surface">
      <div class="flex h-16 items-center gap-4 px-3 md:px-7">
        <${Logo} size="sm" />
        <nav class="hidden items-center gap-1 md:flex">${NAV.map((n, i) => html`<span key=${n} class=${cx('rounded-lg px-3 py-1.5 text-[15px] font-bold', i === 0 ? 'bg-brand-100 text-brand-600' : 'text-muted')}>${n}</span>`)}</nav>
        <span class="ms-auto inline-flex items-center gap-1.5 rounded-full bg-money-50 px-3 py-1.5 text-[14px] font-bold text-money" data-saved><${Icon} name="coins" size=${16} />חסכת עד עכשיו ${fmt(s.saved)}</span>
      </div>
    </header>
    <main class="thin-scroll min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[1180px] px-4 py-6 md:px-8">
        ${mode === 'wed' && drawn && html`<${Notice} icon="list-checks" title="יום רביעי · אמצע השבוע" text=${`${done} מתוך 3 בוצעו. לסמן או להזיז משהו?`} action="לעדכן" onClick=${() => setMode('wed-open')} />`}
        ${mode === 'thu' && drawn && html`<${Notice} icon="flag" title="יום חמישי · סוגרים את השבוע" text="30 שניות: מה בוצע והמספרים. ביום ראשון מתחילים ישר מהתכנון." action="לסגור" onClick=${() => setMode('thu-open')} />`}
        <h1 class="fb-h1 mb-1 text-[28px] md:text-[34px]">${g('בוקר טוב', 'בוקר טוב')}, <span class="fb-marker">${USER.firstName}</span></h1>
        <p class="mb-6 text-[16px] text-muted">${USER.business} · ${mode === 'wed' || mode === 'wed-open' ? 'רביעי 18.11' : mode === 'thu' || mode === 'thu-open' ? 'חמישי 19.11' : 'ראשון 15.11'}</p>
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section class="paper flex min-h-[320px] flex-col items-center justify-center rounded-[18px] p-6 text-center text-muted">
            <${Icon} name="map" size=${44} class="mb-2 text-brand-300" />
            <b class="block font-display text-[18px] text-ink">המפה של המסע</b>
            <span class="text-[14px]">כמו בדשבורד. כאן המוק-אפ מראה רק את כרטיס השבוע.</span>
          </section>
          <${WeekCard} s=${s} tasks=${tasks} focus=${focus} drawn=${drawn} onDraw=${onDraw} onStep=${onStep} onTask=${onTask} onLink=${onLink} onHistory=${() => setMode('history')} onBoard=${() => setBoard(true)} />
        </div>
      </div>
    </main>
    ${board && html`<${Sheet} title=${`השבוע · ${WEEK_LABEL}`} onClose=${() => setBoard(false)}><${DayList} items=${items} focus=${focus} /><//>`}
    ${mode === 'wed-open' && html`<${WedSheet} s=${s} set=${set} tasks=${tasks} onTask=${onTask} onClose=${() => setMode('wed')} notify=${notify} />`}
    ${mode === 'thu-open' && html`<${ThuSheet} s=${s} set=${set} tasks=${tasks} onTask=${onTask} onClose=${() => setMode('thu')} notify=${notify} />`}
    ${mode === 'history' && html`<${HistorySheet} onClose=${() => setMode(null)} />`}
  </div>`;
}

// Wednesday: one look, mark what's done, move what's not to another day.
function WedSheet({ s, set, tasks, onTask, onClose, notify }) {
  const setDay = (id, day) => set((x) => ({ ...x, tasks: x.tasks.map((t) => (t.id === id ? { ...t, day } : t)) }));
  return html`<${Sheet} title="אמצע השבוע" onClose=${onClose} footer=${html`<span class="text-[14px] text-muted">הבלוקים ביומן זזים איתן</span><${Button} onClick=${() => (onClose(), notify('השבוע עודכן', 'check'))}>לשמור<//>`}>
    <p class="mb-3 text-[15px] text-muted">מה בוצע? ומה שעוד לא, לאיזה יום הוא עובר?</p>
    ${tasks.map((t) => {
      const on = !!s.homeDone[t.id];
      return html`<div key=${t.id} class="fb-panel mb-2 !p-3">
        <div class="flex items-center gap-2.5">
          <${Check} on=${on} label=${t.text} onClick=${() => onTask(t, !on)} size="sm" />
          <span class=${cx('min-w-0 flex-1 text-[15px] font-semibold', on && 'text-muted line-through')}>${t.text}</span>
        </div>
        ${!on &&
        html`<div class="mt-2 flex items-center gap-1.5 ps-9">
          <span class="text-[13px] text-muted">ליום:</span>
          ${DAYS.slice(3, 6).map((d) => html`<button key=${d.id} type="button" onClick=${() => setDay(t.id, d.id)} class=${cx('h-8 rounded-lg px-2.5 text-[13px] font-bold cursor-pointer', t.day === d.id ? 'bg-brand-600 text-white' : 'bg-canvas ring-1 ring-line')}>${d.name}</button>`)}
          <button type="button" onClick=${() => notify('עובר לשבוע הבא, ויופיע ב"מה נעשה"', 'calendar-arrow-down')} class="h-8 rounded-lg bg-canvas px-2.5 text-[13px] font-bold ring-1 ring-line cursor-pointer">לשבוע הבא</button>
        </div>`}
      </div>`;
    })}
  <//>`;
}

// Thursday: close the week in 30 seconds. Sunday then starts straight from the planning.
function ThuSheet({ s, set, tasks, onTask, onClose, notify }) {
  const [n, setN] = useState({ leads: 7, calls: 3, closes: 1, revenue: 2700, marketing: '' });
  const close = () => {
    set((x) => ({ ...x, closed: true, thuNums: n }));
    onClose();
    notify('השבוע נסגר. ביום ראשון מתחילים ישר מהתכנון', 'flag');
  };
  return html`<${Sheet} title="סוגרים את השבוע" wide onClose=${onClose} footer=${html`<span class="text-[14px] text-muted">30 שניות, ויום ראשון קצר יותר</span><${Button} onClick=${close}>לסגור את השבוע<//>`}>
    <b class="mb-1.5 block text-[15px]">מה בוצע</b>
    ${tasks.map((t) => {
      const on = !!s.homeDone[t.id];
      return html`<div key=${t.id} class="flex items-center gap-2.5 border-b border-line py-2 last:border-0">
        <${Check} on=${on} label=${t.text} onClick=${() => onTask(t, !on)} size="sm" />
        <span class="min-w-0 flex-1 text-[15px] font-semibold">${t.text}</span>
      </div>`;
    })}
    <b class="mb-1.5 mt-4 block text-[15px]">המספרים של השבוע</b>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      ${METRICS.map((m) => html`<label key=${m.id} class="block">
        <span class="mb-1 block text-[13px] font-bold text-muted">${m.label}</span>
        <input inputmode="numeric" dir="ltr" value=${n[m.id] === '' ? '' : m.money ? num(n[m.id]) : n[m.id]} placeholder="—" onInput=${(e) => setN((x) => ({ ...x, [m.id]: e.target.value === '' ? '' : Number(e.target.value.replace(/[^\d]/g, '')) }))} class=${cx(inputCls, '!h-10 text-end font-display font-bold tabular-nums')} />
      </label>`)}
    </div>
  <//>`;
}

function HistorySheet({ onClose }) {
  return html`<${Sheet} title="השבועות הקודמים" wide onClose=${onClose}>
    <p class="mb-2 text-[14px] text-muted">עד 26 שבועות אחורה.</p>
    <div class="fb-panel !p-0">
      ${HISTORY.map((h) => html`<div key=${h.week} class="grid grid-cols-[88px_1fr_auto] items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
        <b class="tabular-nums">${h.week}</b>
        <span class="min-w-0"><span class="block truncate text-[14px] font-semibold">${h.focus}</span><span class="text-[12px] text-muted">${h.leads} פניות · ${h.closes} סגירות · ${fmt(h.revenue)}</span></span>
        <span class=${cx('rounded-full px-2 py-0.5 text-[13px] font-bold', h.done === 3 ? 'bg-brand-100 text-brand-600' : 'bg-canvas text-muted ring-1 ring-line')}>${h.done}/3</span>
      </div>`)}
    </div>
  <//>`;
}
