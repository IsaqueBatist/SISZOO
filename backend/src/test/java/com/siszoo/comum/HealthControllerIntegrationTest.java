package com.siszoo.comum;

import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

class HealthControllerIntegrationTest extends AbstractIntegrationTest {

    @Test
    void deveResponderStatusUp() {
        given()
                .when()
                .get("/api/health")
                .then()
                .statusCode(200)
                .body("status", equalTo("UP"));
    }
}
