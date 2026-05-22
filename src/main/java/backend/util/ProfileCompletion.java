package backend.util;

import backend.model.User;

import java.util.ArrayList;
import java.util.List;

public class ProfileCompletion {

    public static ProfileCompletionResult compute(User user) {
        boolean isDentist = user.getRole() != null &&
                user.getRole().name().equals("DENTIST");

        int total = isDentist ? 4 : 3;
        List<String> missing = new ArrayList<>();
        int filled = 0;

        if (user.getUsername() == null || user.getUsername().isBlank()) {
            missing.add("username");
        } else {
            filled++;
        }
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            missing.add("phone");
        } else {
            filled++;
        }
        if (user.getCity() == null || user.getCity().isBlank()) {
            missing.add("city");
        } else {
            filled++;
        }
        if (isDentist) {
            if (user.getSpecialty() == null) {
                missing.add("specialty");
            } else {
                filled++;
            }
        }

        int pct = (int) Math.round((double) filled / total * 100);
        return new ProfileCompletionResult(pct, missing);
    }
}
