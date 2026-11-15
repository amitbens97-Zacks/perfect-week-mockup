// "מה כבר קבוע השבוע": the week as a full-screen calendar. Every calendar event and every post of
// the week sits on its day. Drag a card to another day (mouse: the whole card; touch: the grip),
// tap a card for a small editor, "+" on a day adds to it. Calendar edits go back to Google
// Calendar, post edits to the week plan of "מכונת תוכן". A move or a delete can be undone.
import { html, useState, useRef, Icon, cx } from './lib.js';
import { Button } from './components.js';
import { Sheet, inputCls, Tag } from './ui.js';
import { TYPE } from './board.js';
import { From } from './screens.js';
import { DAYS, TODAY } from './data.js';
import { hours, toMin } from './calc.js';

const EVENT_KINDS = [
  ['client', 'פגישת ליווי'],
  ['sales', 'שיחת היכרות'],
  ['group', 'סדנה'],
  ['mentor', 'פגישת FlowBiz'],
  ['personal', 'אישי'],
];
const POST_STATES = ['מתוזמן', 'לצלם ולהעלות', 'טיוטה'];
const selCls = 'h-10 rounded-lg border border-line bg-white px-2 text-[15px]';
const timeOf = (it) => (it.src === 'post' ? it.at : it.from);

// The small editor: title, day, time, and the kind (an event) or the state (a post).
function ItemEditor({ item, isNew, onSave, onCancel, onDelete }) {
  const [d, setD] = useState(item);
  const post = d.src === 'post';
  const put = (k) => (e) => setD((x) => ({ ...x, [k]: k === 'day' ? Number(e.target.value) : e.target.value }));
  const bad = !post && d.to <= d.from;
  const ok = d.title.trim() && !bad;
  const save = () => ok && onSave({ ...d, title: d.title.trim(), short: d.title === item.title ? item.short : undefined });
  const kind = (src) => setD((x) => (src === 'post' ? { ...x, src, at: x.at || x.from || '19:00', state: x.state || 'טיוטה', type: x.type || 'ערך' } : { ...x, src, from: x.from || '12:00', to: x.to || '13:00', kind: x.kind || 'client' }));
  return html`<div>
    ${isNew &&
    html`<div class="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-line" role="radiogroup" aria-label="מה מוסיפים">
      ${[['event', 'ליומן', 'calendar-days'], ['post', 'פוסט', 'megaphone']].map(([k, l, ic]) => html`<button key=${k} type="button" role="radio" aria-checked=${d.src === k} onClick=${() => kind(k)} class=${cx('inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[15px] font-bold cursor-pointer', d.src === k ? 'bg-brand-600 text-white' : 'text-ink hover:bg-canvas')}><${Icon} name=${ic} size=${15} />${l}</button>`)}
    </div>`}
    <input value=${d.title} onInput=${put('title')} onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), e.stopPropagation(), save())} placeholder=${post ? 'מה מפרסמים?' : 'מה ביומן?'} aria-label="כותרת" class=${cx(inputCls, 'mb-2.5')} autoFocus />
    <div class="flex flex-wrap items-center gap-1.5">
      <select value=${d.day} onChange=${put('day')} class=${selCls} aria-label="יום">${DAYS.map((x) => html`<option value=${x.id}>${x.name} ${x.date}</option>`)}</select>
      ${post
        ? html`<input type="time" dir="ltr" step="900" value=${d.at} onInput=${put('at')} class=${cx(selCls, 'tabular-nums')} aria-label="שעה" />
            <select value=${d.state} onChange=${put('state')} class=${selCls} aria-label="מצב">${POST_STATES.map((x) => html`<option value=${x}>${x}</option>`)}</select>`
        : html`<input type="time" dir="ltr" step="900" value=${d.from} onInput=${put('from')} class=${cx(selCls, 'tabular-nums')} aria-label="משעה" />
            <span class="text-muted">עד</span>
            <input type="time" dir="ltr" step="900" value=${d.to} onInput=${put('to')} class=${cx(selCls, 'tabular-nums', bad && '!border-error')} aria-label="עד שעה" />
            <select value=${d.kind} onChange=${put('kind')} class=${selCls} aria-label="סוג">${EVENT_KINDS.map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select>`}
    </div>
    ${bad && html`<p class="mt-1 text-[13px] font-bold text-error">שעת הסיום לפני ההתחלה</p>`}
    <div class="mt-4 flex items-center gap-2">
      <${Button} variant="mini" onClick=${save} disabled=${!ok}><${Icon} name="check" size=${15} />${isNew ? 'להוסיף' : 'לשמור'}<//>
      <${Button} variant="quiet" onClick=${onCancel}>ביטול<//>
      ${!isNew && html`<button type="button" onClick=${onDelete} class="ms-auto inline-flex items-center gap-1 text-[14px] font-bold text-error hover:underline cursor-pointer"><${Icon} name="trash-2" size=${15} />למחוק</button>`}
    </div>
  </div>`;
}

// One card on the calendar.
function Card({ it, lifted, handlers }) {
  const post = it.src === 'post';
  const T = TYPE[post ? 'post' : it.kind] || TYPE.client;
  return html`<div
    role="button"
    tabindex="0"
    aria-label=${`${it.title}, ${DAYS[it.day].name} ${timeOf(it)}. לחיצה לעריכה, גרירה ליום אחר`}
    data-card=${it.key}
    ...${handlers}
    class=${cx('group relative select-none rounded-lg px-2 py-1.5 text-start transition-opacity cursor-grab active:cursor-grabbing', T.cls, lifted && 'opacity-35')}
  >
    <span class="flex items-center gap-1 text-[12px] font-bold opacity-85">
      <${Icon} name=${T.icon} size=${12} />
      <span class="tabular-nums" dir="ltr">${post ? it.at : `${it.from}-${it.to}`}</span>
      <span data-grip class="ms-auto -me-1 grid h-6 w-6 touch-none place-items-center rounded opacity-50 group-hover:opacity-100" aria-hidden="true"><${Icon} name="grip-vertical" size=${14} /></span>
    </span>
    <span class=${cx('block overflow-hidden text-[13.5px] leading-snug', it.kind === 'personal' && 'text-muted')} style=${{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>${it.title}</span>
    ${post && html`<span class="mt-1 block"><${Tag} tone=${it.state === 'מתוזמן' ? 'live' : 'draft'}>${it.state}<//></span>`}
  </div>`;
}

export function WeekScreen({ sc, events, posts, setEvents, setPosts, notify, onConnect, connected }) {
  const [edit, setEdit] = useState(null); // { item, isNew }
  const [drag, setDrag] = useState(null); // { key, x, y, over }
  const st = useRef(null);
  const swallowClick = useRef(false);

  const all = [...events.map((e) => ({ ...e, src: 'event', key: `e${e.id}` })), ...posts.map((p) => ({ ...p, src: 'post', key: `p${p.id}` }))];
  const meetH = hours(events.filter((e) => e.kind !== 'personal').reduce((t, e) => t + toMin(e.to) - toMin(e.from), 0));
  const strip = ({ src, key, ...rest }) => rest;
  const setOf = (src) => (src === 'post' ? setPosts : setEvents);
  const where = (src) => (src === 'post' ? 'במכונת התוכן' : 'ב-Google Calendar');

  const move = (it, day) => {
    const from = it.day;
    setOf(it.src)((l) => l.map((y) => (y.id === it.id ? { ...y, day } : y)));
    notify(`עבר ליום ${DAYS[day].name}. עודכן גם ${where(it.src)}`, 'calendar-check', () => setOf(it.src)((l) => l.map((y) => (y.id === it.id ? { ...y, day: from } : y))));
  };
  const save = (x) => {
    const was = edit.item;
    const clean = strip(x);
    if (edit.isNew) {
      setOf(x.src)((l) => [...l, { ...clean, id: `n${Date.now()}` }]);
      notify(x.src === 'post' ? 'נוסף לתוכנית של מכונת התוכן' : 'נוסף ל-Google Calendar', 'plus');
    } else if (was.src !== x.src) {
      setOf(was.src)((l) => l.filter((y) => y.id !== was.id));
      setOf(x.src)((l) => [...l, clean]);
    } else {
      setOf(x.src)((l) => l.map((y) => (y.id === x.id ? clean : y)));
      notify(`עודכן גם ${where(x.src)}`, 'check');
    }
    setEdit(null);
  };
  const del = () => {
    const x = edit.item;
    setOf(x.src)((l) => l.filter((y) => y.id !== x.id));
    setEdit(null);
    notify(x.src === 'post' ? 'הפוסט נמחק' : 'האירוע נמחק', 'trash-2', () => setOf(x.src)((l) => [...l, strip(x)]));
  };
  const addOn = (day) =>
    setEdit({ isNew: true, item: connected ? { src: 'event', id: '', day, from: '12:00', to: '13:00', title: '', kind: 'client' } : { src: 'post', id: '', day, at: '19:00', title: '', state: 'טיוטה', type: 'ערך' } });

  // Drag: the mouse drags the whole card; on touch only the grip does (so the page still scrolls).
  const dayAt = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-day]');
    return el ? Number(el.dataset.day) : null;
  };
  const handlers = (it) => ({
    onPointerDown: (e) => {
      if (e.button > 0) return;
      if (e.pointerType !== 'mouse' && !e.target.closest('[data-grip]')) return;
      const r = e.currentTarget.getBoundingClientRect();
      st.current = { it, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, moved: false };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      const d = st.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
      d.moved = true;
      e.preventDefault();
      setDrag({ key: it.key, x: e.clientX, y: e.clientY, over: dayAt(e.clientX, e.clientY) });
    },
    onPointerUp: (e) => {
      const d = st.current;
      st.current = null;
      if (!d || !d.moved) return;
      swallowClick.current = true;
      setTimeout(() => (swallowClick.current = false), 50);
      const over = dayAt(e.clientX, e.clientY);
      setDrag(null);
      if (over != null && over !== it.day) move(it, over);
    },
    onPointerCancel: () => ((st.current = null), setDrag(null)),
    onClick: () => !swallowClick.current && setEdit({ item: it }),
    onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setEdit({ item: it })),
  });
  const lifted = drag && all.find((x) => x.key === drag.key);

  return html`<div class="mx-auto flex max-w-[1320px] flex-col px-4 py-5 md:px-8 lg:h-full">
    <div class="mb-3 flex flex-wrap items-end gap-x-6 gap-y-2">
      <div class="min-w-0 flex-1">
        <h1 class="fb-h1 mb-1 text-[26px] md:text-[32px]">מה כבר <span class="fb-marker">קבוע</span> השבוע</h1>
        <p class="max-w-[60ch] text-[17px] text-muted">משהו זז? גוררים ליום אחר. לחיצה על כרטיס פותחת עריכה.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-[14px]">
        ${connected && html`<span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold ring-1 ring-line"><${Icon} name="calendar-days" size=${15} class="text-brand-600" />${events.length} ביומן · ${meetH} שעות פגישות</span>`}
        ${posts.length > 0 && html`<span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold ring-1 ring-line"><${Icon} name="megaphone" size=${15} class="text-brand-600" />${posts.length} פוסטים</span>`}
        ${connected && html`<${From}>Google Calendar<//>`}
        ${posts.length > 0 && html`<${From}>מכונת תוכן<//>`}
      </div>
    </div>
    ${!connected &&
    html`<div class="fb-panel mb-3 flex flex-wrap items-center gap-3 !px-4 !py-3">
      <span class="fb-chip-ic h-10 w-10"><${Icon} name="calendar-x" size=${20} /></span>
      <span class="min-w-0 flex-1"><b class="block text-[16px]">היומן עוד לא מחובר</b><span class="text-[14px] text-muted">עם יומן, הכריש רואה את הפגישות ושם את המשימות בשעות הפנויות.</span></span>
      <${Button} variant="mini" onClick=${onConnect}><${Icon} name="link" size=${15} />לחבר את Google Calendar<//>
    </div>`}
    ${sc.step >= 10 && !sc.content && posts.length === 0 &&
    html`<button type="button" onClick=${() => notify('נפתח "מכונת תוכן שיווקי" על השבוע הזה', 'megaphone')} class="lp-option mb-3"><${Icon} name="megaphone" size=${18} class="text-brand-600" /><span class="flex-1 font-bold">עוד אין תוכן לשבוע. להכין עכשיו?</span><${Icon} name="chevron-left" size=${16} /></button>`}
    <div class="paper min-h-0 flex-1 rounded-[18px] p-2 md:p-3 max-lg:mb-20">
      <div class="grid h-full min-h-0 gap-1.5 max-lg:grid-cols-1 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,.85fr)_minmax(0,.7fr)]">
        ${DAYS.map((d) => {
          const list = all.filter((x) => x.day === d.id).sort((a, b) => timeOf(a).localeCompare(timeOf(b)));
          const over = drag && drag.over === d.id && lifted && lifted.day !== d.id;
          return html`<div key=${d.id} data-day=${d.id} class=${cx('flex min-h-0 min-w-0 flex-col rounded-xl p-1.5 transition-colors max-lg:flex-row max-lg:items-start max-lg:gap-2', over ? 'bg-brand-50 ring-2 ring-brand-600' : d.id === TODAY ? 'bg-brand-50/70 ring-1 ring-brand-200' : d.id === 6 ? 'bg-canvas/70' : 'bg-canvas/40')}>
            <div class="mb-1.5 text-center leading-tight max-lg:mb-0 max-lg:w-12 max-lg:shrink-0 max-lg:pt-1">
              <b class=${cx('block font-display text-[15px]', d.id === TODAY ? 'text-brand-600' : 'text-ink')}>${d.name}</b>
              <span class="text-[12px] tabular-nums text-muted">${d.date}</span>
            </div>
            <div class="thin-scroll flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto">
              ${list.map((it) => html`<${Card} key=${it.key} it=${it} lifted=${drag?.key === it.key} handlers=${handlers(it)} />`)}
              ${list.length === 0 && html`<span class="py-1 text-center text-[13px] text-faint max-lg:text-start">${d.id === 6 ? 'מנוחה' : 'פנוי'}</span>`}
              <button type="button" onClick=${() => addOn(d.id)} aria-label=${`להוסיף ליום ${d.name}`} class="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg text-[13px] font-bold text-brand-600 opacity-70 hover:bg-white hover:opacity-100 cursor-pointer max-lg:justify-start max-lg:px-1"><${Icon} name="plus" size=${14} />להוסיף</button>
            </div>
          </div>`;
        })}
      </div>
    </div>
    ${lifted &&
    html`<div class=${cx('pointer-events-none fixed z-[60] w-[160px] rotate-[2deg] rounded-lg px-2 py-1.5 shadow-xl', (TYPE[lifted.src === 'post' ? 'post' : lifted.kind] || TYPE.client).cls)} style=${{ left: `${drag.x - 80}px`, top: `${drag.y - 20}px` }}>
      <span class="block text-[12px] font-bold tabular-nums" dir="ltr">${timeOf(lifted)}</span>
      <span class="block truncate text-[13.5px]">${lifted.title}</span>
    </div>`}
    ${edit &&
    html`<${Sheet} title=${edit.isNew ? 'להוסיף לשבוע' : edit.item.src === 'post' ? 'הפוסט' : 'האירוע ביומן'} onClose=${() => setEdit(null)}>
      <${ItemEditor} item=${edit.item} isNew=${edit.isNew} onSave=${save} onCancel=${() => setEdit(null)} onDelete=${del} />
    <//>`}
  </div>`;
}
