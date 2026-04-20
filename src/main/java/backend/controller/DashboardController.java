package backend.controller;

import backend.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/clinic/{dentistId}")
    public DashboardService.ClinicStatsDTO getClinicStats(@PathVariable UUID dentistId) {
        return dashboardService.getClinicStats(dentistId);
    }

    @GetMapping("/patient/{patientId}")
    public DashboardService.PatientHistoryDTO getPatientHistory(@PathVariable UUID patientId) {
        return dashboardService.getPatientHistory(patientId);
    }

}
