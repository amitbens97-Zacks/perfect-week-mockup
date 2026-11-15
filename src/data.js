// Mock data for scope task 8, "צייר לי שבוע מושלם" (the weekly loop from the skills pack,
// "מחבילת הסקילים לשדרוגים במערכת", page 10). In production every piece comes from the system:
//   the week's events                -> Google Calendar (read, new) or the meeting day
//   follow-ups                       -> the one leads table (follow_up date, status)
//   what goes out this week          -> the week plan of "מכונת תוכן שיווקי" (10)
//   weekly targets, income goal      -> "העסק במספרים" (5)
//   hours per week for the business  -> "העסק במספרים" (5), first from "אני והעסק" (2)
//   last week's three tasks          -> the week record saved by this ritual
// The demo business is a nutrition consultant: מיכל/מיכאל אברהם, "לאכול בשקט".
// The end client is always "הוא" (third person), and the follow-up messages are in the user's voice.

export const PARTNER = { name: 'הכריש', role: 'השותף העסקי' };
export const STEP = { name: 'צייר לי שבוע מושלם', sub: 'הטקס השבועי · כ-10 דקות', icon: 'calendar-range' };

// ---------- who the user is (?user=m or ?user=f, or the developer panel) ----------
const PROFILES = {
  f: { gender: 'f', firstName: 'מיכל', fullName: 'מיכל אברהם' },
  m: { gender: 'm', firstName: 'מיכאל', fullName: 'מיכאל אברהם' },
};
const GENDER_KEY = 'flowbiz-pw-gender';
function pickGender() {
  try {
    const q = new URLSearchParams(location.search).get('user');
    if (q === 'f' || q === 'm') {
      localStorage.setItem(GENDER_KEY, q);
      return q;
    }
    return localStorage.getItem(GENDER_KEY) === 'm' ? 'm' : 'f';
  } catch {
    return 'f';
  }
}
export const GENDER = pickGender();
export const g = (m, f) => (GENDER === 'f' ? f : m);
export function setDemoGender(v) {
  try {
    localStorage.setItem(GENDER_KEY, v);
  } catch {}
  const u = new URL(location.href);
  u.searchParams.set('user', v);
  location.href = u.toString();
}

export const USER = {
  ...PROFILES[GENDER],
  business: 'לאכול בשקט',
  field: 'ליווי תזונתי בלי דיאטות',
  audience: 'אנשים בני 30-55 שרוצים לרדת במשקל בלי דיאטות כסאח',
  b2b: false,
  goalMonth: 12000,
  monthSoFar: 7400,
  saved: 4350, // "חסכת עד עכשיו" on the home page
};

// "סל המוצרים" (3)
export const PRODUCTS = [
  { id: 'core', name: 'ליווי "לאכול בשקט" · 3 חודשים', price: 2700 },
  { id: 'ws', name: 'סדנה קבוצתית בזום', price: 290 },
  { id: 'one', name: 'פגישת ייעוץ חד-פעמית', price: 450 },
];

// Weekly targets from "העסק במספרים" (5): 12,000 a month, about one new client a week.
export const METRICS = [
  { id: 'leads', label: 'פניות חדשות', icon: 'inbox', target: 8, from: 'מהלידים' },
  { id: 'calls', label: 'שיחות היכרות', icon: 'phone', target: 3, from: 'מהיומן' },
  { id: 'closes', label: 'לקוחות שסגרו', icon: 'handshake', target: 1, from: 'מ"סגרתי!"' },
  { id: 'revenue', label: 'הכנסות', icon: 'banknote', target: 3000, money: true },
  { id: 'marketing', label: 'הוצאות שיווק', icon: 'megaphone', target: 300, money: true, max: true },
];
// What the system already knows about last week (the user only checks it).
export const LAST_NUMS = { leads: 9, calls: 1, closes: 0, revenue: 2050, marketing: 150 };

