package backend.model;

import backend.enums.DentalSpecialty;
import backend.enums.Role;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;


@Getter
@Setter
@NoArgsConstructor
public class User {

    private UUID id;
    private String email;
    private String username;
    private String password;
    private String phone;
    private String city;
    private String address;
    private Double rating;
    private DentalSpecialty specialty; //only for dentists
    private Role role;
    private LocalDateTime createdAt;


    public User(String email, String username,String password, String phone, Role role) {
        this.id = UUID.randomUUID();
        this.email = email;
        this.username = username;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }



}
