package com.qrmenu.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@qrmenu.app}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetUrl = baseUrl + "/reset-password?token=" + token;

        if (mailSender == null) {
            log.warn("SMTP not configured. Password reset URL for {}: {}", toEmail, resetUrl);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("QR Menu — Password Reset");
            message.setText(
                "You requested a password reset.\n\n" +
                "Click the link below to set a new password (valid for 1 hour):\n\n" +
                resetUrl + "\n\n" +
                "If you did not request this, ignore this email."
            );
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", toEmail, e.getMessage());
            log.warn("Reset URL for manual delivery: {}", resetUrl);
        }
    }
}
