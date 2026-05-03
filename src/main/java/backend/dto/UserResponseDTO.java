package backend.dto;


import backend.enums.DentalSpecialty;
import backend.enums.Role;
import backend.model.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class UserResponseDTO {

    private UUID id;
    private String username;
    private Role role;
    private String city;
    private String address;
    private Double rating;
    private DentalSpecialty specialty;
    private LocalDateTime createdAt;


    public static UserResponseDTO from(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.role = user.getRole();
        dto.city = user.getCity();
        dto.address = user.getAddress();
        dto.rating = user.getRating();
        dto.specialty = user.getSpecialty();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }

}
