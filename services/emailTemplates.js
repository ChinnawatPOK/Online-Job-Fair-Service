const EVENT_NAME = 'Online Job Fair 2022';
const BRAND_COLOR = '#1d4ed8';

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// '2022-05-10' -> 'Tuesday, 10 May 2022'
const formatDate = (date) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
        timeZone: 'UTC',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

const companyLabel = (company) => (company ? company.name : 'Unknown company');

const detailRows = (rows) =>
    rows
        .filter(([, value]) => value)
        .map(([label, value]) => `
            <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
            </tr>`)
        .join('');

const detailCard = (title, rows, accent = BRAND_COLOR) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:20px 0;border:1px solid #e5e7eb;border-left:4px solid ${accent};border-radius:6px;">
        <tr><td style="padding:16px 20px;">
            <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${accent};font-weight:700;margin-bottom:4px;">${escapeHtml(title)}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows(rows)}</table>
        </td></tr>
    </table>`;

const layout = ({ preheader, heading, badge, badgeColor, body }) => `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
        <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
                <tr><td style="background:${BRAND_COLOR};padding:20px 32px;color:#ffffff;font-size:20px;font-weight:700;">
                    ${EVENT_NAME}
                    <div style="font-size:13px;font-weight:400;opacity:0.85;margin-top:2px;">10 &ndash; 13 May 2022 &middot; Interview Sessions</div>
                </td></tr>
                <tr><td style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
                    <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${badgeColor}1a;color:${badgeColor};font-size:12px;font-weight:700;">${escapeHtml(badge)}</span>
                    <h1 style="margin:12px 0 16px;font-size:22px;color:#111827;">${escapeHtml(heading)}</h1>
                    ${body}
                    <p style="margin:24px 0 0;">Best regards,<br><strong>${EVENT_NAME} Team</strong></p>
                </td></tr>
                <tr><td style="padding:20px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;line-height:1.5;border-top:1px solid #e5e7eb;">
                    This is an automated message, please do not reply to this email.<br>
                    You are receiving it because you registered for ${EVENT_NAME}.
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

const textFooter = `\n\nBest regards,\n${EVENT_NAME} Team\n\n--\nThis is an automated message, please do not reply to this email.`;

exports.bookingCreated = ({ user, booking, company }) => {
    const rows = [
        ['Booking ID', `#${booking.id}`],
        ['Company', companyLabel(company)],
        ['Date', formatDate(booking.booking_date)],
        ['Address', company && company.address],
        ['Contact', company && company.tel],
        ['Website', company && company.website]
    ];

    return {
        subject: `Booking confirmed: ${companyLabel(company)} on ${formatDate(booking.booking_date)}`,
        html: layout({
            preheader: `Your interview session with ${companyLabel(company)} is confirmed.`,
            heading: 'Your interview session is confirmed',
            badge: 'CONFIRMED',
            badgeColor: '#16a34a',
            body: `
                <p style="margin:0;">Hi ${escapeHtml(user.name)},</p>
                <p>Thank you for booking an interview session at ${EVENT_NAME}. Here are your booking details:</p>
                ${detailCard('Booking details', rows, '#16a34a')}
                <p style="margin:0;">Please arrive 10 minutes early and bring a copy of your resume.
                You can view, change or cancel your bookings anytime in your account (up to 3 sessions).</p>`
        }),
        text: `Hi ${user.name},\n\nThank you for booking an interview session at ${EVENT_NAME}.\n\n` +
            rows.filter(([, v]) => v).map(([label, v]) => `${label}: ${v}`).join('\n') +
            '\n\nPlease arrive 10 minutes early and bring a copy of your resume.' + textFooter
    };
};

exports.bookingUpdatedByAdmin = ({ owner, before, after, beforeCompany, afterCompany }) => {
    const beforeRows = [['Company', companyLabel(beforeCompany)], ['Date', formatDate(before.booking_date)]];
    const afterRows = [
        ['Company', companyLabel(afterCompany)],
        ['Date', formatDate(after.booking_date)],
        ['Address', afterCompany && afterCompany.address],
        ['Contact', afterCompany && afterCompany.tel]
    ];

    return {
        subject: `Your booking #${after.id} has been updated`,
        html: layout({
            preheader: `Your interview session is now with ${companyLabel(afterCompany)} on ${formatDate(after.booking_date)}.`,
            heading: 'Your interview session has been updated',
            badge: 'UPDATED',
            badgeColor: '#d97706',
            body: `
                <p style="margin:0;">Hi ${escapeHtml(owner.name)},</p>
                <p>An administrator has made a change to your booking <strong>#${after.id}</strong>.</p>
                ${detailCard('Previous', beforeRows, '#9ca3af')}
                ${detailCard('New schedule', afterRows, '#d97706')}
                <p style="margin:0;">If this change doesn't work for you, you can update or cancel the booking in your account.</p>`
        }),
        text: `Hi ${owner.name},\n\nAn administrator has made a change to your booking #${after.id}.\n\n` +
            `Previous: ${companyLabel(beforeCompany)} on ${formatDate(before.booking_date)}\n` +
            `New:      ${companyLabel(afterCompany)} on ${formatDate(after.booking_date)}\n\n` +
            "If this change doesn't work for you, you can update or cancel the booking in your account." + textFooter
    };
};

exports.bookingDeletedByAdmin = ({ owner, booking, company }) => {
    const rows = [
        ['Booking ID', `#${booking.id}`],
        ['Company', companyLabel(company)],
        ['Date', formatDate(booking.booking_date)]
    ];

    return {
        subject: `Your booking #${booking.id} has been cancelled`,
        html: layout({
            preheader: `Your interview session with ${companyLabel(company)} has been cancelled.`,
            heading: 'Your interview session has been cancelled',
            badge: 'CANCELLED',
            badgeColor: '#dc2626',
            body: `
                <p style="margin:0;">Hi ${escapeHtml(owner.name)},</p>
                <p>We're sorry to let you know that an administrator has cancelled the following booking:</p>
                ${detailCard('Cancelled booking', rows, '#dc2626')}
                <p style="margin:0;">This frees up one of your 3 booking slots, so you're welcome to book another session
                between 10 and 13 May 2022.</p>`
        }),
        text: `Hi ${owner.name},\n\nWe're sorry to let you know that an administrator has cancelled the following booking:\n\n` +
            rows.map(([label, v]) => `${label}: ${v}`).join('\n') +
            '\n\nThis frees up one of your 3 booking slots, so you are welcome to book another session between 10 and 13 May 2022.' +
            textFooter
    };
};
