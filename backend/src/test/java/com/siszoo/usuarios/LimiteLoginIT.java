package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.startsWith;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// Limite de tentativas do login com valores baixos num contexto
// proprio: o contexto compartilhado dos demais *IT usa limites altos, porque
// todos chegam de 127.0.0.1.
class LimiteLoginIT extends AbstractIntegrationTest {

    private static final String SENHA = "SenhaTeste123";

    @DynamicPropertySource
    static void limitesBaixos(DynamicPropertyRegistry registro) {
        registro.add("siszoo.login.limite.falhas-por-email", () -> 3);
        registro.add("siszoo.login.limite.falhas-por-ip", () -> 1000);
    }

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    private String contaAtiva() {
        String email = "limite." + UUID.randomUUID().toString().replaceAll("[^a-z]", "") + "x@itu.sp.gov.br";
        fixture.tokenAdmin(email, "Limite");
        return email;
    }

    @Test
    @DisplayName("tres senhas erradas bloqueiam o e-mail: a quarta tentativa recebe 429 mesmo com a senha certa")
    void bloqueiaDepoisDasFalhas() {
        String email = contaAtiva();
        String outroEmail = contaAtiva();
        // Baseline depois de criar as contas: a fixture faz um login ao cria-las.
        long loginsAntes = loginsAuditados();

        for (int i = 0; i < 3; i++) {
            login(email, "errada-" + i).then().statusCode(401);
        }
        login(email, SENHA).then().statusCode(429)
                .body("mensagem", startsWith("Muitas tentativas em pouco tempo"));
        login(email, "errada-x").then().statusCode(429);

        // Outro e-mail do mesmo IP continua entrando.
        login(outroEmail, SENHA).then().statusCode(200);
        // O 429 nao vira LOGIN na auditoria (so o login do outro e-mail).
        assertThat(loginsAuditados() - loginsAntes, equalTo(1L));
    }

    @Test
    @DisplayName("login correto zera as falhas anteriores do e-mail")
    void sucessoZeraOContador() {
        String email = contaAtiva();

        login(email, "errada").then().statusCode(401);
        login(email, "errada").then().statusCode(401);
        login(email, SENHA).then().statusCode(200);
        login(email, "errada").then().statusCode(401);
        login(email, "errada").then().statusCode(401);
        login(email, SENHA).then().statusCode(200);
    }

    @Test
    @DisplayName("e-mail sem conta tambem conta falhas, sem revelar que nao existe")
    void emailInexistenteSegueOMesmoLimite() {
        String email = "ninguem.limite@itu.sp.gov.br";
        for (int i = 0; i < 3; i++) {
            login(email, "qualquer").then().statusCode(401);
        }
        login(email, "qualquer").then().statusCode(429);
    }

    private static Response login(String email, String senha) {
        return given().contentType(ContentType.JSON).body(Map.of("email", email, "senha", senha)).post("/api/auth/login");
    }

    private long loginsAuditados() {
        return auditoriaEventoRepository.findAll().stream().filter(e -> e.getAcao() == AcaoAuditoria.LOGIN).count();
    }
}
