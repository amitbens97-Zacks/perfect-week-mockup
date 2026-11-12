// Task 8 "צייר לי שבוע מושלם": the weekly ritual from the skills pack (page 10), as a full screen
// with a week board that fills in as you go. Parts (each skipped quietly when it has no data):
// מה נעשה → השבוע (יומן + תוכן, פולואפים) → המספרים (+ הפוקוס) → לפגישה → 3 משימות → סיום → דף הבית.
// Around it: the home card, Wednesday's check-in and Thursday's 30-second close.
// Link params: ?screen=<id>, ?scenario=<id>, ?user=m|f, ?embed = phone layout. Shift+D opens the notes.
import { html, render, useState, useEffect, useRef, Icon, confetti, confettiBurst } from './lib.js';
import { PartnerBubble, Progress, TopBar, BottomBar, Status, PrimaryButton, Button, Toast } from './components.js';
import { STEP, USER, SCENARIOS, LAST_NUMS, FOLLOWUPS, VALUE, g } from './data.js';
import { eventsOf, followupsOf, postsOf, lastTasksOf, focusOf, defaultTasks, nextOption, placeBlocks, loadOf } from './calc.js';
import { Opening, LastWeek, WeekScreen, Followups, Numbers, Focus, Meeting, Tasks, Done } from './screens.js';
import { Home } from './home.js';
import { DevPanel } from './devnotes.js';
import { EMBED, IS_PHONE, readView, saveView, writeHandoff, takeHandoff, applyPhoneViewport, ViewToggle, PhonePreview } from './viewswitch.js';

const params = new URLSearchParams(location.search);
const LABEL = { last: 'מה נעשה', week: 'מה קבוע', followups: 'למי לחזור', numbers: 'המספרים', focus: 'הפוקוס', meeting: 'הפגישה', tasks: 'שלוש משימות' };
const SHARK_LINE = {
  opening: 'שבוע טוב לא קורה במקרה. מציירים אותו ביום ראשון, בעשר דקות.',
  last: 'מה שלא נעשה זה לא כישלון. זה מידע על מה באמת חשוב.',
  week: 'קודם רואים מה כבר תפוס. רק אז מחליטים מה להוסיף.',
  followups: 'רוב העסקאות נסגרות בפולואפ השני או השלישי. רוב האנשים מוותרים אחרי הראשון.',
  numbers: 'מספר אחד אמיתי שווה יותר מעשר תחושות.',
  focus: 'כשמתקנים את המקום שבו המשפך נתקע, כל השאר זז איתו.',
  meeting: 'מי שמגיע לפגישה עם שאלות, יוצא ממנה עם החלטות.',
  tasks: 'שלוש משימות שבוצעו שוות יותר מעשר שחיכו.',
  done: g('זהו, השבוע מצויר. עכשיו רק לצאת לדרך.', 'זהו, השבוע מצויר. עכשיו רק לצאת לדרך.'),
};

function freshState(scId) {
  const sc = SCENARIOS[scId];
  const last = lastTasksOf(sc);
  return {
    scId,
    connected: sc.calendar,
    streak: sc.streak,
    saved: USER.saved,
    hoursWeek: sc.hoursWeek,
    lastDone: Object.fromEntries(last.map((t) => [t.id, t.done])),
    carry: {},
    sent: {},
    msgs: {},
    nums: { ...LAST_NUMS, marketing: '' },
    questions: { q1: true, q2: true },
    myQuestions: [],
    prepDoc: true,
    tasks: null,
    events: null, // null = as read from the calendar; an array once the user edits it
    posts: null, // the same for the content plan
    stepsDone: {}, // { taskId: [bool per step] }
    paidAll: false, // the +100 for all three is paid once a week
    blocks: true,
    reminders: { ritual: { day: 0, at: '08:00' }, wed: { day: 3, at: '12:00' }, thu: { day: 4, at: '16:00' } },
    closed: false,
    thuNums: null,
    drawn: false,
    homeDone: {},
    reached: 0,
  };
}

