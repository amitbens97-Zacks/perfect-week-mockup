// The ritual's screens. One question per screen, one short line under it; the week board beside it
// fills in as the user goes (on phones: the seven-day strip on top).
import { html, useState, Icon, cx, PencilCheck, confetti } from './lib.js';
import { Button, SharkAvatar, InlineEdit } from './components.js';
import { inputCls, Tag } from './ui.js';
import { WeekBoard, MiniWeek } from './board.js';
import { USER, DAYS, METRICS, DECISIONS, KIND, VALUE, WEEK_LABEL, LAST_WEEK_LABEL, PARTNER, g } from './data.js';
import { fmt, num, hours, monthPace, dayName, toMin } from './calc.js';

// ---------- the frame ----------
export function Frame({ title, sub, items, focus, empty, children, wideBoard }) {
  return html`<div class=${cx('mx-auto h-full max-w-[1320px] px-4 py-5 md:px-8 lg:grid lg:gap-8 lg:py-5', wideBoard ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)]')}>
    <div class="thin-scroll min-w-0 lg:h-full lg:overflow-y-auto lg:pe-1">
      <${MiniWeek} items=${items} focus=${focus} />
      <h1 class="fb-h1 mb-1.5 text-[26px] md:text-[32px]">${title[0]}<span class="fb-marker">${title[1]}</span>${title[2] || ''}</h1>
      ${sub && html`<p class="mb-4 max-w-[60ch] text-[17px] text-muted">${sub}</p>`}
      ${children}
    </div>
    <div class="hidden min-h-0 lg:flex"><${WeekBoard} items=${items} focus=${focus} empty=${empty} class="w-full" /></div>
  </div>`;
}

// Where a prefilled value came from.
export function From({ children }) {
  return html`<span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-canvas px-2 py-0.5 text-[12px] font-bold text-muted ring-1 ring-line"><${Icon} name="link-2" size=${12} />${children}</span>`;
}

function Check({ on, onClick, label }) {
  return html`<button type="button" role="checkbox" aria-checked=${on} aria-label=${label} onClick=${onClick} class=${cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg border-[1.5px] transition-colors cursor-pointer', on ? 'border-brand-600 bg-brand-100' : 'border-line bg-white hover:border-brand-300')}>
    ${on && html`<${PencilCheck} size=${20} color="#0038b8" weight=${3} />`}
  </button>`;
}

export function Switch({ on, onChange, label, sub }) {
  return html`<button type="button" role="switch" aria-checked=${on} onClick=${() => onChange(!on)} class="flex w-full items-center gap-3 text-start cursor-pointer">
    <span class=${cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-brand-600' : 'bg-line')}>
      <span class=${cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'right-6' : 'right-1')}></span>
    </span>
    <span class="min-w-0"><b class="block text-[16px]">${label}</b>${sub && html`<span class="block text-[14px] text-muted">${sub}</span>`}</span>
  </button>`;
}

// ---------- opening ----------
export function Opening({ parts, sc, s, items }) {
  const streak = s.streak;
  return html`<${Frame} title=${['צייר לי ', 'שבוע מושלם', '']} items=${items} empty>
    <p class="-mt-0.5 mb-5 max-w-[44ch] text-[18px] text-ink-2">10 דקות, ויש לך שבוע: מה כבר ביומן, למי לחזור, ושלוש משימות שבאמת מזיזות את העסק.</p>
    <ol class="mb-5 flex flex-col gap-2.5" aria-label="החלקים">
      ${parts.map((p, i) => html`<li key=${p.id} class="flex items-start gap-3">
        <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-[13px] font-black text-brand-600">${i + 1}</span>
        <span class="leading-snug"><b class="block text-[16px]">${p.label}</b><span class="text-[14px] text-muted">${p.why}</span></span>
      </li>`)}
    </ol>
    ${s.closed && html`<p class="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[15px] font-semibold text-brand-900"><${Icon} name="fast-forward" size=${16} class="text-brand-600" />${g('את השבוע שעבר סגרת ביום חמישי, אז מתחילים ישר מהתכנון.', 'את השבוע שעבר סגרת ביום חמישי, אז מתחילים ישר מהתכנון.')}</p>`}
    ${streak > 0
      ? html`<div class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[14px] font-bold ring-1 ring-line"><${Icon} name="flame" size=${17} class="text-warn" />${streak} ${streak === 1 ? 'שבוע' : 'שבועות'} ברצף. השבוע ${streak + 1}?</div>`
      : html`<div class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[14px] font-bold ring-1 ring-line"><${Icon} name="sparkles" size=${16} class="text-brand-600" />השבוע הראשון שלך. מכאן מתחיל הרצף.</div>`}
  <//>`;
}

