package com.siszoo.usuarios.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.mapper.AuditoriaEventoMapper;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;

import tools.jackson.databind.ObjectMapper;

@Service
public class AuditoriaEventoService {

    private final AuditoriaEventoRepository auditoriaEventoRepository;
    private final AuditoriaEventoMapper auditoriaEventoMapper;
    private final ObjectMapper objectMapper;

    public AuditoriaEventoService(
            AuditoriaEventoRepository auditoriaEventoRepository,
            AuditoriaEventoMapper auditoriaEventoMapper,
            ObjectMapper objectMapper) {
        this.auditoriaEventoRepository = auditoriaEventoRepository;
        this.auditoriaEventoMapper = auditoriaEventoMapper;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void registrar(Usuario usuario, AcaoAuditoria acao, String entidade, Object payloadAntes, Object payloadDepois) {
        AuditoriaEvento evento = new AuditoriaEvento();
        evento.setUsuario(usuario);
        evento.setAcao(acao);
        evento.setEntidade(entidade);
        evento.setPayloadAntes(serializar(payloadAntes));
        evento.setPayloadDepois(serializar(payloadDepois));
        auditoriaEventoRepository.save(evento);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AuditoriaEventoResponse> listar(int pagina, int tamanho) {
        Page<AuditoriaEvento> page = auditoriaEventoRepository.findAll(
                PageRequest.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "ocorreuEm")));
        return PaginaResponse.de(page.map(auditoriaEventoMapper::toResponse));
    }

    private String serializar(Object payload) {
        // Jackson 3: writeValueAsString lança tools.jackson.core.JacksonException,
        // que é unchecked (extends RuntimeException) — nao precisa de try/catch.
        return payload == null ? null : objectMapper.writeValueAsString(payload);
    }
}
