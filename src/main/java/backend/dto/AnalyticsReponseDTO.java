package backend.dto;


import backend.enums.DentalSpecialty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class AnalyticsReponseDTO {

    private long totalRequests;
    private long totalOffers;
    private long acceptedOffers;

    /** acceptedOffers / totalOffers * 100, rounded to 2 decimal places */
    private double acceptanceRatePercent;

    /** Average offer price across all PENDING + ACCEPTED offers */
    private BigDecimal averageOfferPrice;

    /** Average offer price broken down by specialty */
    private Map<DentalSpecialty,BigDecimal> averagePriceBySpecialty;

    /** Number of open requests per city, top-N sorted descending */
    private Map<String, Long> requestsByCity;

    /** Average estimated wait days per dentist UUID */
    private Map<String,Double> avgWaitDaysByDentist;
}
