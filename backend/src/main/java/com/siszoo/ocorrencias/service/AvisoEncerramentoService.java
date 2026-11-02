package com.siszoo.ocorrencias.service;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@Service
public class AvisoEncerramentoService {

    static final String TEMPLATE_EMAIL = "email/encerramento-ocorrencia";
    static final String ENTIDADE_AUDITORIA = "aviso_encerramento_ocorrencia";
    static final String ENVIADO = "ENVIADO";
    static final String FALHA = "FALHA";
    static final String NAO_SUBMETIDO = "NAO_SUBMETIDO";

    private static final Logger log = LoggerFactory.getLogger(AvisoEncerramentoService.class);
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final OcorrenciaRepository ocorrenciaRepository;
    private final DenuncianteRepository denuncianteRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final boolean habilitado;

    public AvisoEncerramentoService(
            OcorrenciaRepository ocorrenciaRepository,
            DenuncianteRepository denuncianteRepository,
            UsuarioRepository usuarioRepository,
            EmailService emailService,
            EmailTemplateService emailTemplateService,
            AuditoriaEventoService auditoriaEventoService,
            @Value("${siszoo.ocorrencia.aviso-encerramento:true}") boolean habilitado) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.denuncianteRepository = denuncianteRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.habilitado = habilitado;
    }

    @Transactional
    public void avisarDenunciante(UUID ocorrenciaId, UUID autorId) {
        if (!habilitado) {
            return;
        }
        Ocorrencia ocorrencia = ocorrenciaRepository.findDetalheById(ocorrenciaId).orElse(null);
        if (ocorrencia == null || ocorrencia.isAnonima() || !ocorrencia.isEncerrada()
                || ocorrencia.getProvidenciaTomada() == null) {
            return;
        }
        Denunciante denunciante = denuncianteRepository.findByOcorrenciaId(ocorrenciaId).orElse(null);
        if (denunciante == null || !StringUtils.hasText(denunciante.getEmail())) {
            return;
        }

        Map<String, Object> variaveis = new LinkedHashMap<>();
        variaveis.put("nome", StringUtils.hasText(denunciante.getNome()) ? denunciante.getNome() : "munícipe");
        variaveis.put("protocolo", ocorrencia.getProtocolo());
        variaveis.put("dataEncerramento", ocorrencia.getEncerradaEm().format(DATA_BR));
        variaveis.put("providencia", ocorrencia.getProvidenciaTomada().getNome());

        String protocolo = ocorrencia.getProtocolo();
        String destinatario = EmailService.mascarar(denunciante.getEmail());
        Usuario autor = autorId == null ? null : usuarioRepository.findById(autorId).orElse(null);
        CompletableFuture<Void> envio;
        try {
            envio = emailService.enviar(
                    denunciante.getEmail(),
                    "SISZOO - Ocorrência " + protocolo + " encerrada",
                    emailTemplateService.renderizarHtml(TEMPLATE_EMAIL, variaveis),
                    emailTemplateService.renderizarTexto(TEMPLATE_EMAIL, variaveis));
        } catch (TaskRejectedException ex) {
            log.warn("Aviso de encerramento da ocorrencia {} nao submetido: executor recusou a tarefa", protocolo);
            auditar(autor, ocorrenciaId, protocolo, destinatario, NAO_SUBMETIDO);
            return;
        } catch (RuntimeException ex) {
            log.warn("Aviso de encerramento da ocorrencia {} falhou antes do envio: {}",
                    protocolo, ex.getClass().getSimpleName());
            auditar(autor, ocorrenciaId, protocolo, destinatario, FALHA);
            return;
        }
        envio.whenComplete((ok, falha) -> auditar(autor, ocorrenciaId, protocolo, destinatario,
                falha == null ? ENVIADO : FALHA));
    }

    private void auditar(Usuario autor, UUID ocorrenciaId, String protocolo, String destinatario, String resultado) {
        Map<String, Object> registro = new LinkedHashMap<>();
        registro.put("protocolo", protocolo);
        registro.put("destinatario", destinatario);
        registro.put("resultado", resultado);
        try {
            auditoriaEventoService.registrar(autor, AcaoAuditoria.NOTIFICACAO, ENTIDADE_AUDITORIA, ocorrenciaId,
                    null, registro);
        } catch (RuntimeException ex) {
            log.warn("Resultado {} do aviso de encerramento da ocorrencia {} nao foi auditado: {}",
                    resultado, protocolo, ex.getClass().getSimpleName());
        }
    }
}
