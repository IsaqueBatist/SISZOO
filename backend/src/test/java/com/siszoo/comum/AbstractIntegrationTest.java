package com.siszoo.comum;

import com.siszoo.TestcontainersConfiguration;
import com.siszoo.comum.exception.ScaffoldExcecoesController;
import com.siszoo.comum.exception.ScaffoldViolacaoIntegridadeController;
import com.siszoo.comum.security.TesteProtegidoController;
import com.siszoo.comum.security.rbac.ScaffoldCriarUsuarioController;
import com.siszoo.comum.security.rbac.ScaffoldListarUsuariosController;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import({
        TestcontainersConfiguration.class,
        ApiTesteFixture.class,
        SenhaRapidaTesteConfig.class,
        TesteProtegidoController.class,
        ScaffoldViolacaoIntegridadeController.class,
        ScaffoldExcecoesController.class,
        ScaffoldCriarUsuarioController.class,
        ScaffoldListarUsuariosController.class
})
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
