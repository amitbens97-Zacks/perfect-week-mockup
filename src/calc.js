// Everything here runs in code, not in the model (the skill's rule: every calculation in code).
// The model writes only two things in production: the follow-up messages and the three tasks.
import { EVENTS, BUSY_EVENTS, FOLLOWUPS, POSTS, LAST_TASKS, METRICS, FOCUS_TASKS, TASK_POOL, JOURNEY_TASKS, WORK, DAYS, g } from './data.js';

const nf = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });
export const fmt = (n) => (n == null || n === '' || Number.isNaN(n) ? '—' : `${nf.format(n)} ₪`);
export const num = (n) => nf.format(n);
export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const hours = (mins) => {
  const h = Math.round((mins / 60) * 2) / 2;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
};

// ---------- what the system brings, by scenario ----------
export const eventsOf = (sc) => (sc.calendar ? [...EVENTS, ...(sc.busy ? BUSY_EVENTS : [])].filter((e) => sc.meeting || e.kind !== 'mentor') : []);
export const followupsOf = (sc) => (sc.leads ? FOLLOWUPS : []);
export const postsOf = (sc) => (sc.content ? POSTS : []);
export const lastTasksOf = (sc) => (sc.first ? [] : sc.step < 11 ? LAST_TASKS.map((t, i) => ({ ...t, text: ['להשלים את "סל המוצרים" (שלב 3)', 'לכתוב 3 שמות למוצר המרכזי', 'לקרוא את תיק הלקוח'][i], done: i < 2 })) : LAST_TASKS);

// Hours of business work in the calendar (personal events don't count).
export const busyMins = (events) => events.filter((e) => e.kind !== 'personal').reduce((t, e) => t + toMin(e.to) - toMin(e.from), 0);

// ---------- the numbers and the focus ----------
// The funnel: leads → discovery calls → clients. The focus is the first stage that is clearly
// behind its weekly target (under 60%). Before it, everything else is noise.
export function focusOf(n, sc) {
  if (!sc.goal) return null;
  const r = (id) => {
    const t = METRICS.find((m) => m.id === id).target;
    return (Number(n[id]) || 0) / t;
  };
  const leadToCall = n.leads > 0 ? Math.round((n.calls / n.leads) * 100) : 0;
  const callToClose = n.calls > 0 ? Math.round((n.closes / n.calls) * 100) : 0;
  if (r('leads') < 0.6)
    return { id: 'leads', title: 'להביא יותר פניות', line: `${n.leads} פניות מתוך ${METRICS[0].target}. כל השאר מחכה לפניות.`, stage: 0 };
  if (r('calls') < 0.6)
    return { id: 'calls', title: 'להפוך פניות לשיחות', line: `הגיעו ${n.leads} פניות, ורק ${n.calls === 1 ? 'אחת' : n.calls} הגיעה לשיחה (${leadToCall}%). הפניות כבר כאן, הן רק מחכות לטלפון.`, stage: 1 };
  if (r('closes') < 0.6)
    return { id: 'closes', title: 'לסגור את מי שכבר דיבר איתך', line: `${n.calls} שיחות, ${n.closes} סגירות (${callToClose}%). מי שכבר דיבר איתך הכי קרוב להגיד כן.`, stage: 2 };
  return { id: 'steady', title: 'לשמור על הקצב', line: 'כל המספרים ביעד. השבוע שומרים על מה שעובד.', stage: 3 };
}

// Month progress: how far the month's income is, against how far the month is (15.11 = half).
export function monthPace(soFar, goal) {
  const p = Math.round((soFar / goal) * 100);
  const time = 50;
  return { p, time, ok: p >= time - 5 };
}

// ---------- the three tasks ----------
const pick = (o, slot, i = 0) => ({ ...o, id: `${slot}-${i}`, slot, alt: i });

export function defaultTasks(sc, focus, carry) {
  if (sc.step < 11) {
    // Sized to the user's hours: about a quarter of the week for the journey.
    return JOURNEY_TASKS.slice(0, 3).map((t, i) => ({ ...t, id: `j-${i}`, slot: `j${i}`, alt: 0, day: [0, 2, 4][i] }));
  }
  const first = focus ? { ...FOCUS_TASKS[focus.id] } : { ...FOCUS_TASKS.steady };
  // Last week's undone task joins the focus task when they are the same job; otherwise it takes
  // the content slot (the content is already planned in "מכונת תוכן"). The system task stays.
  const same = carry && focus?.id === 'calls';
  if (same) first.carried = true;
  const second = carry && !same
    ? { text: carry.text, steps: carry.steps || [], mins: 30, kind: 'carry', id: 'content-carry', slot: 'content', alt: -1, day: 1 }
    : { ...pick(TASK_POOL.content[0], 'content'), day: 4 };
  return [
    { ...first, id: 'focus-0', slot: 'focus', alt: Object.keys(FOCUS_TASKS).indexOf(focus?.id || 'steady'), day: 0 },
    second,
    { ...pick(TASK_POOL.system[0], 'system'), day: 3 },
  ];
}

// "הצעה אחרת": the next option for that slot (the previous one stays one click back).
export function nextOption(task) {
  const pool = task.slot === 'focus' ? Object.values(FOCUS_TASKS) : task.slot.startsWith('j') ? JOURNEY_TASKS : TASK_POOL[task.slot];
  const at = task.alt;
  const i = (at + 1) % pool.length;
  return { ...pool[i], id: `${task.slot}-${i}`, slot: task.slot, alt: i, day: task.day, prev: task };
}

// ---------- the time blocks ----------
// Each task goes into the first free gap of its day, from 09:00, in 15-minute steps.
// A full day pushes it to the next working day. Saturday is never used.
export function placeBlocks(tasks, events) {
  const taken = events.map((e) => ({ day: e.day, a: toMin(e.from), b: toMin(e.to) }));
  return tasks.map((t) => {
    for (let k = 0; k < 6; k += 1) {
      const day = (t.day + k) % 6;
      const end = day === 5 ? WORK.fridayEnd : WORK.end;
      for (let a = WORK.start; a + t.mins <= end; a += 15) {
        const b = a + t.mins;
        if (!taken.some((x) => x.day === day && a < x.b + 15 && b > x.a - 15)) {
          taken.push({ day, a, b });
          return { ...t, day, at: toTime(a), until: toTime(b), moved: day !== t.day };
        }
      }
    }
    return { ...t, at: null };
  });
}

// ---------- the load check ----------
// Business hours in the calendar + the tasks + a fixed 30 minutes a day for messages and admin,
// against the hours per week the user set in "העסק במספרים".
export function loadOf(events, tasks, hoursWeek) {
  const meet = busyMins(events);
  const work = tasks.reduce((t, x) => t + x.mins, 0);
  const admin = 5 * 30;
  const total = meet + work + admin;
  const cap = hoursWeek * 60;
  return { meet, work, admin, total, cap, over: total > cap, left: cap - total };
}

export const dayName = (d) => DAYS[d]?.name;

// What the reminder message says (email + notification; WhatsApp once the bot is live).
export const wedText = (done, all) => g(`אמצע השבוע: ${done} מתוך ${all} בוצעו. רוצה לסמן או להזיז משהו?`, `אמצע השבוע: ${done} מתוך ${all} בוצעו. רוצה לסמן או להזיז משהו?`);
