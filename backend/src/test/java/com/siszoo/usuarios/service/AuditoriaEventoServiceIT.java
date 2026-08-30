package com.siszoo.usuarios.service;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

class AuditoriaEventoServiceIT extends AbstractIntegrationTest {

    @Autowired
    private AuditoriaEventoService auditoriaEventoService;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

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
                Map.of("ativo", true),
                Map.of("ativo", false));

        AuditoriaEvento evento = auditoriaEventoRepository.findAll().stream()
                .filter(e -> e.getUsuario() != null && e.getUsuario().getId().equals(usuario.getId()))
                .findFirst()
                .orElseThrow();

        assertThat(evento.getAcao(), equalTo(AcaoAuditoria.ATUALIZACAO));
        assertThat(evento.getEntidade(), equalTo("usuario"));
        assertThat(evento.getPayloadAntes(), equalTo("{\"ativo\":true}"));
        assertThat(evento.getPayloadDepois(), equalTo("{\"ativo\":false}"));
        assertThat(evento.getOcorreuEm(), notNullValue());
    }

    @Test
    void deveRegistrarEventoSemUsuarioEComPayloadsNulos() {
        auditoriaEventoService.registrar(null, AcaoAuditoria.LOGOUT, "usuario", null, null);

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

        auditoriaEventoService.registrar(usuario, AcaoAuditoria.CRIACAO, "usuario", null, null);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "usuario", null, null);

        PaginaResponse<AuditoriaEventoResponse> pagina = auditoriaEventoService.listar(0, 50);
        List<AuditoriaEventoResponse> itens = pagina.itens();

        assertThat(itens.size(), greaterThanOrEqualTo(2));
        for (int i = 0; i < itens.size() - 1; i++) {
            assertThat(!itens.get(i).ocorreuEm().isBefore(itens.get(i + 1).ocorreuEm()), equalTo(true));
        }
    }
}
