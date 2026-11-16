// The week's goal. On the focus screen: a short road from "where you are now" (last week's
// numbers) to "where we get to this week" (the weekly targets), with the focus stage marked. The
// goal can be edited for this week only (the steady targets stay in "העסק במספרים"). After the
// ritual it shows on the journey map on the home page, at the current step.
import { html, useState, Icon, cx } from './lib.js';
import { SharkAvatar, Button } from './components.js';
import { inputCls } from './ui.js';
import { METRICS, g } from './data.js';
import { fmt, num } from './calc.js';

export const BASE = Object.fromEntries(METRICS.map((m) => [m.id, m.target]));
const STAGES = [
  ['leads', 'פניות', (v) => `${v} פניות`],
  ['calls', 'שיחות היכרות', (v) => (v === 1 ? 'שיחה אחת' : `${v} שיחות`)],
  ['closes', 'לקוחות חדשים', (v) => (v === 1 ? 'לקוח אחד' : `${v} לקוחות`)],
];

// The goal of the week, from the focus and this week's targets: the headline is the stuck stage.
export function weekGoalOf(focus, edit) {
  if (!focus) return null;
  const t = { ...BASE, ...(edit || {}) };
  const head = {
    leads: `${t.leads} פניות חדשות`,
    calls: `${t.calls} שיחות היכרות`,
    closes: t.closes === 1 ? 'לקוח חדש אחד' : `${t.closes} לקוחות חדשים`,
    steady: 'לשמור על הקצב',
  }[focus.id];
  const sub = `${STAGES.map(([id, , f]) => f(t[id])).join(' · ')} · ${fmt(t.revenue)}`;
  return { head, sub, stage: focus.stage, t, edited: !!edit };
}

function Spot({ icon, label, children, tone, class: cls = '', action }) {
  return html`<div class=${cx(cls, 'relative z-[1] w-[min(46%,250px)] rounded-xl px-3 py-2 shadow-[0_6px_16px_-8px_rgba(45,62,102,.4)]', tone === 'goal' ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-line')}>
    <span class=${cx('mb-0.5 flex items-center gap-1 text-[12px] font-bold', tone === 'goal' ? 'text-brand-100' : 'text-muted')}><${Icon} name=${icon} size=${13} />${label}${action}</span>
    ${children}
  </div>`;
}

// This week's targets, for this week only.
function GoalEditor({ goal, onSave, onCancel }) {
  const [d, setD] = useState(goal.t);
  const put = (id) => (e) => {
    const v = e.target.value.replace(/[^\d]/g, '');
    setD((x) => ({ ...x, [id]: v === '' ? '' : Number(v) }));
  };
  const ok = ['leads', 'calls', 'closes', 'revenue'].every((k) => d[k] !== '' && d[k] >= 0) && d.leads > 0;
  const fields = [...STAGES.map(([id, label]) => [id, label]), ['revenue', 'הכנסות (₪)']];
  return html`<div class="rise rounded-xl bg-canvas p-3 ring-1 ring-brand-200">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      ${fields.map(([id, label]) => html`<label key=${id} class="block">
        <span class="mb-1 block text-[13px] font-bold text-muted">${label}</span>
        <input inputmode="numeric" dir="ltr" value=${d[id] === '' ? '' : id === 'revenue' ? num(d[id]) : d[id]} onInput=${put(id)} class=${cx(inputCls, '!h-10 text-end font-display font-bold tabular-nums')} aria-label=${label} />
        <span class="mt-0.5 block text-[12px] text-faint">${id === 'revenue' ? `הקבוע: ${fmt(BASE[id])}` : `הקבוע: ${BASE[id]}`}</span>
      </label>`)}
    </div>
    <div class="mt-2.5 flex flex-wrap items-center gap-2">
      <${Button} variant="mini" disabled=${!ok} onClick=${() => onSave(d)}><${Icon} name="check" size=${15} />לשמור לשבוע הזה<//>
      <${Button} variant="quiet" onClick=${onCancel}>ביטול<//>
      ${goal.edited && html`<button type="button" onClick=${() => onSave(null)} class="ms-auto text-[14px] font-bold text-brand-600 hover:underline cursor-pointer">חזרה ליעד הקבוע</button>`}
    </div>
  </div>`;
}

