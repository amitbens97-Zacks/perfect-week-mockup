// The home page around the ritual: the "צייר לי שבוע מושלם" button, the "השבוע שלי" card after it,
// the Wednesday check-in, the Thursday 30-second close, and the past weeks.
import { html, useState, Icon, cx } from './lib.js';
import { Check, TaskRow } from './steps.js';
import { Button, Logo, SharkAvatar } from './components.js';
import { Sheet, inputCls } from './ui.js';
import { DayList, WeekBoard } from './board.js';
import { USER, DAYS, TODAY, METRICS, HISTORY, VALUE, WEEK_LABEL, g } from './data.js';
import { fmt, num } from './calc.js';

const NAV = ['בית', 'יומן', 'משימות', 'כספים', 'קבצים', 'לידים'];

// "השבוע שלי" on the home page, the whole width: the goal and the focus on top, the three tasks
// with their small steps on one side, and the week board (all seven days) on the other.
// (The journey map lives on the system's own home page, so it is not repeated here.)
function WeekCard({ s, tasks, items, focus, goal, drawn, onDraw, onStep, onTask, onLink, onHistory, onBoard, onAdd, onPick }) {
  // One task open at a time: the one the user picked, else the first one not done yet.
  const [pick, setPick] = useState(null);
  const link = 'text-[14px] font-bold text-brand-600 hover:underline cursor-pointer';
  if (!drawn)
    return html`<section class="paper flex flex-wrap items-center gap-x-5 gap-y-4 rounded-[18px] p-5 md:p-6">
      <${SharkAvatar} size=${56} mood="calm" />
      <div class="min-w-0 flex-1">
        <span class="hand block text-[34px] leading-none">השבוע שלי</span>
        <span class="text-[15px] text-muted">השבוע עוד לא מצויר · ${WEEK_LABEL} · כ-10 דקות</span>
        ${s.streak > 0 && html`<span class="mt-1 flex items-center gap-1.5 text-[14px] font-bold text-muted"><${Icon} name="flame" size=${16} class="text-warn" />${s.streak} שבועות ברצף. ${g('אל תשבור אותו', 'אל תשברי אותו')}</span>`}
      </div>
      <div class="flex flex-col items-center gap-2 max-sm:w-full">
        <${Button} class="max-sm:w-full" onClick=${onDraw}><${Icon} name="calendar-range" size=${20} />צייר לי שבוע מושלם<//>
        <button type="button" onClick=${onHistory} class=${link}>השבועות הקודמים</button>
      </div>
    </section>`;
  const done = tasks.filter((t) => s.homeDone[t.id]).length;
  const open = pick === 'none' ? null : pick || tasks.find((t) => !s.homeDone[t.id])?.id;
  const stepsAll = tasks.reduce((n, t) => n + (t.steps || []).length, 0);
  const stepsOn = tasks.reduce((n, t) => n + (s.stepsDone[t.id] || []).filter(Boolean).length, 0);
  return html`<section class="paper rounded-[18px] p-4 md:p-6">
    <div class="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div class="leading-none">
        <span class="hand block text-[38px] leading-none">השבוע שלי</span>
        <span class="text-[14px] font-bold text-muted">${WEEK_LABEL}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        ${goal &&
        html`<span class="inline-flex items-center gap-2 rounded-full bg-brand-600 py-1 pe-3.5 ps-1 text-white" title=${goal.sub}>
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15"><${Icon} name="flag" size=${16} /></span>
          <span class="leading-tight"><span class="block text-[11px] font-bold text-brand-100">יעד השבוע</span><b class="text-[15px]">${goal.head}</b></span>
        </span>`}
        ${focus && html`<span class="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[14px] font-bold text-white"><${Icon} name="crosshair" size=${15} class="text-brand-300" />${focus.title}</span>`}
        <span class="inline-flex items-center gap-1 rounded-full bg-warn-50 px-3 py-2 text-[14px] font-bold text-warn" title="שבועות ברצף"><${Icon} name="flame" size=${16} />${s.streak}</span>
      </div>
    </div>
    <div class="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div class="min-w-0">
        <div class="mb-1 flex items-baseline justify-between gap-2">
          <b class="text-[16px]">שלוש המשימות</b>
          <span class="text-[13px] tabular-nums text-muted">${done} מתוך 3${done === 3 ? '. שבוע מלא!' : ''}</span>
        </div>
        <div class="mb-1.5 h-2 overflow-hidden rounded-full bg-canvas ring-1 ring-line"><span class="block h-full rounded-full bg-brand-600 transition-all" style=${{ width: `${stepsAll ? (stepsOn / stepsAll) * 100 : 0}%` }}></span></div>
        <p class="mb-1 text-[13px] text-muted">${stepsOn} מתוך ${stepsAll} צעדים קטנים</p>
        <div class="flex flex-col">
          ${tasks.map((t, i) => html`<${TaskRow} key=${t.id} t=${t} i=${i} sd=${s.stepsDone[t.id]} done=${!!s.homeDone[t.id]} open=${open === t.id} onOpen=${() => setPick(open === t.id ? 'none' : t.id)} onStep=${onStep} onTask=${onTask} onLink=${onLink} meta=${`${DAYS[t.day].short} ${t.at || ''}`} />`)}
        </div>
        ${goal && html`<p class="mt-3 flex items-start gap-1.5 rounded-xl bg-canvas px-3 py-2 text-[13px] ring-1 ring-line"><${Icon} name="flag" size=${14} class="mt-0.5 shrink-0 text-brand-600" /><span><b>היעדים:</b> ${goal.sub}</span></p>`}
        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick=${() => onAdd()} class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] font-bold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50 cursor-pointer"><${Icon} name="calendar-plus" size=${15} />משימה ליומן</button>
          <button type="button" onClick=${onBoard} class=${cx(link, 'lg:hidden')}>הלוח של השבוע</button>
          <button type="button" onClick=${onDraw} class=${link}>לעדכן את השבוע</button>
          <button type="button" onClick=${onHistory} class=${link}>השבועות הקודמים</button>
        </div>
      </div>
      <div class="hidden min-h-[440px] min-w-0 lg:flex">
        <${WeekBoard} items=${items} bare onAdd=${onAdd} onPick=${onPick} class="w-full" />
      </div>
    </div>
  </section>`;
}

