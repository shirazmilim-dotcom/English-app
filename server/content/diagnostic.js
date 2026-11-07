// מאגר שאלות לאבחון אדפטיבי. כל פריט משויך לרמת CEFR.
// listening: קטע שמושמע בקול (TTS) ושאלה. vocab: אוצר מילים והבנת משפטים.

export const DIAG_LISTENING = [
  { id: 'l-a1-1', level: 'A1', audio: 'Hello! My name is Tom. I am ten years old, and I have a big brown dog.', qHe: 'מה יש לטום?', options: ['חתול לבן', 'כלב חום גדול', 'אח קטן'], answer: 1 },
  { id: 'l-a1-2', level: 'A1', audio: 'The shop opens at nine o\'clock and closes at five.', qHe: 'מתי החנות נסגרת?', options: ['בתשע', 'בשתיים', 'בחמש'], answer: 2 },
  { id: 'l-a1-3', level: 'A1', audio: 'Can I have two coffees and one orange juice, please?', qHe: 'כמה משקאות הוזמנו בסך הכול?', options: ['שניים', 'שלושה', 'ארבעה'], answer: 1 },
  { id: 'l-a2-1', level: 'A2', audio: 'Sorry I\'m late. The bus didn\'t come, so I had to walk all the way from the station.', qHe: 'למה הדובר איחר?', options: ['הוא קם מאוחר', 'האוטובוס לא הגיע והוא הלך ברגל', 'הוא הלך לאיבוד'], answer: 1 },
  { id: 'l-a2-2', level: 'A2', audio: 'I usually go to the gym on Mondays and Wednesdays, but this week I\'m going on Thursday instead.', qHe: 'מתי הדובר הולך לחדר כושר השבוע?', options: ['שני ורביעי', 'רק ברביעי', 'בחמישי'], answer: 2 },
  { id: 'l-a2-3', level: 'A2', audio: 'The blue shirt is nice, but it\'s too expensive. I\'ll take the white one – it\'s half the price.', qHe: 'איזו חולצה הדוברת קונה ולמה?', options: ['הכחולה – היא יפה יותר', 'הלבנה – היא זולה יותר', 'אף אחת – שתיהן יקרות'], answer: 1 },
  { id: 'l-b1-1', level: 'B1', audio: 'I was going to take the job in Berlin, but when they told me I\'d have to start next month, I realized I just wasn\'t ready to move so quickly.', qHe: 'למה הדוברת לא לקחה את העבודה?', options: ['המשכורת הייתה נמוכה', 'היא לא הייתה מוכנה לעבור כל כך מהר', 'היא לא אוהבת את ברלין'], answer: 1 },
  { id: 'l-b1-2', level: 'B1', audio: 'If you\'re planning to visit the museum on Sunday, I\'d book tickets online. Last time we went, the line was over an hour long.', qHe: 'מה הדובר ממליץ?', options: ['להגיע מוקדם בבוקר', 'לא ללכת ביום ראשון', 'להזמין כרטיסים מראש באינטרנט'], answer: 2 },
  { id: 'l-b1-3', level: 'B1', audio: 'The meeting has been moved from Tuesday to Wednesday, but the time stays the same, so I\'ll see you at three.', qHe: 'מה השתנה בפגישה?', options: ['היום', 'השעה', 'היום והשעה'], answer: 0 },
  { id: 'l-b2-1', level: 'B2', audio: 'Honestly, the reviews were glowing, so I expected a lot more. It wasn\'t bad, exactly – it just didn\'t live up to the hype.', qHe: 'מה דעת הדוברת?', options: ['זה היה גרוע מאוד', 'זה היה בסדר אבל פחות טוב מהציפיות', 'זה היה מעולה כמו בביקורות'], answer: 1 },
  { id: 'l-b2-2', level: 'B2', audio: 'We\'re not ruling out a price increase, but before anything is decided, we want to see how the next quarter goes.', qHe: 'מה המצב לגבי העלאת המחיר?', options: ['הוחלט להעלות מחירים', 'הוחלט שלא להעלות מחירים', 'עדיין לא הוחלט – מחכים לתוצאות'], answer: 2 },
  { id: 'l-b2-3', level: 'B2', audio: 'He\'s brilliant at coming up with ideas, but when it comes to following through, he tends to lose interest pretty quickly.', qHe: 'מה החולשה שלו?', options: ['אין לו רעיונות', 'הוא לא מסיים את מה שהוא מתחיל', 'הוא לא עובד טוב בצוות'], answer: 1 },
  { id: 'l-c1-1', level: 'C1', audio: 'Had we known the venue would be double-booked, we\'d have made alternative arrangements weeks ago rather than scrambling at the last minute.', qHe: 'מה המשמעות?', options: ['הם ידעו על הבעיה מראש ולא עשו כלום', 'הם לא ידעו על הבעיה, ולכן נאלצו להתארגן ברגע האחרון', 'הם ביטלו את האירוע'], answer: 1 },
  { id: 'l-c1-2', level: 'C1', audio: 'The proposal is ambitious, no doubt, but I can\'t help feeling it glosses over the logistical challenges we\'d inevitably face.', qHe: 'מה הביקורת של הדובר?', options: ['ההצעה לא שאפתנית מספיק', 'ההצעה מתעלמת מקשיים לוגיסטיים', 'ההצעה יקרה מדי'], answer: 1 },
  { id: 'l-c1-3', level: 'C1', audio: 'It\'s not that I object to the idea in principle; it\'s more that the timing strikes me as somewhat ill-judged.', qHe: 'מה עמדת הדוברת?', options: ['היא מתנגדת לרעיון עצמו', 'היא תומכת בלי הסתייגות', 'הרעיון בסדר, אבל העיתוי לא מוצלח'], answer: 2 },
];

