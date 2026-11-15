// "הסבר מהכריש": a fixed "?" in the top bar, on every screen of the ritual (as in the practice
// room). It opens the shark's note with a short explanation of the screen (what we do here, what
// you see, why it matters), and "לשאול את הכריש" opens a chat with ready questions and answers.
// In the system, a free question goes to the model with the step and the user's numbers.
// The texts follow the skill (skills pack, pages 9, 10, 16, 19), the demo data, and a Hormozi
// way of running a business: one bottleneck at a time, the money is in the follow-up, give before
// you ask, and few actions done over many planned.
import { html, useState, useRef, useEffect, Icon, cx } from './lib.js';
import { USER, VALUE, g } from './data.js';
import { fmt } from './calc.js';

export const EXPLAIN = {
  opening: {
    title: 'צייר לי שבוע מושלם',
    what: 'כאן מתכננים את השבוע, בכעשר דקות, כל יום ראשון.',
    see: 'החלקים של הטקס. חלק שאין לו נתונים מדלג לבד, למשל "לפגישה" כשאין פגישת FlowBiz ביומן.',
    why: 'שבוע בלי תוכנית מתמלא בדברים דחופים. עשר דקות ביום ראשון קובעות מה באמת יזיז את העסק.',
    qa: [
      ['מה יוצא לי מזה?', `שלוש משימות ביומן, למי לחזור, ופוקוס אחד לשבוע. על כל שבוע מצויר נכנסים ${fmt(VALUE.ritual)} ל"חסכת עד עכשיו".`],
      ['חייבים ביום ראשון?', 'לא. אפשר לצייר בכל יום. התזכורת מגיעה ביום ראשון ב-08:00, ומשנים אותה במסך הסיום.'],
      ['כמה זמן זה לוקח?', g('כעשר דקות. רוב הנתונים מגיעים מהמערכת, ואתה רק בודק ומחליט.', 'כעשר דקות. רוב הנתונים מגיעים מהמערכת, ואת רק בודקת ומחליטה.')],
    ],
  },
  last: {
    title: 'מה יצא מהשבוע שעבר',
    what: 'כאן מסמנים אילו משימות מהשבוע שעבר בוצעו.',
    see: 'שלוש המשימות של השבוע שעבר. מה שכבר סומן ברביעי, מסומן.',
    why: 'מה שלא נעשה לא נעלם. הוא נשקל שוב, ונכנס השבוע רק אם הוא עדיין חשוב.',
    qa: [
      ['מה קורה למשימה שלא בוצעה?', 'אם "לעבור לשבוע הזה" דולק, היא נכנסת לשלוש המשימות. אם זו בדיוק המשימה של הפוקוס החדש, השתיים מתאחדות.'],
      ['ואם היא כבר לא חשובה?', 'מכבים את "לעבור לשבוע הזה". היא נשארת בהיסטוריה של השבועות, ולא נכנסת לשבוע הזה.'],
    ],
  },
  week: {
    title: 'מה כבר קבוע השבוע',
    what: 'כאן רואים מה כבר תפוס השבוע, לפני שמוסיפים משהו.',
    see: 'האירועים מהיומן, מהיום ועד שבוע קדימה, והפוסטים מ"מכונת תוכן". לחיצה על שורה פותחת עריכה.',
    why: 'המשימות של השבוע נכנסות רק לשעות שנשארו פנויות. קודם יודעים מה פנוי.',
    qa: [
      ['למה שלושה פוסטים?', 'שניים שנותנים ערך ואחד עם הצעה. קודם נותנים, ורק אז מבקשים.'],
      ['איך מזוהה פגישת FlowBiz?', 'לפי "FlowBiz" או שם המלווה בכותרת. רק כשיש כזו השבוע, מופיע החלק "לפגישה".'],
      ['שינוי כאן משנה את היומן?', 'כן. עריכה, הוספה ומחיקה נשמרות גם ב-Google Calendar, ופוסט נשמר בתוכנית של "מכונת תוכן". מחיקה אפשר לבטל.'],
    ],
  },
  followups: {
    title: 'למי לחזור השבוע',
    what: 'כאן חוזרים לאנשים שמחכים לך, לידים ולקוחות.',
    see: 'מי שבאיחור, למעלה. לכל אחד הודעה מוכנה בקול שלך: ליד מקבל תשובה, ולקוח פעיל הודעה ששומרת על הקשר.',
    why: 'ליד שלא חוזרים אליו מתקרר. רוב הכסף נמצא בפולואפ, לא בפנייה הראשונה.',
    qa: [
      ['מה עושה "שלחתי"?', 'מעדכן את השורה בטבלת הלידים: מגע אחרון היום, והפולואפ הבא נקבע לבד, בעוד 3 ימים לליד או בעוד שבוע ללקוח פעיל.'],
      ['למה לקוח פעיל ברשימה?', 'כי לקוח שמרגיש שזוכרים אותו נשאר, ממשיך וממליץ. לשמור לקוח זול יותר מלהביא לקוח חדש.'],
      ['ההודעה יוצאת לבד?', g('לא. אתה קורא, עורך אם צריך, ושולח. בלי הלחיצה שלך כלום לא יוצא.', 'לא. את קוראת, עורכת אם צריך, ושולחת. בלי הלחיצה שלך כלום לא יוצא.')],
    ],
  },
  numbers: {
    title: 'המספרים של השבוע שעבר',
    what: 'כאן בודקים חמישה מספרים של השבוע שעבר.',
    see: 'פניות, שיחות היכרות, לקוחות שסגרו, הכנסות והוצאות שיווק. מה שהמערכת כבר יודעת, ממולא.',
    why: 'בלי מספרים, הפוקוס הוא ניחוש. איתם רואים בדיוק איפה הדרך ללקוח נתקעת.',
    qa: [
      [g('ואם אני לא יודע מספר?', 'ואם אני לא יודעת מספר?'), 'משאירים ריק, וממשיכים. נשמר רק מספר מדויק, כי מספר לא נכון שולח את הפוקוס למקום הלא נכון.'],
      ['ההכנסות הן רווח?', 'לא. אלה הכנסות לפני מס והוצאות, כמו יעד ההכנסה שאליו משווים.'],
      ['איפה זה נשמר?', 'בטבלת המספרים, שורה אחת לכל שבוע. משם נבנים הסיכום של החודש והמסמך לפגישה.'],
    ],
  },
  focus: {
    title: 'הפוקוס של השבוע',
    what: 'כאן מוצאים את המקום האחד שבו הדרך מפנייה ללקוח נתקעת.',
    see: 'פניות, שיחות ולקוחות מול היעד השבועי, וכמה עוברים מכל שלב לשלב הבא. השלב הראשון שרחוק מהיעד הוא הפוקוס.',
    why: 'מתקנים צוואר בקבוק אחד בכל פעם. כל עוד הוא תקוע, מה שמוסיפים לפניו נתקע שם.',
    qa: [
      ['איך נבחר הפוקוס?', 'הולכים לפי הסדר: פניות, שיחות, לקוחות. השלב הראשון שמתחת ל-60% מהיעד השבועי הוא הפוקוס, כי כל מה שאחריו תלוי בו.'],
      ['למה לא עוד פניות?', 'כשהפניות כבר מגיעות ולא הופכות לשיחות, עוד פניות רק יחכו בתור. קודם מטפלים במי שכבר פנה.'],
      ['מאיפה היעדים?', `מ"העסק במספרים": היעד של ${fmt(USER.goalMonth)} בחודש, לפי המחיר שלך והמספרים של השבועות האחרונים, מתחלק ליעד לכל שבוע.`],
    ],
  },
  meeting: {
    title: 'מה לשאול בפגישת המיקוד',
    what: 'כאן מכינים את השאלות לפגישת FlowBiz של השבוע.',
    see: 'החלטות שעוד פתוחות, מהשלבים ומהפגישה הקודמת, וגם שאלה משלך. מה שמסמנים, המלווה רואה לפני הפגישה.',
    why: 'פגישה שמתחילה משאלות פתוחות נגמרת בהחלטות, ולא בעדכונים.',
    qa: [
      ['מאיפה השאלות?', 'מהחלטות שנשארו פתוחות בשלבים ובסיכומי הפגישות. עד 12, הישנות קודם.'],
      ['מה זה המסמך לפגישה?', 'כשהפגישה עד יומיים קדימה, נבנה מסמך אחד: מה נעשה, המספרים מול היעד, באילו כלים השתמשת, איפה נתקע והשאלות. המלווה רואה אותו מראש.'],
      ['ומה קורה אחרי הפגישה?', 'החלטה שמשנה משהו בעסק מתעדכנת בפרופיל העסק, רק באישור שלך.'],
    ],
  },
  tasks: {
    title: 'שלוש משימות לשבוע',
    what: 'כאן בוחרים את שלוש המשימות של השבוע.',
    see: 'אחת מהפוקוס, אחת לתוכן, ואחת שמקדמת אותך במערכת. לכל אחת יום, שעה פנויה וצעדים קטנים.',
    why: 'שלוש שבוצעו שוות יותר מעשר שחיכו. בדיקת העומס מוודאת שהן באמת נכנסות בשעות שיש לך.',
    qa: [
      ['למה דווקא שלוש?', 'כי שלוש נכנסות לשבוע אמיתי, ליד הלקוחות. כשיש עשר, בסוף השבוע רובן עוד מחכות.'],
      ['ואם משימה לא מתאימה?', '"הצעה אחרת" מביאה אפשרות אחרת, ותמיד אפשר לחזור לקודמת. אפשר גם לערוך את הטקסט ואת הצעדים.'],
      ['מה זו בדיקת העומס?', 'הפגישות ביומן, זמן המשימות וחצי שעה ביום להודעות, מול השעות לעסק בשבוע. כשעוברים את השעות, אפשר לקצר משימה.'],
    ],
  },
  done: {
    title: 'השבוע מצויר',
    what: 'השבוע מתוכנן: שלוש משימות ביומן, ותזכורות לאמצע השבוע ולסופו.',
    see: `הרצף, ${fmt(VALUE.ritual)} ל"חסכת עד עכשיו", והמשימות עם הצעדים שלהן. כל צעד שמסמנים הוא הצלחה קטנה.`,
    why: 'הכי קל להתחיל כשהתוכנית עוד פתוחה מול העיניים. צעד אחד עכשיו, והשבוע כבר זז.',
    qa: [
      ['מה קורה ברביעי ובחמישי?', 'ברביעי בדיקה קצרה: מה בוצע, ומה עובר ליום אחר. בחמישי סוגרים את השבוע בחצי דקה, וביום ראשון מתחילים ישר מהתכנון.'],
      ['מה שובר את הרצף?', 'שבוע בלי טקס. הרצף סופר שבועות ברצף שבהם השבוע צויר.'],
      ['מתי מקבלים את ה-100 ₪?', `כששלוש המשימות בוצעו. ${fmt(VALUE.allThree)} נכנסים ל"חסכת עד עכשיו", פעם אחת בשבוע.`],
    ],
  },
};

