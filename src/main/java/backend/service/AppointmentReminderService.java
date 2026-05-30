package backend.service;

import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import backend.model.User;
import backend.repository.AppointmentRepository;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 * * * *")
    public void sendUpcomingAppointmentReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.plusHours(23);
        LocalDateTime to   = now.plusHours(25);

        List<Appointment> upcoming = appointmentRepository.findUpcomingInWindow(
                from, to,
                List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED));

        log.info("Reminder job: found {} appointment(s) in the 24h window", upcoming.size());

        for (Appointment appointment : upcoming) {
            Optional<User> patientOpt = userRepository.findById(appointment.getPatientPublicId());
            Optional<User> dentistOpt = userRepository.findById(appointment.getDentistPublicId());

            if (patientOpt.isEmpty() || dentistOpt.isEmpty()) {
                log.warn("Skipping reminder for appointment {}: patient or dentist not found", appointment.getId());
                continue;
            }

            User patient = patientOpt.get();
            User dentist = dentistOpt.get();

            if (!patient.isEmailRemindersEnabled()) {
                log.debug("Skipping reminder for patient {} — reminders disabled", patient.getId());
                continue;
            }

            emailService.sendAppointmentReminder(patient, dentist, appointment);
        }
    }
}
