package backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordReset(String toEmail, String token) {
        // Point this to my frontend host TODO

        String resetLink = "http://localhost:5173/reset-password?token=" + token;

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("Smiling Wallet - Password Reset");
        msg.setText(
                "Click the link below to reset your password (expires in 1 hour):\n\n"
                        + resetLink
                        + "\n\nIf you did not request this, you can safely ignore this email."
        );
        mailSender.send(msg);
    }
}
