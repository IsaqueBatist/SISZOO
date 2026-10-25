package com.siszoo.comum.exception;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.service.LogCapturado;

import ch.qos.logback.classic.spi.ILoggingEvent;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

// Caracterizacao do GlobalExceptionHandler (T45, D1), gravada contra o codigo
// ANTES da consolidacao dos handlers e mantida sem alteracao depois dela.
//
// Para cada excecao que o handler trata hoje (76 de dominio e 3 do framework,
// com os ramos por nome de constraint e a subclasse DuplicateKeyException), e
// para as que ele NAO trata (acesso negado, corpo ilegivel, metodo nao
// suportado, erro inesperado — que nao podem passar a ser capturadas), fixa:
// status, Content-Type, corpo completo e o log do GlobalExceptionHandler
// (nivel, mensagem e excecao anexada). A referencia esta em
// src/test/resources/caracterizacao/global-exception-handler.json.
class GlobalExceptionHandlerCaracterizacaoIT extends AbstractIntegrationTest {

    static final String REFERENCIA = "/caracterizacao/global-exception-handler.json";
    static final JsonMapper JSON = JsonMapper.builder().build();
    // Unico campo que muda a cada execucao (corpo padrao do /error do Boot).
    private static final String CAMPO_VARIAVEL = "timestamp";

    @Autowired
    private ApiTesteFixture fixture;

    private String token;

    @BeforeEach
    void autenticar() {
        token = fixture.tokenAdmin("admin.caracterizacao@itu.sp.gov.br", "Caracterizacao");
    }

    static List<JsonNode> casos() throws IOException {
        try (InputStream entrada = GlobalExceptionHandlerCaracterizacaoIT.class.getResourceAsStream(REFERENCIA)) {
            List<JsonNode> casos = new ArrayList<>();
            JSON.readTree(entrada).get("casos").forEach(casos::add);
            return casos;
        }
    }

    @ParameterizedTest(name = "{index} {0}")
    @MethodSource("casos")
    void respostaELogIguaisAosDeAntesDaConsolidacao(JsonNode caso) {
        ObjectNode observado = executar(token, caso.get("requisicao"));
        ObjectNode esperado = (ObjectNode) caso.deepCopy();
        esperado.remove("id");
        esperado.remove("requisicao");

        assertThat(caso.get("id").asString(), observado, equalTo(esperado));
    }

    // Faz a requisicao do caso e devolve o que foi observado, no mesmo formato
    // da referencia: status, contentType, corpo e logs.
    static ObjectNode executar(String token, JsonNode requisicao) {
        try (LogCapturado log = LogCapturado.de(GlobalExceptionHandler.class)) {
            RequestSpecification spec = given().header("Authorization", "Bearer " + token);
            if (requisicao.hasNonNull("corpo")) {
                spec = spec.contentType("application/json").body(requisicao.get("corpo").asString());
            }
            Response resposta = spec.when().request(requisicao.get("metodo").asString(), requisicao.get("caminho").asString());

            ObjectNode observado = JSON.createObjectNode();
            observado.put("status", resposta.statusCode());
            observado.put("contentType", resposta.contentType());
            String corpo = resposta.asString();
            if (corpo.isEmpty()) {
                observado.putNull("corpo");
            } else {
                JsonNode arvore = JSON.readTree(corpo);
                if (arvore.isObject() && arvore.has(CAMPO_VARIAVEL)) {
                    ((ObjectNode) arvore).put(CAMPO_VARIAVEL, "<varia a cada execucao>");
                }
                observado.set("corpo", arvore);
            }
            ArrayNode logs = observado.putArray("logs");
            for (ILoggingEvent evento : log.eventos()) {
                ObjectNode linha = logs.addObject();
                linha.put("nivel", evento.getLevel().toString());
                linha.put("mensagem", evento.getFormattedMessage());
                if (evento.getThrowableProxy() == null) {
                    linha.putNull("excecao");
                } else {
                    linha.put("excecao", evento.getThrowableProxy().getClassName() + ": "
                            + evento.getThrowableProxy().getMessage());
                }
            }
            return observado;
        }
    }
}