// ---------- 1. what got done last week ----------
export function LastWeek({ s, set, tasks, items }) {
  const done = tasks.filter((t) => s.lastDone[t.id]).length;
  return html`<${Frame} title=${['מה יצא ', 'מהשבוע שעבר', '?']} sub=${g('מסמנים מה בוצע. מה שלא, יכול לעבור לשבוע הזה.', 'מסמנות מה בוצע. מה שלא, יכול לעבור לשבוע הזה.')} items=${items} empty>
    <p class="mb-3 text-[14px] font-bold text-muted">${LAST_WEEK_LABEL}</p>
    <div class="flex flex-col gap-2.5">
      ${tasks.map((t) => {
        const on = !!s.lastDone[t.id];
        return html`<div key=${t.id} class="fb-panel !p-3.5">
          <div class="flex items-center gap-3">
            <${Check} on=${on} label=${t.text} onClick=${() => set((x) => ({ ...x, lastDone: { ...x.lastDone, [t.id]: !on } }))} />
            <span class=${cx('min-w-0 flex-1 text-[16px] font-semibold', on && 'text-muted line-through decoration-brand-300')}>${t.text}</span>
            ${t.done && on && html`<${Tag}>סומן ברביעי<//>`}
          </div>
          ${!on &&
          html`<div class="mt-2.5 border-t border-line pt-2.5 ps-11">
            <${Switch} on=${s.carry[t.id] !== false} onChange=${(v) => set((x) => ({ ...x, carry: { ...x.carry, [t.id]: v } }))} label="לעבור לשבוע הזה" sub="הכריש ישלב אותה בשלוש המשימות" />
          </div>`}
        </div>`;
      })}
    </div>
    <p class="mt-4 text-[16px] font-bold">${done} מתוך ${tasks.length} בוצעו${done === tasks.length ? '. שבוע מלא!' : '.'}</p>
  <//>`;
}

// ---------- 2a. what's already in the week ----------
export function WeekScreen({ sc, events, posts, meeting, items, notify, onConnect, connected }) {
  const meetH = hours(events.filter((e) => e.kind !== 'personal').reduce((t, e) => t + toMin(e.to) - toMin(e.from), 0));
  return html`<${Frame} title=${['מה כבר ', 'קבוע', ' השבוע']} sub="אין כאן שאלות. הכריש מצייר את מה שכבר בלוח." items=${items}>
    <div class="flex flex-col gap-3">
      ${connected
        ? html`<div class="fb-panel !p-4">
            <div class="flex items-center gap-3">
              <span class="fb-chip-ic h-10 w-10"><${Icon} name="calendar-days" size=${20} /></span>
              <div class="min-w-0 flex-1"><b class="block text-[17px]">${events.length} אירועים ביומן</b><span class="text-[14px] text-muted">${meetH} שעות של פגישות עם לקוחות</span></div>
              <${From}>Google Calendar<//>
            </div>
          </div>`
        : html`<div class="fb-panel !p-4">
            <div class="flex items-start gap-3">
              <span class="fb-chip-ic h-10 w-10"><${Icon} name="calendar-x" size=${20} /></span>
              <div class="min-w-0 flex-1">
                <b class="block text-[17px]">היומן עוד לא מחובר</b>
                <span class="mb-2.5 block text-[14px] text-muted">עם יומן, הכריש רואה את הפגישות ושם את המשימות בשעות הפנויות. בלעדיו ממשיכים כרגיל.</span>
                <${Button} variant="mini" onClick=${onConnect}><${Icon} name="link" size=${15} />לחבר את Google Calendar<//>
              </div>
            </div>
          </div>`}
      ${meeting &&
      html`<div class="fb-panel !p-4 ring-1 ring-gold">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fbf1da] text-ink"><${Icon} name="sparkles" size=${20} /></span>
          <div class="min-w-0 flex-1"><b class="block text-[17px]">${meeting.title}</b><span class="text-[14px] text-muted">יום ${dayName(meeting.day)} ב-${meeting.from}. נכין לה שאלות בהמשך.</span></div>
        </div>
      </div>`}
      ${posts.length > 0 &&
      html`<div class="fb-panel !p-4">
        <div class="mb-2 flex items-center gap-3">
          <span class="fb-chip-ic h-10 w-10"><${Icon} name="megaphone" size=${20} /></span>
          <b class="min-w-0 flex-1 text-[17px]">מה מפרסמים השבוע</b>
          <${From}>מכונת תוכן<//>
        </div>
        <ul class="flex flex-col gap-1.5">
          ${posts.map((p) => html`<li key=${p.id} class="flex items-center gap-2 text-[15px]">
            <b class="w-14 shrink-0 text-[13px] text-muted">${DAYS[p.day].name}</b>
            <span class="min-w-0 flex-1 truncate">${p.title}</span>
            <${Tag} tone=${p.state === 'מתוזמן' ? 'live' : 'draft'}>${p.state}<//>
          </li>`)}
        </ul>
      </div>`}
      ${sc.step >= 10 && posts.length === 0 &&
      html`<button type="button" onClick=${() => notify('נפתח "מכונת תוכן שיווקי" על השבוע הזה', 'megaphone')} class="lp-option"><${Icon} name="megaphone" size=${18} class="text-brand-600" /><span class="flex-1 font-bold">עוד אין תוכן לשבוע. להכין עכשיו?</span><${Icon} name="chevron-left" size=${16} /></button>`}
    </div>
  <//>`;
}

