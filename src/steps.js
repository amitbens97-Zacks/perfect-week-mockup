// A task with its small steps (sub-tasks). Each step ticked = a small burst of confetti; the last
// step (or ticking the whole task) = the full confetti. Used on the done screen and the home card.
import { html, Icon, cx, PencilCheck } from './lib.js';

export function Check({ on, onClick, label, size = 'md' }) {
  return html`<button type="button" role="checkbox" aria-checked=${on} aria-label=${label} onClick=${onClick} class=${cx('grid shrink-0 place-items-center rounded-lg border-[1.5px] transition-colors cursor-pointer', size === 'sm' ? 'h-7 w-7' : 'h-8 w-8', on ? 'border-brand-600 bg-brand-100' : 'border-line bg-white hover:border-brand-300')}>
    ${on && html`<${PencilCheck} size=${size === 'sm' ? 18 : 20} color="#0038b8" weight=${3} />`}
  </button>`;
}

// t: the task; sd: the steps ticked so far ([bool]); done: the whole task is done.
export function TaskRow({ t, i, sd = [], done, open, onOpen, onStep, onTask, meta, onLink }) {
  const steps = t.steps || [];
  const n = steps.filter((_, k) => sd[k]).length;
  return html`<div class="border-b border-line py-1.5 last:border-0">
    <div class="flex items-center gap-2.5">
      <${Check} size="sm" on=${done} label=${t.text} onClick=${(e) => onTask(t, !done, e.currentTarget)} />
      <button type="button" onClick=${onOpen} aria-expanded=${open} class="flex min-w-0 flex-1 items-center gap-2 text-start cursor-pointer">
        ${i != null && html`<span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-black text-white">${i + 1}</span>`}
        <span class=${cx('min-w-0 flex-1 text-[15px] font-semibold leading-snug', done && 'text-muted line-through decoration-brand-300')}>${t.text}</span>
        ${meta && html`<span class="whitespace-nowrap text-[12px] tabular-nums text-muted">${meta}</span>`}
        ${steps.length > 0 && html`<span class=${cx('whitespace-nowrap rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums', done ? 'bg-money-50 text-money' : n ? 'bg-brand-100 text-brand-600' : 'bg-canvas text-muted ring-1 ring-line')}>${n}/${steps.length}</span>`}
        <${Icon} name="chevron-down" size=${15} class=${cx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>
    </div>
    ${open &&
    html`<ul class="rise mt-1 flex flex-col ps-9" aria-label="צעדים קטנים">
      ${steps.map((st, k) => {
        const on = !!sd[k];
        return html`<li key=${k}>
          <button type="button" role="checkbox" aria-checked=${on} onClick=${(e) => onStep(t, k, e.currentTarget.firstChild)} class="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-start hover:bg-canvas cursor-pointer">
            <span class=${cx('grid h-5 w-5 shrink-0 place-items-center rounded-md border-[1.5px] transition-colors', on ? 'border-brand-600 bg-brand-100' : 'border-line bg-white')}>${on && html`<${PencilCheck} size=${14} color="#0038b8" weight=${3} />`}</span>
            <span class=${cx('text-[14px] leading-snug', on ? 'text-muted line-through decoration-brand-300' : 'text-ink')}>${st}</span>
          </button>
        </li>`;
      })}
      ${t.link && onLink && html`<li><button type="button" onClick=${() => onLink(t)} class="mt-0.5 inline-flex items-center gap-1 px-1.5 text-[13px] font-bold text-brand-600 hover:underline cursor-pointer"><${Icon} name="arrow-up-left" size=${14} />לפתוח את "${t.link}"</button></li>`}
    </ul>`}
  </div>`;
}
