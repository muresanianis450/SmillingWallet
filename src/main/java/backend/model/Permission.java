package backend.model;


import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "permissions")

public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;
}