// The focus screen: now → this week, with "לשנות" on the goal.
export function GoalMap({ goal, nums, onEdit }) {
  const [editing, setEditing] = useState(false);
  if (!goal) return null;
  const line = (vals) =>
    html`<span class="block text-[13px] leading-snug">${STAGES.map(([id, , f], i) => html`${i > 0 && ' · '}<span class=${cx(i === goal.stage && 'font-bold text-warn')}>${f(Number(vals[id]) || 0)}</span>`)}</span>`;
  return html`<div class="fb-panel mb-3 !p-4">
    <div class="mb-2 flex items-baseline justify-between gap-2">
      <b class="text-[15px]">יעד השבוע</b>
      <span class="text-[13px] text-muted">${goal.edited ? 'שונה לשבוע הזה בלבד' : 'אחרי הטקס הוא עולה גם למפה'}</span>
    </div>
    ${editing
      ? html`<${GoalEditor} goal=${goal} onSave=${(v) => (onEdit(v), setEditing(false))} onCancel=${() => setEditing(false)} />`
      : html`<div class="relative flex min-h-[128px] items-end justify-between gap-3">
          <svg viewBox="0 0 600 130" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <path d="M560 112 C 460 120, 420 40, 300 64 S 130 104, 40 22" fill="none" stroke="#dde9fc" stroke-width="14" stroke-linecap="round" vector-effect="non-scaling-stroke" />
            <path d="M560 112 C 460 120, 420 40, 300 64 S 130 104, 40 22" fill="none" stroke="#8fb3ef" stroke-width="2.5" stroke-dasharray="7 7" stroke-linecap="round" vector-effect="non-scaling-stroke" />
          </svg>
          <${Spot} icon="map-pin" label=${g('אתה כאן', 'את כאן')}>
            <b class="block text-[14px]">השבוע שעבר</b>
            ${line(nums)}
          <//>
          <${Spot} icon="flag" label="לאן מגיעים השבוע" tone="goal" class="self-start"
            action=${html`<button type="button" onClick=${() => setEditing(true)} class="ms-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-bold text-white ring-1 ring-white/40 hover:bg-white/15 cursor-pointer"><${Icon} name="pencil" size=${12} />לשנות</button>`}>
            <b class="block font-display text-[19px] leading-tight">${goal.head}</b>
            <span class="block text-[13px] text-white/85">${goal.sub}</span>
          <//>
        </div>`}
  </div>`;
}

// ---------- the journey map (home page) ----------
// The 15 steps in 6 chapters, as in the journey of November 2026.
const CHAPTERS = [
  { name: 'אפיון', steps: ['מציאת רעיון', 'אני והעסק'] },
  { name: 'שביל הכסף', steps: ['סל מוצרים', 'צייד הלקוחות', 'העסק במספרים'] },
  { name: 'בניית מותג אישי', steps: ['שם ולוגו', 'דף המסרים', 'הצעה מנצחת', 'דף נחיתה'] },
  { name: 'מביאים לקוחות', steps: ['מכונת תוכן שיווקי', 'לקוחות משלמים'] },
  { name: 'מגדילים מכירות', steps: ['חדר התרגול', 'שירות לקוחות אוטומטי'] },
  { name: 'העסק שתמיד רצית', steps: ['ניהול לקוחות', 'ליווי עסקי אנושי'] },
];
const STEPS = CHAPTERS.flatMap((c, ci) => c.steps.map((name, k) => ({ name, ch: ci, first: k === 0 })));

// Three rows of five, like a road on a page: right to left, a turn, left to right, a turn, and
// right to left again. The coordinates are in a 600 x 330 box.
const ROWS = [62, 172, 282];
const COLS = [540, 420, 300, 180, 60];
const POS = STEPS.map((_, i) => {
  const r = Math.floor(i / 5);
  const c = i % 5;
  return { x: r === 1 ? COLS[4 - c] : COLS[c], y: ROWS[r] };
});
function roadTo(n) {
  let d = `M${POS[0].x + 40} ${POS[0].y} L${POS[0].x} ${POS[0].y}`;
  for (let i = 1; i < n; i += 1) {
    const a = POS[i - 1];
    const b = POS[i];
    if (a.y === b.y) d += ` L${b.x} ${b.y}`;
    else {
      const out = a.x < 300 ? -44 : 44;
      d += ` C${a.x + out} ${a.y}, ${b.x + out} ${b.y}, ${b.x} ${b.y}`;
    }
  }
  return d;
}

