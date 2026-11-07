import nodemailer from 'nodemailer';

let transport = null;
export const emailEnabled = () => !!process.env.SMTP_HOST;

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

export async function sendResetEmail(to, link) {
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || 'English Coach <no-reply@example.com>',
    to,
    subject: 'איפוס סיסמה – English Coach',
    text: `שלום,\n\nכדי לבחור סיסמה חדשה, היכנסו לקישור (בתוקף לשעה):\n${link}\n\nאם לא ביקשתם איפוס, אפשר להתעלם מההודעה.`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px">
      <p>שלום,</p><p>כדי לבחור סיסמה חדשה, לחצו על הקישור (בתוקף לשעה):</p>
      <p><a href="${link}">איפוס סיסמה</a></p>
      <p style="color:#666">אם לא ביקשתם איפוס, אפשר להתעלם מההודעה.</p></div>`,
  });
}