// ---------- the week: Sunday 15.11.2026 to Saturday 21.11.2026 ----------
export const TODAY = 0; // the ritual runs on Sunday morning
export const DAYS = [
  { id: 0, short: 'א׳', name: 'ראשון', date: '15.11' },
  { id: 1, short: 'ב׳', name: 'שני', date: '16.11' },
  { id: 2, short: 'ג׳', name: 'שלישי', date: '17.11' },
  { id: 3, short: 'ד׳', name: 'רביעי', date: '18.11' },
  { id: 4, short: 'ה׳', name: 'חמישי', date: '19.11' },
  { id: 5, short: 'ו׳', name: 'שישי', date: '20.11' },
  { id: 6, short: 'ש׳', name: 'שבת', date: '21.11' },
];
export const WEEK_LABEL = '15-21 בנובמבר';
export const LAST_WEEK_LABEL = '8-14 בנובמבר';
// Work hours used to place the task blocks (Friday short, Saturday off).
export const WORK = { start: 9 * 60, end: 18 * 60, fridayEnd: 13 * 60 };

// Calendar events (Google Calendar). kind: client (a session), sales (a discovery call),
// group (the workshop), mentor (a FlowBiz meeting: opens the questions part), personal.
// A FlowBiz meeting is found by "FlowBiz" or the mentor's name in the title (the skill, p.10).
export const EVENTS = [
  { id: 'e1', day: 0, from: '10:00', to: '11:00', title: 'פגישת ליווי · שירה ל.', kind: 'client' },
  { id: 'e2', day: 0, from: '17:00', to: '18:00', title: 'פגישת ליווי · אורית ב.', kind: 'client' },
  { id: 'e3', day: 1, from: '09:00', to: '09:30', title: 'שיחת היכרות · יעל מ.', kind: 'sales' },
  { id: 'e4', day: 1, from: '20:00', to: '21:30', title: 'סדנה "לאכול בשקט" בזום', kind: 'group', short: 'סדנה בזום' },
  { id: 'e5', day: 2, from: '11:00', to: '12:00', title: 'פגישת מיקוד · FlowBiz', kind: 'mentor' },
  { id: 'e6', day: 2, from: '16:00', to: '17:00', title: 'פגישת ליווי · דנה ק.', kind: 'client' },
  { id: 'e7', day: 3, from: '10:00', to: '11:00', title: 'פגישת ליווי · מורן ש.', kind: 'client' },
  { id: 'e8', day: 4, from: '09:30', to: '10:30', title: 'פגישת ליווי · רונית ג.', kind: 'client' },
  { id: 'e9', day: 4, from: '13:00', to: '14:00', title: 'רופא שיניים', kind: 'personal' },
];
// The busy week: the same week with more sessions (to show the load check).
export const BUSY_EVENTS = [
  { id: 'b1', day: 0, from: '12:00', to: '13:00', title: 'פגישת ליווי · הילה ר.', kind: 'client' },
  { id: 'b2', day: 0, from: '14:00', to: '15:00', title: 'פגישת ליווי · נטע ס.', kind: 'client' },
  { id: 'b3', day: 1, from: '10:00', to: '11:00', title: 'הכנת תפריטים ללקוחות', kind: 'client' },
  { id: 'b4', day: 1, from: '14:00', to: '15:00', title: 'פגישת ליווי · שני א.', kind: 'client' },
  { id: 'b5', day: 2, from: '09:00', to: '10:00', title: 'פגישת ליווי · ליאת ו.', kind: 'client' },
  { id: 'b7', day: 3, from: '15:00', to: '16:00', title: 'פגישת ליווי · שירה ל.', kind: 'client' },
  { id: 'b8', day: 4, from: '11:00', to: '12:30', title: 'פגישת ליווי · אסנת מ.', kind: 'client' },
  { id: 'b9', day: 4, from: '15:00', to: '16:00', title: 'פגישת ליווי · דנה ק.', kind: 'client' },
];

