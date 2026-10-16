import nodemailer from "nodemailer";

/**
 * Creates and caches the Nodemailer transporter based on environment variables.
 */
let transporter = null;
let lastConfigHash = "";

const getTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const secure = process.env.EMAIL_SECURE === "true" || port === 465;

    if (!host || !user || !pass) {
        // Return null if unconfigured; sendEmail will log gracefully in development mode
        return null;
    }

    const currentHash = `${host}:${port}:${user}:${secure}`;
    if (transporter && lastConfigHash === currentHash) {
        return transporter;
    }

    lastConfigHash = currentHash;
    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });

    return transporter;
};

/**
 * Low-level email sender that never throws uncaught exceptions or interrupts the caller.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        if (!to) {
            console.warn("[EmailService] No recipient email specified, skipping delivery.");
            return { success: false, reason: "No recipient" };
        }

        const client = getTransporter();
        const fromAddress = process.env.EMAIL_FROM || '"Career Connect" <notifications@careerconnect.com>';

        if (!client) {
            // Safe development fallback: Log email details without exposing credentials
            console.log(
                `[EmailService: Simulated Delivery] To: ${to} | Subject: "${subject}"`
            );
            return {
                success: true,
                simulated: true,
                message: "Email simulated (configure EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env for live SMTP delivery)",
            };
        }

        const info = await client.sendMail({
            from: fromAddress,
            to,
            subject,
            text,
            html,
        });

        console.log(`[EmailService] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        // Log error safely without exposing raw credentials or tokens
        console.error(`[EmailService Error] Failed to send email to ${to}: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// ─── EMAIL HTML TEMPLATE BUILDER ───────────────────────────────────────────

const baseEmailTemplate = ({ title, preheader, content, actionButton = null }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #6A38C2 0%, #4F46E5 100%); padding: 28px 32px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px; }
        .details-box { background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #64748b; }
        .detail-value { font-weight: 600; color: #0f172a; text-align: right; }
        .instructions-box { background-color: #f5f3ff; border-left: 4px solid #6A38C2; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #4338ca; }
        .btn-container { text-align: center; margin: 28px 0 10px 0; }
        .btn { display: inline-block; padding: 12px 28px; background-color: #6A38C2; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(106, 56, 194, 0.25); }
        .footer { padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${preheader || title}
      </div>
      <div class="wrapper">
        <div class="header">
          <h1>Career<span style="color:#fb7185;">-Connect</span></h1>
          <p>${title}</p>
        </div>
        <div class="body">
          ${content}
          ${actionButton ? `
            <div class="btn-container">
              <a href="${actionButton.url}" class="btn" target="_blank">${actionButton.text}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Career Connect. All rights reserved.</p>
          <p>This is an automated notification regarding your job application interview.</p>
        </div>
      </div>
    </body>
    </html>
    `;
};

// ─── HIGH-LEVEL NOTIFICATION EMAIL GENERATORS ──────────────────────────────

export const sendInterviewInvitationEmail = async ({ candidate, recruiter, job, interview }) => {
    const formattedDate = new Date(interview.scheduledDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const isOnline = interview.interviewType === "Online";
    const subject = `Interview Invitation: ${job.title} (${interview.round} Round)`;

    const content = `
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${candidate.fullname}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Congratulations! You have been invited to an interview for the <strong>${job.title}</strong> role by <strong>${recruiter.fullname}</strong>.
      </p>
      <div class="details-box">
        <div class="detail-row"><span class="detail-label">Interview Round</span><span class="detail-value">Round ${interview.roundNumber}: ${interview.round}</span></div>
        <div class="detail-row"><span class="detail-label">Date & Time</span><span class="detail-value">${formattedDate}</span></div>
        <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${interview.duration} Minutes</span></div>
        <div class="detail-row"><span class="detail-label">Format</span><span class="detail-value">${interview.interviewType}</span></div>
        ${isOnline && interview.meetingUrl ? `<div class="detail-row"><span class="detail-label">Meeting URL</span><span class="detail-value"><a href="${interview.meetingUrl}" style="color:#6A38C2;">Join Link</a></span></div>` : ''}
        ${!isOnline && interview.venue ? `<div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${interview.venue}</span></div>` : ''}
      </div>
      ${interview.instructions ? `
        <div class="instructions-box">
          <strong>Instructions from Recruiter:</strong><br/>
          ${interview.instructions}
        </div>
      ` : ''}
      <p style="font-size: 13px; color: #64748b;">
        Please log in to your Career Connect candidate dashboard to confirm your attendance or request an alternative time if necessary.
      </p>
    `;

    const actionButton = isOnline && interview.meetingUrl
        ? { text: "Join Meeting", url: interview.meetingUrl }
        : { text: "View in Dashboard", url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/interviews` };

    return await sendEmail({
        to: candidate.email,
        subject,
        html: baseEmailTemplate({ title: "Interview Invitation", preheader: subject, content, actionButton }),
        text: `Interview Invitation for ${job.title} on ${formattedDate}. Format: ${interview.interviewType}. Round: ${interview.round}.`,
    });
};

export const sendInterviewConfirmedEmail = async ({ recruiter, candidate, job, interview }) => {
    const formattedDate = new Date(interview.scheduledDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const subject = `Interview Confirmed: ${candidate.fullname} for ${job.title}`;
    const content = `
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${recruiter.fullname}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Candidate <strong>${candidate.fullname}</strong> has confirmed attendance for their upcoming interview.
      </p>
      <div class="details-box">
        <div class="detail-row"><span class="detail-label">Candidate</span><span class="detail-value">${candidate.fullname} (${candidate.email})</span></div>
        <div class="detail-row"><span class="detail-label">Role</span><span class="detail-value">${job.title}</span></div>
        <div class="detail-row"><span class="detail-label">Round</span><span class="detail-value">${interview.round}</span></div>
        <div class="detail-row"><span class="detail-label">Date & Time</span><span class="detail-value">${formattedDate}</span></div>
        <div class="detail-row"><span class="detail-label">Format</span><span class="detail-value">${interview.interviewType}</span></div>
      </div>
    `;

    return await sendEmail({
        to: recruiter.email,
        subject,
        html: baseEmailTemplate({ title: "Interview Confirmed", preheader: subject, content }),
        text: `Candidate ${candidate.fullname} has confirmed the interview for ${job.title} on ${formattedDate}.`,
    });
};

export const sendRescheduleRequestedEmail = async ({ recruiter, candidate, job, interview, reason, proposedDate }) => {
    const formattedDate = new Date(interview.scheduledDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const formattedProposed = proposedDate
        ? new Date(proposedDate).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    const subject = `Reschedule Request: ${candidate.fullname} for ${job.title}`;
    const content = `
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${recruiter.fullname}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        <strong>${candidate.fullname}</strong> has requested to reschedule their interview for the <strong>${job.title}</strong> role.
      </p>
      <div class="details-box">
        <div class="detail-row"><span class="detail-label">Current Scheduled Time</span><span class="detail-value">${formattedDate}</span></div>
        <div class="detail-row"><span class="detail-label">Candidate</span><span class="detail-value">${candidate.fullname}</span></div>
        ${formattedProposed ? `<div class="detail-row"><span class="detail-label">Proposed Alternative</span><span class="detail-value" style="color:#d97706;">${formattedProposed}</span></div>` : ''}
      </div>
      <div class="instructions-box" style="border-left-color: #d97706; background-color: #fffbeb; color: #92400e;">
        <strong>Candidate's Reason:</strong><br/>
        "${reason}"
      </div>
      <p style="font-size: 13px; color: #64748b;">
        Please review your recruiter dashboard to reschedule the interview to a mutually convenient time.
      </p>
    `;

    const actionButton = {
        text: "Review & Reschedule",
        url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/interviews`,
    };

    return await sendEmail({
        to: recruiter.email,
        subject,
        html: baseEmailTemplate({ title: "Reschedule Request", preheader: subject, content, actionButton }),
        text: `${candidate.fullname} has requested to reschedule the interview for ${job.title}. Reason: ${reason}.`,
    });
};

export const sendInterviewRescheduledEmail = async ({ candidate, recruiter, job, interview }) => {
    const formattedDate = new Date(interview.scheduledDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const isOnline = interview.interviewType === "Online";
    const subject = `Interview Rescheduled: ${job.title} (${interview.round} Round)`;

    const content = `
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${candidate.fullname}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Your interview for <strong>${job.title}</strong> has been updated to a new time by <strong>${recruiter.fullname}</strong>.
      </p>
      <div class="details-box">
        <div class="detail-row"><span class="detail-label">New Date & Time</span><span class="detail-value" style="color:#6A38C2;">${formattedDate}</span></div>
        <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${interview.duration} Minutes</span></div>
        <div class="detail-row"><span class="detail-label">Format</span><span class="detail-value">${interview.interviewType}</span></div>
        ${isOnline && interview.meetingUrl ? `<div class="detail-row"><span class="detail-label">Meeting URL</span><span class="detail-value"><a href="${interview.meetingUrl}">Join Link</a></span></div>` : ''}
        ${!isOnline && interview.venue ? `<div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${interview.venue}</span></div>` : ''}
      </div>
      ${interview.instructions ? `
        <div class="instructions-box">
          <strong>Updated Instructions:</strong><br/>
          ${interview.instructions}
        </div>
      ` : ''}
    `;

    const actionButton = isOnline && interview.meetingUrl
        ? { text: "Join Meeting", url: interview.meetingUrl }
        : { text: "View Updated Schedule", url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/interviews` };

    return await sendEmail({
        to: candidate.email,
        subject,
        html: baseEmailTemplate({ title: "Interview Rescheduled", preheader: subject, content, actionButton }),
        text: `Your interview for ${job.title} has been rescheduled to ${formattedDate}.`,
    });
};

export const sendInterviewCancelledEmail = async ({ toUser, otherUser, job, interview, cancellationReason }) => {
    const formattedDate = new Date(interview.scheduledDate).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const subject = `Interview Cancelled: ${job.title} (${interview.round} Round)`;
    const content = `
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${toUser.fullname}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        The interview scheduled for <strong>${job.title}</strong> on <strong>${formattedDate}</strong> has been cancelled.
      </p>
      ${cancellationReason ? `
        <div class="instructions-box" style="border-left-color: #ef4444; background-color: #fef2f2; color: #991b1b;">
          <strong>Cancellation Reason:</strong><br/>
          "${cancellationReason}"
        </div>
      ` : ''}
    `;

    return await sendEmail({
        to: toUser.email,
        subject,
        html: baseEmailTemplate({ title: "Interview Cancelled", preheader: subject, content }),
        text: `The interview for ${job.title} on ${formattedDate} has been cancelled. Reason: ${cancellationReason || 'N/A'}.`,
    });
};