export function JourneyMap({ step, goal, drawn }) {
  const total = STEPS.length;
  const cur = Math.min(Math.max(step, 1), total);
  const here = POS[cur - 1];
  const pct = (p) => ({ left: `${(p.x / 600) * 100}%`, top: `${(p.y / 330) * 100}%` });
  const side = here.x > 450 ? 'end' : here.x < 150 ? 'start' : 'mid';
  const shift = side === 'end' ? '-82%' : side === 'start' ? '-18%' : '-50%';
  const full = roadTo(total) + ` L${POS[total - 1].x - 30} ${POS[total - 1].y}`;
  return html`<section class="paper relative overflow-hidden rounded-[18px] p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <span class="leading-none"><span class="hand block text-[34px] leading-none">המפה של המסע</span></span>
      <span class="text-[14px] font-bold text-muted">פרק ${STEPS[cur - 1].ch + 1} · ${CHAPTERS[STEPS[cur - 1].ch].name} · שלב ${cur} מתוך ${total}</span>
    </div>
    <div class="relative mx-auto mt-3 aspect-[600/330] max-h-[340px] w-full max-sm:aspect-[6/5] max-sm:max-h-none">
      <svg viewBox="0 0 600 330" preserveAspectRatio="none" class="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d=${full} fill="none" stroke="#e7eefb" stroke-width="22" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <path d=${full} fill="none" stroke="#c6d6f3" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <path d=${roadTo(cur)} fill="none" stroke="#0038b8" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" class="map-done" />
      </svg>
      ${STEPS.map((st, i) => {
        const n = i + 1;
        const p = POS[i];
        const done = n < cur;
        const now = n === cur;
        return html`<div key=${n} class="absolute" style=${pct(p)}>
          <span title=${`שלב ${n} · ${st.name}`} class=${cx('absolute left-0 top-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display font-black tabular-nums', done ? 'h-7 w-7 bg-brand-600 text-white max-sm:h-6 max-sm:w-6' : now ? 'map-now h-10 w-10 bg-white text-[16px] text-brand-700 ring-[3px] ring-brand-600 max-sm:h-8 max-sm:w-8 max-sm:text-[14px]' : 'h-7 w-7 bg-white text-[12px] text-faint ring-1 ring-line max-sm:h-6 max-sm:w-6')}>
            ${done ? html`<${Icon} name="check" size=${15} strokeWidth=${3} />` : n === total ? html`<${Icon} name="flag" size=${14} />` : n}
          </span>
          ${st.first &&
          html`<span class=${cx('hand absolute left-0 whitespace-nowrap text-[19px] leading-none max-sm:hidden', p.x < 100 ? '-translate-x-[20%]' : p.x > 500 ? '-translate-x-[80%]' : '-translate-x-1/2', st.ch < STEPS[cur - 1].ch ? 'text-brand-600' : st.ch === STEPS[cur - 1].ch ? 'text-ink' : 'text-faint')} style=${{ top: now ? '26px' : '20px' }}>${CHAPTERS[st.ch].name}</span>`}
        </div>`;
      })}
      <div class="absolute z-[2]" style=${{ ...pct(here), transform: `translate(${shift}, calc(-100% - 26px))` }}>
        ${goal && drawn
          ? html`<div class="rise flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-600 py-1 pe-3 ps-1 text-white shadow-[0_10px_24px_-10px_rgba(0,56,184,.7)]">
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15"><${Icon} name="flag" size=${15} /></span>
              <b class="text-[14px]">${goal.head}</b>
            </div>`
          : html`<div class="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white py-1 pe-3 ps-1 shadow-[0_8px_20px_-10px_rgba(45,62,102,.5)] ring-1 ring-line">
              <${SharkAvatar} size=${26} mood="calm" />
              <b class="text-[14px]">${g('אתה כאן', 'את כאן')}</b>
            </div>`}
      </div>
    </div>
    <div class="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
      <span class="flex items-center gap-2 text-[14px]"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 font-display font-black text-brand-700">${cur}</span><span class="leading-tight"><span class="block text-[12px] font-bold text-muted">עכשיו</span><b>${STEPS[cur - 1].name}</b></span></span>
      ${goal && drawn
        ? html`<span class="flex items-center gap-2 text-[14px]"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><${Icon} name="flag" size=${15} /></span><span class="min-w-0 leading-tight"><span class="block text-[12px] font-bold text-muted">יעד השבוע</span><b class="block">${goal.sub}</b></span></span>`
        : cur < total && html`<span class="flex items-center gap-2 text-[14px] text-muted"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line"><${Icon} name="arrow-left" size=${15} /></span><span class="leading-tight"><span class="block text-[12px] font-bold">הבא</span><b class="text-ink">${STEPS[cur].name}</b></span></span>`}
    </div>
  </section>`;
}
