// The week's goal on the map. On the focus screen: a short road from "where you are now" (last
// week's numbers) to "where we get to this week" (the weekly targets), with the focus stage
// marked. The same goal then shows on the journey map on the home page.
import { html, Icon, cx } from './lib.js';
import { SharkAvatar } from './components.js';
import { METRICS, g } from './data.js';
import { fmt } from './calc.js';

const T = Object.fromEntries(METRICS.map((m) => [m.id, m.target]));
const STAGES = [
  ['leads', (v) => `${v} פניות`],
  ['calls', (v) => (v === 1 ? 'שיחה אחת' : `${v} שיחות`)],
  ['closes', (v) => (v === 1 ? 'לקוח אחד' : `${v} לקוחות`)],
];

// The goal of the week, from the focus: its headline is the stage that's stuck.
export function weekGoalOf(focus) {
  if (!focus) return null;
  const head = {
    leads: `${T.leads} פניות חדשות`,
    calls: `${T.calls} שיחות היכרות`,
    closes: T.closes === 1 ? 'לקוח חדש אחד' : `${T.closes} לקוחות חדשים`,
    steady: 'לשמור על הקצב',
  }[focus.id];
  return { head, stage: focus.stage, revenue: T.revenue };
}

function Spot({ icon, label, children, tone, class: cls = '' }) {
  return html`<div class=${cx(cls, 'relative z-[1] w-[min(46%,240px)] rounded-xl px-3 py-2 shadow-[0_6px_16px_-8px_rgba(45,62,102,.4)]', tone === 'goal' ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-line')}>
    <span class=${cx('mb-0.5 flex items-center gap-1 text-[12px] font-bold', tone === 'goal' ? 'text-brand-100' : 'text-muted')}><${Icon} name=${icon} size=${13} />${label}</span>
    ${children}
  </div>`;
}

// The focus screen: now → this week.
export function GoalMap({ goal, nums }) {
  if (!goal) return null;
  const line = (vals, hi) =>
    html`<span class="block text-[13px] leading-snug">${STAGES.map(([id, f], i) => html`${i > 0 && ' · '}<span class=${cx(i === goal.stage && hi)}>${f(Number(vals[id]) || 0)}</span>`)}</span>`;
  return html`<div class="fb-panel mb-3 !p-4">
    <div class="mb-2 flex items-baseline justify-between gap-2">
      <b class="text-[15px]">יעד השבוע</b>
      <span class="text-[13px] text-muted">מה שקובעים כאן עולה גם למפה</span>
    </div>
    <div class="relative flex min-h-[128px] items-end justify-between gap-3">
      <svg viewBox="0 0 600 130" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M560 112 C 460 120, 420 40, 300 64 S 130 104, 40 22" fill="none" stroke="#dde9fc" stroke-width="14" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <path d="M560 112 C 460 120, 420 40, 300 64 S 130 104, 40 22" fill="none" stroke="#8fb3ef" stroke-width="2.5" stroke-dasharray="7 7" stroke-linecap="round" vector-effect="non-scaling-stroke" class="goal-road" />
      </svg>
      <${Spot} icon="map-pin" label=${g('אתה כאן', 'את כאן')}>
        <b class="block text-[14px]">השבוע שעבר</b>
        ${line(nums, 'font-bold text-warn')}
      <//>
      <${Spot} icon="flag" label="לאן מגיעים השבוע" tone="goal" class="self-start">
        <b class="block font-display text-[19px] leading-tight">${goal.head}</b>
        <span class="block text-[13px] text-white/85">${STAGES.map(([id, f]) => f(T[id])).join(' · ')} · ${fmt(goal.revenue)}</span>
      <//>
    </div>
  </div>`;
}

// The home page: the journey map (as on the dashboard), with the week's goal at "you are here".
export function JourneyMap({ step, total = 15, goal, drawn }) {
  const pts = Array.from({ length: total }, (_, i) => {
    const t = i / (total - 1);
    return { x: 560 - t * 520, y: 150 + 70 * Math.sin(t * Math.PI * 2.2) };
  });
  const road = pts.reduce((d, p, i) => d + (i ? ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `M${p.x} ${p.y}`), '');
  const cur = pts[Math.min(step, total) - 1];
  const pct = (p) => ({ left: `${(p.x / 600) * 100}%`, top: `${(p.y / 300) * 100}%` });
  return html`<section class="paper relative min-h-[340px] overflow-hidden rounded-[18px] p-5">
    <div class="flex items-baseline justify-between gap-2">
      <b class="font-display text-[19px]">המפה של המסע</b>
      <span class="text-[13px] text-muted">שלב ${step} מתוך ${total}</span>
    </div>
    <div class="relative mt-2 h-[260px]">
      <svg viewBox="0 0 600 300" preserveAspectRatio="none" class="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d=${road} fill="none" stroke="#dde9fc" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <path d=${road} fill="none" stroke="#8fb3ef" stroke-width="2.5" stroke-dasharray="7 7" vector-effect="non-scaling-stroke" />
      </svg>
      ${pts.map((p, i) => {
        const n = i + 1;
        return html`<span key=${n} class=${cx('absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-bold tabular-nums', n < step ? 'h-6 w-6 bg-brand-600 text-[11px] text-white' : n === step ? 'h-8 w-8 bg-white text-[13px] text-brand-700 ring-[3px] ring-brand-600' : 'h-6 w-6 bg-white text-[11px] text-muted ring-1 ring-line')} style=${pct(p)}>${n}</span>`;
      })}
      ${cur &&
      html`<div class="absolute z-[2]" style=${{ ...pct(cur), transform: 'translate(-50%, calc(-100% - 22px))' }}>
        ${goal && drawn
          ? html`<div class="rise flex items-center gap-2 whitespace-nowrap rounded-xl bg-brand-600 px-3 py-2 text-white shadow-lg">
              <${Icon} name="flag" size=${16} class="text-brand-100" />
              <span class="leading-tight"><span class="block text-[12px] font-bold text-brand-100">יעד השבוע</span><b class="text-[15px]">${goal.head}</b></span>
            </div>`
          : html`<div class="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-[13px] font-bold text-muted shadow ring-1 ring-line"><${SharkAvatar} size=${22} mood="calm" />${g('אתה כאן', 'את כאן')}</div>`}
        <span class=${cx('absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent', goal && drawn ? 'border-t-brand-600' : 'border-t-white')}></span>
      </div>`}
    </div>
    <p class="text-[13px] text-muted">כמו בדשבורד. כאן המוקאפ מראה רק את המסע ואת יעד השבוע.</p>
  </section>`;
}
