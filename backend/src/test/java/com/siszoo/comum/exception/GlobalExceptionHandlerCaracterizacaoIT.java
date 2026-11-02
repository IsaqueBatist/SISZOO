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

class GlobalExceptionHandlerCaracterizacaoIT extends AbstractIntegrationTest {

    static final String REFERENCIA = "/caracterizacao/global-exception-handler.json";
    static final JsonMapper JSON = JsonMapper.builder().build();
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