// ---------- 2b. follow-ups ----------
export function Followups({ list, s, onSent, onUnsend, setMsg, notify, items }) {
  const left = list.filter((f) => !s.sent[f.id]).length;
  // One open at a time: the one the user picked, or the next one still waiting.
  const [pick, setPick] = useState(null);
  const openId = pick && !s.sent[pick] ? pick : list.find((f) => !s.sent[f.id])?.id;
  const lateTag = (f) => (f.late > 0 ? html`<${Tag} tone="draft">באיחור ${f.late === 1 ? 'יום' : `${f.late} ימים`}<//>` : html`<span class="text-[13px] text-muted">${f.due}</span>`);
  return html`<${Frame} title=${['למי ', 'לחזור', ' השבוע']} sub=${g('קודם מי שמחכה הכי הרבה. ההודעות מוכנות, בקול שלך.', 'קודם מי שמחכה הכי הרבה. ההודעות מוכנות, בקול שלך.')} items=${items}>
    <div class="flex flex-col gap-2">
      ${list.map((f) => {
        const sent = s.sent[f.id];
        if (sent)
          return html`<div key=${f.id} class="fb-panel flex items-center gap-3 !px-3.5 !py-2.5">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100"><${PencilCheck} size=${18} color="#0038b8" weight=${3} /></span>
            <span class="min-w-0 flex-1"><b class="text-[16px]">${f.name}</b><span class="block text-[13px] text-muted">עודכן בלידים · פולואפ הבא ב-${sent}</span></span>
            <button type="button" onClick=${() => onUnsend(f)} class="text-[14px] font-bold text-brand-600 hover:underline cursor-pointer">ביטול</button>
          </div>`;
        if (f.id !== openId)
          return html`<button key=${f.id} type="button" onClick=${() => setPick(f.id)} class="fb-panel flex w-full items-center gap-2.5 !px-3.5 !py-2.5 text-start cursor-pointer hover:ring-1 hover:ring-brand-300">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warn-50 text-warn"><${Icon} name="message-circle" size=${16} /></span>
            <b class="text-[16px]">${f.name}</b>
            <${Tag} tone=${f.kind === 'client' ? 'blue' : 'muted'}>${f.status}<//>
            ${lateTag(f)}
            <${Icon} name="chevron-down" size=${16} class="ms-auto text-muted" />
          </button>`;
        return html`<div key=${f.id} class="fb-panel rise !p-4 ring-1 ring-brand-200">
          <div class="mb-1 flex flex-wrap items-center gap-2">
            <b class="text-[17px]">${f.name}</b>
            <${Tag} tone=${f.kind === 'client' ? 'blue' : 'muted'}>${f.status}<//>
            ${lateTag(f)}
          </div>
          <p class="mb-2 text-[14px] text-muted">${f.note}</p>
          <div class="mb-2.5 rounded-xl bg-canvas p-3 text-[15px] leading-relaxed ring-1 ring-line">
            <${InlineEdit} value=${s.msgs[f.id] ?? f.msg} multiline onSave=${(v) => setMsg(f.id, v)} />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <${Button} variant="mini" onClick=${() => notify(`נפתח וואטסאפ עם ההודעה ל${f.name}`, 'message-circle')}><${Icon} name="message-circle" size=${15} />לשלוח בוואטסאפ<//>
            <${Button} variant="quiet" onClick=${async () => {
              try {
                await navigator.clipboard.writeText(s.msgs[f.id] ?? f.msg);
              } catch {}
              notify('ההודעה הועתקה', 'copy');
            }}><${Icon} name="copy" size=${15} />להעתיק<//>
            <button type="button" onClick=${() => onSent(f)} class="ms-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[14px] font-bold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50 cursor-pointer"><${Icon} name="check" size=${15} />שלחתי</button>
          </div>
        </div>`;
      })}
    </div>
    <p class="mt-3 text-[14px] text-muted">${left === 0 ? 'כל הפולואפים יצאו. הלידים עודכנו.' : `"שלחתי" מעדכן את הליד בטבלה: מגע אחרון היום, והפולואפ הבא נקבע לבד.`}</p>
  <//>`;
}

