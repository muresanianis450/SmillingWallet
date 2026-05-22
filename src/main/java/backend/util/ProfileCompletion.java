package backend.util;

import backend.enums.Role;
import backend.model.User;

import java.util.ArrayList;
import java.util.List;

public class ProfileCompletion {

    public static ProfileCompletionResult calculate(User user) {
        List<String> missing = new ArrayList<>();

        if (isBlank(user.getUsername())) missing.add("username");
        if (isBlank(user.getPhone()))    missing.add("phone");
        if (isBlank(user.getCity()))     missing.add("city");

        int total = 3;

        if (user.getRole() == Role.DENTIST) {
            total = 4;
            if (user.getSpecialty() == null) missing.add("specialty");
        }

        int filled = total - missing.size();
        int pct = (int) Math.round((double) filled / total * 100);

        return new ProfileCompletionResult(pct, missing);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
