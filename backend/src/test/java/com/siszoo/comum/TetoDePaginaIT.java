package com.siszoo.comum;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;

// T45 (S4): toda listagem paginada aceita 1 <= tamanho <= 500. Fora disso,
// 422 no campo `tamanho` em vez de carregar a tabela inteira (tamanho grande)
// ou de 500 (tamanho 0, IllegalArgumentException do PageRequest). 500 e o
// maior tamanho que o frontend pede hoje e continua aceito.
class TetoDePaginaIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;

    @BeforeEach
    void autenticar() {
        tokenAdmin = fixture.tokenAdmin("teto.pagina@itu.sp.gov.br", "TetoPagina");
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {
            "/api/animais", "/api/baias", "/api/vacinacoes", "/api/procedimentos", "/api/prescricoes", "/api/exames",
            "/api/medicamentos", "/api/ocorrencias", "/api/processos", "/api/relatorios/historico", "/api/auditoria",
            "/api/usuarios"})
    void tamanhoForaDoIntervaloResponde422EAte500Aceita(String rota) {
        for (int tamanho : new int[] {0, 501}) {
            given().header("Authorization", "Bearer " + tokenAdmin)
                    .when().get(rota + "?pagina=0&tamanho=" + tamanho)
                    .then().statusCode(422)
                    .body("campos[0].campo", equalTo("tamanho"))
                    .body("campos[0].mensagem", equalTo("Tamanho de pagina deve estar entre 1 e 500"));
        }
        given().header("Authorization", "Bearer " + tokenAdmin)
                .when().get(rota + "?pagina=0&tamanho=500")
                .then().statusCode(200)
                .body("tamanho", equalTo(500));
    }
}