// ---------- 3a. the numbers ----------
export function Numbers({ s, set, items }) {
  const n = s.nums;
  const put = (id, v) => set((x) => ({ ...x, nums: { ...x.nums, [id]: v === '' ? '' : Math.max(0, Number(String(v).replace(/[^\d]/g, ''))) } }));
  const from = { leads: 'מהלידים', calls: 'מהיומן', closes: 'מ"סגרתי!"', revenue: 'מהמרכז הפיננסי' };
  return html`<${Frame} title=${['המספרים של ', 'השבוע שעבר', '']} sub=${g('הכריש מילא את מה שהוא כבר יודע. בודקים, משלימים, ושומרים.', 'הכריש מילא את מה שהוא כבר יודע. בודקות, משלימות, ושומרות.')} items=${items}>
    <p class="mb-3 text-[14px] font-bold text-muted">${LAST_WEEK_LABEL}</p>
    <div class="fb-panel !p-0">
      ${METRICS.map((m) => html`<label key=${m.id} class="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0">
        <span class="fb-chip-ic h-9 w-9"><${Icon} name=${m.icon} size=${18} /></span>
        <span class="min-w-0 flex-1"><b class="block text-[16px]">${m.label}</b>${from[m.id] && n[m.id] !== '' ? html`<${From}>${from[m.id]}<//>` : html`<span class="text-[13px] text-muted">${m.id === 'marketing' ? 'לא חובה. אם לא יודעים, משאירים ריק' : ''}</span>`}</span>
        <span class="text-[13px] text-muted max-sm:hidden">יעד: ${m.money ? fmt(m.target) : m.target}</span>
        <span class="relative">
          <input inputmode="numeric" dir="ltr" value=${n[m.id] === '' ? '' : m.money ? num(n[m.id]) : n[m.id]} onInput=${(e) => put(m.id, e.target.value)} placeholder="—" class=${cx(inputCls, '!h-10 !w-28 text-end font-display font-bold tabular-nums', m.money && '!pe-3 !ps-7')} aria-label=${m.label} />
          ${m.money && html`<span class="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[14px] text-muted">₪</span>`}
        </span>
      </label>`)}
    </div>
    <p class="mt-3 text-[14px] text-muted">הסכומים לפני מס. נשמר בטבלת המספרים, שורה לשבוע.</p>
  <//>`;
}

