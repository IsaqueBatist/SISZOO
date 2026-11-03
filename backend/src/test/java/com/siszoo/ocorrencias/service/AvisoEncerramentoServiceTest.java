package com.siszoo.ocorrencias.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.test.util.ReflectionTestUtils;

import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.ProvidenciaTomada;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class AvisoEncerramentoServiceTest {

    @Mock private OcorrenciaRepository ocorrenciaRepository;
    @Mock private DenuncianteRepository denuncianteRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private EmailService emailService;
    @Mock private EmailTemplateService emailTemplateService;
    @Mock private AuditoriaEventoService auditoriaEventoService;

    private final UUID ocorrenciaId = UUID.randomUUID();
    private Ocorrencia ocorrencia;
    private Denunciante denunciante;

    @BeforeEach
    void preparar() {
        ProvidenciaTomada providencia = new ProvidenciaTomada();
        providencia.setCodigo("captura_remocao");
        providencia.setNome("Captura e remoção");
        ocorrencia = new Ocorrencia();
        ocorrencia.setId(ocorrenciaId);
        ocorrencia.setProtocolo("045/2026");
        ocorrencia.setEndereco("Rua do Denunciado, 99");
        ocorrencia.setDescricao("Vizinho mantém cão preso sem água");
        ReflectionTestUtils.setField(ocorrencia, "statusOcorrencia", StatusOcorrencia.ENCERRADA);
        ReflectionTestUtils.setField(ocorrencia, "providenciaTomada", providencia);
        ReflectionTestUtils.setField(ocorrencia, "encerradaEm", LocalDateTime.of(2026, 9, 10, 14, 30));
        denunciante = new Denunciante();
        denunciante.setNome("Maria Souza");
        denunciante.setEmail("maria@exemplo.com");
        lenient().when(ocorrenciaRepository.findDetalheById(ocorrenciaId)).thenReturn(Optional.of(ocorrencia));
        lenient().when(denuncianteRepository.findByOcorrenciaId(ocorrenciaId)).thenReturn(Optional.of(denunciante));
        lenient().when(emailTemplateService.renderizarHtml(anyString(), any())).thenReturn("<p>html</p>");
        lenient().when(emailTemplateService.renderizarTexto(anyString(), any())).thenReturn("texto");
    }

    private AvisoEncerramentoService service(boolean habilitado) {
        return new AvisoEncerramentoService(ocorrenciaRepository, denuncianteRepository, usuarioRepository,
                emailService, emailTemplateService, auditoriaEventoService, habilitado);
    }

    @Test
    @DisplayName("denunciante identificado com e-mail recebe protocolo, data e providencia, sem dados de terceiros")
    void enviaSoProtocoloDataEProvidencia() {
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));

        service(true).avisarDenunciante(ocorrenciaId, null);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> variaveis = ArgumentCaptor.forClass(Map.class);
        verify(emailTemplateService).renderizarHtml(eq(AvisoEncerramentoService.TEMPLATE_EMAIL), variaveis.capture());
        assertThat(variaveis.getValue()).containsOnlyKeys("nome", "protocolo", "dataEncerramento", "providencia")
                .containsEntry("protocolo", "045/2026")
                .containsEntry("dataEncerramento", "10/09/2026")
                .containsEntry("providencia", "Captura e remoção");
        assertThat(variaveis.getValue().values().toString())
                .doesNotContain("Rua do Denunciado").doesNotContain("Vizinho mantém");
        verify(emailService).enviar(eq("maria@exemplo.com"), eq("SISZOO - Ocorrência 045/2026 encerrada"),
                anyString(), anyString());
        verify(auditoriaEventoService).registrar(any(), eq(AcaoAuditoria.NOTIFICACAO),
                eq(AvisoEncerramentoService.ENTIDADE_AUDITORIA), eq(ocorrenciaId), any(),
                eq(Map.of("protocolo", "045/2026", "destinatario", "m***@exemplo.com",
                        "resultado", AvisoEncerramentoService.ENVIADO)));
    }

    @Test
    @DisplayName("ocorrencia anonima nao envia nem audita")
    void anonimaNaoEnvia() {
        ocorrencia.setAnonima(true);

        service(true).avisarDenunciante(ocorrenciaId, null);

        verifyNoInteractions(emailService, auditoriaEventoService);
    }

    @Test
    @DisplayName("denunciante sem e-mail nao envia nem falha")
    void semEmailNaoEnvia() {
        denunciante.setEmail("  ");

        service(true).avisarDenunciante(ocorrenciaId, null);

        verifyNoInteractions(emailService, auditoriaEventoService);
    }

    @Test
    @DisplayName("falha de SMTP e auditada como FALHA")
    void falhaDeSmtpAuditada() {
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.failedFuture(new MailSendException("SMTP indisponivel")));

        service(true).avisarDenunciante(ocorrenciaId, null);

        verify(auditoriaEventoService).registrar(any(), eq(AcaoAuditoria.NOTIFICACAO),
                eq(AvisoEncerramentoService.ENTIDADE_AUDITORIA), eq(ocorrenciaId), any(),
                eq(Map.of("protocolo", "045/2026", "destinatario", "m***@exemplo.com",
                        "resultado", AvisoEncerramentoService.FALHA)));
    }

    @Test
    @DisplayName("com a configuracao desligada nao consulta nem envia")
    void desligadoNaoEnvia() {
        service(false).avisarDenunciante(ocorrenciaId, null);

        verifyNoInteractions(ocorrenciaRepository, emailService, auditoriaEventoService);
        verify(denuncianteRepository, never()).findByOcorrenciaId(any());
    }
}
