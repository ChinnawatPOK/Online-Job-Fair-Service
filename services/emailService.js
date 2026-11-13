const User = require('../models/User');
const Company = require('../models/Company');
const templates = require('./emailTemplates');

const MAILTRAP_SEND_URL = 'https://sandbox.api.mailtrap.io/api/send';
const SEND_TIMEOUT_MS = 2000;

const sendEmail = async ({ to, subject, text, html }) => {
    const { MAILTRAP_API_TOKEN, MAILTRAP_INBOX_ID, MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;

    if (!MAILTRAP_API_TOKEN || !MAILTRAP_INBOX_ID) {
        console.log(`Email skipped (Mailtrap is not configured): ${subject} -> ${to}`);
        return false;
    }

    try {
        const res = await fetch(`${MAILTRAP_SEND_URL}/${MAILTRAP_INBOX_ID}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${MAILTRAP_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: { email: MAIL_FROM_EMAIL || 'no-reply@jobfair.com', name: MAIL_FROM_NAME || 'Online Job Fair' },
                to: [{ email: to }],
                subject,
                text,
                html,
                category: 'Booking Notification'
            }),
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
        });

        if (!res.ok) {
            console.log(`Email to ${to} failed: ${res.status} ${await res.text()}`);
            return false;
        }
        return true;
    } catch (err) {
        console.log(`Email to ${to} failed: ${err.message}`);
        return false;
    }
};

exports.sendEmail = sendEmail;

exports.notifyBookingCreated = async (user, booking) => {
    try {
        const company = await Company.findById(booking.company_id);
        return await sendEmail({ to: user.email, ...templates.bookingCreated({ user, booking, company }) });
    } catch (err) {
        console.log(`Email failed: ${err.message}`);
        return false;
    }
};

exports.notifyBookingUpdatedByAdmin = async (before, after) => {
    try {
        const owner = await User.findById(after.user_id);
        if (!owner) return false;

        const [beforeCompany, afterCompany] = await Promise.all([
            Company.findById(before.company_id),
            Company.findById(after.company_id)
        ]);
        return await sendEmail({
            to: owner.email,
            ...templates.bookingUpdatedByAdmin({ owner, before, after, beforeCompany, afterCompany })
        });
    } catch (err) {
        console.log(`Email failed: ${err.message}`);
        return false;
    }
};

exports.notifyBookingDeletedByAdmin = async (booking) => {
    try {
        const owner = await User.findById(booking.user_id);
        if (!owner) return false;

        const company = await Company.findById(booking.company_id);
        return await sendEmail({ to: owner.email, ...templates.bookingDeletedByAdmin({ owner, booking, company }) });
    } catch (err) {
        console.log(`Email failed: ${err.message}`);
        return false;
    }
};
