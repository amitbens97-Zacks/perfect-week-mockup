// The week board: seven days that fill in as the ritual goes ("מצייר" the week).
// Wide screens: a board beside the question. Phones: a strip of seven days on top, and the
// full board as a list in a sheet.
import { html, useState, useRef, Icon, cx, PencilLine } from './lib.js';
import { DAYS, TODAY, WEEK_LABEL, USER, g } from './data.js';
import { Sheet } from './ui.js';

export const TYPE = {
  client: { icon: 'user-round', cls: 'bg-white text-ink ring-1 ring-line', dot: 'bg-ink/60', label: 'פגישות' },
  sales: { icon: 'phone', cls: 'bg-white text-ink ring-1 ring-line', dot: 'bg-ink/60', label: 'פגישות' },
  group: { icon: 'users-round', cls: 'bg-white text-ink ring-1 ring-line', dot: 'bg-ink/60', label: 'פגישות' },
  mentor: { icon: 'sparkles', cls: 'bg-[#fbf1da] text-ink ring-1 ring-gold', dot: 'bg-gold', label: 'פגישת FlowBiz' },
  personal: { icon: 'coffee', cls: 'bg-canvas text-muted ring-1 ring-line', dot: 'bg-faint', label: 'אישי' },
  followup: { icon: 'message-circle', cls: 'bg-warn-50 text-warn ring-1 ring-[#ecd3a8]', dot: 'bg-warn', label: 'פולואפים' },
  post: { icon: 'megaphone', cls: 'bg-brand-100 text-brand-700 ring-1 ring-brand-200', dot: 'bg-brand-300', label: 'תוכן' },
  task: { icon: 'pencil', cls: 'bg-brand-600 text-white shadow-sm', dot: 'bg-brand-600', label: 'המשימות' },
  mine: { icon: 'clipboard-check', cls: 'bg-white text-brand-700 border border-dashed border-brand-300', dot: 'bg-white ring-1 ring-brand-600', label: 'משימות שהוספת' },
};
const ORDER = ['task', 'mine', 'mentor', 'client', 'followup', 'post', 'personal'];
const legendKey = (t) => (t === 'sales' || t === 'group' ? 'client' : t);
const sortItems = (a, b) => (a.at || '99').localeCompare(b.at || '99');

// One item: a small line with the icon and the time (or "באיחור"), then the label, cut at 2 lines
// (a task gets 3). The full text is in the tooltip and in the list view.
function Chip({ it, i, small }) {
  const T = TYPE[it.type];
  if (!small)
    return html`<div class=${cx('rise flex items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] leading-snug', T.cls)} style=${{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
      <${Icon} name=${it.icon || T.icon} size=${14} class="opacity-80" />
      ${it.at && html`<b class="tabular-nums">${it.at}</b>`}
      <span class=${cx('min-w-0 flex-1', it.type === 'task' && 'font-bold')}>${it.label}</span>
      ${it.late > 0 && html`<b class="text-[12px]">באיחור</b>`}
    </div>`;
  return html`<div
    class=${cx('rise min-w-0 rounded-lg px-1.5 py-1 leading-tight', T.cls, it.hi && 'ring-2 ring-brand-600')}
    style=${{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
    title=${it.label}
  >
    <span class="flex items-center gap-1 text-[11px] font-bold opacity-85">
      <${Icon} name=${it.icon || T.icon} size=${11} />
      ${it.at ? html`<span class="tabular-nums">${it.at}</span>` : it.late > 0 ? html`<span>באיחור</span>` : ''}
    </span>
    <span class=${cx('block overflow-hidden text-[11.5px]', it.type === 'task' ? 'font-bold [-webkit-line-clamp:3]' : '[-webkit-line-clamp:2]')} style=${{ display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>${it.short || it.label}</span>
  </div>`;
}

