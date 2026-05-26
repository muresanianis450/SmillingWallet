# ─── Stage 1: Build the JAR ───────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy dependency descriptors first so Maven layer is cached unless pom.xml changes
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw.cmd ./

# Download all dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B --no-transfer-progress

# Copy source and build (skip tests — tests run in CI, not in image build)
COPY src ./src
RUN mvn package -DskipTests -B --no-transfer-progress


# ─── Stage 2: Minimal runtime image ──────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/*.jar app.jar

# 8080 = HTTP (SSL is terminated at the load balancer / nginx in front)
EXPOSE 8080

# JVM tuning for containers: respect cgroup memory limits, use G1GC
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-jar", "app.jar"]
