package com.siszoo.seed;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StringUtils;

import com.siszoo.usuarios.dto.AtualizarStatusUsuarioRequest;
import com.siszoo.usuarios.dto.CriarUsuarioRequest;
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuthService;
import com.siszoo.usuarios.service.AutoridadeService;
import com.siszoo.usuarios.service.UsuarioService;

// Usuarios ficticios de cada perfil, criados pelo admin bootstrap
// (DataSeeder, siszoo.admin.email) pelo mesmo caminho do POST /api/usuarios:
// politica de senha, hash do PasswordEncoder e auditoria reais. A troca de
// senha (AuthService) marca senha_alterada_em, para o login nao cair no
// primeiro acesso — exceto no usuario "primeiro acesso", de proposito.
class UsuariosSeed {

    // Senha unica e ficticia de todos os usuarios do seed, documentada no
    // README (secao "Dados ficticios"). Atende a PoliticaSenha de todos eles.
    static final String SENHA_FICTICIA = "Ficticio#2026";
    static final String SUFIXO_EMAIL = ".seed@itu.sp.gov.br";

    static final String ADMINISTRADOR = "Administrador";
    static final String VETERINARIO = "Veterinário";
    static final String AGENTE = "Agente Sanitário";

    record PlanoUsuario(String chave, String nome, String sobrenome, String cargo, String crmv,
            boolean primeiroAcesso, boolean inativo) {

        // Padrao institucional so aceita [a-z.]: "Sérgio" vira "sergio".
        String email() {
            String semAcento = Normalizer.normalize(nome + "." + sobrenome, Normalizer.Form.NFD)
                    .replaceAll("\\p{M}", "");
            return semAcento.toLowerCase(Locale.ROOT) + SUFIXO_EMAIL;
        }
    }

    static final List<PlanoUsuario> PLANO = List.of(
            new PlanoUsuario("usuario:admin", "Marta", "Siqueira", ADMINISTRADOR, null, false, false),
            new PlanoUsuario("usuario:vet-1", "Renato", "Albuquerque", VETERINARIO, "SP-99001", false, false),
            new PlanoUsuario("usuario:vet-2", "Camila", "Prado", VETERINARIO, "SP-99002", false, false),
            new PlanoUsuario("usuario:vet-3", "Helena", "Duarte", VETERINARIO, "SP-99003", true, false),
            new PlanoUsuario("usuario:agente-1", "Paulo", "Teixeira", AGENTE, null, false, false),
            new PlanoUsuario("usuario:agente-2", "Juliana", "Moreira", AGENTE, null, false, false),
            new PlanoUsuario("usuario:agente-3", "Rafael", "Campos", AGENTE, null, false, false),
            new PlanoUsuario("usuario:agente-4", "Sérgio", "Lacerda", AGENTE, null, false, true));

    // Quem faz cada tipo de trabalho no resto do seed.
    record Atores(SeedAtor admin, List<SeedAtor> veterinarios, List<SeedAtor> agentes) {

        SeedAtor veterinario(int indice) {
            return veterinarios.get(indice % veterinarios.size());
        }

        SeedAtor agente(int indice) {
            return agentes.get(indice % agentes.size());
        }
    }

    private final SeedExecutor executor;
    private final UsuarioService usuarioService;
    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final AutoridadeService autoridadeService;
    private final JdbcTemplate jdbcTemplate;
    private final String emailAdminBootstrap;

    UsuariosSeed(SeedExecutor executor, UsuarioService usuarioService, AuthService authService,
            UsuarioRepository usuarioRepository, AutoridadeService autoridadeService, JdbcTemplate jdbcTemplate,
            @Value("${siszoo.admin.email:}") String emailAdminBootstrap) {
        this.executor = executor;
        this.usuarioService = usuarioService;
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.autoridadeService = autoridadeService;
        this.jdbcTemplate = jdbcTemplate;
        this.emailAdminBootstrap = emailAdminBootstrap;
    }

    String emailAdminBootstrap() {
        return emailAdminBootstrap;
    }

    SeedAtor adminBootstrap() {
        Usuario admin = Optional.ofNullable(StringUtils.hasText(emailAdminBootstrap) ? emailAdminBootstrap : null)
                .flatMap(usuarioRepository::findByEmail)
                .orElseThrow(() -> new IllegalStateException("Seed: o administrador inicial nao existe. Defina"
                        + " ADMIN_SEED_EMAIL e ADMIN_SEED_PASSWORD (DataSeeder) antes de ligar o seed."));
        return ator(admin.getId());
    }

    // Um passo (chave + transacao propria) por chamada de service, como uma
    // requisicao HTTP por acao na API: criar, trocar a senha, desativar.
    Atores executar() {
        SeedAtor bootstrap = adminBootstrap();
        for (PlanoUsuario plano : PLANO) {
            UUID id = executor.garantir(plano.chave(), "usuario",
                    () -> usuarioRepository.findByEmail(plano.email()).map(Usuario::getId),
                    () -> criar(plano, bootstrap));
            if (!plano.primeiroAcesso()) {
                executor.garantir(plano.chave() + ":senha", "usuario_senha", () -> {
                    authService.trocarSenha(id, executor.valido(new TrocarSenhaRequest(SENHA_FICTICIA, SENHA_FICTICIA)));
                    return id;
                });
            }
            if (plano.inativo()) {
                executor.garantir(plano.chave() + ":inativo", "usuario_status", () -> bootstrap.executar(
                        "USUARIOS_ACESSO:escrita", () -> usuarioService.alterarStatus(
                                id, executor.valido(new AtualizarStatusUsuarioRequest(false)), bootstrap.id()).id()));
            }
        }
        return atores();
    }

    Atores atores() {
        List<PlanoUsuario> ativos = PLANO.stream().filter(p -> !p.inativo() && !p.primeiroAcesso()).toList();
        SeedAtor admin = ator(executor.idObrigatorio("usuario:admin"));
        List<SeedAtor> veterinarios = ativos.stream().filter(p -> VETERINARIO.equals(p.cargo()))
                .map(p -> ator(executor.idObrigatorio(p.chave()))).toList();
        List<SeedAtor> agentes = ativos.stream().filter(p -> AGENTE.equals(p.cargo()))
                .map(p -> ator(executor.idObrigatorio(p.chave()))).toList();
        return new Atores(admin, veterinarios, agentes);
    }

    private UUID criar(PlanoUsuario plano, SeedAtor bootstrap) {
        CriarUsuarioRequest request = executor.valido(new CriarUsuarioRequest(
                plano.nome(), plano.sobrenome(), plano.email(), plano.cargo(), plano.crmv(), null, SENHA_FICTICIA));
        return bootstrap.executar("USUARIOS_ACESSO:escrita", () -> usuarioService.criar(request, bootstrap.id()).id());
    }

    // Mesma resolucao do JwtAuthenticationFilter: cargos do usuario -> autoridades.
    private SeedAtor ator(UUID usuarioId) {
        List<String> cargos = jdbcTemplate.queryForList(
                "SELECT c.nome FROM usuario_cargo uc JOIN cargo c ON c.id = uc.cargo_id WHERE uc.usuario_id = ?",
                String.class, usuarioId);
        return new SeedAtor(usuarioId, String.join(",", cargos), autoridadeService.resolverAutoridades(cargos));
    }
}
