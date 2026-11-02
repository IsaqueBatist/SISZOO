package com.siszoo.usuarios.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.dto.OpcoesFiltroAuditoriaResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Modulo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.FalhaAuditoriaException;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import com.siszoo.usuarios.mapper.AuditoriaEventoMapper;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;

import tools.jackson.databind.ObjectMapper;

@Service
public class AuditoriaEventoService {

    private static final Sort ORDEM_LISTAGEM = Sort.by(Sort.Direction.DESC, "ocorreuEm", "id");

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
    public void registrar(Usuario usuario, AcaoAuditoria acao, String entidade, UUID entidadeId,
            Object payloadAntes, Object payloadDepois) {
        auditoriaEventoRepository.save(novoEvento(usuario, acao, entidade, entidadeId, payloadAntes, payloadDepois));
    }

    @Transactional
    public void registrarImediato(Usuario usuario, AcaoAuditoria acao, String entidade, UUID entidadeId,
            Object payloadAntes, Object payloadDepois) {
        AuditoriaEvento evento = novoEvento(usuario, acao, entidade, entidadeId, payloadAntes, payloadDepois);
        try {
            auditoriaEventoRepository.saveAndFlush(evento);
        } catch (DataAccessException e) {
            throw new FalhaAuditoriaException(e);
        }
    }

    private AuditoriaEvento novoEvento(Usuario usuario, AcaoAuditoria acao, String entidade, UUID entidadeId,
            Object payloadAntes, Object payloadDepois) {
        AuditoriaEvento evento = new AuditoriaEvento();
        evento.setUsuario(usuario);
        evento.setAcao(acao);
        evento.setEntidade(entidade);
        evento.setEntidadeId(entidadeId);
        evento.setPayloadAntes(serializar(payloadAntes));
        evento.setPayloadDepois(serializar(payloadDepois));
        evento.setIp(ipDaRequisicao());
        return evento;
    }

    private static String ipDaRequisicao() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes atributos)) {
            return null;
        }
        String ip = atributos.getRequest().getRemoteAddr();
        if (ip == null) {
            return null;
        }
        int zona = ip.indexOf('%');
        return zona < 0 ? ip : ip.substring(0, zona);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AuditoriaEventoResponse> listar(FiltroAuditoria filtro, int pagina, int tamanho) {
        Specification<AuditoriaEvento> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (filtro.acao() != null) {
                p.add(cb.equal(root.get("acao"), filtro.acao()));
            }
            if (StringUtils.hasText(filtro.usuarioEmail())) {
                p.add(cb.equal(root.join("usuario", JoinType.LEFT).get("email"), filtro.usuarioEmail().trim()));
            }
            if (filtro.modulo() != null) {
                p.add(root.get("entidade").in(entidadesDoModulo(filtro.modulo())));
            }
            if (filtro.de() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("ocorreuEm"), filtro.de().atStartOfDay()));
            }
            if (filtro.ate() != null) {
                p.add(cb.lessThan(root.get("ocorreuEm"), filtro.ate().plusDays(1).atStartOfDay()));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
        Page<AuditoriaEvento> page = auditoriaEventoRepository.findAll(spec,
                Paginacao.pagina(pagina, tamanho, ORDEM_LISTAGEM));
        return PaginaResponse.de(page.map(auditoriaEventoMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public OpcoesFiltroAuditoriaResponse opcoesFiltro() {
        return new OpcoesFiltroAuditoriaResponse(
                auditoriaEventoRepository.acoesDistintas(),
                auditoriaEventoRepository.usuariosDistintos(),
                List.of(Modulo.values()));
    }

    public record FiltroAuditoria(AcaoAuditoria acao, String usuarioEmail, Modulo modulo, LocalDate de, LocalDate ate) {
    }

    private static final Map<Modulo, List<String>> ENTIDADES_POR_MODULO = Map.of(
            Modulo.USUARIOS_ACESSO, List.of("usuario", "preferencia_usuario", "sessao_usuario"),
            Modulo.GESTAO_ANIMAIS, List.of("animal", "baia", "vacinacao", "procedimento", "prescricao", "medicamento",
                    "exame", "anexo_animal"),
            Modulo.OCORRENCIAS_DENUNCIAS, List.of("ocorrencia", "denunciante", "anexo_ocorrencia",
                    "movimentacao_ocorrencia"),
            Modulo.PROCESSOS_SANITARIOS, List.of("processo_sanitario"),
            Modulo.RELATORIOS, List.of("relatorio_gerado"));

    private static List<String> entidadesDoModulo(Modulo modulo) {
        return ENTIDADES_POR_MODULO.getOrDefault(modulo, List.of("__nenhuma__"));
    }

    @Transactional(readOnly = true)
    public List<AuditoriaEventoResponse> listarPorEntidade(String entidade, UUID entidadeId) {
        return auditoriaEventoRepository.findByEntidadeAndEntidadeIdOrderByOcorreuEmAsc(entidade, entidadeId).stream()
                .map(auditoriaEventoMapper::toResponse)
                .toList();
    }

    private String serializar(Object payload) {
        return payload == null ? null : objectMapper.writeValueAsString(payload);
    }
}
