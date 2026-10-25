package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;

import io.restassured.http.ContentType;

// T45: as contagens anuais do dashboard e do relatorio anual deixaram de usar
// YEAR(col) = :ano (que impede o indice de data) e passaram a filtrar por
// intervalo [01/01, 31/12]. Fixa que o resultado e o da leitura antiga:
// processos nas bordas do ano caem no ano da propria data, e cada consulta
// bate com uma referencia SQL por EXTRACT(YEAR ...). Os anos 2011-2013 nao sao
// usados por nenhum outro teste do banco compartilhado.
class ContagemAnualProcessosIT extends AbstractIntegrationTest {

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProcessoSanitarioRepository processoRepository;

    @Autowired
    private AnimalAmostradoRepository amostraRepository;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        tokenAgente = fixture.tokenComCargo("agente.contagem.anual@itu.sp.gov.br", "Agente", "ContagemAnual",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[T45] bordas do ano: 31/12 e 01/01 entram no ano da propria data, igual a YEAR()")
    void bordasDoAno() {
        // (abertura, resultado): o ano do resultado pode ser outro, de proposito.
        abrirComResultadoNegativo(LocalDate.of(2011, 12, 31), LocalDate.of(2012, 12, 31));
        abrirComResultadoNegativo(LocalDate.of(2012, 1, 1), LocalDate.of(2013, 1, 1));
        abrirComResultadoNegativo(LocalDate.of(2012, 12, 31), LocalDate.of(2012, 12, 31));
        abrirComResultadoNegativo(LocalDate.of(2013, 1, 1), LocalDate.of(2013, 1, 1));

        assertThat(porCodigo(processoRepository.contarPorDoenca(2011)).get("raiva"), equalTo(1L));
        assertThat(porCodigo(processoRepository.contarPorDoenca(2012)).get("raiva"), equalTo(2L));
        assertThat(porCodigo(processoRepository.contarPorDoenca(2013)).get("raiva"), equalTo(1L));

        assertThat(porCodigo(amostraRepository.contarRaivaPorEspecie(2011)).get("canino"), equalTo(1L));
        assertThat(porCodigo(amostraRepository.contarRaivaPorEspecie(2012)).get("canino"), equalTo(2L));
        assertThat(porCodigo(amostraRepository.contarRaivaPorEspecie(2013)).get("canino"), equalTo(1L));

        assertThat(negativosDeRaiva(2011), equalTo(0L));
        assertThat(negativosDeRaiva(2012), equalTo(2L));
        assertThat(negativosDeRaiva(2013), equalTo(2L));

        for (int ano = 2011; ano <= 2013; ano++) {
            assertThat("contarPorDoenca(" + ano + ")", porCodigo(processoRepository.contarPorDoenca(ano)),
                    equalTo(referencia("SELECT d.codigo, count(*) FROM processo_sanitario p"
                            + " JOIN doenca d ON d.id = p.doenca_id"
                            + " WHERE EXTRACT(YEAR FROM p.data_abertura) = ? GROUP BY d.codigo", ano)));
            assertThat("contarRaivaPorEspecie(" + ano + ")", porCodigo(amostraRepository.contarRaivaPorEspecie(ano)),
                    equalTo(referencia("SELECT e.codigo, count(DISTINCT a.processo_id) FROM animal_amostrado a"
                            + " JOIN especie e ON e.id = a.especie_id JOIN processo_sanitario p ON p.id = a.processo_id"
                            + " JOIN doenca d ON d.id = p.doenca_id WHERE d.codigo = 'raiva'"
                            + " AND EXTRACT(YEAR FROM p.data_abertura) = ? GROUP BY e.codigo", ano)));
            assertThat("contarResultadosPorDoenca(" + ano + ")", negativosDeRaiva(ano),
                    equalTo(jdbcTemplate.queryForObject("SELECT count(*) FROM processo_sanitario p"
                            + " JOIN doenca d ON d.id = p.doenca_id"
                            + " JOIN resultado_laboratorial r ON r.id = p.resultado_laboratorial_id"
                            + " WHERE d.codigo = 'raiva' AND r.codigo = 'negativo'"
                            + " AND EXTRACT(YEAR FROM p.data_resultado) = ?", Long.class, ano)));
        }
    }

    private void abrirComResultadoNegativo(LocalDate dataAbertura, LocalDate dataResultado) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("dataAbertura", dataAbertura.toString());
        @SuppressWarnings("unchecked")
        Map<String, Object> amostra = ((List<Map<String, Object>>) corpo.get("amostras")).get(0);
        amostra.put("dataColeta", dataAbertura.toString());
        String id = fixture.postarProcesso(tokenAgente, corpo).then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch("/api/processos/" + id + "/status")
                .then().statusCode(200);
        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("resultado", "negativo", "dataResultado", dataResultado.toString()))
                .when().post("/api/processos/" + id + "/resultados")
                .then().statusCode(200);
    }

    private long negativosDeRaiva(int ano) {
        return processoRepository.contarResultadosPorDoenca(ano).stream()
                .filter(linha -> "raiva".equals(linha.getCodigo()))
                .mapToLong(linha -> linha.getNegativos())
                .sum();
    }

    private static Map<String, Long> porCodigo(List<ContagemCatalogoProjection> linhas) {
        return linhas.stream()
                .collect(Collectors.toMap(ContagemCatalogoProjection::getCodigo, ContagemCatalogoProjection::getQuantidade));
    }

    private Map<String, Long> referencia(String sql, int ano) {
        return jdbcTemplate.query(sql, (linha, i) -> Map.entry(linha.getString(1), linha.getLong(2)), ano).stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
}
