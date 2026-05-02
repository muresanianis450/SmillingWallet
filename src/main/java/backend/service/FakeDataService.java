package backend.service;

import com.github.javafaker.Faker;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class FakeDataService {

    //Thread-safe flag to start/stop the loop
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final Faker faker = new Faker();


    private final SimpMessagingTemplate messagingTemplate;

    public FakeDataService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    //Repository or websocket service
    // private final OfferRepository offerRepository

    public void setRunning(boolean run) {
        if (run && !isRunning.get()) {
            isRunning.set(true);
            startGenerationLoop();
        }else{
            isRunning.set(false);
        }
    }

    private void startGenerationLoop() {
        CompletableFuture.runAsync( () -> {
            while (isRunning.get()) {
                try{
                    String doctorName = "Dr. " + faker.name().lastName();
                    int quote = faker.number().numberBetween(300, 600);

                    // Construct a full object that matches your TypeScript ClientOffer interface
                    Map<String, Object> newOffer = new HashMap<>();
                    newOffer.put("id", java.util.UUID.randomUUID().toString()); // Truly unique ID
                    newOffer.put("doctorLabel", doctorName);
                    newOffer.put("exactQuote", quote);
                    newOffer.put("priceMin", quote - 50);
                    newOffer.put("priceMax", quote + 100);
                    newOffer.put("rating", 4.0 + (faker.random().nextDouble() * 1.0));
                    newOffer.put("reviewCount", faker.number().numberBetween(10, 200));
                    newOffer.put("matchScore", faker.number().numberBetween(85, 99));
                    newOffer.put("savingsVsAvg", faker.number().numberBetween(-20, 50));
                    newOffer.put("date", "Apr 25, 2026");
                    newOffer.put("time", "14:30");
                    newOffer.put("validUntil", "24h");
                    newOffer.put("specialMentions", java.util.List.of("Free Consultation", "X-Ray Included"));

                    messagingTemplate.convertAndSend("/topic/offers", Optional.of(newOffer));


                    Thread.sleep(5000);
                }catch( InterruptedException e) {
                    Thread.currentThread().interrupt();
                    isRunning.set(false);
                }
            }
        });
    }


}
