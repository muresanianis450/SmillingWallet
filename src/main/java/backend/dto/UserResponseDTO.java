package backend.dto;

import backend.enums.DentalSpecialty;
import backend.enums.Role;
import backend.model.User;
import backend.util.ProfileCompletion;
import backend.util.ProfileCompletionResult;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class UserResponseDTO {

    private UUID id;
    private String email;
    private String username;
    private String phone;
    private Role role;
    private boolean accountActive;
    private String city;
    private String address;
    private Double rating;
    private DentalSpecialty specialty;
    private LocalDateTime createdAt;
    private String profilePicture;
    private boolean twoFactorEnabled;
    private boolean emailRemindersEnabled;
    private int profileCompletionPct;
    private List<String> missingFields;

    public static UserResponseDTO from(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.id = user.getId();
        dto.email = user.getEmail();
        dto.username = user.getUsername();
        dto.accountActive = user.isAccountActive();
        dto.phone = user.getPhone();
        dto.role = user.getRole();
        dto.city = user.getCity();
        dto.address = user.getAddress();
        dto.rating = user.getRating();
        dto.specialty = user.getSpecialty();
        dto.createdAt = user.getCreatedAt();
        dto.profilePicture = user.getProfilePicture();
        dto.twoFactorEnabled = user.isTotpEnabled();
        dto.emailRemindersEnabled = user.isEmailRemindersEnabled();

        ProfileCompletionResult completion = ProfileCompletion.compute(user);
        dto.profileCompletionPct = completion.completionPct();
        dto.missingFields = completion.missingFields();

        return dto;
    }
}
