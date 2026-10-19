package com.siszoo.animais;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.fail;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.TipoBaiaRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// Capacidade da baia sob cadastros simultaneos (DER §3.2: baia_id so em baia
// com ocupacao < capacidade). Mesma tecnica de OcorrenciaTransacaoIT (T30):
// uma conexao do teste trava a linha da baia (FOR UPDATE) e so a libera
// quando pg_stat_activity mostra as N requisicoes esperando por ela ao mesmo
// tempo. Sem trava no servico, cada requisicao ja contou a ocupacao e para
// no INSERT do animal (a FK para baia pede FOR KEY SHARE); com a trava, para
// antes de contar. Liberada a linha, as N disputam a ultima vaga de fato.
class BaiaConcorrenciaIT extends AbstractIntegrationTest {

    private static final int CADASTROS_CONCORRENTES = 4;
    private static final int TIMEOUT_SEGUNDOS = 60;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private BaiaRepository baiaRepository;

    @Autowired
    private TipoBaiaRepository tipoBaiaRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @Test
    void cadastrosSimultaneosNaUltimaVagaNaoPassamDaCapacidade() throws Exception {
        String token = fixture.tokenAdmin("teste.admin.baia.concorrencia@itu.sp.gov.br", "Concorrencia");
        Baia baia = new Baia();
        baia.setNome("Concorrencia " + UUID.randomUUID().toString().substring(0, 8));
        baia.setTipoBaia(tipoBaiaRepository.findByCodigo("interna").orElseThrow());
        baia.setCapacidade((short) 2);
        baiaRepository.save(baia);
        postar(token, baia.getId()).then().statusCode(200);

        List<Response> respostas = postarEmParalelo(token, baia.getId());

        long aceitos = respostas.stream().filter(r -> r.statusCode() == 200).count();
        long recusados = respostas.stream()
                .filter(r -> r.statusCode() == 409
                        && "Baia informada ja atingiu a capacidade".equals(r.path("mensagem")))
                .count();
        assertThat("respostas: " + respostas.stream().map(Response::statusCode).toList(), aceitos, equalTo(1L));
        assertThat(recusados, equalTo((long) CADASTROS_CONCORRENTES - 1));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT count(*) FROM animal WHERE baia_id = ?", Integer.class, baia.getId()), equalTo(2));
    }

    private Response postar(String token, UUID baiaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "nome", "Disputa", "especie", "canino", "sexo", "macho", "esterilizado", false,
                        "status", "em_tratamento", "motivoEntrada", "resgate",
                        "dataEntrada", "2026-09-10T09:00:00", "baiaId", baiaId.toString()))
                .when()
                .post("/api/animais");
    }

    private List<Response> postarEmParalelo(String token, UUID baiaId) throws Exception {
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(CADASTROS_CONCORRENTES);
        try (Connection bloqueio = dataSource.getConnection()) {
            bloqueio.setAutoCommit(false);
            int pidBloqueio = pidDe(bloqueio);
            List<Future<Response>> futuros = new ArrayList<>();
            // O rollback fica no finally: libera as requisicoes presas tambem
            // quando a espera falha.
            try {
                try (PreparedStatement trava = bloqueio.prepareStatement(
                        "SELECT 1 FROM baia WHERE id = ? FOR UPDATE")) {
                    trava.setObject(1, baiaId);
                    trava.executeQuery().close();
                }
                for (int i = 0; i < CADASTROS_CONCORRENTES; i++) {
                    futuros.add(executor.submit(() -> {
                        if (!largada.await(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS)) {
                            throw new IllegalStateException("largada nao liberada");
                        }
                        return postar(token, baiaId);
                    }));
                }
                largada.countDown();
                aguardarBloqueadas(futuros, pidBloqueio);
            } finally {
                bloqueio.rollback();
            }

            List<Response> respostas = new ArrayList<>();
            for (Future<Response> futuro : futuros) {
                try {
                    respostas.add(futuro.get(TIMEOUT_SEGUNDOS, TimeUnit.SECONDS));
                } catch (TimeoutException e) {
                    fail("POST /api/animais nao terminou em " + TIMEOUT_SEGUNDOS + " s (bloqueio ou deadlock?)");
                }
            }
            return respostas;
        } finally {
            executor.shutdownNow();
            executor.awaitTermination(10, TimeUnit.SECONDS);
        }
    }

    private static int pidDe(Connection conexao) throws Exception {
        try (Statement consulta = conexao.createStatement();
                ResultSet resultado = consulta.executeQuery("SELECT pg_backend_pid()")) {
            resultado.next();
            return resultado.getInt(1);
        }
    }

    // Conta as sessoes presas pela conexao bloqueadora, direta ou
    // indiretamente: varias sessoes na fila da mesma linha esperam a primeira
    // da fila (pg_blocking_pids aponta para ela), nao o dono da trava. Uma
    // requisicao que termina antes nao disputou a vaga com as demais.
    private void aguardarBloqueadas(List<Future<Response>> futuros, int pidBloqueio) throws Exception {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(TIMEOUT_SEGUNDOS);
        int bloqueadas = 0;
        while (System.nanoTime() < limite) {
            for (Future<Response> futuro : futuros) {
                if (futuro.isDone()) {
                    throw new AssertionError("Uma requisicao terminou sem esperar as demais: " + futuro.get().asString());
                }
            }
            bloqueadas = jdbcTemplate.queryForObject("""
                    WITH RECURSIVE presas(pid) AS (
                        SELECT pid FROM pg_stat_activity
                        WHERE state = 'active' AND ? = ANY(pg_blocking_pids(pid))
                        UNION
                        SELECT a.pid FROM pg_stat_activity a
                        JOIN presas p ON p.pid = ANY(pg_blocking_pids(a.pid))
                        WHERE a.state = 'active'
                    )
                    SELECT count(*) FROM presas WHERE pid <> pg_backend_pid()
                    """, Integer.class, pidBloqueio);
            if (bloqueadas == futuros.size()) {
                return;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Esperadas " + futuros.size() + " requisicoes paradas na baia; vistas " + bloqueadas);
    }
}
