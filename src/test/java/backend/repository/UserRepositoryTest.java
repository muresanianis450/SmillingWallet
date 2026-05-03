package backend.repository;

import backend.enums.Role;
import backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = com.example.smillingwallet.SmilingWalletApplication.class)
@Transactional
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User patient;
    private User dentist;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        patient = new User("patient@test.com", "patient1", "pass123", "0700000001", Role.PATIENT);
        dentist = new User("dentist@test.com", "dentist1", "pass456", "0700000002", Role.DENTIST);

        userRepository.save(patient);
        userRepository.save(dentist);
    }

    // --- CRUD ---

    @Test
    void save_andFindById_works() {
        Optional<User> found = userRepository.findById(patient.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("patient@test.com");
    }

    @Test
    void update_works() {
        patient.setCity("Cluj");
        userRepository.save(patient);

        User updated = userRepository.findById(patient.getId()).orElseThrow();
        assertThat(updated.getCity()).isEqualTo("Cluj");
    }

    @Test
    void delete_works() {
        userRepository.delete(patient);
        assertThat(userRepository.findById(patient.getId())).isEmpty();
    }

    @Test
    void findAll_returnsAllUsers() {
        List<User> all = userRepository.findAll();
        assertThat(all).hasSize(2);
    }

    // --- Custom queries ---

    @Test
    void findByEmail_returnsCorrectUser() {
        Optional<User> found = userRepository.findByEmail("dentist@test.com");
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("dentist1");
    }

    @Test
    void findByEmail_unknownEmail_returnsEmpty() {
        assertThat(userRepository.findByEmail("nobody@test.com")).isEmpty();
    }

    @Test
    void findByUsername_returnsCorrectUser() {
        Optional<User> found = userRepository.findByUsername("patient1");
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("patient@test.com");
    }

    @Test
    void existsByEmail_trueForExisting() {
        assertThat(userRepository.existsByEmail("patient@test.com")).isTrue();
    }

    @Test
    void existsByEmail_falseForMissing() {
        assertThat(userRepository.existsByEmail("ghost@test.com")).isFalse();
    }

    @Test
    void findByRole_returnsDentistsOnly() {
        List<User> dentists = userRepository.findByRole(Role.DENTIST);
        assertThat(dentists).hasSize(1);
        assertThat(dentists.get(0).getEmail()).isEqualTo("dentist@test.com");
    }

    @Test
    void findByRole_returnsAllMatchingRole() {
        User anotherPatient = new User("p2@test.com", "patient2", "pass", "07", Role.PATIENT);
        userRepository.save(anotherPatient);

        List<User> patients = userRepository.findByRole(Role.PATIENT);
        assertThat(patients).hasSize(2);
    }
}