// Follow-ups for the next 7 days from the leads table, late ones first. Each comes with a ready
// message in the user's voice: a lead gets a reply, an active client a keep-in-touch message.
export const FOLLOWUPS = [
  {
    id: 'l1', name: 'רותם אלון', status: 'פנייה חדשה', due: 'היה ב-12.11', late: 3, day: 0, kind: 'lead',
    note: 'פנה בוואטסאפ אחרי הפוסט על ארוחות ערב',
    msg: g(
      'היי רותם, כאן מיכאל מ"לאכול בשקט". ראיתי שפנית אליי בשבוע שעבר ועוד לא הספקנו לדבר. מתי נוח לך לשיחה קצרה של 15 דקות השבוע?',
      'היי רותם, כאן מיכל מ"לאכול בשקט". ראיתי שפנית אליי בשבוע שעבר ועוד לא הספקנו לדבר. מתי נוח לך לשיחה קצרה של 15 דקות השבוע?',
    ),
  },
  {
    id: 'l2', name: 'גלית פרץ', status: 'הצעה נשלחה', due: 'היה ב-14.11', late: 1, day: 0, kind: 'lead',
    note: 'קיבלה את ההצעה לליווי 3 חודשים ב-10.11',
    msg: 'היי גלית, רציתי לבדוק אם הספקת לעבור על ההצעה לליווי. יש משהו שכדאי שאסביר לפני שמחליטים?',
  },
  {
    id: 'l3', name: 'נועם שגיא', status: 'פנייה חדשה', due: 'ב-16.11', late: 0, day: 1, kind: 'lead',
    note: 'נרשם לסדנה ושאל על ליווי אישי',
    msg: 'היי נועם, שמחתי שהגעת לסדנה! שאלת על ליווי אישי, אז הנה הפרטים בקצרה. אם מתאים לך, נקבע שיחה של 15 דקות ונראה אם זה בשבילך.',
  },
  {
    id: 'l4', name: 'אורית ברק', status: 'לקוח פעיל', due: 'ב-18.11', late: 0, day: 3, kind: 'client',
    note: 'חודש שני בליווי',
    msg: 'היי אורית, איך עבר השבוע עם התפריט החדש? אם משהו לא הסתדר, תכתבי לי ונתקן לפני הפגישה.',
  },
];

// The week plan of "מכונת תוכן שיווקי" (10): three items, at most one offer.
export const POSTS = [
  { id: 'p1', day: 0, at: '19:00', title: 'פוסט: "3 סיבות שהדיאטה נגמרת ביום חמישי"', short: 'פוסט: למה הדיאטה נגמרת', type: 'ערך', state: 'מתוזמן' },
  { id: 'p2', day: 2, at: '12:00', title: g('קרוסלה: "מה אני אוכל ביום עמוס"', 'קרוסלה: "מה אני אוכלת ביום עמוס"'), short: 'קרוסלה: יום עמוס', type: 'ערך', state: 'מתוזמן' },
  { id: 'p3', day: 4, at: '19:30', title: 'רילס: 3 החלפות קטנות בארוחת ערב, ובסוף הזמנה לשיחת היכרות', short: 'רילס: ארוחת ערב', type: 'הצעה', state: 'לצלם ולהעלות' },
];

// Last week's three tasks (saved by last week's ritual). Wednesday's check-in already marked two.
export const LAST_TASKS = [
  { id: 't1', text: 'לשלוח לגלית פרץ הצעה לליווי 3 חודשים', done: true },
  { id: 't2', text: 'לצלם רילס להרשמה לסדנה', done: true },
  { id: 't3', text: 'להתקשר ל-4 הפניות מהסדנה ולקבוע שיחות היכרות', done: false, steps: ['לפתוח את 4 הפניות בטבלת הלידים', 'להתקשר לשתי הראשונות', 'להתקשר לשתיים הנותרות', 'לקבוע שיחות ביומן'] },
];

// Open decisions for the FlowBiz meeting (the skill, p.10: up to 12, the oldest first).
export const DECISIONS = [
  { id: 'q1', text: 'להעלות את מחיר הליווי ל-3,000 ₪?', from: 'מ"העסק במספרים"' },
  { id: 'q2', text: 'לפתוח סדנה קבוצתית שנייה בדצמבר?', from: 'מסיכום הפגישה הקודמת' },
  { id: 'q3', text: 'להוריד את פגישת הייעוץ החד-פעמית מהסל?', from: 'מ"סל המוצרים"' },
  { id: 'q4', text: 'לנסות פרסום ממומן באינסטגרם, 300 ₪ בחודש?', from: 'מ"מכונת תוכן"' },
  { id: 'q5', text: 'איך עונים ל"אין לי זמן לבשל"?', from: 'מ"חדר התרגול"' },
];

