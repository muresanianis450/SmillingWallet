package backend.enums;

/** How a user authenticates. LOCAL = email + password; the rest are social logins. */
public enum AuthProvider {
    LOCAL,
    GOOGLE,
    APPLE
}
