package com.siszoo.ocorrencias.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

// Eventos de acesso a dado de denunciante de ocorrencia sigilosa, gerados pelo
// detalhe (OcorrenciaConsultaService.buscarPorId) e pelo download de anexo
// (AnexoOcorrenciaService.baixarAnexo). Sem @Transactional e sem lancar
// AccessDeniedException: grava na transacao de quem chama, que e a mais
// externa e decide o rollback (o 403 do download e lancado por baixarAnexo,
// com noRollbackFor, depois de o ACESSO_NEGADO estar gravado).
@Component
public class AuditoriaSigiloOcorrencia {

    private final AuditoriaEventoService auditoriaEventoService;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaSigiloOcorrencia(AuditoriaEventoService auditoriaEventoService, UsuarioRepository usuarioRepository) {
        this.auditoriaEventoService = auditoriaEventoService;
        this.usuarioRepository = usuarioRepository;
    }

    // T26: acesso autorizado a dado de denunciante sigiloso. O payload so leva
    // o id da ocorrencia — nenhum dado pessoal (D23).
    public void registrarVisualizacao(PermissoesOcorrencia permissoes, String entidade, UUID entidadeId,
            UUID ocorrenciaId) {
        auditoriaEventoService.registrar(autor(permissoes), AcaoAuditoria.VISUALIZACAO,
                entidade, entidadeId, null, Map.of("ocorrenciaId", ocorrenciaId));
    }

    // T43: acesso ao dado de denunciante sigiloso recusado pela regra de
    // sigilo. Mesmo payload da VISUALIZACAO (so o id da ocorrencia). Gravado
    // com flush antes da resposta: falha vira 500, nunca 409 nem entrega.
    public void registrarAcessoNegado(PermissoesOcorrencia permissoes, String entidade, UUID entidadeId,
            UUID ocorrenciaId) {
        auditoriaEventoService.registrarImediato(autor(permissoes), AcaoAuditoria.ACESSO_NEGADO,
                entidade, entidadeId, null, Map.of("ocorrenciaId", ocorrenciaId));
    }

    private Usuario autor(PermissoesOcorrencia permissoes) {
        return usuarioRepository.findById(permissoes.usuarioId()).orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
