// תוכן לימודי: שלבים (CEFR) → יחידות → שיעורים.
// כל שיעור משלב: אוצר מילים בהקשר → הקשבה (שיחה) → שאלות הבנה → שימוש במילים בקול → משימות דיבור.
// כדי להוסיף שיעור: הוסף אובייקט ל-LESSONS ושייך אותו ליחידה ב-STAGES.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const levelIndex = (l) => Math.max(0, LEVELS.indexOf(l));

export const STAGES = [
  {
    id: 'A1',
    level: 'A1',
    title: 'צעדים ראשונים',
    subtitle: 'משפטים בסיסיים על עצמי ועל צרכים פשוטים',
    milestoneScenario: 'cafe',
    units: [
      { id: 'a1-u1', title: 'להציג את עצמי', canDo: 'אני יכול/ה להציג את עצמי ולשאול שאלות היכרות פשוטות', lessons: ['a1-intro'] },
      { id: 'a1-u2', title: 'להזמין בבית קפה', canDo: 'אני יכול/ה להזמין משקה ומאפה ולשלם', lessons: ['a1-cafe'] },
    ],
  },
  {
    id: 'A2',
    level: 'A2',
    title: 'שיחות יומיומיות',
    subtitle: 'לספר על השגרה, להזמין, לקנות ולהסתדר',
    milestoneScenario: 'restaurant',
    units: [
      { id: 'a2-u1', title: 'לספר על היום שלי', canDo: 'אני יכול/ה לתאר את סדר היום שלי ולשאול על של אחרים', lessons: ['a2-routine'] },
      { id: 'a2-u2', title: 'במסעדה', canDo: 'אני יכול/ה להזמין במסעדה, לבקש שינויים ולפתור בעיה קטנה', lessons: ['a2-restaurant'] },
    ],
  },
  {
    id: 'B1',
    level: 'B1',
    title: 'עצמאות בשיחה',
    subtitle: 'להסתדר בטיול, לספר חוויות ולפתור בעיות',
    milestoneScenario: 'hotel',
    units: [
      { id: 'b1-u1', title: 'בעיה במלון', canDo: 'אני יכול/ה להסביר בעיה בנימוס ולבקש פתרון', lessons: ['b1-hotel'] },
      { id: 'b1-u2', title: 'לספר על חוויה', canDo: 'אני יכול/ה לספר סיפור קצר בזמן עבר עם פרטים ותחושות', lessons: ['b1-story'] },
    ],
  },
  {
    id: 'B2',
    level: 'B2',
    title: 'ביטחון בשיחה מקצועית',
    subtitle: 'ישיבות עבודה, דעות ודיון',
    milestoneScenario: 'work',
    units: [
      { id: 'b2-u1', title: 'ישיבת עבודה', canDo: 'אני יכול/ה להשתתף בישיבת עבודה, להציע ולהתפשר', lessons: ['b2-meeting'] },
      { id: 'b2-u2', title: 'להביע ולנמק דעה', canDo: 'אני יכול/ה להביע דעה, לנמק אותה ולהגיב לדעה אחרת', lessons: ['b2-opinion'] },
    ],
  },
];

