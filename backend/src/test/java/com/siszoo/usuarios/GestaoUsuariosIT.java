package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// Decisao funcional de 31/10/2026: o Administrador edita o cadastro e redefine a
// senha de usuarios, inclusive de outro Administrador, com auditoria.
class GestaoUsuariosIT extends AbstractIntegrationTest {

    private static final String SENHA_TEMPORARIA = "Tmp#Zoo2026!seg";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static String emailUnico(String prefixo) {
        return prefixo + "." + UUID.randomUUID().toString().replaceAll("[^a-z]", "") + "x@itu.sp.gov.br";
    }

    private String tokenAdmin() {
        return fixture.tokenAdmin(emailUnico("gestao.admin"), "Gestao");
    }

    private UUID idDe(String email) {
        return usuarioRepository.findByEmail(email).map(Usuario::getId).orElseThrow();
    }

    private record Pessoa(String email, UUID id, String token) {
    }

    private Pessoa pessoa(UUID cargoId) {
        String email = emailUnico("gestao.alvo");
        String token = fixture.tokenComCargo(email, "Maria", "Alvo", cargoId);
        return new Pessoa(email, idDe(email), token);
    }

    private static Response editar(String token, UUID id, Map<String, Object> corpo) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(corpo).put("/api/usuarios/" + id);
    }

    private static Response redefinir(String token, UUID id, String senha) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("senhaTemporaria", senha)).post("/api/usuarios/" + id + "/senha");
    }

    private static Map<String, Object> cadastro(String cargo, String crmv) {
        return crmv == null
                ? Map.of("nome", "Maria", "sobrenome", "Alvo Editada", "cargo", cargo, "telefone", "11 99999-0000")
                : Map.of("nome", "Maria", "sobrenome", "Alvo Editada", "cargo", cargo, "crmv", crmv);
    }

    private int statusDoProtegido(String token) {
        return given().header("Authorization", "Bearer " + token).get("/api/usuarios/me").statusCode();
    }

    @Test
    @DisplayName("administrador edita o cadastro, e a resposta traz o telefone")
    void editaCadastro() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        editar(tokenAdmin(), alvo.id(), cadastro("Agente Sanitário", null)).then().statusCode(200)
                .body("sobrenome", equalTo("Alvo Editada"))
                .body("telefone", equalTo("11 99999-0000"))
                .body("email", equalTo(alvo.email()));
    }

    @Test
    @DisplayName("edicao valida os campos e exige CRMV de Veterinario")
    void validaCampos() {
        String admin = tokenAdmin();
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        editar(admin, alvo.id(), Map.of("nome", "", "sobrenome", "X", "cargo", "Agente Sanitário")).then().statusCode(422)
                .body("campos[0].campo", equalTo("nome"));
        editar(admin, alvo.id(), cadastro("Veterinário", null)).then().statusCode(422);
        editar(admin, alvo.id(), cadastro("Cargo que nao existe", null)).then().statusCode(422);
        editar(admin, UUID.randomUUID(), cadastro("Agente Sanitário", null)).then().statusCode(404);
    }

    @Test
    @DisplayName("mudar o cargo revoga as sessoes do alvo e vale no proximo login")
    void mudarCargoRevogaSessoes() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        editar(tokenAdmin(), alvo.id(), cadastro("Veterinário", "CRMV-SP 123")).then().statusCode(200)
                .body("cargos[0]", equalTo("Veterinário"));

        assertThat(statusDoProtegido(alvo.token()), equalTo(401));
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from usuario_cargo where usuario_id = ?", Integer.class, alvo.id()), equalTo(1));
    }

    @Test
    @DisplayName("editar sem mudar o cargo nao derruba a sessao do alvo")
    void editarSemMudarCargoMantemSessao() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        editar(tokenAdmin(), alvo.id(), cadastro("Agente Sanitário", null)).then().statusCode(200);

        assertThat(statusDoProtegido(alvo.token()), equalTo(200));
    }

    @Test
    @DisplayName("administrador nao muda o proprio cargo, mas edita os proprios dados")
    void proprioCargo() {
        String email = emailUnico("gestao.proprio");
        String token = fixture.tokenAdmin(email, "Proprio");

        editar(token, idDe(email), cadastro("Agente Sanitário", null)).then().statusCode(422);
        editar(token, idDe(email), cadastro("Administrador", null)).then().statusCode(200);
    }

    @Test
    @DisplayName("um administrador edita e redefine a senha de outro, e rebaixa quando ha outro ativo")
    void administradorSobreOutroAdministrador() {
        Pessoa outro = pessoa(ApiTesteFixture.CARGO_ADMINISTRADOR_ID);
        String admin = tokenAdmin();

        redefinir(admin, outro.id(), SENHA_TEMPORARIA).then().statusCode(204);
        editar(admin, outro.id(), cadastro("Agente Sanitário", null)).then().statusCode(200);
    }

    // Um administrador sempre tem outro ativo (ele mesmo), entao a recusa so e
    // alcancavel por quem tem a permissao sem ser Administrador, ou na corrida.
    @Test
    @DisplayName("ultimo administrador ativo nao pode ser rebaixado nem desativado")
    void ultimoAdministrador() {
        String tokenGestor = tokenDeGestorSemCargoAdministrador();
        Pessoa unico = pessoa(ApiTesteFixture.CARGO_ADMINISTRADOR_ID);
        List<UUID> outros = desativarAdministradoresExceto(unico.id());
        try {
            editar(tokenGestor, unico.id(), cadastro("Agente Sanitário", null)).then().statusCode(422);
            alterarStatus(tokenGestor, unico.id(), false).then().statusCode(422);
        } finally {
            reativar(outros);
        }
        assertThat(statusDoProtegido(unico.token()), equalTo(200));
    }

    @Test
    @DisplayName("dois administradores desativando um ao outro ao mesmo tempo: o sistema nao fica sem nenhum")
    void desativacaoCruzadaSimultanea() throws Exception {
        Pessoa a = pessoa(ApiTesteFixture.CARGO_ADMINISTRADOR_ID);
        Pessoa b = pessoa(ApiTesteFixture.CARGO_ADMINISTRADOR_ID);
        List<UUID> outros = desativarAdministradoresExceto(a.id(), b.id());
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch largada = new CountDownLatch(1);
            Future<Integer> aDesativaB = executor.submit(() -> {
                largada.await();
                return alterarStatus(a.token(), b.id(), false).statusCode();
            });
            Future<Integer> bDesativaA = executor.submit(() -> {
                largada.await();
                return alterarStatus(b.token(), a.id(), false).statusCode();
            });
            largada.countDown();
            aDesativaB.get();
            bDesativaA.get();

            assertThat(jdbcTemplate.queryForObject(
                    "select count(*) from usuario where ativo and id in (?, ?)", Integer.class, a.id(), b.id()),
                    greaterThanOrEqualTo(1));
        } finally {
            executor.shutdown();
            reativar(outros);
            reativar(List.of(a.id(), b.id()));
        }
    }

    private String tokenDeGestorSemCargoAdministrador() {
        UUID cargo = UUID.randomUUID();
        jdbcTemplate.update("insert into cargo (id, nome, descricao) values (?, ?, 'Cargo de teste')",
                cargo, "Gestor " + cargo);
        jdbcTemplate.update("""
                insert into cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao)
                values (?, 'USUARIOS_ACESSO', 'geral', true, true, false)
                """, cargo);
        return fixture.tokenComCargo(emailUnico("gestao.gestor"), "Gestor", "Teste", cargo);
    }

    // Banco compartilhado entre testes: os demais administradores saem do caminho.
    private List<UUID> desativarAdministradoresExceto(UUID... mantidos) {
        List<UUID> manter = List.of(mantidos);
        List<UUID> outros = jdbcTemplate.queryForList("""
                select u.id from usuario u join usuario_cargo uc on uc.usuario_id = u.id
                where uc.cargo_id = ? and u.ativo
                """, UUID.class, ApiTesteFixture.CARGO_ADMINISTRADOR_ID).stream()
                .filter(id -> !manter.contains(id))
                .toList();
        outros.forEach(id -> jdbcTemplate.update("update usuario set ativo = false where id = ?", id));
        return outros;
    }

    private void reativar(List<UUID> usuarios) {
        usuarios.forEach(id -> jdbcTemplate.update("update usuario set ativo = true where id = ?", id));
    }

    private static Response alterarStatus(String token, UUID id, boolean ativo) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("ativo", ativo)).patch("/api/usuarios/" + id + "/status");
    }

    @Test
    @DisplayName("redefinir: nao devolve senha, zera o primeiro acesso, derruba as sessoes e a temporaria entra")
    void redefineSenha() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        Response resposta = redefinir(tokenAdmin(), alvo.id(), SENHA_TEMPORARIA);

        resposta.then().statusCode(204);
        assertThat(resposta.asString(), equalTo(""));
        assertThat(statusDoProtegido(alvo.token()), equalTo(401));
        assertThat(usuarioRepository.findById(alvo.id()).orElseThrow().getSenhaAlteradaEm(), nullValue());
        assertThat(usuarioRepository.findById(alvo.id()).orElseThrow().getSenha(), not(containsString(SENHA_TEMPORARIA)));

        String tokenTemporario = fixture.login(alvo.email(), SENHA_TEMPORARIA);
        given().contentType(ContentType.JSON).body(Map.of("email", alvo.email(), "senha", "SenhaTeste123"))
                .post("/api/auth/login").then().statusCode(401);
        given().header("Authorization", "Bearer " + tokenTemporario).get("/api/usuarios/me")
                .then().statusCode(200).body("senhaAlteradaEm", nullValue());
    }

    @Test
    @DisplayName("senha temporaria: a API so libera a troca; depois de trocar, o acesso volta")
    void senhaTemporariaBloqueiaOSistema() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        redefinir(tokenAdmin(), alvo.id(), SENHA_TEMPORARIA).then().statusCode(204);
        String token = fixture.login(alvo.email(), SENHA_TEMPORARIA);

        given().header("Authorization", "Bearer " + token).get("/api/processos").then().statusCode(403)
                .body("mensagem", equalTo("Troque a sua senha temporária para continuar."));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(new TrocarSenhaRequest(SENHA_TEMPORARIA, SENHA_TEMPORARIA))
                .post("/api/auth/senha").then().statusCode(422)
                .body("campos[0].campo", equalTo("novaSenha"));

        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(new TrocarSenhaRequest("Definitiva#2026xz", "Definitiva#2026xz"))
                .post("/api/auth/senha").then().statusCode(204);
        given().header("Authorization", "Bearer " + token).get("/api/processos").then().statusCode(200);
    }

    @Test
    @DisplayName("redefinicao recusa a propria conta, senha fora da politica e usuario inexistente")
    void redefinicaoRecusas() {
        String email = emailUnico("gestao.autoredefine");
        String admin = fixture.tokenAdmin(email, "Auto");
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);

        redefinir(admin, idDe(email), SENHA_TEMPORARIA).then().statusCode(422);
        redefinir(admin, alvo.id(), "fraca").then().statusCode(422);
        redefinir(admin, alvo.id(), "abcdefghij").then().statusCode(422);
        redefinir(admin, UUID.randomUUID(), SENHA_TEMPORARIA).then().statusCode(404);
    }

    @Test
    @DisplayName("veterinario e agente recebem 403 nas duas operacoes")
    void semPermissao() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        for (UUID cargo : List.of(ApiTesteFixture.CARGO_VETERINARIO_ID, ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID)) {
            String token = pessoa(cargo).token();

            editar(token, alvo.id(), cadastro("Administrador", null)).then().statusCode(403);
            redefinir(token, alvo.id(), SENHA_TEMPORARIA).then().statusCode(403);
        }
        assertThat(statusDoProtegido(alvo.token()), equalTo(200));
    }

    @Test
    @DisplayName("auditoria: autor, antes/depois da edicao, sem telefone, hash nem senha")
    void auditaAsOperacoes() {
        Pessoa alvo = pessoa(ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String emailAdmin = emailUnico("gestao.auditora");
        String admin = fixture.tokenAdmin(emailAdmin, "Auditora");

        editar(admin, alvo.id(), cadastro("Agente Sanitário", null)).then().statusCode(200);
        redefinir(admin, alvo.id(), SENHA_TEMPORARIA).then().statusCode(204);

        List<Map<String, Object>> eventos = jdbcTemplate.queryForList("""
                select usuario_id, payload_antes::text as antes, payload_depois::text as depois
                from auditoria_evento where entidade = 'usuario' and entidade_id = ? and acao = 'ATUALIZACAO'
                order by ocorreu_em
                """, alvo.id());
        assertThat(eventos.size(), equalTo(2));
        assertThat(eventos.stream().map(evento -> evento.get("usuario_id")).distinct().toList(),
                containsInAnyOrder(idDe(emailAdmin)));

        String antes = (String) eventos.get(0).get("antes");
        String depois = (String) eventos.get(0).get("depois");
        assertThat(antes, containsString("\"sobrenome\": \"Alvo\""));
        assertThat(depois, containsString("\"sobrenome\": \"Alvo Editada\""));
        assertThat(depois, containsString("\"telefoneAlterado\": true"));
        assertThat(depois, not(containsString("99999")));

        String redefinicao = (String) eventos.get(1).get("depois");
        assertThat(redefinicao, containsString("\"senhaRedefinida\": true"));
        assertThat(redefinicao, not(containsString(SENHA_TEMPORARIA)));
        String hash = usuarioRepository.findById(alvo.id()).orElseThrow().getSenha();
        assertThat(redefinicao, not(containsString(hash)));
    }
}