// A task of the user's own, straight into the calendar (beside the three of the ritual): what, which
// day, from when to when. It goes to Google Calendar like the task blocks; a tap on it edits or deletes.
function MineEditor({ item, isNew, onSave, onCancel, onDelete }) {
  const [d, setD] = useState(item);
  const put = (k) => (e) => setD((x) => ({ ...x, [k]: k === 'day' ? Number(e.target.value) : e.target.value }));
  const bad = d.to <= d.from;
  const ok = d.title.trim() && !bad;
  const save = () => ok && onSave({ ...d, title: d.title.trim() });
  const sel = 'h-10 rounded-lg border border-line bg-white px-2 text-[15px]';
  return html`<div>
    <input value=${d.title} onInput=${put('title')} onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), save())} placeholder="מה המשימה?" aria-label="המשימה" class=${cx(inputCls, 'mb-2.5')} autoFocus />
    <div class="flex flex-wrap items-center gap-1.5">
      <select value=${d.day} onChange=${put('day')} class=${sel} aria-label="יום">${DAYS.map((x) => html`<option value=${x.id}>${x.name} ${x.date}</option>`)}</select>
      <input type="time" dir="ltr" step="900" value=${d.from} onInput=${put('from')} class=${cx(sel, 'tabular-nums')} aria-label="משעה" />
      <span class="text-muted">עד</span>
      <input type="time" dir="ltr" step="900" value=${d.to} onInput=${put('to')} class=${cx(sel, 'tabular-nums', bad && '!border-error')} aria-label="עד שעה" />
    </div>
    ${bad && html`<p class="mt-1 text-[13px] font-bold text-error">שעת הסיום לפני ההתחלה</p>`}
    <div class="mt-4 flex items-center gap-2">
      <${Button} variant="mini" onClick=${save} disabled=${!ok}><${Icon} name="check" size=${15} />${isNew ? 'להוסיף ליומן' : 'לשמור'}<//>
      <${Button} variant="quiet" onClick=${onCancel}>ביטול<//>
      ${!isNew && html`<button type="button" onClick=${onDelete} class="ms-auto inline-flex items-center gap-1 text-[14px] font-bold text-error hover:underline cursor-pointer"><${Icon} name="trash-2" size=${15} />למחוק</button>`}
    </div>
  </div>`;
}

// A notification as it appears at the top of the home page (and by email).
function Notice({ icon, title, text, action, onClick }) {
  return html`<button type="button" onClick=${onClick} class="rise mb-4 flex w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-start text-white shadow-lg cursor-pointer">
    <${Icon} name=${icon} size=${22} class="text-brand-300" />
    <span class="min-w-0 flex-1"><b class="block text-[16px]">${title}</b><span class="text-[14px] text-white/80">${text}</span></span>
    <span class="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[14px] font-bold text-ink">${action}</span>
  </button>`;
}

export function Home({ s, set, tasks, items, focus, goal, drawn, mode, setMode, onDraw, notify, onStep, onTask, onLink }) {
  const [board, setBoard] = useState(false);
  const [mine, setMine] = useState(null); // { item, isNew }: a task of the user's own, in the editor
  const done = tasks.filter((t) => s.homeDone[t.id]).length;
  const where = s.connected ? 'ל-Google Calendar' : 'ללוח של השבוע';
  const addOn = (day = TODAY) => setMine({ isNew: true, item: { id: '', day, from: '12:00', to: '13:00', title: '' } });
  const pickMine = (it) => {
    const m = (s.mine || []).find((x) => x.id === it.mid);
    if (m) setMine({ item: m });
  };
  const saveMine = (x) => {
    if (mine.isNew) {
      set((y) => ({ ...y, mine: [...(y.mine || []), { ...x, id: `m${Date.now()}` }] }));
      notify(`המשימה נוספה ${where}`, 'calendar-plus');
    } else {
      set((y) => ({ ...y, mine: y.mine.map((m) => (m.id === x.id ? x : m)) }));
      notify('המשימה עודכנה, גם ביומן', 'check');
    }
    setMine(null);
  };
  const delMine = () => {
    const x = mine.item;
    set((y) => ({ ...y, mine: y.mine.filter((m) => m.id !== x.id) }));
    setMine(null);
    notify('המשימה נמחקה מהיומן', 'trash-2', () => set((y) => ({ ...y, mine: [...(y.mine || []), x] })));
  };
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
        <${WeekCard} s=${s} tasks=${tasks} items=${items} focus=${focus} goal=${goal} drawn=${drawn} onDraw=${onDraw} onStep=${onStep} onTask=${onTask} onLink=${onLink} onHistory=${() => setMode('history')} onBoard=${() => setBoard(true)} onAdd=${addOn} onPick=${pickMine} />
      </div>
    </main>
    ${mine && html`<${Sheet} title=${mine.isNew ? 'משימה חדשה ביומן' : 'משימה ביומן'} onClose=${() => setMine(null)}><${MineEditor} item=${mine.item} isNew=${mine.isNew} onSave=${saveMine} onCancel=${() => setMine(null)} onDelete=${delMine} /><//>`}
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
