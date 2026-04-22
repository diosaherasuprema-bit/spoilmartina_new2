const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Martina Collection <noreply@resend.dev>';

const RARITY_EMOJI = {
  common: '⚪',
  rare: '🔵',
  epic: '🟣',
  legendary: '⭐',
};

async function sendPackConfirmation(toEmail, packCards, packNumber) {
  if (!process.env.RESEND_API_KEY) return;

  const cardsList = packCards.map(c =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1a0828;">${RARITY_EMOJI[c.rarity]}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a0828;color:${rarityColor(c.rarity)};font-weight:bold;text-transform:uppercase;letter-spacing:.05em;font-size:12px;">${c.rarity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1a0828;color:#fce4ef;">${c.name}</td>
    </tr>`
  ).join('');

  const hasLegendary = packCards.some(c => c.rarity === 'legendary');
  const hasEpic = packCards.some(c => c.rarity === 'epic');

  const headline = hasLegendary
    ? '⭐ LEGENDARY PULL! You got something special.'
    : hasEpic
    ? '🟣 Epic pull! Not bad at all.'
    : '📦 Your pack has been opened.';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;padding:0;background:#04020a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#04020a;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0f060c;border:1px solid rgba(232,69,122,.2);border-radius:8px;overflow:hidden;max-width:520px;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#2a0838,#5a1068);padding:32px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">🦂</div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:.08em;color:#fce4ef;text-transform:uppercase;">MARTINA COLLECTION</div>
            <div style="font-size:11px;letter-spacing:.3em;color:rgba(232,69,122,.7);margin-top:4px;text-transform:uppercase;">Season 01 · Pack #${packNumber || '?'}</div>
          </td>
        </tr>

        <!-- HEADLINE -->
        <tr>
          <td style="padding:28px 32px 16px;text-align:center;">
            <div style="font-size:15px;color:#fce4ef;font-weight:600;">${headline}</div>
            <div style="font-size:12px;color:rgba(232,69,122,.6);margin-top:8px;letter-spacing:.1em;">Here are your 5 cards:</div>
          </td>
        </tr>

        <!-- CARDS TABLE -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1a0828;border-radius:6px;overflow:hidden;">
              <tr style="background:#150828;">
                <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:.2em;color:rgba(232,69,122,.5);text-transform:uppercase;font-weight:400;">Type</th>
                <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:.2em;color:rgba(232,69,122,.5);text-transform:uppercase;font-weight:400;">Rarity</th>
                <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:.2em;color:rgba(232,69,122,.5);text-transform:uppercase;font-weight:400;">Card</th>
              </tr>
              ${cardsList}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <a href="${process.env.APP_URL}/album" style="display:inline-block;padding:14px 36px;background:#e8457a;color:#04020a;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border-radius:2px;">View my album →</a>
            <div style="margin-top:20px;">
              <a href="${process.env.APP_URL}" style="font-size:11px;color:rgba(232,69,122,.5);text-decoration:none;letter-spacing:.15em;">🦂 Open another pack</a>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1a0828;text-align:center;">
            <div style="font-size:10px;color:rgba(252,228,239,.2);letter-spacing:.15em;">Martina Collection · Season 01 · @spoilMartina</div>
            <div style="font-size:10px;color:rgba(252,228,239,.15);margin-top:4px;">Your money exists to make me happy. 🦂</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: toEmail,
      subject: `🦂 Pack #${packNumber || '?'} opened — Martina Collection`,
      html,
    });
    console.log(`Email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email error:', err);
  }
}

function rarityColor(rarity) {
  const colors = { common: '#a0b0c0', rare: '#4090ff', epic: '#c060ff', legendary: '#f0c040' };
  return colors[rarity] || '#fce4ef';
}

module.exports = { sendPackConfirmation };