// items: [{ id, day, at, label, type, late, hi }]
// onMove: drag a card to another day, as in "מה כבר קבוע השבוע" (the follow-ups stay where the leads
// table puts them). onPick: a tap on a task the user added opens its editor.
export function WeekBoard({ items, focus, empty, onClose, bare, onAdd, onPick, onMove, class: cls = '' }) {
  const [drag, setDrag] = useState(null); // { id, x, y, over }
  const st = useRef(null);
  const swallow = useRef(false);
  const canMove = (it) => onMove && it.type !== 'followup';
  const dayAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-bday]');
    return el ? Number(el.dataset.bday) : null;
  };
  const handlers = (it) =>
    !canMove(it)
      ? {}
      : {
          onPointerDown: (e) => {
            if (e.button > 0) return;
            st.current = { it, x0: e.clientX, y0: e.clientY, moved: false };
            try {
              e.currentTarget.setPointerCapture?.(e.pointerId);
            } catch {}
          },
          onPointerMove: (e) => {
            const d = st.current;
            if (!d) return;
            if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
            d.moved = true;
            e.preventDefault();
            setDrag({ id: it.id, x: e.clientX, y: e.clientY, over: dayAt(e.clientX, e.clientY) });
          },
          onPointerUp: (e) => {
            const d = st.current;
            st.current = null;
            if (!d || !d.moved) return;
            swallow.current = true;
            setTimeout(() => (swallow.current = false), 50);
            const over = dayAt(e.clientX, e.clientY);
            setDrag(null);
            if (over != null && over !== it.day) onMove(it, over);
          },
          onPointerCancel: () => ((st.current = null), setDrag(null)),
        };
  const lifted = drag && items.find((x) => x.id === drag.id);
  const types = [...new Set(items.map((x) => legendKey(x.type)))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return html`<div class=${cx('flex min-h-0 flex-col', !bare && 'paper rounded-[18px] p-3 md:p-4', cls)}>
    ${!bare &&
    html`<div class="mb-2 flex items-end justify-between gap-2">
      <div class="leading-none">
        <span class="hand block text-[30px] leading-none">${g('השבוע של', 'השבוע של')} ${USER.firstName}</span>
        <span class="relative -mt-1 block h-2 w-28"><${PencilLine} class="absolute inset-0 h-2 w-full" /></span>
      </div>
      <span class="flex items-center gap-1">
        <span class="text-[13px] font-bold text-muted">${WEEK_LABEL}</span>
        ${onClose && html`<button type="button" onClick=${onClose} aria-label="לסגור את הלוח" title="לסגור את הלוח" class="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink cursor-pointer"><${Icon} name="chevrons-left" size=${17} /></button>`}
      </span>
    </div>`}
    ${focus &&
    html`<div class="rise mb-2 flex items-center gap-2 rounded-xl bg-ink px-3 py-1.5 text-[13px] font-bold text-white">
      <${Icon} name="crosshair" size=${15} class="text-brand-300" />הפוקוס: ${focus.title}
    </div>`}
    <div class="grid min-h-0 flex-1 grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,.7fr)_minmax(0,.55fr)] gap-1">
      ${DAYS.map((d) => {
        const list = items.filter((x) => x.day === d.id).sort(sortItems);
        const over = lifted && drag.over === d.id && lifted.day !== d.id;
        return html`<div key=${d.id} data-bday=${d.id} class=${cx('flex min-h-0 min-w-0 flex-col rounded-xl p-1 transition-colors', over ? 'bg-brand-50 ring-2 ring-brand-600' : d.id === TODAY ? 'bg-brand-50 ring-1 ring-brand-200' : d.id === 6 ? 'bg-canvas/70' : 'bg-canvas/40')}>
          <div class="mb-1 text-center leading-tight">
            <b class=${cx('block font-display text-[13px]', d.id === TODAY ? 'text-brand-600' : 'text-ink')}>${d.short}</b>
            <span class="text-[11px] tabular-nums text-muted">${d.date}</span>
          </div>
          <div class="thin-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            ${list.map((it, i) => {
              const pick = onPick && it.type !== 'followup' ? () => !swallow.current && onPick(it) : null;
              return html`<div
                key=${it.id}
                ...${handlers(it)}
                onClick=${pick}
                onKeyDown=${pick && ((e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick()))}
                role=${pick ? 'button' : undefined}
                tabIndex=${pick ? 0 : undefined}
                data-card=${canMove(it) ? '' : undefined}
                title=${pick ? 'לחיצה לעריכה, גרירה ליום אחר' : undefined}
                class=${cx(canMove(it) && 'touch-none select-none cursor-grab active:cursor-grabbing', pick && 'cursor-pointer hover:opacity-80', drag?.id === it.id && 'opacity-40')}
              ><${Chip} it=${it} i=${i} small /></div>`;
            })}
            ${list.length === 0 && d.id === 6 && html`<span class="mt-2 text-center text-[11px] text-faint">מנוחה</span>`}
            ${onAdd && html`<button type="button" onClick=${() => onAdd(d.id)} aria-label=${`להוסיף משימה ליומן ביום ${d.name}`} title="להוסיף משימה ליומן" class="inline-flex h-7 shrink-0 items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap rounded-lg text-[12px] font-bold text-brand-600 opacity-60 hover:bg-white hover:opacity-100 cursor-pointer"><${Icon} name="plus" size=${13} /><span class="hidden xl:inline">משימה</span></button>`}
          </div>
        </div>`;
      })}
    </div>
    ${lifted &&
    html`<div class=${cx('pointer-events-none fixed z-[60] w-[140px] rotate-[2deg] rounded-lg px-2 py-1 text-[12px] leading-tight shadow-xl', (TYPE[lifted.type] || TYPE.client).cls)} style=${{ left: `${drag.x - 70}px`, top: `${drag.y - 18}px` }}>
      ${lifted.at && html`<b class="block tabular-nums">${lifted.at}</b>`}<span class="block truncate">${lifted.short || lifted.label}</span>
    </div>`}
    ${empty && items.length === 0
      ? html`<p class="mt-2 text-center text-[13px] text-muted">כאן השבוע יצטייר, חלק אחרי חלק</p>`
      : html`<div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
          ${types.map((t) => html`<span key=${t} class="inline-flex items-center gap-1"><i class=${cx('h-2 w-2 rounded-full', TYPE[t].dot)}></i>${TYPE[t].label}</span>`)}
        </div>`}
  </div>`;
}

