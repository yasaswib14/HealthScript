package com.prescription;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.prescription.repository")
@EntityScan(basePackages = "com.prescription.model")
public class DigitalPrescriptionApplication {
    public static void main(String[] args) {
        SpringApplication.run(DigitalPrescriptionApplication.class, args);
    }
}
