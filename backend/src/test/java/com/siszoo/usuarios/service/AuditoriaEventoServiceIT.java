package com.siszoo.usuarios.service;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.mapper.AuditoriaEventoMapper;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import tools.jackson.databind.ObjectMapper;

class AuditoriaEventoServiceIT extends AbstractIntegrationTest {

    @Autowired
    private AuditoriaEventoService auditoriaEventoService;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditoriaEventoMapper auditoriaEventoMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Usuario criarUsuario(String email) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha("hash-irrelevante-para-este-teste");
        usuario.setNome("Teste");
        usuario.setSobrenome("Auditoria");
        return usuarioRepository.save(usuario);
    }

    @Test
    void deveRegistrarEventoComPayloadsSerializados() {
        Usuario usuario = criarUsuario("teste.auditoria.payload@itu.sp.gov.br");

        auditoriaEventoService.registrar(
                usuario,
                AcaoAuditoria.ATUALIZACAO,
                "usuario",
                null,
                Map.of("ativo", true),
                Map.of("ativo", false));

        AuditoriaEvento evento = auditoriaEventoRepository.findAll().stream()
                .filter(e -> e.getUsuario() != null && e.getUsuario().getId().equals(usuario.getId()))
                .findFirst()
                .orElseThrow();

        assertThat(evento.getAcao(), equalTo(AcaoAuditoria.ATUALIZACAO));
        assertThat(evento.getEntidade(), equalTo("usuario"));
        // Compara pelo conteúdo (via árvore JSON), não pela formatação exata da
        // string — o ObjectMapper pode variar espaçamento entre versões/config.
        assertThat(objectMapper.readTree(evento.getPayloadAntes()), equalTo(objectMapper.readTree("{\"ativo\":true}")));
        assertThat(objectMapper.readTree(evento.getPayloadDepois()), equalTo(objectMapper.readTree("{\"ativo\":false}")));
        assertThat(evento.getOcorreuEm(), notNullValue());
    }

    @Test
    void deveRegistrarEventoSemUsuarioEComPayloadsNulos() {
        auditoriaEventoService.registrar(null, AcaoAuditoria.LOGOUT, "usuario", null, null, null);

        AuditoriaEvento evento = auditoriaEventoRepository.findAll().stream()
                .filter(e -> e.getUsuario() == null && e.getAcao() == AcaoAuditoria.LOGOUT)
                .findFirst()
                .orElseThrow();

        assertThat(evento.getPayloadAntes(), nullValue());
        assertThat(evento.getPayloadDepois(), nullValue());
    }

    @Test
    void deveListarEventosPaginadosDoMaisRecenteParaOMaisAntigo() {
        Usuario usuario = criarUsuario("teste.auditoria.listagem@itu.sp.gov.br");

        auditoriaEventoService.registrar(usuario, AcaoAuditoria.CRIACAO, "usuario", null, null, null);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "usuario", null, null, null);

        PaginaResponse<AuditoriaEventoResponse> pagina = auditoriaEventoService.listar(0, 50);
        List<AuditoriaEventoResponse> itens = pagina.itens();

        assertThat(itens.size(), greaterThanOrEqualTo(2));
        for (int i = 0; i < itens.size() - 1; i++) {
            assertThat(!itens.get(i).ocorreuEm().isBefore(itens.get(i + 1).ocorreuEm()), equalTo(true));
        }
    }

    @Test
    void deveGravarEntidadeIdInformado() {
        Usuario usuario = criarUsuario("teste.auditoria.entidadeid@itu.sp.gov.br");

        auditoriaEventoService.registrar(usuario, AcaoAuditoria.CRIACAO, "usuario", usuario.getId(), null, null);

        AuditoriaEvento evento = auditoriaEventoRepository.findAll().stream()
                .filter(e -> e.getUsuario() != null && e.getUsuario().getId().equals(usuario.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(evento.getEntidadeId(), equalTo(usuario.getId()));
        AuditoriaEventoResponse response = auditoriaEventoService.listar(0, 50).itens().stream()
                .filter(r -> r.id().equals(evento.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(response.entidadeId(), equalTo(usuario.getId()));
    }

    @Test
    void deveLerEventoLegadoComEntidadeIdNulo() {
        // Simula linha anterior a V9: INSERT sem entidade_id. O payload traz um
        // id, mas nao ha backfill — entidade_id continua nulo.
        UUID idLegado = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO auditoria_evento (id, acao, entidade, payload_depois) VALUES (?, 'CRIACAO', 'vacinacao', ?::jsonb)",
                idLegado, "{\"id\":\"" + UUID.randomUUID() + "\"}");

        AuditoriaEvento evento = auditoriaEventoRepository.findById(idLegado).orElseThrow();
        AuditoriaEventoResponse response = auditoriaEventoMapper.toResponse(evento);

        assertThat(evento.getEntidadeId(), nullValue());
        assertThat(response.entidadeId(), nullValue());
        assertThat(response.entidade(), equalTo("vacinacao"));
        assertThat(auditoriaEventoService.listar(0, 50).itens(), notNullValue());
    }
}
