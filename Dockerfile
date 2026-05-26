# ─── Stage 1: Build the Spring Boot JAR ──────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Cache the dependency layer — only re-downloads when pom.xml changes
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Compile & package (tests run in CI, not during image build)
COPY src src
RUN ./mvnw package -DskipTests -q


# ─── Stage 2: Lean runtime image ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

# Activate the production profile so application-prod.yml overrides the defaults
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