// ---------- 3b. the focus ----------
export function Focus({ s, focus, items }) {
  const n = s.nums;
  const stages = [
    { id: 'leads', label: 'פניות', v: n.leads, t: METRICS[0].target },
    { id: 'calls', label: 'שיחות', v: n.calls, t: METRICS[1].target },
    { id: 'closes', label: 'לקוחות', v: n.closes, t: METRICS[2].target },
  ];
  const rate = (a, b) => (a > 0 ? `${Math.round((b / a) * 100)}%` : '—');
  const pace = monthPace(USER.monthSoFar, USER.goalMonth);
  return html`<${Frame} title=${['הפוקוס של ', 'השבוע', '']} sub="איפה הדרך מפנייה ללקוח נתקעת. משם מתחילים." items=${items} focus=${focus}>
    <div class="fb-panel mb-3 !p-4">
      <div class="flex items-stretch gap-1.5">
        ${stages.map((st, i) => {
          const ok = st.v / st.t >= 0.6;
          const hit = focus?.stage === i;
          return html`${i > 0 && html`<span class="flex shrink-0 flex-col items-center justify-center px-0.5 text-center text-muted"><${Icon} name="arrow-left" size=${16} /><b class="text-[12px] tabular-nums">${rate(stages[i - 1].v, st.v)}</b></span>`}
          <div key=${st.id} class=${cx('min-w-0 flex-1 rounded-xl p-2.5 text-center', hit ? 'bg-warn-50 ring-2 ring-warn' : 'bg-canvas ring-1 ring-line')}>
            <span class="block text-[13px] font-bold text-muted">${st.label}</span>
            <b class=${cx('block font-display text-[28px] font-black leading-tight tabular-nums', hit ? 'text-warn' : ok ? 'text-ink' : 'text-ink')}>${st.v}</b>
            <span class="text-[12px] text-muted">מתוך ${st.t}</span>
          </div>`;
        })}
      </div>
    </div>
    ${focus &&
    html`<div class="rise mb-3 flex items-start gap-3 rounded-2xl bg-ink p-4 text-white">
      <${SharkAvatar} size=${44} mood=${focus.id === 'steady' ? 'happy' : 'thinking'} />
      <div class="min-w-0">
        <span class="text-[13px] font-bold text-brand-300">${PARTNER.name} · הפוקוס של השבוע</span>
        <b class="block font-display text-[22px] leading-tight">${focus.title}</b>
        <p class="mt-1 text-[15px] text-white/85">${focus.line}</p>
        <p class="mt-1.5 text-[14px] font-bold text-brand-300">המשימה הראשונה של השבוע תצא מכאן.</p>
      </div>
    </div>`}
    <div class="fb-panel !p-4">
      <div class="mb-1.5 flex items-baseline justify-between gap-2">
        <b class="text-[15px]">נובמבר: ${fmt(USER.monthSoFar)} מתוך ${fmt(USER.goalMonth)}</b>
        <span class=${cx('text-[14px] font-bold', pace.ok ? 'text-money' : 'text-warn')}>${pace.p}%</span>
      </div>
      <div class="relative h-3 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
        <span class="block h-full rounded-full bg-money" style=${{ width: `${Math.min(100, pace.p)}%` }}></span>
        <span class="absolute inset-y-0 border-s-2 border-dashed border-ink/50" style=${{ insetInlineStart: `${pace.time}%` }}></span>
      </div>
      <p class="mt-1.5 text-[14px] text-muted">${pace.ok ? g('עבר חצי חודש, ואתה בקצב ליעד.', 'עבר חצי חודש, ואת בקצב ליעד.') : 'עבר חצי חודש, וההכנסות מאחור.'} השבוע: ${fmt(n.revenue)} מתוך ${fmt(METRICS[3].target)}.</p>
    </div>
  <//>`;
}

// ---------- 4. the FlowBiz meeting (only when it's in the calendar) ----------
export function Meeting({ meeting, s, set, items, soon }) {
  const [text, setText] = useState('');
  const picked = DECISIONS.filter((d) => s.questions[d.id]).length + s.myQuestions.length;
  const toggle = (id) => set((x) => ({ ...x, questions: { ...x.questions, [id]: !x.questions[id] } }));
  const add = () => {
    if (!text.trim()) return;
    set((x) => ({ ...x, myQuestions: [...x.myQuestions, text.trim()] }));
    setText('');
  };
  return html`<${Frame} title=${['מה לשאול ב', 'פגישת המיקוד', '']} sub=${`יום ${dayName(meeting.day)} ב-${meeting.from}. בוחרים מה עוד פתוח, והמלווה רואה את זה לפני הפגישה.`} items=${items}>
    <div class="fb-panel mb-3 !p-0">
      ${DECISIONS.map((d) => html`<div key=${d.id} class="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0">
        <${Check} on=${!!s.questions[d.id]} label=${d.text} onClick=${() => toggle(d.id)} />
        <span class="min-w-0 flex-1 leading-snug"><b class="text-[15px] font-semibold">${d.text}</b> <span class="whitespace-nowrap text-[12px] text-muted">${d.from}</span></span>
      </div>`)}
      ${s.myQuestions.map((q, i) => html`<div key=${q} class="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
        <${Check} on=${true} label=${q} onClick=${() => set((x) => ({ ...x, myQuestions: x.myQuestions.filter((_, j) => j !== i) }))} />
        <b class="min-w-0 flex-1 text-[16px] font-semibold">${q}</b><${Tag} tone="blue">שלי<//>
      </div>`)}
      <div class="flex gap-2 px-4 py-2.5">
        <input value=${text} onInput=${(e) => setText(e.target.value)} onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), e.stopPropagation(), add())} placeholder="עוד שאלה משלך" class=${cx(inputCls, '!h-10')} />
        <${Button} variant="mini" onClick=${add} disabled=${!text.trim()}>להוסיף<//>
      </div>
    </div>
    ${soon &&
    html`<div class="fb-panel !p-4">
      <${Switch} on=${s.prepDoc} onChange=${(v) => set((x) => ({ ...x, prepDoc: v }))} label="להכין את המסמך לפגישה" sub="הפגישה בעוד יומיים. המסמך נבנה מהשבוע: מה נעשה, המספרים מול היעד, איפה נתקע והשאלות" />
    </div>`}
    <p class="mt-3 text-[14px] text-muted">${picked} ${picked === 1 ? 'שאלה נבחרה' : 'שאלות נבחרו'}. החלטה שמשנה משהו בעסק תעודכן אחרי הפגישה, באישור.</p>
  <//>`;
}

