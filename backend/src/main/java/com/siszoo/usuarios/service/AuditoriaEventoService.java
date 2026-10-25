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

    // T43: grava o evento ja (flush), para quem lanca uma excecao logo depois
    // com noRollbackFor (ACESSO_NEGADO antes do 403). No registrar(), o INSERT
    // so sai no commit; se falhasse ali, a excecao do commit substituiria a do
    // chamador e uma violacao de integridade viraria 409. Aqui a falha sai
    // antes, como FalhaAuditoriaException (500), e desfaz a transacao. So para
    // transacoes sem outra escrita pendente: o flush levaria junto as escritas
    // do chamador e a traducao as atribuiria a auditoria.
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

    // T43: endereco do socket da requisicao HTTP em curso. O navegador fala
    // direto com o backend (porta 8080 publicada; o nginx do front so serve o
    // SPA) e nao ha server.forward-headers-strategy: X-Forwarded-For e
    // definido pelo cliente e nao e lido, para o IP nao poder ser forjado.
    // Fora de requisicao (envio assincrono da notificacao, DataSeeder), nulo.
    // A zona de um IPv6 link-local ("fe80::1%eth0") e so o indice da
    // interface local, nao parte do endereco, e poderia estourar ip varchar(45).
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
    public PaginaResponse<AuditoriaEventoResponse> listar(int pagina, int tamanho) {
        return listar(FiltroAuditoria.VAZIO, pagina, tamanho);
    }

    // F2-027 (Fase 3 do TG): filtros de servidor para a tela de Logs. Sem
    // parametros, comportamento anterior (so paginacao). `modulo` e derivado da
    // entidade (auditoria_evento nao guarda modulo): ver MODULO_POR_ENTIDADE.
    @Transactional(readOnly = true)
    public PaginaResponse<AuditoriaEventoResponse> listar(FiltroAuditoria filtro, int pagina, int tamanho) {
        Specification<AuditoriaEvento> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (filtro.acao() != null) {
                p.add(cb.equal(root.get("acao"), filtro.acao()));
            }
            if (StringUtils.hasText(filtro.entidade())) {
                p.add(cb.equal(root.get("entidade"), filtro.entidade().trim()));
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
                Paginacao.pagina(pagina, tamanho, Sort.by(Sort.Direction.DESC, "ocorreuEm")));
        return PaginaResponse.de(page.map(auditoriaEventoMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public OpcoesFiltroAuditoriaResponse opcoesFiltro() {
        return new OpcoesFiltroAuditoriaResponse(
                auditoriaEventoRepository.acoesDistintas(),
                auditoriaEventoRepository.entidadesDistintas(),
                auditoriaEventoRepository.usuariosDistintos(),
                List.of(Modulo.values()));
    }

    // Filtro da listagem (todos opcionais). `de`/`ate` sao dias inclusivos no fuso do sistema.
    public record FiltroAuditoria(AcaoAuditoria acao, String entidade, String usuarioEmail, Modulo modulo, LocalDate de, LocalDate ate) {
        static final FiltroAuditoria VAZIO = new FiltroAuditoria(null, null, null, null, null, null);
    }

    // Nomes de entidade usados nas chamadas de registrar(...) em cada modulo
    // (mesmo mapa do frontend, moduloDaEntidade.ts). Entidade nova sem mapa
    // simplesmente nao aparece no filtro por modulo.
    private static final Map<Modulo, List<String>> ENTIDADES_POR_MODULO = Map.of(
            Modulo.USUARIOS_ACESSO, List.of("usuario", "preferencia_usuario"),
            Modulo.GESTAO_ANIMAIS, List.of("animal", "baia", "vacinacao", "procedimento", "prescricao", "medicamento",
                    "exame", "anexo_animal"),
            Modulo.OCORRENCIAS_DENUNCIAS, List.of("ocorrencia", "denunciante", "anexo_ocorrencia",
                    "movimentacao_ocorrencia"),
            Modulo.PROCESSOS_SANITARIOS, List.of("processo_sanitario"),
            Modulo.RELATORIOS, List.of("relatorio_gerado"));

    private static List<String> entidadesDoModulo(Modulo modulo) {
        return ENTIDADES_POR_MODULO.getOrDefault(modulo, List.of("__nenhuma__"));
    }

    // T37: mini trilha de auditoria de uma entidade especifica (ex.: um
    // processo sanitario), sem paginacao — volume pequeno por entidade. Usado
    // por modulos que nao tem USUARIOS_ACESSO:leitura (so o Administrador
    // tem), protegidos pela propria autorizacao do modulo chamador.
    @Transactional(readOnly = true)
    public List<AuditoriaEventoResponse> listarPorEntidade(String entidade, UUID entidadeId) {
        return auditoriaEventoRepository.findByEntidadeAndEntidadeIdOrderByOcorreuEmAsc(entidade, entidadeId).stream()
                .map(auditoriaEventoMapper::toResponse)
                .toList();
    }

    private String serializar(Object payload) {
        // Jackson 3: writeValueAsString lança tools.jackson.core.JacksonException,
        // que é unchecked (extends RuntimeException) — nao precisa de try/catch.
        return payload == null ? null : objectMapper.writeValueAsString(payload);
    }
}
