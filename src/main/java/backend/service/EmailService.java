package backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final String frontendUrl;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.frontend-url}") String frontendUrl) {
        this.mailSender  = mailSender;
        this.frontendUrl = frontendUrl;
    }

    // ── Public methods (async — never block the HTTP thread) ─────────────────

    @Async
    public void sendPasswordReset(String toEmail, String username, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String html = RESET_HTML_TEMPLATE
                .replace("{{USER_NAME}}", username)
                .replace("{{RESET_LINK}}", resetLink);
        sendHtml(toEmail, "Smiling Wallet – Reset Your Password", html);
    }

    @Async
    public void sendDentistInvite(String toEmail, String clinicName, String token) {
        String activationLink = frontendUrl + "/activate?token=" + token;
        String html = INVITE_HTML_TEMPLATE
                .replace("{{CLINIC_NAME}}", clinicName)
                .replace("{{ACTIVATION_LINK}}", activationLink);
        sendHtml(toEmail, "Invitation to Join Smiling Wallet", html);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to build email for {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ── HTML Templates ────────────────────────────────────────────────────────

    private static final String INVITE_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invitation to Join Smiling Wallet</title>
                <style>
                    body { margin:0; padding:0; background-color:#f4f5fb; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333; -webkit-font-smoothing:antialiased; }
                    table { border-spacing:0; border-collapse:collapse; }
                    td { padding:0; }
                    img { border:0; }
                    .wrapper { width:100%; table-layout:fixed; background-color:#f4f5fb; padding-bottom:40px; }
                    .main { background-color:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.03); overflow:hidden; }
                    h1 { color:#1a1a2e; font-size:24px; font-weight:700; margin-top:0; margin-bottom:16px; }
                    p { color:#6b7280; font-size:16px; line-height:1.6; margin-top:0; margin-bottom:24px; }
                    .header { padding:30px 40px 20px; text-align:center; }
                    .header-logo { font-size:22px; font-weight:800; color:#7b68ee; text-decoration:none; }
                    .content { padding:20px 40px 40px; }
                    .highlight-text { color:#7b68ee; }
                    .btn-container { text-align:center; margin:32px 0; }
                    .btn { background-color:#7b68ee; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block; }
                    .steps { background-color:#f9fafb; border-radius:8px; padding:24px; margin-bottom:24px; }
                    .step-item { margin-bottom:16px; }
                    .step-item:last-child { margin-bottom:0; }
                    .step-title { font-weight:600; color:#1a1a2e; font-size:15px; margin-bottom:4px; display:block; }
                    .step-desc { font-size:14px; color:#6b7280; margin:0; }
                    .footer { text-align:center; padding:30px 40px; color:#9ca3af; font-size:13px; }
                    .footer a { color:#7b68ee; text-decoration:none; }
                    @media screen and (max-width:600px) { .content,.header { padding-left:20px !important; padding-right:20px !important; } }
                </style>
            </head>
            <body>
                <center class="wrapper">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;">
                        <tr><td align="center">
                            <table class="main" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="header">
                                        <br>
                                        <a href="#" class="header-logo">Smiling Wallet</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="content">
                                        <h1>Grow your clinic with new patients.</h1>
                                        <p>Hello {{CLINIC_NAME}},</p>
                                        <p>We are excited to invite you to join <strong>Smiling Wallet</strong>, the smart new way patients are finding their perfect dental care providers.</p>
                                        <p>Patients use our platform to submit their dental needs. As a verified clinic, you can review these requests and provide competitive quotes, completely seamlessly.</p>
                                        <div class="steps">
                                            <div class="step-item">
                                                <span class="step-title"><span style="color:#7b68ee;">01</span> Review Requests</span>
                                                <p class="step-desc">Get instant access to anonymous patient requests in your area.</p>
                                            </div>
                                            <div class="step-item">
                                                <span class="step-title"><span style="color:#7b68ee;">02</span> Send Your Offer</span>
                                                <p class="step-desc">Submit your personalized quote based on the patient's specific dental needs.</p>
                                            </div>
                                            <div class="step-item">
                                                <span class="step-title"><span style="color:#7b68ee;">03</span> Get Booked</span>
                                                <p class="step-desc">When a patient matches with your offer, they book directly with your clinic.</p>
                                            </div>
                                        </div>
                                        <p>Join our network of top-rated specialists and start filling your appointment book with patients who are actively looking for the services you offer.</p>
                                        <div class="btn-container">
                                            <a href="{{ACTIVATION_LINK}}" class="btn">Create Your Clinic Account</a>
                                        </div>
                                        <p style="font-size:14px; margin-bottom:0;">
                                            Best regards,<br>
                                            <strong>The Smiling Wallet Team</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
                                <tr>
                                    <td class="footer">
                                        <p style="margin-bottom:8px;">You are receiving this email because we believe Smiling Wallet would be a great fit for your practice.</p>
                                        <p style="margin-bottom:0;">This invitation link expires in 72 hours.</p>
                                    </td>
                                </tr>
                            </table>
                        </td></tr>
                    </table>
                </center>
            </body>
            </html>
            """;

    private static final String RESET_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password - Smiling Wallet</title>
                <style>
                    body { margin:0; padding:0; background-color:#f4f5fb; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333; -webkit-font-smoothing:antialiased; }
                    table { border-spacing:0; border-collapse:collapse; }
                    td { padding:0; }
                    img { border:0; }
                    .wrapper { width:100%; table-layout:fixed; background-color:#f4f5fb; padding-bottom:40px; }
                    .main { background-color:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.03); overflow:hidden; }
                    h1 { color:#1a1a2e; font-size:24px; font-weight:700; margin-top:0; margin-bottom:16px; }
                    p { color:#6b7280; font-size:16px; line-height:1.6; margin-top:0; margin-bottom:24px; }
                    .header { padding:30px 40px 20px; text-align:center; }
                    .header-logo { font-size:22px; font-weight:800; color:#7b68ee; text-decoration:none; }
                    .content { padding:20px 40px 40px; }
                    .btn-container { text-align:left; margin:32px 0; }
                    .btn { background-color:#7b68ee; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block; }
                    .notice-box { background-color:#f9fafb; border-left:4px solid #d1d5db; border-radius:4px; padding:16px; margin-bottom:24px; }
                    .notice-box p { font-size:14px; margin:0; color:#4b5563; }
                    .footer { text-align:center; padding:30px 40px; color:#9ca3af; font-size:13px; }
                    .footer a { color:#7b68ee; text-decoration:none; }
                    @media screen and (max-width:600px) { .content,.header { padding-left:20px !important; padding-right:20px !important; } }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;">
                    <tr>
                        <td align="center">
                            <table class="main" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="header">
                                        <a href="#" class="header-logo">Smiling Wallet</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="content">
                                        <h1>Reset your password</h1>
                                        <p>Hello {{USER_NAME}},</p>
                                        <p>We received a request to reset the password for your Smiling Wallet account. If you made this request, click the button below to choose a new password.</p>
                                        <div class="btn-container">
                                            <a href="{{RESET_LINK}}" class="btn">Reset Password</a>
                                        </div>
                                        <div class="notice-box">
                                            <p><strong>Didn't request this change?</strong><br>
                                                If you did not request a new password, you can safely ignore this email. Your password will remain the same and your account is secure.</p>
                                        </div>
                                        <p style="font-size:14px; margin-bottom:0;">
                                            For security reasons, this link will expire in 24 hours.<br><br>
                                            Best regards,<br>
                                            <strong>The Smiling Wallet Team</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
                                <tr>
                                    <td class="footer">
                                        <p style="margin-bottom:8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                        <p style="margin-bottom:0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </center>
            </body>
            </html>
            """;
}