function partsOf(sc, s) {
  return [
    !sc.first && !s.closed && { id: 'last', label: 'מה נעשה', why: 'מה יצא מהשבוע שעבר', screens: ['last'] },
    { id: 'week', label: 'השבוע', why: sc.leads ? 'מה כבר קבוע, ולמי לחזור' : 'מה כבר קבוע ביומן', screens: ['week', ...(sc.leads ? ['followups'] : [])] },
    sc.goal && { id: 'nums', label: 'המספרים', why: s.closed ? 'הפוקוס, לפי מה שסגרת בחמישי' : 'מול היעד, ואיפה הפוקוס', screens: [...(s.closed ? [] : ['numbers']), 'focus'] },
    sc.meeting && { id: 'meet', label: 'לפגישה', why: 'מה לשאול בפגישת המיקוד', screens: ['meeting'] },
    { id: 'tasks', label: '3 משימות', why: 'בדיוק שלוש, כל אחת ביום ובשעה', screens: ['tasks'] },
  ].filter(Boolean);
}

function App({ view: shellView, onViewChange }) {
  const handoff = useRef(takeHandoff()).current;
  const startSc = SCENARIOS[params.get('scenario')] ? params.get('scenario') : 'full';
  const [s, setS] = useState(handoff?.state || freshState(startSc));
  const [screen, setScreen] = useState(handoff?.screen || 'opening');
  const [mode, setMode] = useState(handoff?.mode || null); // home overlays: wed, thu, history
  const [toast, setToast] = useState(null);
  const [dev, setDev] = useState(false);
  const [unread, setUnread] = useState(true);
  const timers = useRef({});
  const sRef = useRef(s);
  sRef.current = s;

  // The week as read from the calendar and the content plan, or as the user edited it. The
  // meeting part shows whenever there is a FlowBiz meeting in the (edited) calendar.
  const scBase = { ...SCENARIOS[s.scId], calendar: s.connected };
  const events = s.connected ? s.events ?? eventsOf({ ...scBase, meeting: scBase.meeting }) : [];
  const posts = s.posts ?? postsOf(scBase);
  const meeting = events.find((e) => e.kind === 'mentor') || null;
  const sc = { ...scBase, meeting: !!meeting };
  const parts = partsOf(sc, s);
  const FLOW = parts.flatMap((p) => p.screens);
  const fups = followupsOf(sc);
  const setEvents = (fn) => setS((x) => ({ ...x, events: fn(x.events ?? events) }));
  const setPosts = (fn) => setS((x) => ({ ...x, posts: fn(x.posts ?? posts) }));
  const lastTasks = lastTasksOf(sc);
  const focus = sc.goal ? focusOf(s.closed && s.thuNums ? s.thuNums : s.nums, sc) : null;

  const carryTask = () => lastTasks.find((t) => !sRef.current.lastDone[t.id] && sRef.current.carry[t.id] !== false) || null;
  const withTasks = (x) => (x.tasks ? x : { ...x, tasks: defaultTasks(sc, focus, sc.first || x.closed ? null : carryTask()) });
  const placed = s.tasks ? placeBlocks(s.tasks, events) : [];
  const load = loadOf(events, placed, s.hoursWeek);

  // Deep link: ?screen=tasks needs the tasks ready, ?screen=done/home a drawn week.
  useEffect(() => {
    const q = params.get('screen');
    if (!handoff && q && q !== 'opening') jump(q === 'home' ? 'home' : q);
  }, []);
  useEffect(() => {
    window.__flowbizSnapshot = () => ({ screen, state: s, mode });
  });
  useEffect(() => {
    const q = new URLSearchParams();
    q.set('screen', screen);
    if (s.scId !== 'full') q.set('scenario', s.scId);
    if (EMBED) q.set('embed', '1');
    if (params.get('user')) q.set('user', params.get('user'));
    history.replaceState(null, '', `${location.pathname}?${q}`);
    setUnread(true);
    document.querySelector('main')?.scrollTo(0, 0);
  }, [screen, s.scId]);
  useEffect(() => {
    const k = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (e.key === 'D' && e.shiftKey && !typing) setDev((d) => !d);
      if (e.key === 'Enter' && !typing && !e.shiftKey && !dev) {
        const btn = document.querySelector('[data-primary] button:not([disabled])');
        if (btn && document.activeElement?.tagName !== 'BUTTON') btn.click();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [dev]);

  const notify = (text, icon = 'info', undo) => {
    setToast({ id: Date.now(), text, icon, undo });
    clearTimeout(timers.current.toast);
    timers.current.toast = setTimeout(() => setToast(null), undo ? 5000 : 2800);
  };
  const undoToast = () => {
    toast?.undo?.();
    setToast(null);
  };
  // Small wins: a ticked step = a small burst from the checkbox; a whole task = the full confetti;
  // all three = the big one, and +100 ₪ to "חסכת עד עכשיו" (once a week).
  const taskDone = (t, homeDone) => {
    const x = sRef.current;
    const all = (x.tasks || []).every((y) => homeDone[y.id]);
    if (all && !x.paidAll) {
      setS((y) => ({ ...y, paidAll: true, saved: y.saved + VALUE.allThree }));
      confetti('chapter');
      notify(`שלוש משימות, שבוע מלא! +${VALUE.allThree} ₪ ל"חסכת עד עכשיו"`, 'coins');
    } else {
      confetti('step');
      notify(all ? 'שלוש מתוך שלוש. שבוע מלא!' : 'משימה הושלמה! גם ביומן', 'party-popper');
    }
  };
  const toggleStep = (t, k, el) => {
    const x = sRef.current;
    const steps = t.steps || [];
    const cur = steps.map((_, j) => !!(x.stepsDone[t.id] || [])[j]);
    cur[k] = !cur[k];
    const all = cur.length > 0 && cur.every(Boolean);
    const homeDone = { ...x.homeDone, [t.id]: all };
    setS((y) => ({ ...y, stepsDone: { ...y.stepsDone, [t.id]: cur }, homeDone: { ...y.homeDone, [t.id]: all } }));
    if (cur[k] && all) taskDone(t, homeDone);
    else if (cur[k]) confettiBurst(el);
  };
  const toggleTask = (t, on) => {
    const x = sRef.current;
    const homeDone = { ...x.homeDone, [t.id]: on };
    setS((y) => ({ ...y, homeDone: { ...y.homeDone, [t.id]: on }, stepsDone: { ...y.stepsDone, [t.id]: (t.steps || []).map(() => on) } }));
    if (on) taskDone(t, homeDone);
  };
  const openLink = (t) => notify(`נפתח "${t.link}"`, 'arrow-up-left');

  const go = (to) => {
    const i = FLOW.indexOf(to);
    if (i >= 0) setS((x) => ({ ...(to === 'tasks' ? withTasks(x) : x), reached: Math.max(x.reached, i) }));
    if (to === 'done' && !sRef.current.drawn) {
      setS((x) => ({ ...withTasks(x), drawn: true, streak: x.streak + 1, saved: x.saved + VALUE.ritual }));
      setTimeout(() => confetti('step'), 150);
    }
    setScreen(to);
  };
  const next = () => {
    if (screen === 'numbers') notify('המספרים נשמרו בטבלה', 'table');
    go(FLOW[FLOW.indexOf(screen) + 1] || 'done');
  };
  const back = () => {
    const i = FLOW.indexOf(screen);
    if (screen === 'done') go(FLOW[FLOW.length - 1]);
    else if (i > 0) go(FLOW[i - 1]);
    else go('opening');
  };

  // "שלחתי": the lead row is updated (last contact today, next follow-up set), with undo.
  const sent = (f) => {
    const nextDate = f.kind === 'client' ? '25.11' : '18.11';
    setS((x) => ({ ...x, sent: { ...x.sent, [f.id]: nextDate } }));
    notify(`עודכן בלידים: ${f.name}, פולואפ הבא ב-${nextDate}`, 'check', () => setS((x) => ({ ...x, sent: { ...x.sent, [f.id]: undefined } })));
  };
  const unsend = (f) => setS((x) => ({ ...x, sent: { ...x.sent, [f.id]: undefined } }));
  const swap = (t) => setS((x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === t.id ? nextOption(y) : y)) }));
  const unswap = (t) => setS((x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === t.id ? y.prev : y)) }));

  function jump(id) {
    setDev(false);
    setMode(null);
    if (id.startsWith('home') || id === 'next-sunday') {
      if (id === 'home-before') return (setS((x) => ({ ...x, drawn: false })), setScreen('home'));
      if (id === 'next-sunday') {
        setS((x) => ({ ...x, closed: true, thuNums: { leads: 7, calls: 3, closes: 1, revenue: 2700, marketing: '' }, tasks: null, drawn: false, reached: 0, homeDone: {}, stepsDone: {}, paidAll: false }));
        return setScreen('opening');
      }
      setS((x) => {
        const y = withTasks(x);
        const t0 = y.tasks[0];
        if (id === 'home') return { ...y, drawn: true };
        return { ...y, drawn: true, homeDone: { ...x.homeDone, [t0.id]: true }, stepsDone: { ...x.stepsDone, [t0.id]: (t0.steps || []).map(() => true) } };
      });
      setMode(id === 'home-wed' ? 'wed' : id === 'home-thu' ? 'thu' : null);
      return setScreen('home');
    }
    if (id === 'done') {
      setS((x) => ({ ...withTasks(x), reached: FLOW.length - 1 }));
      return go('done');
    }
    if (id !== 'opening' && !FLOW.includes(id)) return notify('במצב הזה החלק הזה מדלג. אפשר להחליף מצב למעלה', 'info');
    setS((x) => ({ ...x, reached: Math.max(x.reached, FLOW.indexOf(id)) }));
    go(id);
  }
  const changeScenario = (id) => {
    setS(freshState(id));
    setMode(null);
    setDev(false);
    setScreen('opening');
    notify(`מצב: ${SCENARIOS[id].label}`, 'repeat');
  };
  const reset = () => changeScenario(s.scId);

  // ---------- what the board shows: it fills in part by part ----------
  const pos = screen === 'opening' ? -1 : screen === 'done' || screen === 'home' ? 999 : FLOW.indexOf(screen);
  const reached = (name) => {
    const i = FLOW.indexOf(name);
    return i >= 0 && pos >= i;
  };
  const items = [];
  if (pos >= FLOW.indexOf('week') && FLOW.indexOf('week') >= 0) {
    events.forEach((e) => items.push({ id: e.id, day: e.day, at: e.from, label: e.title, short: e.short || e.title.replace(/^(פגישת|שיחת) /, ''), type: e.kind, hi: screen === 'meeting' && e.kind === 'mentor' }));
    posts.forEach((p) => items.push({ id: p.id, day: p.day, at: p.at, label: p.title, short: p.short, type: 'post' }));
  }
  if (reached('followups') || (pos === 999 && fups.length))
    fups.forEach((f) => items.push({ id: `f${f.id}`, day: f.day, label: `לחזור ל${f.name.split(' ')[0]}`, type: 'followup', late: s.sent[f.id] ? 0 : f.late, icon: s.sent[f.id] ? 'check' : undefined }));
  if (screen === 'tasks' || pos === 999) placed.forEach((t) => items.push({ id: `t${t.id}`, day: t.day, at: t.at, label: t.text, type: 'task' }));
  const shownFocus = (reached('focus') || pos === 999) && focus ? focus : null;

  if (screen === 'home')
    return html`<${Home} s=${s} set=${setS} tasks=${placed} items=${items} focus=${shownFocus} drawn=${s.drawn} mode=${mode} setMode=${setMode}
        onDraw=${() => (setS((x) => ({ ...x, tasks: x.drawn ? x.tasks : null, reached: 0 })), setScreen('opening'))} notify=${notify} onStep=${toggleStep} onTask=${toggleTask} onLink=${openLink} />
      <${Toast} toast=${toast} onUndo=${undoToast} />
      <${DevPanel} open=${dev} onClose=${() => setDev(false)} onJump=${jump} onReset=${reset} scenario=${s.scId} onScenario=${changeScenario} />
      ${devFab(setDev)}`;

  // ---------- the frame ----------
  const partIdx = parts.findIndex((p) => p.screens.includes(screen));
  const reachedPart = parts.findIndex((p) => p.screens.includes(FLOW[s.reached]));
  const firstOf = (i) => parts[i].screens[0];
  const devBtn = html`<button type="button" onClick=${() => setDev((d) => !d)} title="הערות למפתחים (Shift+D)" aria-label="הערות למפתחים" class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-brand-600 cursor-pointer max-md:hidden"><${Icon} name="code-xml" size=${18} /></button>`;
  const labels = parts.map((p) => p.label);
  const progress =
    partIdx >= 0
      ? html`<${Progress} parts=${labels} current=${partIdx} maxReached=${Math.max(reachedPart, partIdx)} onJump=${(i) => go(firstOf(i))} />`
      : screen === 'done'
        ? html`<${Progress} parts=${labels} current=${labels.length - 1} maxReached=${labels.length - 1} done onJump=${(i) => go(firstOf(i))} />`
        : null;
  const top = html`<${TopBar}
    step=${STEP}
    progress=${progress}
    tools=${html`${!EMBED && html`<${ViewToggle} view=${shellView} onChange=${onViewChange} class="max-md:hidden" />`}${devBtn}`}
    onHome=${() => (setMode(null), setScreen('home'))}
  />`;

  const reason = screen === 'tasks' && placed.some((t) => !t.text.trim()) ? 'חסרה משימה' : null;
  const primary = (label, onClick, opts = {}) => html`<span data-primary><${PrimaryButton} label=${label} onClick=${onClick} disabled=${!!reason} check=${opts.check} /></span>`;
  const backBtn = html`<${Button} variant="secondary" onClick=${back}>חזרה<//>`;
  const nextLabel = LABEL[FLOW[FLOW.indexOf(screen) + 1]];
  const bottom =
    screen === 'opening'
      ? html`<${BottomBar} status=${html`<${Status} hint=${`${parts.length} חלקים · כ-10 דקות`} />`} primary=${primary('מתחילים', () => go(FLOW[0]))} />`
      : screen === 'done'
        ? html`<${BottomBar} back=${backBtn} status=${html`<${Status} save="saved" />`} primary=${primary('לדף הבית', () => (setMode(null), setScreen('home')))} />`
        : html`<${BottomBar}
            back=${backBtn}
            status=${html`<${Status} reason=${reason} hint=${`חלק ${partIdx + 1} מתוך ${parts.length}`} />`}
            primary=${screen === 'tasks' ? primary('לצייר את השבוע', () => go('done'), { check: true }) : primary(`הבא: ${nextLabel}`, next)}
          />`;

  const common = { s, set: setS, items };
  const body = {
    opening: html`<${Opening} parts=${parts} s=${s} />`,
    last: html`<${LastWeek} ...${common} tasks=${lastTasks} />`,
    week: html`<${WeekScreen} sc=${sc} events=${events} posts=${posts} setEvents=${setEvents} setPosts=${setPosts} items=${items} notify=${notify} connected=${sc.calendar} onConnect=${() => (setS((x) => ({ ...x, connected: true })), notify('Google Calendar חובר. הכריש קרא את השבוע', 'calendar-check'))} />`,
    followups: html`<${Followups} list=${fups} s=${s} onSent=${sent} onUnsend=${unsend} setMsg=${(id, v) => setS((x) => ({ ...x, msgs: { ...x.msgs, [id]: v } }))} notify=${notify} items=${items} />`,
    numbers: html`<${Numbers} ...${common} />`,
    focus: html`<${Focus} s=${s.closed && s.thuNums ? { ...s, nums: s.thuNums } : s} focus=${focus} items=${items} />`,
    meeting: meeting && html`<${Meeting} meeting=${meeting} ...${common} soon=${meeting.day <= 2} />`,
    tasks: s.tasks && html`<${Tasks} ...${common} sc=${sc} tasks=${placed} load=${load} focus=${shownFocus} onSwap=${swap} onBack=${unswap} notify=${notify} />`,
    done: s.tasks && html`<${Done} s=${s} set=${setS} sc=${sc} tasks=${placed} items=${items} focus=${shownFocus} notify=${notify} onStep=${toggleStep} onTask=${toggleTask} onLink=${openLink} setRem=${(k, v) => setS((x) => ({ ...x, reminders: { ...x.reminders, [k]: { ...x.reminders[k], ...v } } }))} />`,
  }[screen];

  return html`<div class="fb-notebook flex h-dvh flex-col text-ink" dir="rtl">
    ${top}
    <main class="thin-scroll relative min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
      ${body}
      ${SHARK_LINE[screen] && html`<${PartnerBubble} key=${screen} message=${SHARK_LINE[screen]} unread=${unread} onRead=${() => setUnread(false)} />`}
    </main>
    ${bottom}
    <${Toast} toast=${toast} onUndo=${undoToast} />
    <${DevPanel} open=${dev} onClose=${() => setDev(false)} onJump=${jump} onReset=${reset} scenario=${s.scId} onScenario=${changeScenario} />
  </div>`;
}

// On the home page there is no step bar, so the notes button floats in the corner.
const devFab = (setDev) =>
  html`<button type="button" onClick=${() => setDev((d) => !d)} title="הערות למפתחים (Shift+D)" aria-label="הערות למפתחים" class="fixed bottom-4 left-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-white text-muted shadow-lg ring-1 ring-line hover:text-brand-600 cursor-pointer"><${Icon} name="code-xml" size=${18} /></button>`;

function Root() {
  const [view, setView] = useState(readView);
  useEffect(() => applyPhoneViewport(view), [view]);
  const change = (v) => {
    if (v === 'mobile') {
      try {
        writeHandoff(window.__flowbizSnapshot?.());
      } catch {}
    }
    saveView(v);
    setView(v);
  };
  if (!EMBED && !IS_PHONE && view === 'mobile') return html`<${PhonePreview} onSwitch=${change} title="צייר לי שבוע מושלם" />`;
  return html`<${App} view=${view} onViewChange=${change} />`;
}

applyPhoneViewport(readView());
render(html`<${Root} />`, document.getElementById('app'));
