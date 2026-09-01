import dotenv from 'dotenv';
dotenv.config();

/**
 * Sends a transactional email with an OTP code using Brevo REST API v3
 * @param {Object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.otp - 6-digit OTP code
 */
export const sendOtpEmail = async ({ toEmail, otp }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderName = process.env.EMAIL_FROM_NAME || 'WebVault Admin';
  const senderEmail = process.env.EMAIL_FROM || 'admin@webvault.com';

  console.log(`\n==================================================`);
  console.log(`🔑 BREVO OTP DISPATCH REQUEST`);
  console.log(`📧 Target Email: ${toEmail}`);
  console.log(`🔢 OTP Code: ${otp}`);
  console.log(`==================================================\n`);

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY not configured in backend/.env. Email not sent via network.');
    return { success: false, message: 'Brevo API key missing' };
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: '🔒 WebVault - Password Reset Verification Code',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 20px; text-decoration: none; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 16px; }
          .otp-box { background-color: #0f172a; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; margin: 0; }
          .info { font-size: 14px; color: #94a3b8; line-height: 1.6; text-align: center; }
          .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">WV</div>
            <div class="title">Password Reset Verification</div>
          </div>
          <p class="info">You requested a password reset for your <strong>WebVault</strong> account. Use the code below to complete your reset request:</p>
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>
          <p class="info">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
          <div class="footer">
            &copy; WebVault Secure Bookmark Manager. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Brevo Email sent successfully! MessageId:', data.messageId);
      return { success: true, messageId: data.messageId };
    } else {
      console.warn('⚠️ Brevo API response error:', data);
      return { success: false, error: data.message || 'Failed to dispatch email via Brevo' };
    }
  } catch (error) {
    console.error('❌ Failed to call Brevo API:', error.message);
    return { success: false, error: error.message };
  }
};

export default { sendOtpEmail };