// Phones: seven small days with a dot per item; a tap opens the board as a list.
export function MiniWeek({ items, focus }) {
  const [open, setOpen] = useState(false);
  return html`<div class="mb-4 lg:hidden">
    <button type="button" onClick=${() => setOpen(true)} class="paper flex w-full items-stretch gap-1 rounded-2xl p-2 cursor-pointer" aria-label="הלוח של השבוע">
      ${DAYS.map((d) => {
        const list = items.filter((x) => x.day === d.id);
        return html`<span key=${d.id} class=${cx('flex flex-1 flex-col items-center gap-1 rounded-lg py-1', d.id === TODAY && 'bg-brand-50')}>
          <b class="text-[12px]">${d.short}</b>
          <span class="flex min-h-[8px] flex-wrap justify-center gap-0.5">${list.slice(0, 6).map((it) => html`<i key=${it.id} class=${cx('h-1.5 w-1.5 rounded-full', TYPE[it.type].dot)}></i>`)}</span>
        </span>`;
      })}
      <span class="grid place-items-center px-1 text-brand-600"><${Icon} name="maximize-2" size=${16} /></span>
    </button>
    ${open &&
    html`<${Sheet} title=${`השבוע · ${WEEK_LABEL}`} onClose=${() => setOpen(false)}>
      <${DayList} items=${items} focus=${focus} />
    <//>`}
  </div>`;
}

// The board as a list of days (phones, and the summary card).
export function DayList({ items, focus }) {
  return html`<div class="flex flex-col gap-2">
    ${focus && html`<div class="flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-[14px] font-bold text-white"><${Icon} name="crosshair" size=${15} class="text-brand-300" />הפוקוס: ${focus.title}</div>`}
    ${DAYS.map((d) => {
      const list = items.filter((x) => x.day === d.id).sort(sortItems);
      if (!list.length && d.id !== TODAY) return null;
      return html`<div key=${d.id} class="flex gap-3 border-b border-line pb-2 last:border-0">
        <div class="w-12 shrink-0 text-center"><b class=${cx('block font-display text-[15px]', d.id === TODAY && 'text-brand-600')}>${d.name}</b><span class="text-[12px] text-muted">${d.date}</span></div>
        <div class="flex min-w-0 flex-1 flex-col gap-1">${list.length ? list.map((it, i) => html`<${Chip} key=${it.id} it=${it} i=${i} />`) : html`<span class="text-[13px] text-faint">עוד ריק</span>`}</div>
      </div>`;
    })}
  </div>`;
}