export const DIAG_VOCAB = [
  { id: 'v-a1-1', level: 'A1', q: 'What does "kitchen" mean?', qHe: 'מה פירוש kitchen?', options: ['מטבח', 'חדר שינה', 'גינה'], answer: 0 },
  { id: 'v-a1-2', level: 'A1', q: 'I ___ a student.', qHe: 'השלימו את המשפט', options: ['is', 'am', 'are'], answer: 1 },
  { id: 'v-a1-3', level: 'A1', q: 'What does "tired" mean?', qHe: 'מה פירוש tired?', options: ['רעב', 'עייף', 'שמח'], answer: 1 },
  { id: 'v-a2-1', level: 'A2', q: 'Yesterday I ___ to the cinema with my friends.', qHe: 'השלימו את המשפט', options: ['go', 'went', 'going'], answer: 1 },
  { id: 'v-a2-2', level: 'A2', q: 'What does "borrow" mean?', qHe: 'מה פירוש borrow?', options: ['להשאיל לאחר', 'לשאול (לקבל בהשאלה)', 'לקנות'], answer: 1 },
  { id: 'v-a2-3', level: 'A2', q: 'Choose the correct sentence:', qHe: 'בחרו את המשפט התקין', options: ['She don\'t like fish.', 'She doesn\'t likes fish.', 'She doesn\'t like fish.'], answer: 2 },
  { id: 'v-b1-1', level: 'B1', q: 'I\'ve lived here ___ 2015.', qHe: 'השלימו את המשפט', options: ['for', 'since', 'from'], answer: 1 },
  { id: 'v-b1-2', level: 'B1', q: 'What does "I can\'t afford it" mean?', qHe: 'מה המשמעות?', options: ['אין לי מספיק כסף לזה', 'אני לא מסוגל/ת להרים את זה', 'אין לי זמן לזה'], answer: 0 },
  { id: 'v-b1-3', level: 'B1', q: 'If it rains tomorrow, we ___ the picnic.', qHe: 'השלימו את המשפט', options: ['cancel', 'will cancel', 'would cancelled'], answer: 1 },
  { id: 'v-b2-1', level: 'B2', q: 'What does "to put something off" mean?', qHe: 'מה פירוש put off?', options: ['לכבות', 'לדחות למועד מאוחר יותר', 'להוריד בגד'], answer: 1 },
  { id: 'v-b2-2', level: 'B2', q: 'I wish I ___ more time to travel last year.', qHe: 'השלימו את המשפט', options: ['had had', 'have', 'would have'], answer: 0 },
  { id: 'v-b2-3', level: 'B2', q: 'Which word means "unwilling to change your opinion"?', qHe: 'איזו מילה פירושה "לא מוכן/ה לשנות דעה"?', options: ['stubborn', 'reliable', 'generous'], answer: 0 },
  { id: 'v-c1-1', level: 'C1', q: 'What does "to be on the fence" mean?', qHe: 'מה המשמעות?', options: ['להיות בסכנה', 'להתלבט ולא להחליט', 'להיות מחוץ לעניינים'], answer: 1 },
  { id: 'v-c1-2', level: 'C1', q: 'Not only ___ late, but he also forgot the documents.', qHe: 'השלימו את המשפט', options: ['he arrived', 'did he arrive', 'he did arrive'], answer: 1 },
  { id: 'v-c1-3', level: 'C1', q: 'Which is closest in meaning to "meticulous"?', qHe: 'מה הכי קרוב ל־meticulous?', options: ['קפדני מאוד בפרטים', 'מהיר מאוד', 'חסר סבלנות'], answer: 0 },
];

// משימות דיבור בקושי עולה
export const DIAG_SPEAKING = [
  { id: 'sp1', level: 'A1', promptEn: 'Tell me your name, where you live, and one thing you like.', promptHe: 'ספר/י איך קוראים לך, איפה את/ה גר/ה ודבר אחד שאת/ה אוהב/ת.' },
  { id: 'sp2', level: 'A2', promptEn: 'What did you do last weekend?', promptHe: 'מה עשית בסוף השבוע האחרון?' },
  { id: 'sp3', level: 'B1', promptEn: 'Do you prefer working from home or from an office? Explain why.', promptHe: 'מה את/ה מעדיף/ה – לעבוד מהבית או מהמשרד? נמק/י.' },
];

export const GOALS = [
  { id: 'travel', he: 'להסתדר בטיולים בחו״ל' },
  { id: 'work', he: 'אנגלית לעבודה' },
  { id: 'social', he: 'לדבר עם חברים ואנשים חדשים' },
  { id: 'media', he: 'להבין סדרות, סרטים ופודקאסטים' },
  { id: 'study', he: 'לימודים או מבחן' },
  { id: 'relocation', he: 'מעבר לחו״ל' },
  { id: 'confidence', he: 'פשוט להרגיש בטוח/ה לדבר' },
];

export const INTERESTS = [
  { id: 'travel', he: 'טיולים', emoji: '✈️' },
  { id: 'food', he: 'אוכל', emoji: '🍜' },
  { id: 'relationships', he: 'זוגיות ויחסים', emoji: '💞' },
  { id: 'music', he: 'מוזיקה', emoji: '🎵' },
  { id: 'business', he: 'עסקים', emoji: '📈' },
  { id: 'social', he: 'רשתות חברתיות', emoji: '📱' },
  { id: 'content', he: 'יצירת תוכן', emoji: '🎬' },
  { id: 'daily', he: 'חיי היום־יום', emoji: '🏡' },
];