// The three tasks: one from the focus, one for content, one that moves the user forward in the
// system (the next step of the journey, or a tool not used yet). Every slot has a few options;
// "הצעה אחרת" moves to the next one (with a way back). mins = how long it takes; short = a shorter
// version for a full week; steps = small sub-tasks to tick off during the week (each a small win).
export const FOCUS_TASKS = {
  leads: { text: 'לפרסם את הפוסט של יום ראשון ב-2 קבוצות פייסבוק', mins: 30, kind: 'focus', steps: ['לבחור 2 קבוצות שהקהל שלך נמצא בהן', 'להתאים את הפתיח לכל קבוצה', 'לפרסם ולענות לתגובות הראשונות'] },
  calls: {
    text: 'להתקשר ל-4 הפניות מהסדנה ולקבוע 2 שיחות היכרות', mins: 60, kind: 'focus',
    steps: ['לפתוח את 4 הפניות בטבלת הלידים', 'להתקשר לשתי הראשונות', 'להתקשר לשתיים הנותרות', 'לקבוע 2 שיחות ביומן'],
    short: { text: 'לשלוח ל-4 הפניות מהסדנה הודעה עם קישור לקביעת שיחה', mins: 20, steps: ['להעתיק את ההודעה עם הקישור', 'לשלוח ל-4 הפניות'] },
  },
  closes: { text: 'פולואפ טלפוני לגלית פרץ על ההצעה', mins: 20, kind: 'focus', steps: ['לקרוא שוב את ההצעה ששלחת', 'להכין תשובה ל"צריך לחשוב על זה"', 'להתקשר לגלית'] },
  steady: { text: 'להציע חודש המשך ללקוחות שמסיימות ליווי החודש', mins: 20, kind: 'focus', steps: ['לבדוק מי מסיימת ליווי החודש', 'לשלוח לכל אחת הודעה אישית', 'לקבוע שיחה קצרה עם מי שעונה'] },
};
export const TASK_POOL = {
  content: [
    {
      text: 'לצלם את הרילס של יום חמישי (3 החלפות בארוחת ערב)', mins: 45, kind: 'content',
      steps: ['לכתוב את 3 ההחלפות ואת ההזמנה בסוף', 'לצלם בטייק אחד', 'לתזמן לחמישי ב-19:30'],
      short: { text: 'לצלם את הרילס בטייק אחד, בלי עריכה', mins: 20, steps: ['לצלם בטייק אחד', 'לתזמן לחמישי ב-19:30'] },
    },
    { text: 'לכתוב פוסט תשובה ל"אין לי זמן לבשל"', mins: 30, kind: 'content', steps: ['לרשום 3 ארוחות של 10 דקות', 'לכתוב את הפוסט', 'לתזמן ב"מכונת תוכן"'] },
    { text: 'לפתוח הרשמה לסדנה של דצמבר בדף הנחיתה', mins: 30, kind: 'content', steps: ['לקבוע תאריך לסדנה', 'לעדכן את דף הנחיתה', 'לפרסם סטורי עם הקישור'] },
  ],
  // Progress in the system: the next step of the journey, or a tool that wasn't used yet.
  system: [
    {
      text: 'להתקדם במסע: שיחת אימון אחת ב"חדר התרגול" (שלב 12)', mins: 25, kind: 'system', link: 'חדר התרגול',
      steps: ['לפתוח את "חדר התרגול"', 'שיחת אימון מול לקוח שאומר "זה יקר לי"', 'לשמור את התשובה בדף ההתנגדויות'],
      short: { text: 'שיחת אימון קצרה אחת ב"חדר התרגול"', mins: 10, steps: ['לפתוח את "חדר התרגול"', 'שיחה אחת, רמה 1'] },
    },
    { text: 'לבנות ב"מכונת תוכן" את התוכנית לשבוע הבא', mins: 20, kind: 'system', link: 'מכונת תוכן', steps: ['לפתוח את "מכונת תוכן"', 'לבחור 3 רעיונות', 'לאשר את התוכנית'] },
    { text: 'לעדכן את "העסק במספרים" עם מחיר הליווי החדש', mins: 15, kind: 'system', link: 'העסק במספרים', steps: ['לפתוח את "העסק במספרים"', 'לעדכן את המחיר', 'לבדוק את היעד החדש'] },
  ],
};
// A user in the middle of the journey (step 4) gets the tasks of the next steps, sized to their hours.
export const JOURNEY_TASKS = [
  { text: 'לסיים את "צייד הלקוחות" (שלב 4)', mins: 40, kind: 'journey', link: 'צייד הלקוחות', steps: ['לפתוח את השלב מהמפה', 'לענות על החלק שנשאר', 'לאשר את התוצר'] },
  { text: 'לכתוב 5 שמות של אנשים שמתאימים ללקוח האידיאלי', mins: 15, kind: 'journey', steps: ['לעבור על אנשי הקשר בטלפון', 'לרשום 5 שמות', 'לסמן מי הכי מתאים'] },
  { text: 'להתחיל את "העסק במספרים" (שלב 5)', mins: 35, kind: 'journey', link: 'העסק במספרים', steps: ['לפתוח את השלב', 'למלא את ההוצאות הקבועות', 'לקבוע יעד הכנסה'] },
  { text: 'לקרוא את תיק הלקוח ולסמן מה מפתיע', mins: 15, kind: 'journey', steps: ['לקרוא את תיק הלקוח', 'לסמן 2 דברים שמפתיעים'] },
];