export const LESSONS = {
  'a1-intro': {
    id: 'a1-intro',
    level: 'A1',
    title: 'Hi, I\'m Dana',
    titleHe: 'נעים להכיר',
    goalHe: 'בסוף השיעור תוכל/י לומר איך קוראים לך, מאיפה את/ה ומה את/ה עושה – ולשאול את אותן שאלות.',
    vocab: [
      { term: 'Nice to meet you', he: 'נעים להכיר', example: 'Hi, I\'m Tom. Nice to meet you!', exampleHe: 'היי, אני תום. נעים להכיר!' },
      { term: 'Where are you from?', he: 'מאיפה את/ה?', example: 'Where are you from? I\'m from Israel.', exampleHe: 'מאיפה את/ה? אני מישראל.' },
      { term: 'I live in…', he: 'אני גר/ה ב…', example: 'I live in Haifa, near the sea.', exampleHe: 'אני גר/ה בחיפה, ליד הים.' },
      { term: 'What do you do?', he: 'במה את/ה עובד/ת?', example: 'What do you do? I\'m a teacher.', exampleHe: 'במה את/ה עובד/ת? אני מורה.' },
      { term: 'work as', he: 'לעבוד בתור', example: 'I work as a nurse.', exampleHe: 'אני עובד/ת כאח/ות.' },
      { term: 'too', he: 'גם (בסוף משפט)', example: 'I like coffee too.', exampleHe: 'גם אני אוהב/ת קפה.' },
    ],
    listening: {
      titleHe: 'שתי שכנות חדשות נפגשות בלובי',
      lines: [
        { speaker: 'A', name: 'Dana', text: 'Hi! Are you new here?', he: 'היי! את חדשה כאן?' },
        { speaker: 'B', name: 'Maya', text: 'Yes, I am. I\'m Maya. I live on the third floor.', he: 'כן. אני מאיה. אני גרה בקומה השלישית.' },
        { speaker: 'A', name: 'Dana', text: 'Nice to meet you, Maya. I\'m Dana. Where are you from?', he: 'נעים להכיר, מאיה. אני דנה. מאיפה את?' },
        { speaker: 'B', name: 'Maya', text: 'I\'m from Eilat. And you?', he: 'אני מאילת. ואת?' },
        { speaker: 'A', name: 'Dana', text: 'I\'m from Tel Aviv. What do you do?', he: 'אני מתל אביב. במה את עובדת?' },
        { speaker: 'B', name: 'Maya', text: 'I work as a nurse. I work at the hospital near here.', he: 'אני עובדת כאחות. אני עובדת בבית החולים כאן קרוב.' },
        { speaker: 'A', name: 'Dana', text: 'Oh, cool! I\'m a teacher.', he: 'אה, מגניב! אני מורה.' },
      ],
      questions: [
        { id: 'q1', q: 'Where does Maya live in the building?', qHe: 'באיזו קומה מאיה גרה?', options: ['On the first floor', 'On the third floor', 'On the fifth floor'], answer: 1, explainHe: 'מאיה אומרת: "I live on the third floor" – בקומה השלישית.' },
        { id: 'q2', q: 'Where is Maya from?', qHe: 'מאיפה מאיה?', options: ['Tel Aviv', 'Haifa', 'Eilat'], answer: 2, explainHe: '"I\'m from Eilat" – היא מאילת. דנה היא מתל אביב.' },
        { id: 'q3', q: 'What is Maya\'s job?', qHe: 'מה המקצוע של מאיה?', options: ['A nurse', 'A teacher', 'A doctor'], answer: 0, explainHe: '"I work as a nurse" – היא אחות. דנה היא המורה.' },
      ],
    },
    vocabUse: [
      { term: 'Nice to meet you', promptHe: 'דמיינ/י שפגשת מישהו חדש. אמר/י משפט שמשלב "Nice to meet you" ואת השם שלך.' },
      { term: 'I live in…', promptHe: 'אמר/י איפה את/ה גר/ה, ותוסיף/י פרט אחד על המקום.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'Hi! I\'m Alex. What\'s your name?', promptHe: 'עני/ה: מה השם שלך? (אפשר להוסיף "Nice to meet you")', hintEn: 'Hi Alex, I\'m … Nice to meet you!', model: 'Hi Alex! I\'m Noa. Nice to meet you.', keywords: ['i\'m', 'name', 'nice', 'meet', 'i am'] },
      { id: 's2', promptEn: 'Where are you from, and where do you live now?', promptHe: 'ספר/י מאיפה את/ה ואיפה את/ה גר/ה היום.', hintEn: 'I\'m from … and I live in …', model: 'I\'m from Jerusalem, but now I live in Ramat Gan.', keywords: ['from', 'live'] },
      { id: 's3', promptEn: 'What do you do?', promptHe: 'במה את/ה עובד/ת או לומד/ת? (I work as… / I study…)', hintEn: 'I work as a … / I\'m a student.', model: 'I work as an accountant in a small company.', keywords: ['work', 'study', 'student', 'i\'m a', 'job'] },
    ],
  },

  'a1-cafe': {
    id: 'a1-cafe',
    level: 'A1',
    title: 'A coffee, please',
    titleHe: 'הזמנה בבית קפה',
    goalHe: 'תלמד/י להזמין משקה ומאפה בנימוס, לבחור גודל, לשאול על המחיר ולשלם.',
    vocab: [
      { term: 'Can I have…?', he: 'אפשר לקבל…?', example: 'Can I have a latte, please?', exampleHe: 'אפשר לקבל לאטה, בבקשה?' },
      { term: 'small / medium / large', he: 'קטן / בינוני / גדול', example: 'A large tea, please.', exampleHe: 'תה גדול, בבקשה.' },
      { term: 'for here or to go?', he: 'לשבת כאן או לקחת?', example: 'Is that for here or to go?', exampleHe: 'זה לשבת כאן או לקחת?' },
      { term: 'How much is it?', he: 'כמה זה עולה?', example: 'How much is it? – It\'s five dollars.', exampleHe: 'כמה זה עולה? – חמישה דולר.' },
      { term: 'pay by card', he: 'לשלם בכרטיס', example: 'Can I pay by card?', exampleHe: 'אפשר לשלם בכרטיס?' },
      { term: 'anything else?', he: 'עוד משהו?', example: 'Anything else? – No, thank you.', exampleHe: 'עוד משהו? – לא, תודה.' },
    ],
    listening: {
      titleHe: 'אורי מזמין קפה בלונדון',
      lines: [
        { speaker: 'A', name: 'Barista', text: 'Hi there! What can I get you?', he: 'שלום! מה אפשר להביא לך?' },
        { speaker: 'B', name: 'Uri', text: 'Hi. Can I have a cappuccino, please?', he: 'היי. אפשר לקבל קפוצ\'ינו, בבקשה?' },
        { speaker: 'A', name: 'Barista', text: 'Sure. Small, medium or large?', he: 'בטח. קטן, בינוני או גדול?' },
        { speaker: 'B', name: 'Uri', text: 'Medium, please. And a croissant.', he: 'בינוני, בבקשה. וקרואסון.' },
        { speaker: 'A', name: 'Barista', text: 'Is that for here or to go?', he: 'לשבת כאן או לקחת?' },
        { speaker: 'B', name: 'Uri', text: 'To go. How much is it?', he: 'לקחת. כמה זה עולה?' },
        { speaker: 'A', name: 'Barista', text: 'That\'s six pounds fifty.', he: 'זה שש לירות וחמישים.' },
        { speaker: 'B', name: 'Uri', text: 'Can I pay by card?', he: 'אפשר לשלם בכרטיס?' },
        { speaker: 'A', name: 'Barista', text: 'Of course. Here you go!', he: 'בטח. בבקשה!' },
      ],
      questions: [
        { id: 'q1', q: 'What size is Uri\'s coffee?', qHe: 'באיזה גודל הקפה של אורי?', options: ['Small', 'Medium', 'Large'], answer: 1, explainHe: 'אורי אומר "Medium, please" – בינוני.' },
        { id: 'q2', q: 'Is Uri staying in the café?', qHe: 'האם אורי נשאר לשבת בבית הקפה?', options: ['Yes, for here', 'No, it\'s to go', 'We don\'t know'], answer: 1, explainHe: 'הוא עונה "To go" – הוא לוקח איתו.' },
        { id: 'q3', q: 'How much does he pay?', qHe: 'כמה הוא משלם?', options: ['£5.50', '£6.15', '£6.50'], answer: 2, explainHe: '"six pounds fifty" = 6.50 לירות. שימו לב: fifty (50) ולא fifteen (15).' },
      ],
    },
    vocabUse: [
      { term: 'Can I have…?', promptHe: 'הזמינ/י משקה שאת/ה אוהב/ת עם "Can I have…".' },
      { term: 'How much is it?', promptHe: 'שאל/י כמה עולה משהו – מאפה, כרטיס, חולצה – כרצונך.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'Hi! What can I get you?', promptHe: 'הזמינ/י משקה אחד בנימוס.', hintEn: 'Can I have a …, please?', model: 'Hi! Can I have an iced coffee, please?', keywords: ['can i have', 'please', 'i\'d like', 'i would like', 'coffee', 'tea'] },
      { id: 's2', promptEn: 'Small, medium or large? And anything else?', promptHe: 'בחר/י גודל, והוסיפ/י מאפה או אמר/י שזה הכול.', hintEn: 'Large, please. And a muffin. / That\'s all, thanks.', model: 'Small, please. And a chocolate muffin.', keywords: ['small', 'medium', 'large', 'that\'s all', 'and a', 'no thank'] },
      { id: 's3', promptEn: 'That\'s seven dollars. Cash or card?', promptHe: 'עני/ה איך תשלמ/י, ותגיד/י תודה.', hintEn: 'By card, please. Thank you!', model: 'Card, please. Thanks a lot!', keywords: ['card', 'cash', 'thank'] },
    ],
  },

  'a2-routine': {
    id: 'a2-routine',
    level: 'A2',
    title: 'My daily routine',
    titleHe: 'סדר היום שלי',
    goalHe: 'תוכל/י לתאר את סדר היום שלך בהווה פשוט, להשתמש במילות זמן ולשאול אחרים על היום שלהם.',
    vocab: [
      { term: 'wake up', he: 'להתעורר', example: 'I usually wake up at seven.', exampleHe: 'אני בדרך כלל מתעורר/ת בשבע.' },
      { term: 'usually', he: 'בדרך כלל', example: 'She usually takes the bus to work.', exampleHe: 'היא בדרך כלל לוקחת אוטובוס לעבודה.' },
      { term: 'get ready', he: 'להתארגן', example: 'It takes me twenty minutes to get ready.', exampleHe: 'לוקח לי עשרים דקות להתארגן.' },
      { term: 'commute', he: 'נסיעה לעבודה / לנסוע לעבודה', example: 'My commute is about forty minutes.', exampleHe: 'הנסיעה שלי לעבודה היא בערך ארבעים דקות.' },
      { term: 'after that', he: 'אחרי זה', example: 'I have breakfast. After that, I check my emails.', exampleHe: 'אני אוכל/ת ארוחת בוקר. אחרי זה אני בודק/ת מיילים.' },
      { term: 'in the evening', he: 'בערב', example: 'In the evening, I relax and watch a series.', exampleHe: 'בערב אני נח/ה ורואה סדרה.' },
    ],
    listening: {
      titleHe: 'פודקאסט קצר: איך נראה יום של אופה',
      lines: [
        { speaker: 'A', name: 'Host', text: 'So, Ben, you\'re a baker. What time do you wake up?', he: 'אז, בן, אתה אופה. באיזו שעה אתה מתעורר?' },
        { speaker: 'B', name: 'Ben', text: 'Very early! I usually wake up at four, and I get ready in ten minutes.', he: 'מוקדם מאוד! בדרך כלל אני מתעורר בארבע, ומתארגן בעשר דקות.' },
        { speaker: 'A', name: 'Host', text: 'Wow. How do you get to the bakery?', he: 'וואו. איך אתה מגיע למאפייה?' },
        { speaker: 'B', name: 'Ben', text: 'I ride my bike. My commute is only fifteen minutes.', he: 'אני רוכב על אופניים. הנסיעה שלי היא רק רבע שעה.' },
        { speaker: 'A', name: 'Host', text: 'And what do you do after work?', he: 'ומה אתה עושה אחרי העבודה?' },
        { speaker: 'B', name: 'Ben', text: 'I finish at one. After that, I sleep for an hour. In the evening, I play with my kids.', he: 'אני מסיים באחת. אחרי זה אני ישן שעה. בערב אני משחק עם הילדים שלי.' },
        { speaker: 'A', name: 'Host', text: 'Do you ever sleep late?', he: 'אתה אי פעם ישן עד מאוחר?' },
        { speaker: 'B', name: 'Ben', text: 'Only on Saturdays. Then I wake up at nine!', he: 'רק בשבתות. אז אני מתעורר בתשע!' },
      ],
      questions: [
        { id: 'q1', q: 'What time does Ben usually wake up?', qHe: 'מתי בן מתעורר בדרך כלל?', options: ['At 4:00', 'At 9:00', 'At 1:00'], answer: 0, explainHe: '"I usually wake up at four" – בארבע. בתשע הוא מתעורר רק בשבת.' },
        { id: 'q2', q: 'How does he get to work?', qHe: 'איך הוא מגיע לעבודה?', options: ['By bus', 'By bike', 'On foot'], answer: 1, explainHe: '"I ride my bike" – הוא רוכב על אופניים.' },
        { id: 'q3', q: 'What does he do right after he finishes work?', qHe: 'מה הוא עושה מיד אחרי שהוא מסיים לעבוד?', options: ['He plays with his kids', 'He goes to the gym', 'He sleeps for an hour'], answer: 2, explainHe: '"After that, I sleep for an hour" – הוא ישן שעה. עם הילדים הוא משחק בערב.' },
      ],
    },
    vocabUse: [
      { term: 'usually', promptHe: 'ספר/י משהו שאת/ה עושה בדרך כלל בבוקר, עם המילה usually.' },
      { term: 'after that', promptHe: 'תאר/י שתי פעולות ברצף וחבר/י ביניהן עם after that.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'What does a normal morning look like for you?', promptHe: 'תאר/י בוקר רגיל שלך – לפחות שתי פעולות.', hintEn: 'I usually wake up at… Then I… After that, I…', model: 'I usually wake up at seven. I have coffee, and after that I take my kids to school.', keywords: ['wake up', 'usually', 'then', 'after that', 'breakfast', 'coffee'] },
      { id: 's2', promptEn: 'How do you get to work or school?', promptHe: 'איך את/ה מגיע/ה לעבודה או ללימודים, וכמה זמן זה לוקח?', hintEn: 'I take the train. It takes about…', model: 'I drive to work. It takes about half an hour, but with traffic it\'s longer.', keywords: ['take', 'drive', 'bus', 'train', 'walk', 'minutes', 'commute'] },
      { id: 's3', promptEn: 'And what do you like to do in the evening?', promptHe: 'מה את/ה אוהב/ת לעשות בערב?', hintEn: 'In the evening, I like to…', model: 'In the evening, I like to cook dinner and watch a series with my partner.', keywords: ['evening', 'like', 'watch', 'cook', 'read', 'relax'] },
    ],
  },

  'a2-restaurant': {
    id: 'a2-restaurant',
    level: 'A2',
    title: 'At the restaurant',
    titleHe: 'במסעדה',
    goalHe: 'תלמד/י להזמין שולחן, לבקש המלצה, לבקש שינוי במנה ולהתלונן בנימוס כשמשהו לא בסדר.',
    vocab: [
      { term: 'a table for two', he: 'שולחן לשניים', example: 'Hi, do you have a table for two?', exampleHe: 'היי, יש לכם שולחן לשניים?' },
      { term: 'What do you recommend?', he: 'מה אתה ממליץ?', example: 'Everything looks great. What do you recommend?', exampleHe: 'הכול נראה מעולה. מה אתה ממליץ?' },
      { term: 'I\'ll have…', he: 'אני אקח…', example: 'I\'ll have the salmon, please.', exampleHe: 'אני אקח את הסלמון, בבקשה.' },
      { term: 'without', he: 'בלי', example: 'Can I get the salad without onions?', exampleHe: 'אפשר את הסלט בלי בצל?' },
      { term: 'I\'m allergic to…', he: 'אני אלרגי/ת ל…', example: 'I\'m allergic to nuts.', exampleHe: 'אני אלרגי/ת לאגוזים.' },
      { term: 'the check / the bill', he: 'החשבון', example: 'Could we have the check, please?', exampleHe: 'אפשר לקבל את החשבון, בבקשה?' },
    ],
    listening: {
      titleHe: 'ארוחת ערב בניו יורק – משהו לא בסדר עם המנה',
      lines: [
        { speaker: 'A', name: 'Waiter', text: 'Good evening. Are you ready to order?', he: 'ערב טוב. אתם מוכנים להזמין?' },
        { speaker: 'B', name: 'Noa', text: 'Almost. What do you recommend?', he: 'כמעט. מה אתה ממליץ?' },
        { speaker: 'A', name: 'Waiter', text: 'The pasta with mushrooms is very popular tonight.', he: 'הפסטה עם הפטריות מאוד פופולרית הערב.' },
        { speaker: 'B', name: 'Noa', text: 'Great, I\'ll have the pasta. Does it have nuts? I\'m allergic to nuts.', he: 'מעולה, אני אקח את הפסטה. יש בה אגוזים? אני אלרגית לאגוזים.' },
        { speaker: 'A', name: 'Waiter', text: 'It comes with pine nuts, but we can make it without them.', he: 'היא מגיעה עם צנוברים, אבל אפשר להכין בלעדיהם.' },
        { speaker: 'B', name: 'Noa', text: 'Yes, without nuts, please.', he: 'כן, בלי אגוזים, בבקשה.' },
        { speaker: 'A', name: 'Waiter', text: 'Here\'s your pasta.', he: 'הנה הפסטה שלך.' },
        { speaker: 'B', name: 'Noa', text: 'Excuse me, I\'m sorry, but I think there are nuts in this.', he: 'סליחה, אני מצטערת, אבל נראה לי שיש בזה אגוזים.' },
        { speaker: 'A', name: 'Waiter', text: 'Oh, I\'m so sorry! I\'ll bring you a new one right away.', he: 'אוי, אני מאוד מצטער! אביא לך חדשה מיד.' },
      ],
      questions: [
        { id: 'q1', q: 'What does the waiter recommend?', qHe: 'מה המלצר ממליץ?', options: ['The salmon', 'The mushroom pasta', 'The salad'], answer: 1, explainHe: '"The pasta with mushrooms is very popular" – הפסטה עם הפטריות.' },
        { id: 'q2', q: 'Why does Noa ask about nuts?', qHe: 'למה נועה שואלת על אגוזים?', options: ['She is allergic', 'She loves nuts', 'She is a vegetarian'], answer: 0, explainHe: '"I\'m allergic to nuts" – היא אלרגית.' },
        { id: 'q3', q: 'What is the problem when the food arrives?', qHe: 'מה הבעיה כשהאוכל מגיע?', options: ['It\'s cold', 'It\'s the wrong dish', 'It has nuts'], answer: 2, explainHe: '"I think there are nuts in this" – יש במנה אגוזים למרות הבקשה.' },
      ],
    },
    vocabUse: [
      { term: 'without', promptHe: 'הזמינ/י מנה שאת/ה אוהב/ת ובקש/י אותה בלי משהו.' },
      { term: 'What do you recommend?', promptHe: 'בקש/י המלצה – על מנה, קינוח או יין – במשפט שלם.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'Hi, welcome! Do you have a reservation?', promptHe: 'אין לך הזמנה. בקש/י שולחן לכמה אנשים.', hintEn: 'No, we don\'t. Do you have a table for…?', model: 'No, we don\'t. Do you have a table for three?', keywords: ['table', 'for', 'reservation', 'no'] },
      { id: 's2', promptEn: 'Are you ready to order?', promptHe: 'הזמינ/י מנה ובקש/י שינוי אחד (בלי משהו / בצד).', hintEn: 'I\'ll have the… without…, please.', model: 'Yes, I\'ll have the chicken salad, but without onions, please.', keywords: ['i\'ll have', 'without', 'please', 'i would like', 'i\'d like'] },
      { id: 's3', promptEn: 'Here\'s your soup. Enjoy!', promptHe: 'המרק קר. התלונ/י בנימוס ובקש/י פתרון.', hintEn: 'Excuse me, I\'m sorry, but my soup is cold. Could you…?', model: 'Excuse me, sorry, but my soup is a bit cold. Could you warm it up, please?', keywords: ['excuse me', 'sorry', 'cold', 'could you', 'please'] },
    ],
  },

  'b1-hotel': {
    id: 'b1-hotel',
    level: 'B1',
    title: 'There\'s a problem with my room',
    titleHe: 'בעיה במלון',
    goalHe: 'תתרגל/י להסביר בעיה בצורה ברורה ומנומסת, להציע פתרון ולהגיע להסכמה – מיומנות קריטית בטיול.',
    vocab: [
      { term: 'check in', he: 'לעשות צ\'ק־אין', example: 'We\'d like to check in, please. We have a booking.', exampleHe: 'נרצה לעשות צ\'ק־אין, בבקשה. יש לנו הזמנה.' },
      { term: 'booking / reservation', he: 'הזמנה', example: 'My booking says a double room with a balcony.', exampleHe: 'בהזמנה שלי כתוב חדר זוגי עם מרפסת.' },
      { term: 'I was wondering if…', he: 'רציתי לשאול אם…', example: 'I was wondering if we could change rooms.', exampleHe: 'רציתי לשאול אם נוכל להחליף חדר.' },
      { term: 'doesn\'t work', he: 'לא עובד', example: 'The air conditioning doesn\'t work.', exampleHe: 'המזגן לא עובד.' },
      { term: 'upgrade', he: 'שדרוג', example: 'They gave us a free upgrade to a suite.', exampleHe: 'נתנו לנו שדרוג חינם לסוויטה.' },
      { term: 'make up for', he: 'לפצות על', example: 'To make up for it, breakfast is free tomorrow.', exampleHe: 'כדי לפצות על זה, ארוחת הבוקר מחר בחינם.' },
    ],
    listening: {
      titleHe: 'אורח מתקשר לקבלה של מלון ברומא',
      lines: [
        { speaker: 'A', name: 'Reception', text: 'Good evening, front desk. How can I help you?', he: 'ערב טוב, דלפק הקבלה. איך אוכל לעזור?' },
        { speaker: 'B', name: 'Guest', text: 'Hi, this is room 412. I\'m afraid the air conditioning doesn\'t work, and it\'s really hot in here.', he: 'היי, מדבר מחדר 412. אני חושש שהמזגן לא עובד, וחם פה מאוד.' },
        { speaker: 'A', name: 'Reception', text: 'I\'m sorry to hear that. I can send someone from maintenance, but they won\'t be available until tomorrow morning.', he: 'צר לי לשמוע. אני יכול לשלוח מישהו מהתחזוקה, אבל הם לא יהיו זמינים עד מחר בבוקר.' },
        { speaker: 'B', name: 'Guest', text: 'Tomorrow? I was wondering if we could just change rooms tonight instead.', he: 'מחר? רציתי לשאול אם נוכל פשוט להחליף חדר הלילה במקום.' },
        { speaker: 'A', name: 'Reception', text: 'Let me check… We\'re almost full, but I have a room on the sixth floor. It\'s actually bigger, with a view of the city.', he: 'רגע אבדוק… אנחנו כמעט מלאים, אבל יש לי חדר בקומה השישית. הוא בעצם גדול יותר, עם נוף לעיר.' },
        { speaker: 'B', name: 'Guest', text: 'That sounds perfect. Is there an extra charge?', he: 'נשמע מושלם. יש תוספת תשלום?' },
        { speaker: 'A', name: 'Reception', text: 'No, it\'s a free upgrade. And to make up for the trouble, breakfast is on us tomorrow.', he: 'לא, זה שדרוג חינם. וכדי לפצות על הטרחה, ארוחת הבוקר מחר עלינו.' },
      ],
      questions: [
        { id: 'q1', q: 'What is the guest\'s problem?', qHe: 'מה הבעיה של האורח?', options: ['The room is too noisy', 'The air conditioning is broken', 'The room is too small'], answer: 1, explainHe: '"the air conditioning doesn\'t work" – המזגן לא עובד.' },
        { id: 'q2', q: 'Why doesn\'t the guest accept the first solution?', qHe: 'למה האורח לא מקבל את הפתרון הראשון?', options: ['Maintenance can only come tomorrow', 'It costs too much', 'He wants a refund'], answer: 0, explainHe: 'אנשי התחזוקה זמינים רק מחר בבוקר ("not available until tomorrow morning").' },
        { id: 'q3', q: 'What does the hotel give him to make up for the trouble?', qHe: 'מה המלון נותן לו כפיצוי על הטרחה?', options: ['A discount on the room', 'A free dinner', 'Free breakfast'], answer: 2, explainHe: '"breakfast is on us tomorrow" – "on us" פירושו "עלינו", כלומר בחינם.' },
      ],
    },
    vocabUse: [
      { term: 'I was wondering if…', promptHe: 'בקש/י בקשה מנומסת מצוות מלון (צ\'ק־אאוט מאוחר, מגבות, חדר שקט) עם I was wondering if.' },
      { term: 'doesn\'t work', promptHe: 'תאר/י משהו שלא עובד בחדר – ומה ההשפעה עליך.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'Good evening, front desk. How can I help you?', promptHe: 'הסבר/י בעיה בחדר שלך (בחר/י בעיה) – בנימוס ובבירור.', hintEn: 'Hi, I\'m in room… I\'m afraid the … doesn\'t work.', model: 'Hi, I\'m in room 208. I\'m afraid the shower doesn\'t work – there\'s no hot water.', keywords: ['room', 'doesn\'t work', 'problem', 'broken', 'afraid', 'there\'s no', 'not working'] },
      { id: 's2', promptEn: 'I\'m sorry. Someone can fix it tomorrow afternoon.', promptHe: 'זה לא מספיק טוב בשבילך. הצע/י פתרון אחר בנימוס.', hintEn: 'I was wondering if we could… instead.', model: 'Tomorrow afternoon is a bit late. I was wondering if we could move to another room tonight.', keywords: ['wondering', 'could', 'another room', 'change', 'instead', 'tonight', 'move'] },
      { id: 's3', promptEn: 'We can move you, but the only free room is smaller. Is that OK?', promptHe: 'החליט/י – להסכים או לא – ונמק/י. אפשר לבקש פיצוי.', hintEn: 'That\'s fine, as long as… / Could you make up for it by…?', model: 'That\'s OK, as long as it\'s quiet. Could you maybe include breakfast to make up for it?', keywords: ['ok', 'fine', 'as long as', 'make up', 'breakfast', 'because', 'but'] },
    ],
  },

  'b1-story': {
    id: 'b1-story',
    level: 'B1',
    title: 'A trip I\'ll never forget',
    titleHe: 'טיול שלא אשכח',
    goalHe: 'תספר/י חוויה בזמן עבר: מה קרה, באיזה סדר, ואיך הרגשת – עם מילות קישור שהופכות סיפור לזורם.',
    vocab: [
      { term: 'at first', he: 'בהתחלה', example: 'At first, I was nervous, but then I relaxed.', exampleHe: 'בהתחלה הייתי לחוץ/ה, אבל אז נרגעתי.' },
      { term: 'suddenly', he: 'פתאום', example: 'Suddenly, it started to rain.', exampleHe: 'פתאום התחיל לרדת גשם.' },
      { term: 'it turned out that', he: 'התברר ש…', example: 'It turned out that the museum was closed.', exampleHe: 'התברר שהמוזיאון היה סגור.' },
      { term: 'get lost', he: 'ללכת לאיבוד', example: 'We got lost in the old city.', exampleHe: 'הלכנו לאיבוד בעיר העתיקה.' },
      { term: 'in the end', he: 'בסוף', example: 'In the end, it was the best day of the trip.', exampleHe: 'בסוף זה היה היום הכי טוב בטיול.' },
      { term: 'I\'ll never forget', he: 'לעולם לא אשכח', example: 'I\'ll never forget the view from the top.', exampleHe: 'לעולם לא אשכח את הנוף מהפסגה.' },
    ],
    listening: {
      titleHe: 'יעל מספרת לחבר על טיול בפורטוגל',
      lines: [
        { speaker: 'A', name: 'Yael', text: 'Did I ever tell you about the time we got lost in Lisbon?', he: 'סיפרתי לך פעם על הפעם שהלכנו לאיבוד בליסבון?' },
        { speaker: 'B', name: 'Sam', text: 'No! What happened?', he: 'לא! מה קרה?' },
        { speaker: 'A', name: 'Yael', text: 'So, we wanted to find a famous restaurant, but my phone died. At first, we thought it was funny.', he: 'אז, רצינו למצוא מסעדה מפורסמת, אבל הטלפון שלי נכבה. בהתחלה חשבנו שזה מצחיק.' },
        { speaker: 'B', name: 'Sam', text: 'And then?', he: 'ואז?' },
        { speaker: 'A', name: 'Yael', text: 'Then it got dark, and suddenly it started to rain really hard. We were completely lost.', he: 'ואז החשיך, ופתאום התחיל לרדת גשם חזק מאוד. היינו אבודים לגמרי.' },
        { speaker: 'A', name: 'Yael', text: 'We went into a tiny bar to wait, and it turned out that the owner\'s grandmother cooked dinner there every night.', he: 'נכנסנו לבר קטנטן לחכות, והתברר שסבתא של הבעלים מבשלת שם ארוחת ערב כל ערב.' },
        { speaker: 'B', name: 'Sam', text: 'No way!', he: 'מה אתה אומר!' },
        { speaker: 'A', name: 'Yael', text: 'In the end, it was the best meal of the whole trip. I\'ll never forget it.', he: 'בסוף זו הייתה הארוחה הכי טובה בכל הטיול. לעולם לא אשכח את זה.' },
      ],
      questions: [
        { id: 'q1', q: 'Why did they get lost?', qHe: 'למה הם הלכו לאיבוד?', options: ['They took the wrong bus', 'Yael\'s phone died', 'They had no map'], answer: 1, explainHe: '"my phone died" – הסוללה נגמרה, ולכן לא היה ניווט.' },
        { id: 'q2', q: 'How did they feel at first?', qHe: 'איך הם הרגישו בהתחלה?', options: ['They thought it was funny', 'They were scared', 'They were angry'], answer: 0, explainHe: '"At first, we thought it was funny" – בהתחלה זה הצחיק אותם.' },
        { id: 'q3', q: 'What was surprising about the bar?', qHe: 'מה היה מפתיע בבר?', options: ['It was very expensive', 'A famous chef worked there', 'The owner\'s grandmother cooked dinner there'], answer: 2, explainHe: '"it turned out that the owner\'s grandmother cooked dinner there" – הסבתא בישלה.' },
      ],
    },
    vocabUse: [
      { term: 'suddenly', promptHe: 'ספר/י רגע מפתיע מטיול או מהחיים, עם suddenly.' },
      { term: 'it turned out that', promptHe: 'ספר/י על משהו שחשבת, ואז התברר שהמצב שונה.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'Tell me about a trip you really enjoyed. Where did you go, and who were you with?', promptHe: 'פתח/י סיפור על טיול: לאן, מתי ועם מי (בזמן עבר).', hintEn: 'A few years ago, I went to… with…', model: 'Two years ago, I went to Greece with my best friend. We stayed on a small island.', keywords: ['went', 'was', 'were', 'ago', 'last', 'with', 'visited', 'stayed'] },
      { id: 's2', promptEn: 'Did anything unexpected happen?', promptHe: 'ספר/י על משהו לא צפוי שקרה – עם suddenly / it turned out that.', hintEn: 'Suddenly… / It turned out that…', model: 'Yes! Suddenly, our ferry was cancelled, so we had to stay another night. It turned out to be amazing.', keywords: ['suddenly', 'turned out', 'happened', 'but', 'so', 'had to', 'then'] },
      { id: 's3', promptEn: 'How did you feel about it in the end?', promptHe: 'סכמ/י: איך הרגשת בסוף ולמה תזכור/י את זה.', hintEn: 'In the end… I\'ll never forget…', model: 'In the end, I was really happy it happened. I\'ll never forget that night on the beach.', keywords: ['in the end', 'felt', 'forget', 'happy', 'because', 'was'] },
    ],
  },

  'b2-meeting': {
    id: 'b2-meeting',
    level: 'B2',
    title: 'Can we push the deadline?',
    titleHe: 'ישיבת עבודה: דחיית דדליין',
    goalHe: 'תתרגל/י שפה מקצועית בישיבה: להציג בעיה, להציע חלופות, להתנגד בעדינות ולהגיע לפשרה.',
    vocab: [
      { term: 'push (back) the deadline', he: 'לדחות את הדדליין', example: 'Is there any chance we could push the deadline back a week?', exampleHe: 'יש סיכוי שנוכל לדחות את הדדליין בשבוע?' },
      { term: 'on track', he: 'בתלם / לפי התוכנית', example: 'The design team is on track for Friday.', exampleHe: 'צוות העיצוב עומד בלוח הזמנים לשישי.' },
      { term: 'I see your point, but…', he: 'אני מבין/ה את הנקודה שלך, אבל…', example: 'I see your point, but the client won\'t be happy.', exampleHe: 'אני מבין/ה את הנקודה, אבל הלקוח לא יהיה מרוצה.' },
      { term: 'What if we…?', he: 'מה אם נ…?', example: 'What if we release a smaller version first?', exampleHe: 'מה אם נשחרר קודם גרסה קטנה יותר?' },
      { term: 'meet halfway', he: 'להיפגש באמצע / להתפשר', example: 'Let\'s meet halfway: three extra days.', exampleHe: 'בואו נתפשר: שלושה ימים נוספים.' },
      { term: 'follow up', he: 'לעקוב / לחזור עם עדכון', example: 'I\'ll follow up with an email after the meeting.', exampleHe: 'אחזור עם מייל מסכם אחרי הישיבה.' },
    ],
    listening: {
      titleHe: 'ישיבת צוות קצרה לפני השקה',
      lines: [
        { speaker: 'A', name: 'Lior', text: 'Before we wrap up, I need to raise something. We\'re not on track for the launch on the 15th.', he: 'לפני שנסכם, אני צריך להעלות משהו. אנחנו לא עומדים בלו"ז להשקה ב־15.' },
        { speaker: 'B', name: 'Karen', text: 'What\'s the main issue?', he: 'מה הבעיה העיקרית?' },
        { speaker: 'A', name: 'Lior', text: 'Testing took longer than expected. Is there any chance we could push the deadline back two weeks?', he: 'הבדיקות לקחו יותר זמן מהצפוי. יש סיכוי שנדחה את הדדליין בשבועיים?' },
        { speaker: 'B', name: 'Karen', text: 'I see your point, but two weeks is a lot. The client has already announced the date.', he: 'אני מבינה את הנקודה, אבל שבועיים זה הרבה. הלקוח כבר הכריז על התאריך.' },
        { speaker: 'A', name: 'Lior', text: 'What if we launch the core features on the 15th and release the reports module a week later?', he: 'מה אם נשיק את הפיצ\'רים המרכזיים ב־15 ונשחרר את מודול הדוחות שבוע אחר כך?' },
        { speaker: 'B', name: 'Karen', text: 'That could work. Let\'s meet halfway – core on the 15th, reports by the 22nd at the latest.', he: 'זה יכול לעבוד. בוא נתפשר – הליבה ב־15, הדוחות עד ה־22 לכל המאוחר.' },
        { speaker: 'A', name: 'Lior', text: 'Great. I\'ll follow up with the client and send everyone a summary today.', he: 'מצוין. אחזור ללקוח ואשלח לכולם סיכום היום.' },
      ],
      questions: [
        { id: 'q1', q: 'Why is the team behind schedule?', qHe: 'למה הצוות בפיגור?', options: ['Testing took longer than expected', 'The client changed the requirements', 'Someone left the team'], answer: 0, explainHe: '"Testing took longer than expected" – הבדיקות התארכו.' },
        { id: 'q2', q: 'Why is Karen against a two-week delay?', qHe: 'למה קרן מתנגדת לדחייה של שבועיים?', options: ['The budget is too small', 'The client already announced the date', 'She is going on vacation'], answer: 1, explainHe: '"The client has already announced the date" – הלקוח כבר פרסם את התאריך.' },
        { id: 'q3', q: 'What do they finally agree on?', qHe: 'על מה הם מסכימים בסוף?', options: ['A two-week delay for everything', 'No changes at all', 'Core features on the 15th, reports by the 22nd'], answer: 2, explainHe: 'פשרה: הליבה ב־15, מודול הדוחות עד ה־22 ("meet halfway").' },
      ],
    },
    vocabUse: [
      { term: 'What if we…?', promptHe: 'הצע/י פתרון לבעיה בעבודה (או בבית) במבנה What if we…?' },
      { term: 'I see your point, but…', promptHe: 'הגב/י לדעה שאת/ה לא מסכים/ה איתה, בעדינות ובנימוק.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'So, is everything on track for the launch next week?', promptHe: 'דווח/י בנימוס שיש עיכוב, הסבר/י למה ובקש/י דחייה.', hintEn: 'Not quite. We\'re running behind because… Is there any chance we could…?', model: 'Not quite, unfortunately. The integration took longer than we expected, so is there any chance we could push the launch back by a week?', keywords: ['behind', 'because', 'push', 'delay', 'chance', 'took longer', 'deadline', 'not quite'] },
      { id: 's2', promptEn: 'A week? That\'s difficult. Our marketing campaign starts on Monday.', promptHe: 'הראה/י הבנה, והצע/י חלופה יצירתית.', hintEn: 'I see your point. What if we…?', model: 'I see your point. What if we launch on Monday with a limited version, and add the remaining features later in the week?', keywords: ['see your point', 'understand', 'what if', 'could', 'instead', 'alternative'] },
      { id: 's3', promptEn: 'OK, that might work. What are the next steps?', promptHe: 'סכמ/י את ההחלטה ואמר/י מה תעשה/י עכשיו.', hintEn: 'So we agreed that… I\'ll follow up…', model: 'Great. So we agreed on a limited launch on Monday. I\'ll follow up with the dev team today and send a summary by email.', keywords: ['agreed', 'follow up', 'i\'ll', 'next', 'send', 'summary', 'today'] },
    ],
  },

  'b2-opinion': {
    id: 'b2-opinion',
    level: 'B2',
    title: 'Is social media good for us?',
    titleHe: 'רשתות חברתיות – בעד ונגד',
    goalHe: 'תביע/י דעה מנומקת, תביא/י דוגמה, תכיר/י בצד השני ותגיב/י לטיעון נגדי – בלי לשמוע תוקפני/ת.',
    vocab: [
      { term: 'on the one hand… on the other hand', he: 'מצד אחד… מצד שני', example: 'On the one hand, it connects people. On the other hand, it can be addictive.', exampleHe: 'מצד אחד זה מחבר אנשים. מצד שני זה יכול להתמכר.' },
      { term: 'to be honest', he: 'למען האמת / בכנות', example: 'To be honest, I spend too much time on my phone.', exampleHe: 'למען האמת, אני מבלה יותר מדי זמן בטלפון.' },
      { term: 'it depends on', he: 'זה תלוי ב…', example: 'It depends on how you use it.', exampleHe: 'זה תלוי איך משתמשים בזה.' },
      { term: 'a good example is', he: 'דוגמה טובה היא', example: 'A good example is how small businesses find customers online.', exampleHe: 'דוגמה טובה היא איך עסקים קטנים מוצאים לקוחות ברשת.' },
      { term: 'I\'m not sure I agree', he: 'אני לא בטוח/ה שאני מסכים/ה', example: 'I\'m not sure I agree. Many teenagers feel lonely online.', exampleHe: 'אני לא בטוח/ה שאני מסכים/ה. הרבה בני נוער מרגישים בודדים ברשת.' },
      { term: 'screen time', he: 'זמן מסך', example: 'I try to limit my screen time in the evening.', exampleHe: 'אני מנסה להגביל את זמן המסך בערב.' },
    ],
    listening: {
      titleHe: 'קטע מתוכנית רדיו: שני מאזינים מתווכחים',
      lines: [
        { speaker: 'A', name: 'Host', text: 'Today\'s question: is social media making us more connected or more lonely? Jonathan, you first.', he: 'השאלה היום: האם הרשתות החברתיות מחברות אותנו יותר או הופכות אותנו בודדים יותר? יונתן, אתה ראשון.' },
        { speaker: 'B', name: 'Jonathan', text: 'To be honest, I think it depends on how you use it. I run a small pottery business, and almost all my customers find me on Instagram.', he: 'בכנות, אני חושב שזה תלוי איך משתמשים בזה. יש לי עסק קטן לקרמיקה, וכמעט כל הלקוחות שלי מוצאים אותי באינסטגרם.' },
        { speaker: 'A', name: 'Host', text: 'And Rachel, you disagree?', he: 'ורחל, את לא מסכימה?' },
        { speaker: 'B', name: 'Rachel', text: 'I see why it works for business, but I\'m not sure I agree in general. I\'m a school counselor, and I see teenagers comparing themselves to others all day.', he: 'אני מבינה למה זה עובד לעסקים, אבל אני לא בטוחה שאני מסכימה באופן כללי. אני יועצת בבית ספר, ואני רואה בני נוער שמשווים את עצמם לאחרים כל היום.' },
        { speaker: 'B', name: 'Rachel', text: 'On the one hand, they\'re always in touch. On the other hand, many of them tell me they feel left out.', he: 'מצד אחד, הם כל הזמן בקשר. מצד שני, הרבה מהם מספרים לי שהם מרגישים מחוץ לעניינים.' },
        { speaker: 'B', name: 'Jonathan', text: 'That\'s a fair point. Maybe the answer is limiting screen time, not deleting the apps.', he: 'זו נקודה הוגנת. אולי הפתרון הוא להגביל זמן מסך, לא למחוק את האפליקציות.' },
      ],
      questions: [
        { id: 'q1', q: 'How does Jonathan use social media?', qHe: 'איך יונתן משתמש ברשתות חברתיות?', options: ['To find customers for his business', 'To keep in touch with family', 'He doesn\'t use it'], answer: 0, explainHe: 'יש לו עסק לקרמיקה, ו"almost all my customers find me on Instagram".' },
        { id: 'q2', q: 'What worries Rachel?', qHe: 'מה מדאיג את רחל?', options: ['Fake news', 'Teenagers comparing themselves and feeling left out', 'Online shopping'], answer: 1, explainHe: 'היא רואה בני נוער ש"comparing themselves to others" ו"feel left out".' },
        { id: 'q3', q: 'What does Jonathan suggest at the end?', qHe: 'מה יונתן מציע בסוף?', options: ['Deleting the apps', 'Banning phones in schools', 'Limiting screen time'], answer: 2, explainHe: '"Maybe the answer is limiting screen time, not deleting the apps".' },
      ],
    },
    vocabUse: [
      { term: 'it depends on', promptHe: 'עני/ה על השאלה "Is working from home better?" עם it depends on.' },
      { term: 'on the one hand… on the other hand', promptHe: 'הצג/י שני צדדים של נושא שמעניין אותך.' },
    ],
    speaking: [
      { id: 's1', promptEn: 'Do you think social media has a positive or negative effect on people? Why?', promptHe: 'הבע/י דעה ונמק/י אותה בלפחות סיבה אחת.', hintEn: 'Personally, I think… because…', model: 'Personally, I think it\'s mostly positive, because it helps people find communities and opportunities they wouldn\'t find otherwise.', keywords: ['think', 'because', 'positive', 'negative', 'personally', 'believe', 'in my opinion'] },
      { id: 's2', promptEn: 'Can you give me a concrete example from your life or from someone you know?', promptHe: 'תן/י דוגמה ממשית שתומכת בדעה שלך.', hintEn: 'A good example is… / For instance, my…', model: 'A good example is my sister. She found her current job through a LinkedIn post.', keywords: ['example', 'for instance', 'my', 'friend', 'once', 'when'] },
      { id: 's3', promptEn: 'Some people say it makes us lonelier. What would you say to them?', promptHe: 'הגב/י לטיעון הנגדי: הכר/י בו, ואז הסבר/י את עמדתך.', hintEn: 'I see their point, but… / That\'s true to some extent, however…', model: 'I see their point, especially with teenagers. However, I think it depends on how you use it – the problem is endless scrolling, not the platforms themselves.', keywords: ['see', 'point', 'but', 'however', 'depends', 'true', 'although'] },
    ],
  },
};

export function stageOfLesson(lessonId) {
  for (const st of STAGES) for (const u of st.units) if (u.lessons.includes(lessonId)) return { stage: st, unit: u };
  return null;
}

export const ALL_LESSON_IDS = STAGES.flatMap((s) => s.units.flatMap((u) => u.lessons));
