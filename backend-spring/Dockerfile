FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Gradle 빌드 산출물 복사 (CI에서 빌드 후 COPY)
COPY build/libs/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV TZ=Asia/Seoul

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "app.jar"]