export const KIND = {
  focus: { label: 'מהפוקוס', icon: 'crosshair' },
  content: { label: 'תוכן', icon: 'megaphone' },
  system: { label: 'התקדמות במערכת', icon: 'route' },
  journey: { label: 'במסע', icon: 'map' },
  carry: { label: 'מהשבוע שעבר', icon: 'undo-2' },
};

// Past weeks (the history keeps 26).
export const HISTORY = [
  { week: '8-14.11', done: 2, focus: 'להביא יותר פניות', leads: 9, closes: 0, revenue: 2050 },
  { week: '1-7.11', done: 3, focus: 'לסגור את מי שכבר דיבר איתך', leads: 6, closes: 2, revenue: 5400 },
  { week: '25-31.10', done: 3, focus: 'להביא יותר פניות', leads: 4, closes: 1, revenue: 2700 },
  { week: '18-24.10', done: 1, focus: 'להתחיל לפרסם', leads: 2, closes: 0, revenue: 0 },
];

// The demo situations (developer panel). Each part with no data is skipped quietly.
export const SCENARIOS = {
  full: { label: 'פעילה, אחרי שלב 11', sub: 'יומן, לידים, יעד, תוכן ופגישה ביומן', step: 12, calendar: true, leads: true, goal: true, content: true, meeting: true, first: false, busy: false, streak: 3, hoursWeek: 20 },
  nomeet: { label: 'בלי פגישה השבוע', sub: 'החלק "לפגישה" מדלג', step: 12, calendar: true, leads: true, goal: true, content: true, meeting: false, first: false, busy: false, streak: 3, hoursWeek: 20 },
  busy: { label: 'שבוע עמוס מדי', sub: 'בדיקת העומס מתריעה', step: 12, calendar: true, leads: true, goal: true, content: true, meeting: true, first: false, busy: true, streak: 3, hoursWeek: 20 },
  first: { label: 'שבוע ראשון', sub: 'בלי "מה נעשה"', step: 12, calendar: true, leads: true, goal: true, content: true, meeting: false, first: true, busy: false, streak: 0, hoursWeek: 20 },
  nocal: { label: 'בלי יומן מחובר', sub: 'יש כפתור לחבר, הלוח לא נתקע', step: 12, calendar: false, leads: true, goal: true, content: true, meeting: false, first: false, busy: false, streak: 3, hoursWeek: 20 },
  mid: { label: 'באמצע המסע (שלב 4)', sub: 'בלי לידים, יעד ותוכן', step: 4, calendar: false, leads: false, goal: false, content: false, meeting: false, first: false, busy: false, streak: 1, hoursWeek: 10 },
};

// "חסכת עד עכשיו": what the ritual is worth, the same way every step is worth something.
export const VALUE = { ritual: 150, ritualLike: 'כמו שעת תכנון עם יועץ עסקי', allThree: 100 };