// The button in the top bar: a question mark, the sign everyone reads as "explain this".
// The tooltip says who explains. It tells the page to open the shark's note (main.js listens).
export function ExplainButton({ class: cls = '' }) {
  return html`<span class=${cx('group relative inline-flex shrink-0', cls)}>
    <button type="button" onClick=${(e) => (e.currentTarget.blur(), window.dispatchEvent(new CustomEvent('fb:explain')))} aria-label="הסבר מהכריש על המסך הזה" class="no-print grid h-10 w-10 place-items-center rounded-full bg-brand-50 font-display text-[22px] font-black leading-none text-brand-600 ring-[1.5px] ring-brand-300 transition hover:bg-brand-600 hover:text-white hover:ring-brand-600 focus-visible:bg-brand-600 focus-visible:text-white cursor-pointer">?</button>
    <span role="tooltip" class="pointer-events-none absolute end-0 top-[calc(100%+8px)] z-30 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[13px] font-bold text-white shadow-lg group-hover:block group-focus-within:block">הסבר מהכריש על המסך הזה</span>
  </span>`;
}

// The inside of the shark's note: the explanation, then the chat.
export function SharkTalk({ screen }) {
  const ex = EXPLAIN[screen] || EXPLAIN.opening;
  const [chat, setChat] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useRef(null);
  useEffect(() => list.current?.scrollTo(0, 1e6), [msgs.length, busy]);
  const asked = new Set(msgs.filter((m) => m.me).map((m) => m.text));
  const send = async (q) => {
    q = q.trim();
    if (!q || busy) return;
    setText('');
    setMsgs((m) => [...m, { me: true, text: q }]);
    setBusy(true);
    const ready = ex.qa.find(([k]) => k === q);
    await new Promise((r) => setTimeout(r, ready ? 500 : 400));
    const reply = ready ? ready[1] : 'במוקאפ אני עונה על השאלות המוכנות. במערכת אפשר לשאול אותי כל דבר על השבוע ועל העסק.';
    setMsgs((m) => [...m, { me: false, text: reply }]);
    setBusy(false);
  };

  if (!chat)
    return html`<div class="text-[15px] leading-relaxed">
      <p class="mb-2 font-display text-[17px] font-bold text-brand-900">${ex.title}</p>
      <p>${ex.what}</p>
      <p class="mt-1.5 text-muted">${ex.see}</p>
      <p class="mt-2 rounded-xl bg-brand-50 px-3 py-2 font-semibold text-brand-900">${ex.why}</p>
      <button type="button" onClick=${() => setChat(true)} class="mt-3 inline-flex items-center gap-1.5 text-[15px] font-bold text-brand-600 hover:underline cursor-pointer"><${Icon} name="message-circle" size=${16} />לשאול את הכריש</button>
    </div>`;

  return html`<div class="text-[15px]">
    <button type="button" onClick=${() => setChat(false)} class="mb-2 inline-flex items-center gap-1 text-[13px] font-bold text-muted hover:text-ink cursor-pointer"><${Icon} name="arrow-right" size=${14} />חזרה להסבר</button>
    <div ref=${list} class="thin-scroll flex max-h-[240px] flex-col gap-2 overflow-y-auto">
      ${msgs.length === 0 && html`<p class="text-muted">${g('מה תרצה לדעת על', 'מה תרצי לדעת על')} "${ex.title}"?</p>`}
      ${msgs.map((m, i) => html`<p key=${i} class=${cx('max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-snug', m.me ? 'self-start rounded-ss-md bg-brand-600 text-white' : 'self-end rounded-se-md bg-canvas ring-1 ring-line')}>${m.text}</p>`)}
      ${busy && html`<p class="self-end rounded-2xl bg-canvas px-3 py-2 text-muted ring-1 ring-line">הכריש כותב...</p>`}
    </div>
    ${ex.qa.some(([q]) => !asked.has(q)) && html`<div class="mt-2.5 flex flex-wrap gap-1.5">${ex.qa.filter(([q]) => !asked.has(q)).map(([q]) => html`<button key=${q} type="button" onClick=${() => send(q)} class="rounded-full bg-white px-2.5 py-1 text-start text-[13px] font-semibold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50 cursor-pointer">${q}</button>`)}</div>`}
    <form class="mt-2.5 flex gap-1.5" onSubmit=${(e) => (e.preventDefault(), send(text))}>
      <input value=${text} onInput=${(e) => setText(e.target.value)} onKeyDown=${(e) => e.stopPropagation()} placeholder="לשאול על השבוע..." aria-label="שאלה לכריש" class="h-10 min-w-0 flex-1 rounded-xl bg-white px-3 text-[15px] ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-300" />
      <button type="submit" disabled=${!text.trim() || busy} aria-label="לשלוח" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white disabled:opacity-40 cursor-pointer"><${Icon} name="send" size=${17} /></button>
    </form>
  </div>`;
}
