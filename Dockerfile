FROM openjdk:17-jdk-slim
COPY target/booking-backend-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]