// ---------- 5. three tasks ----------
function TaskCard({ t, i, onDay, onSwap, onBack, onText, onShorten }) {
  const K = KIND[t.kind] || KIND.focus;
  return html`<div class="fb-panel !px-3.5 !py-2.5">
    <div class="flex items-start gap-3">
      <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-[14px] font-black text-white">${i + 1}</span>
      <div class="min-w-0 flex-1">
        <div class="mb-1 flex flex-wrap items-center gap-1.5">
          <${Tag} tone=${t.kind === 'focus' ? 'blue' : 'muted'}><${Icon} name=${K.icon} size=${12} />${K.label}<//>
          ${t.carried && html`<${Tag}><${Icon} name="undo-2" size=${12} />גם מהשבוע שעבר<//>`}
          <span class="text-[13px] text-muted">כ-${t.mins} דק׳</span>
          <span class="ms-auto flex items-center gap-1" role="radiogroup" aria-label="יום">
            ${DAYS.slice(0, 6).map((d) => html`<button key=${d.id} type="button" role="radio" aria-checked=${t.day === d.id} onClick=${() => onDay(d.id)} title=${`יום ${d.name}`} class=${cx('h-7 w-7 rounded-lg text-[13px] font-bold transition-colors cursor-pointer', t.day === d.id ? 'bg-brand-600 text-white' : 'bg-canvas text-ink ring-1 ring-line hover:ring-brand-300')}>${d.short}</button>`)}
          </span>
        </div>
        <${InlineEdit} value=${t.text} onSave=${onText} class="text-[16px] font-bold leading-snug" />
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
          ${t.at && html`<span class="font-bold tabular-nums text-brand-700"><${Icon} name="clock" size=${13} class="inline align-[-2px]" /> ${dayName(t.day)} ${t.at}-${t.until}</span>`}
          ${t.moved && html`<span class="text-warn">היום מלא, עבר ליום ${dayName(t.day)}</span>`}
          <span class="ms-auto flex items-center gap-3">
            ${onShorten && html`<button type="button" onClick=${onShorten} title=${t.short.text} class="inline-flex items-center gap-1 rounded-md bg-warn-50 px-1.5 font-bold text-warn hover:underline cursor-pointer"><${Icon} name="scissors" size=${14} />לקצר ל-${t.short.mins} דק׳</button>`}
            ${t.prev && html`<button type="button" onClick=${onBack} class="inline-flex items-center gap-1 font-bold text-muted hover:text-brand-600 cursor-pointer"><${Icon} name="undo-2" size=${14} />להצעה הקודמת</button>`}
            <button type="button" onClick=${onSwap} class="inline-flex items-center gap-1 font-bold text-brand-600 hover:underline cursor-pointer"><${Icon} name="refresh-cw" size=${14} />הצעה אחרת</button>
          </span>
        </div>
      </div>
    </div>
  </div>`;
}

export function LoadBar({ load, hoursWeek, onHours, onShorten, shortList, foot }) {
  const max = Math.max(load.cap, load.total);
  const w = (m) => `${(m / max) * 100}%`;
  return html`<div class=${cx('fb-panel !px-4 !py-3', load.over && 'ring-2 ring-warn')}>
    <div class="mb-1.5 flex items-baseline justify-between gap-2">
      <b class="text-[15px]">העומס של השבוע</b>
      <span class=${cx('text-[14px] font-bold tabular-nums', load.over ? 'text-warn' : 'text-ink')}>${hours(load.total)} מתוך ${hoursWeek} שעות</span>
    </div>
    <div class="relative flex h-3.5 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
      <span class="h-full bg-ink/60" style=${{ width: w(load.meet) }} title="פגישות"></span>
      <span class="h-full bg-brand-600" style=${{ width: w(load.work) }} title="המשימות"></span>
      <span class="h-full bg-brand-300" style=${{ width: w(load.admin) }} title="הודעות וניהול"></span>
      ${load.over && html`<span class="absolute inset-y-0 border-s-2 border-dashed border-warn" style=${{ insetInlineStart: w(load.cap) }}></span>`}
    </div>
    <div class=${cx('mt-1.5 flex-wrap gap-x-3 text-[12px] text-muted', load.over ? 'hidden' : 'flex')}>
      <span><i class="me-1 inline-block h-2 w-2 rounded-full bg-ink/60"></i>פגישות ${hours(load.meet)}</span>
      <span><i class="me-1 inline-block h-2 w-2 rounded-full bg-brand-600"></i>המשימות ${hours(load.work)}</span>
      <span><i class="me-1 inline-block h-2 w-2 rounded-full bg-brand-300"></i>הודעות וניהול ${hours(load.admin)}</span>
    </div>
    ${load.over
      ? html`<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-warn-50 px-3 py-1.5">
          <span class="min-w-0 flex-1 text-[14px] font-bold text-warn">השבוע מלא: ${hours(load.total - load.cap) === '1' ? 'שעה' : `${hours(load.total - load.cap)} שעות`} יותר ממה שיש לך.${shortList.length ? ' אפשר לקצר משימה, או:' : ''}</span>
          <button type="button" onClick=${onHours} class="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[13px] font-bold text-ink ring-1 ring-[#ecd3a8] hover:ring-warn cursor-pointer"><${Icon} name="clock" size=${14} class="text-warn" />השבוע יש לי יותר שעות</button>
        </div>`
      : html`<p class="mt-2 text-[14px] text-muted">נשארו ${hours(load.left)} שעות פנויות. <button type="button" onClick=${onHours} class="font-bold text-brand-600 hover:underline cursor-pointer">לשנות את השעות</button></p>`}
  </div>`;
}

export function Tasks({ s, set, sc, tasks, load, items, focus, onSwap, onBack, notify }) {
  const setTask = (id, patch) => set((x) => ({ ...x, tasks: x.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const shortList = tasks.map((t, i) => ({ ...t, slotNo: ['הראשונה', 'השנייה', 'השלישית'][i] })).filter((t) => t.short);
  const shorten = (t) => {
    setTask(t.id, { text: t.short.text, mins: t.short.mins, short: null, prev: { ...s.tasks.find((x) => x.id === t.id) } });
    notify('המשימה קוצרה', 'scissors');
  };
  const [editH, setEditH] = useState(false);
  const askHours = () => setEditH(true);
  return html`<${Frame} title=${['שלוש משימות ', 'לשבוע', '']} sub=${sc.step < 11 ? `מהשלבים הבאים שלך במסע, לפי ${s.hoursWeek} השעות שיש לך בשבוע.` : 'בדיוק שלוש. כל אחת נכנסת ליום ולשעה פנויה.'} items=${items} focus=${focus}>
    <div class="mb-2 flex flex-col gap-2">
      ${tasks.map((t, i) => html`<${TaskCard} key=${t.slot} t=${t} i=${i}
        onDay=${(d) => setTask(t.id, { day: d })}
        onSwap=${() => onSwap(t)}
        onBack=${() => onBack(t)}
        onText=${(v) => setTask(t.id, { text: v })}
        onShorten=${load.over && t.short ? () => shorten(t) : null} />`)}
    </div>
    <${LoadBar} load=${load} hoursWeek=${s.hoursWeek} onHours=${askHours} onShorten=${shorten} shortList=${shortList} />
    ${editH &&
    html`<div class="rise mt-2 flex items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-brand-200">
      <span class="text-[15px] font-bold">השבוע יש לי</span>
      <input type="number" min="1" max="70" dir="ltr" value=${s.hoursWeek} onInput=${(e) => Number(e.target.value) > 0 && set((x) => ({ ...x, hoursWeek: Number(e.target.value) }))} class=${cx(inputCls, '!h-10 !w-20 text-center font-display font-bold')} aria-label="שעות לעסק השבוע" />
      <span class="text-[15px] font-bold">שעות לעסק</span>
      <button type="button" onClick=${() => setEditH(false)} class="ms-auto text-[14px] font-bold text-brand-600 hover:underline cursor-pointer">סגירה</button>
    </div>`}
  <//>`;
}

