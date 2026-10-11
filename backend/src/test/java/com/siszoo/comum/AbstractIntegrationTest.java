package com.siszoo.comum;

import com.siszoo.TestcontainersConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// ApiTesteFixture vem aqui (e nao em cada classe) para nao multiplicar
// contextos Spring em cache — a chave do contexto inclui os @Import.
@Import({TestcontainersConfiguration.class, ApiTesteFixture.class})
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUpRestAssured() {
        RestAssured.port = port;
        RestAssured.basePath = "/";
    }
}
