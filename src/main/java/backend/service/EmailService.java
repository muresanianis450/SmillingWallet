package backend.service;

import backend.model.Appointment;
import backend.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

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
    public void sendAppointmentReminder(User patient, User dentist, Appointment appointment) {
        String clinicName    = dentist.getUsername();
        String clinicAddress = buildAddress(dentist);
        String date          = appointment.getScheduledAt().format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy"));
        String time          = appointment.getScheduledAt().format(DateTimeFormatter.ofPattern("h:mm a"));

        // Google Calendar URL tokens
        String calStart = appointment.getScheduledAt().format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss"));
        String calEnd   = appointment.getScheduledAt().plusHours(1).format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss"));
        String calTitle = URLEncoder.encode("Dental Appointment at " + clinicName, StandardCharsets.UTF_8);
        String calAddr  = URLEncoder.encode(clinicAddress, StandardCharsets.UTF_8);
        String calUrl   = "https://calendar.google.com/calendar/render?action=TEMPLATE"
                        + "&text=" + calTitle
                        + "&dates=" + calStart + "/" + calEnd
                        + "&details=Booked+via+Smiling+Wallet"
                        + "&location=" + calAddr;
        String mapsUrl  = "https://www.google.com/maps/dir/?api=1&destination=" + calAddr;

        String html = REMINDER_HTML_TEMPLATE
                .replace("{{PATIENT_NAME}}", patient.getUsername())
                .replace("{{CLINIC_NAME}}", clinicName)
                .replace("{{DATE}}", date)
                .replace("{{TIME}}", time)
                .replace("{{ADDRESS}}", clinicAddress)
                .replace("{{CALENDAR_URL}}", calUrl)
                .replace("{{MAPS_URL}}", mapsUrl);

        sendHtml(patient.getEmail(), "Smiling Wallet – Your Appointment is Tomorrow!", html);
    }

    @Async
    public void sendNewOfferNotification(String toEmail, String patientName, String shortRequestId) {
        String html = NEW_OFFER_HTML_TEMPLATE
                .replace("{{PATIENT_NAME}}", patientName)
                .replace("{{REQUEST_ID}}", shortRequestId)
                .replace("{{APP_LINK}}", frontendUrl);
        sendHtml(toEmail, "Smiling Wallet – You have a new offer!", html);
    }

    @Async
    public void sendRescheduleRequestedNotification(String toEmail, String dentistName, String shortOfferId) {
        String html = RESCHEDULE_REQUESTED_HTML_TEMPLATE
                .replace("{{DENTIST_NAME}}", dentistName)
                .replace("{{OFFER_ID}}", shortOfferId)
                .replace("{{APP_LINK}}", frontendUrl);
        sendHtml(toEmail, "Smiling Wallet – Patient requested new time slots", html);
    }

    @Async
    public void sendNewSlotsProposedNotification(String toEmail, String patientName, String shortDentistId) {
        String html = NEW_SLOTS_HTML_TEMPLATE
                .replace("{{PATIENT_NAME}}", patientName)
                .replace("{{DENTIST_ID}}", shortDentistId)
                .replace("{{APP_LINK}}", frontendUrl);
        sendHtml(toEmail, "Smiling Wallet – New time slots proposed for your offer", html);
    }

    @Async
    public void sendAppointmentConfirmedNotification(String toEmail, String patientName,
                                                     String clinicName, String clinicAddress,
                                                     java.time.LocalDateTime scheduledAt,
                                                     String transactionId) {
        String date        = scheduledAt.format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy"));
        String time        = scheduledAt.format(DateTimeFormatter.ofPattern("h:mm a"));
        String paymentDate = java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        String html = APPOINTMENT_CONFIRMED_HTML_TEMPLATE
                .replace("{{PATIENT_NAME}}", patientName)
                .replace("{{CLINIC_NAME}}", clinicName)
                .replace("{{CLINIC_ADDRESS}}", clinicAddress)
                .replace("{{DATE}}", date)
                .replace("{{TIME}}", time)
                .replace("{{TRANSACTION_ID}}", transactionId)
                .replace("{{PAYMENT_DATE}}", paymentDate)
                .replace("{{DASHBOARD_LINK}}", frontendUrl);
        sendHtml(toEmail, "Smiling Wallet – Your Appointment is Confirmed!", html);
    }

    @Async
    public void sendPaymentConfirmation(String toEmail, String userName, String clinicName,
                                        String amount, String transactionId) {
        String date = java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        String html = PAYMENT_CONFIRMATION_HTML_TEMPLATE
                .replace("{{USER_NAME}}", userName)
                .replace("{{CLINIC_NAME}}", clinicName)
                .replace("{{AMOUNT}}", amount)
                .replace("{{TRANSACTION_ID}}", transactionId)
                .replace("{{DATE}}", date)
                .replace("{{DASHBOARD_LINK}}", frontendUrl);
        sendHtml(toEmail, "Smiling Wallet – Payment Successful", html);
    }

    @Async
    public void sendEmail2faCode(String toEmail, String username, String code) {
        String html = EMAIL_2FA_HTML_TEMPLATE
                .replace("{{USER_NAME}}", username)
                .replace("{{CODE}}", code);
        sendHtml(toEmail, "Smiling Wallet – Your verification code", html);
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

    private String buildAddress(User dentist) {
        StringBuilder sb = new StringBuilder();
        if (dentist.getAddress() != null && !dentist.getAddress().isBlank()) sb.append(dentist.getAddress());
        if (dentist.getCity() != null && !dentist.getCity().isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(dentist.getCity());
        }
        return sb.isEmpty() ? "Address not provided" : sb.toString();
    }

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

    private static final String REMINDER_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Reminder - Smiling Wallet</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #f4f5fb; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; -webkit-font-smoothing: antialiased; }
                    table { border-spacing: 0; border-collapse: collapse; }
                    td { padding: 0; }
                    img { border: 0; }
                    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f5fb; padding-bottom: 40px; }
                    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; }
                    h1 { color: #1a1a2e; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; }
                    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; }
                    .header { padding: 30px 40px 20px; text-align: center; }
                    .header-logo { font-size: 22px; font-weight: 800; color: #7b68ee; text-decoration: none; }
                    .content { padding: 20px 40px 40px; }
                    .btn-container { text-align: left; margin: 32px 0; }
                    .btn { background-color: #7b68ee; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; }
                    .btn-secondary { background-color: #ffffff; color: #7b68ee !important; border: 2px solid #7b68ee; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; }
                    .notice-box { background-color: #f9fafb; border-left: 4px solid #7b68ee; border-radius: 4px; padding: 20px; margin-bottom: 24px; }
                    .notice-box p { font-size: 15px; margin: 0; color: #1a1a2e; }
                    .footer { text-align: center; padding: 30px 40px; color: #9ca3af; font-size: 13px; }
                    .footer a { color: #7b68ee; text-decoration: none; }
                    @media screen and (max-width: 600px) {
                        .content, .header { padding-left: 20px !important; padding-right: 20px !important; }
                        .btn, .btn-secondary { display: block; text-align: center; width: 100%; box-sizing: border-box; }
                    }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 40px;">
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
                                        <h1>Your appointment is tomorrow!</h1>
                                        <p>Hello {{PATIENT_NAME}},</p>
                                        <p>This is a quick reminder that you have an upcoming dental appointment scheduled for tomorrow. We're excited to see your new smile.</p>
                                        <div class="notice-box">
                                            <p><strong>Clinic:</strong> {{CLINIC_NAME}}<br>
                                               <strong>Date:</strong> Tomorrow, {{DATE}}<br>
                                               <strong>Time:</strong> {{TIME}}<br>
                                               <strong>Location:</strong> {{ADDRESS}}</p>
                                        </div>
                                        <p>Need directions or want to add this to your schedule? Use the links below:</p>
                                        <div class="btn-container">
                                            <a href="{{CALENDAR_URL}}" target="_blank" class="btn">Add to Google Calendar</a>
                                            <br><br>
                                            <a href="{{MAPS_URL}}" target="_blank" class="btn-secondary">Get Directions (Google Maps)</a>
                                        </div>
                                        <p style="font-size: 14px; margin-bottom: 0;">
                                            Please arrive 5 minutes early. If you need to reschedule, please contact the clinic directly.<br><br>
                                            Best regards,<br>
                                            <strong>The Smiling Wallet Team</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                                <tr>
                                    <td class="footer">
                                        <p style="margin-bottom: 8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                        <p style="margin-bottom: 0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
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

    private static final String NEW_OFFER_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Offer - Smiling Wallet</title>
                <style>
                    body { margin:0; padding:0; background-color:#f4f5fb; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333; -webkit-font-smoothing:antialiased; }
                    table { border-spacing:0; border-collapse:collapse; }
                    td { padding:0; }
                    .wrapper { width:100%; table-layout:fixed; background-color:#f4f5fb; padding-bottom:40px; }
                    .main { background-color:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.03); overflow:hidden; }
                    h1 { color:#1a1a2e; font-size:24px; font-weight:700; margin-top:0; margin-bottom:16px; }
                    p { color:#6b7280; font-size:16px; line-height:1.6; margin-top:0; margin-bottom:24px; }
                    .header { padding:30px 40px 20px; text-align:center; }
                    .header-logo { font-size:22px; font-weight:800; color:#7b68ee; text-decoration:none; }
                    .content { padding:20px 40px 40px; }
                    .notice-box { background-color:#f5f4ff; border-left:4px solid #7b68ee; border-radius:4px; padding:20px; margin-bottom:24px; }
                    .notice-box p { font-size:15px; margin:0; color:#1a1a2e; }
                    .btn-container { text-align:center; margin:32px 0; }
                    .btn { background-color:#7b68ee; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block; }
                    .footer { text-align:center; padding:30px 40px; color:#9ca3af; font-size:13px; }
                    .footer a { color:#7b68ee; text-decoration:none; }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;">
                    <tr><td align="center">
                        <table class="main" border="0" cellpadding="0" cellspacing="0">
                            <tr><td class="header"><a href="#" class="header-logo">Smiling Wallet</a></td></tr>
                            <tr><td class="content">
                                <h1>A clinic sent you an offer!</h1>
                                <p>Hello {{PATIENT_NAME}},</p>
                                <p>Great news — a dental clinic has reviewed your request and sent you a price offer with proposed appointment time slots.</p>
                                <div class="notice-box">
                                    <p><strong>Request:</strong> #{{REQUEST_ID}}<br>
                                       Log in to review the offer, pick a time slot, or request different times.</p>
                                </div>
                                <div class="btn-container">
                                    <a href="{{APP_LINK}}" class="btn">View My Offers</a>
                                </div>
                                <p style="font-size:14px; margin-bottom:0;">
                                    Best regards,<br><strong>The Smiling Wallet Team</strong>
                                </p>
                            </td></tr>
                        </table>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
                            <tr><td class="footer">
                                <p style="margin-bottom:8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                <p style="margin-bottom:0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
                            </td></tr>
                        </table>
                    </td></tr>
                </table>
            </center>
            </body>
            </html>
            """;

    private static final String RESCHEDULE_REQUESTED_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reschedule Requested - Smiling Wallet</title>
                <style>
                    body { margin:0; padding:0; background-color:#f4f5fb; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333; -webkit-font-smoothing:antialiased; }
                    table { border-spacing:0; border-collapse:collapse; }
                    td { padding:0; }
                    .wrapper { width:100%; table-layout:fixed; background-color:#f4f5fb; padding-bottom:40px; }
                    .main { background-color:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.03); overflow:hidden; }
                    h1 { color:#1a1a2e; font-size:24px; font-weight:700; margin-top:0; margin-bottom:16px; }
                    p { color:#6b7280; font-size:16px; line-height:1.6; margin-top:0; margin-bottom:24px; }
                    .header { padding:30px 40px 20px; text-align:center; }
                    .header-logo { font-size:22px; font-weight:800; color:#7b68ee; text-decoration:none; }
                    .content { padding:20px 40px 40px; }
                    .notice-box { background-color:#fffbeb; border-left:4px solid #f59e0b; border-radius:4px; padding:20px; margin-bottom:24px; }
                    .notice-box p { font-size:15px; margin:0; color:#1a1a2e; }
                    .btn-container { text-align:center; margin:32px 0; }
                    .btn { background-color:#f59e0b; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block; }
                    .footer { text-align:center; padding:30px 40px; color:#9ca3af; font-size:13px; }
                    .footer a { color:#7b68ee; text-decoration:none; }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;">
                    <tr><td align="center">
                        <table class="main" border="0" cellpadding="0" cellspacing="0">
                            <tr><td class="header"><a href="#" class="header-logo">Smiling Wallet</a></td></tr>
                            <tr><td class="content">
                                <h1>Patient requested new time slots</h1>
                                <p>Hello {{DENTIST_NAME}},</p>
                                <p>A patient was not available on your proposed times and has requested you to suggest new appointment slots.</p>
                                <div class="notice-box">
                                    <p><strong>Offer:</strong> #{{OFFER_ID}}<br>
                                       Please log in and propose up to 3 new time slots so the patient can choose.</p>
                                </div>
                                <div class="btn-container">
                                    <a href="{{APP_LINK}}" class="btn">Propose New Slots</a>
                                </div>
                                <p style="font-size:14px; margin-bottom:0;">
                                    Best regards,<br><strong>The Smiling Wallet Team</strong>
                                </p>
                            </td></tr>
                        </table>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
                            <tr><td class="footer">
                                <p style="margin-bottom:8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                <p style="margin-bottom:0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
                            </td></tr>
                        </table>
                    </td></tr>
                </table>
            </center>
            </body>
            </html>
            """;

    private static final String NEW_SLOTS_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Time Slots - Smiling Wallet</title>
                <style>
                    body { margin:0; padding:0; background-color:#f4f5fb; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333; -webkit-font-smoothing:antialiased; }
                    table { border-spacing:0; border-collapse:collapse; }
                    td { padding:0; }
                    .wrapper { width:100%; table-layout:fixed; background-color:#f4f5fb; padding-bottom:40px; }
                    .main { background-color:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.03); overflow:hidden; }
                    h1 { color:#1a1a2e; font-size:24px; font-weight:700; margin-top:0; margin-bottom:16px; }
                    p { color:#6b7280; font-size:16px; line-height:1.6; margin-top:0; margin-bottom:24px; }
                    .header { padding:30px 40px 20px; text-align:center; }
                    .header-logo { font-size:22px; font-weight:800; color:#7b68ee; text-decoration:none; }
                    .content { padding:20px 40px 40px; }
                    .notice-box { background-color:#f5f4ff; border-left:4px solid #7b68ee; border-radius:4px; padding:20px; margin-bottom:24px; }
                    .notice-box p { font-size:15px; margin:0; color:#1a1a2e; }
                    .btn-container { text-align:center; margin:32px 0; }
                    .btn { background-color:#7b68ee; color:#ffffff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block; }
                    .footer { text-align:center; padding:30px 40px; color:#9ca3af; font-size:13px; }
                    .footer a { color:#7b68ee; text-decoration:none; }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;">
                    <tr><td align="center">
                        <table class="main" border="0" cellpadding="0" cellspacing="0">
                            <tr><td class="header"><a href="#" class="header-logo">Smiling Wallet</a></td></tr>
                            <tr><td class="content">
                                <h1>The clinic proposed new time slots!</h1>
                                <p>Hello {{PATIENT_NAME}},</p>
                                <p>The clinic has reviewed your reschedule request and proposed new appointment time slots for you to choose from.</p>
                                <div class="notice-box">
                                    <p><strong>Clinic:</strong> Dr. #{{DENTIST_ID}}<br>
                                       Log in to view the new slots and confirm your appointment.</p>
                                </div>
                                <div class="btn-container">
                                    <a href="{{APP_LINK}}" class="btn">Choose a Time Slot</a>
                                </div>
                                <p style="font-size:14px; margin-bottom:0;">
                                    Best regards,<br><strong>The Smiling Wallet Team</strong>
                                </p>
                            </td></tr>
                        </table>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
                            <tr><td class="footer">
                                <p style="margin-bottom:8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                <p style="margin-bottom:0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
                            </td></tr>
                        </table>
                    </td></tr>
                </table>
            </center>
            </body>
            </html>
            """;

    private static final String APPOINTMENT_CONFIRMED_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment & Payment Confirmed - Smiling Wallet</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #f4f5fb; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; -webkit-font-smoothing: antialiased; }
                    table { border-spacing: 0; border-collapse: collapse; }
                    td { padding: 0; }
                    img { border: 0; }
                    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f5fb; padding-bottom: 40px; }
                    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; }
                    h1 { color: #1a1a2e; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; }
                    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; }
                    .header { padding: 30px 40px 20px; text-align: center; }
                    .header-logo { font-size: 22px; font-weight: 800; color: #7b68ee; text-decoration: none; }
                    .content { padding: 20px 40px 40px; }
                    .btn-container { text-align: center; margin: 32px 0; }
                    .btn { background-color: #7b68ee; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; }
                    .steps { background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
                    .step-item { margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; }
                    .step-item:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
                    .step-title { font-weight: 600; color: #1a1a2e; font-size: 15px; margin-bottom: 4px; display: block; }
                    .step-desc { font-size: 14px; color: #4b5563; margin: 0; }
                    .receipt-amount { float: right; font-weight: bold; color: #1a1a2e; font-size: 16px; }
                    .footer { text-align: center; padding: 30px 40px; color: #9ca3af; font-size: 13px; }
                    .footer a { color: #7b68ee; text-decoration: none; }
                    @media screen and (max-width: 600px) { .content, .header { padding-left: 20px !important; padding-right: 20px !important; } }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 40px;">
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
                                        <h1>Appointment Confirmed!</h1>
                                        <p>Hello {{PATIENT_NAME}},</p>
                                        <p>Great news! Your request has been accepted. Your upcoming appointment at <strong>{{CLINIC_NAME}}</strong> is officially confirmed.</p>
                                        <p>We are also writing to confirm that your submission fee has been successfully processed.</p>
                                        <div class="steps">
                                            <div class="step-item">
                                                <span class="step-title">Appointment Details</span>
                                                <p class="step-desc">
                                                    <strong>Date:</strong> {{DATE}}<br>
                                                    <strong>Time:</strong> {{TIME}}<br>
                                                    <strong>Location:</strong> {{CLINIC_NAME}}, {{CLINIC_ADDRESS}}
                                                </p>
                                            </div>
                                            <div class="step-item">
                                                <span class="step-title">Payment Receipt</span>
                                                <p class="step-desc">
                                                    Platform Submission Fee
                                                    <span class="receipt-amount">&euro;1.00</span>
                                                    <br><br>
                                                    <span style="color: #9ca3af; font-size: 12px;">Transaction ID: #{{TRANSACTION_ID}}<br>Date: {{PAYMENT_DATE}}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="btn-container">
                                            <a href="{{DASHBOARD_LINK}}" class="btn">View Appointment Details</a>
                                        </div>
                                        <p style="font-size: 14px; margin-bottom: 0;">
                                            Thank you for using Smiling Wallet!<br><br>
                                            Best regards,<br>
                                            <strong>The Smiling Wallet Team</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                                <tr>
                                    <td class="footer">
                                        <p style="margin-bottom: 8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                        <p style="margin-bottom: 0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
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

    private static final String PAYMENT_CONFIRMATION_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Successful - Smiling Wallet</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #f4f5fb; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; -webkit-font-smoothing: antialiased; }
                    table { border-spacing: 0; border-collapse: collapse; }
                    td { padding: 0; }
                    img { border: 0; }
                    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f5fb; padding-bottom: 40px; }
                    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; }
                    h1 { color: #1a1a2e; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; }
                    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; }
                    .header { padding: 30px 40px 20px; text-align: center; }
                    .header-logo { font-size: 22px; font-weight: 800; color: #7b68ee; text-decoration: none; }
                    .content { padding: 20px 40px 40px; }
                    .btn-container { text-align: left; margin: 32px 0; }
                    .btn { background-color: #7b68ee; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; }
                    .notice-box { background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 4px; padding: 20px; margin-bottom: 24px; }
                    .notice-box p { font-size: 15px; margin: 0; color: #4b5563; line-height: 1.8; }
                    .success-text { color: #10b981; font-weight: 600; }
                    .footer { text-align: center; padding: 30px 40px; color: #9ca3af; font-size: 13px; }
                    .footer a { color: #7b68ee; text-decoration: none; }
                    @media screen and (max-width: 600px) { .content, .header { padding-left: 20px !important; padding-right: 20px !important; } }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 40px;">
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
                                        <h1>Payment Successful</h1>
                                        <p>Hello {{USER_NAME}},</p>
                                        <p>Thank you! We have successfully processed your <strong>1% platform service fee</strong> following your confirmed treatment at <strong>{{CLINIC_NAME}}</strong>.</p>
                                        <div class="notice-box">
                                            <p style="margin-bottom: 12px;"><span class="success-text">&#10003; Payment Approved</span></p>
                                            <p>
                                                <strong>Amount Paid:</strong> &euro;{{AMOUNT}}<br>
                                                <strong>Description:</strong> 1% Smiling Wallet Service Fee<br>
                                                <strong>Transaction ID:</strong> #{{TRANSACTION_ID}}<br>
                                                <strong>Date:</strong> {{DATE}}
                                            </p>
                                        </div>
                                        <p>Your Smiling Wallet process is now complete for this treatment. We wish you a fast recovery and an amazing new smile!</p>
                                        <div class="btn-container">
                                            <a href="{{DASHBOARD_LINK}}" class="btn">View My Appointments</a>
                                        </div>
                                        <p style="font-size: 14px; margin-bottom: 0;">
                                            Best regards,<br>
                                            <strong>The Smiling Wallet Team</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                                <tr>
                                    <td class="footer">
                                        <p style="margin-bottom: 8px;">Need help? <a href="mailto:support@smilingwallet.com">Contact our support team</a>.</p>
                                        <p style="margin-bottom: 0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
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

    private static final String EMAIL_2FA_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verification Code - Smiling Wallet</title>
                <style>
                    body { margin:0; padding:0; background-color:#f4f5fb; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#333333; }
                    table { border-spacing:0; border-collapse:collapse; }
                    td { padding:0; }
                    .wrapper { width:100%; table-layout:fixed; background-color:#f4f5fb; padding-bottom:40px; }
                    .main { background-color:#ffffff; margin:0 auto; width:100%; max-width:600px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.03); overflow:hidden; }
                    h1 { color:#1a1a2e; font-size:24px; font-weight:700; margin-top:0; margin-bottom:16px; }
                    p { color:#6b7280; font-size:16px; line-height:1.6; margin-top:0; margin-bottom:24px; }
                    .header { padding:30px 40px 20px; text-align:center; }
                    .header-logo { font-size:22px; font-weight:800; color:#7b68ee; text-decoration:none; }
                    .content { padding:20px 40px 40px; }
                    .code-box { background-color:#f5f4ff; border:2px solid #7b68ee; border-radius:12px; padding:24px; margin:24px 0; text-align:center; }
                    .code { font-size:40px; font-weight:800; letter-spacing:0.3em; color:#1a1a2e; font-family:monospace; }
                    .footer { text-align:center; padding:30px 40px; color:#9ca3af; font-size:13px; }
                    .footer a { color:#7b68ee; text-decoration:none; }
                </style>
            </head>
            <body>
            <center class="wrapper">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top:40px;">
                    <tr><td align="center">
                        <table class="main" border="0" cellpadding="0" cellspacing="0">
                            <tr><td class="header"><a href="#" class="header-logo">Smiling Wallet</a></td></tr>
                            <tr><td class="content">
                                <h1>Your verification code</h1>
                                <p>Hello {{USER_NAME}},</p>
                                <p>Use the code below to verify your identity. It expires in 10 minutes.</p>
                                <div class="code-box">
                                    <div class="code">{{CODE}}</div>
                                </div>
                                <p style="font-size:14px; margin-bottom:0;">
                                    If you did not request this code, you can safely ignore this email.<br><br>
                                    Best regards,<br><strong>The Smiling Wallet Team</strong>
                                </p>
                            </td></tr>
                        </table>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;">
                            <tr><td class="footer">
                                <p style="margin-bottom:0;">&copy; 2026 Smiling Wallet. All rights reserved.</p>
                            </td></tr>
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
