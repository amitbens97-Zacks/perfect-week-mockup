// The week's goal. On the focus screen: a short road from "where you are now" (last week's
// numbers) to "where we get to this week" (the weekly targets), with the focus stage marked. The
// goal can be edited for this week only (the steady targets stay in "העסק במספרים"). After the
// ritual it shows in "השבוע שלי" on the home page.
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
      <span class="text-[13px] text-muted">${goal.edited ? 'שונה לשבוע הזה בלבד' : 'אחרי הטקס הוא מופיע גם בדף הבית'}</span>
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