// ---------- done ----------
export function Done({ s, set, sc, tasks, items, focus, notify, setRem }) {
  const R = s.reminders;
  const [edit, setEdit] = useState(false);
  const REM = [
    ['ritual', 'הטקס', 'calendar-range'],
    ['wed', 'אמצע שבוע', 'list-checks'],
    ['thu', 'סיכום שבוע', 'flag'],
  ];
  const row = (key, label, icon) => html`<div key=${key} class="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
    <${Icon} name=${icon} size=${16} class="text-brand-600" />
    <span class="min-w-0 flex-1 text-[15px] font-semibold">${label}</span>
    <select value=${R[key].day} onChange=${(e) => setRem(key, { day: Number(e.target.value) })} class="h-9 rounded-lg border border-line bg-white px-2 text-[14px]" aria-label=${`יום: ${label}`}>
      ${DAYS.slice(0, 6).map((d) => html`<option value=${d.id}>${d.name}</option>`)}
    </select>
    <select value=${R[key].at} onChange=${(e) => setRem(key, { at: e.target.value })} class="h-9 rounded-lg border border-line bg-white px-2 text-[14px] tabular-nums" aria-label=${`שעה: ${label}`}>
      ${['07:30', '08:00', '09:00', '12:00', '16:00', '19:00'].map((t) => html`<option value=${t}>${t}</option>`)}
    </select>
  </div>`;
  return html`<${Frame} title=${['השבוע ', 'מצויר', '']} items=${items} focus=${focus}>
    <div class="mb-2.5 grid grid-cols-2 gap-2">
      <div class="fb-panel flex items-center gap-2.5 !p-3">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-50"><${Icon} name="flame" size=${20} class="text-warn" /></span>
        <span class="min-w-0"><b class="block font-display text-[18px] leading-tight">${s.streak} ${s.streak === 1 ? 'שבוע' : 'שבועות'} ברצף</b><span class="text-[13px] text-muted">${s.streak === 1 ? 'מכאן מתחיל הרצף' : 'כל ראשון, בלי לפספס'}</span></span>
      </div>
      <div class="fb-panel flex items-center gap-2.5 !p-3" title=${VALUE.ritualLike}>
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-money-50"><${Icon} name="coins" size=${20} class="text-money" /></span>
        <span class="min-w-0"><b class="block font-display text-[18px] leading-tight text-money">+${fmt(VALUE.ritual)}</b><span class="text-[13px] text-muted">ל"חסכת עד עכשיו"</span></span>
      </div>
    </div>
    <div class="fb-panel mb-2.5 !px-4 !py-3">
      ${tasks.map((t, i) => html`<div key=${t.id} class="flex items-center gap-2.5 border-b border-line py-1.5 last:border-0">
        <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-black text-white">${i + 1}</span>
        <span class="min-w-0 flex-1 text-[15px] font-semibold leading-snug">${t.text}</span>
        <span class="whitespace-nowrap text-[13px] tabular-nums text-muted">${DAYS[t.day].short} ${t.at || ''}</span>
      </div>`)}
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <${Button} variant="mini" onClick=${() => notify(`בהצלחה! "${tasks[0].text}"`, 'play')}><${Icon} name="play" size=${15} />להתחיל עכשיו את הראשונה<//>
        ${s.prepDoc && sc.meeting && html`<span class="flex items-center gap-1 text-[13px] text-muted"><${Icon} name="file-text" size=${14} />המסמך לפגישה נשמר בקבצים</span>`}
      </div>
    </div>
    ${sc.calendar &&
    html`<div class="fb-panel mb-2.5 !px-4 !py-3">
      <${Switch} on=${s.blocks} onChange=${(v) => set((x) => ({ ...x, blocks: v }))} label=${s.blocks ? 'המשימות נכנסו ליומן כבלוקים' : 'להכניס את המשימות ליומן'} sub="ב-Google Calendar, כל משימה בשעה שלה" />
    </div>`}
    <div class="fb-panel !px-4 !py-3">
      <div class="flex items-center gap-2">
        <${Icon} name="bell" size=${16} class="text-brand-600" />
        <span class="min-w-0 flex-1 text-[14px]"><b>תזכורות:</b> ${REM.map(([k, l]) => `${l} ${DAYS[R[k].day].short} ${R[k].at}`).join(' · ')}</span>
        <button type="button" onClick=${() => setEdit((e) => !e)} class="text-[14px] font-bold text-brand-600 hover:underline cursor-pointer">${edit ? 'סגירה' : 'לשנות'}</button>
      </div>
      ${edit && html`<div class="mt-1.5 border-t border-line pt-1">${REM.map(([k, l, ic]) => row(k, l, ic))}<p class="mt-1 text-[12px] text-muted">במייל ובהתראה. כשהבוט בוואטסאפ יעלה, גם שם.</p></div>`}
    </div>
  <//>`;
}
