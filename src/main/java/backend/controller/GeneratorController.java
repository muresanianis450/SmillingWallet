package backend.controller;


import backend.service.FakeDataService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/generator")
public class GeneratorController {

    private final FakeDataService fakeDataService;

    public GeneratorController(FakeDataService fakeDataService) {
        this.fakeDataService = fakeDataService;
    }

    @PostMapping("/start")
    public void start() { fakeDataService.setRunning(true); }

    @PostMapping("/stop")
    public void stop() { fakeDataService.setRunning(false); }
}
