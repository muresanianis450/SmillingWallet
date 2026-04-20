package backend.repository;


import backend.enums.Role;
import backend.model.User;
import org.springframework.stereotype.Repository;


import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

@Repository
public class UserRepository {

    private final Map<UUID, User> store = new ConcurrentHashMap<>();

    public User save(User user) {
        store.put(user.getId(),user);
        return user;
    }

    public Optional<User> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public Optional<User> findByEmail(String email) {
        return store.values().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst();
    }

    public boolean existsByEmail(String email) {
        return store.values().stream()
                .anyMatch(u -> u.getEmail().equalsIgnoreCase(email));
    }

    public List<User> findAll(){
        return new ArrayList<>(store.values());
    }

    public List<User> findByRole(Role role) {
        return store.values().stream()
                .filter(u -> u.getRole() == role)
                .collect(Collectors.toList());
    }

    public Optional<User> findByUsername(String username) {
        return store.values().stream()
                .filter( u -> u.getUsername() == username)
                .findFirst();
    }
    public void deleteById(UUID id) {
        store.remove(id);
    }

    public boolean existsById(UUID id) {
        return store.containsKey(id);
    }

    public int count() {
        return store.size();
    }

    public void clear() {
        store.clear();
    }



}
