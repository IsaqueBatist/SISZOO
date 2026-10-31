package com.siszoo.usuarios.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.usuarios.dto.AtualizarPerfilRequest;
import com.siszoo.usuarios.dto.AtualizarStatusUsuarioRequest;
import com.siszoo.usuarios.dto.AtualizarUsuarioRequest;
import com.siszoo.usuarios.dto.CriarUsuarioRequest;
import com.siszoo.usuarios.dto.RedefinirSenhaRequest;
import com.siszoo.usuarios.dto.UsuarioAuditoriaSnapshot;
import com.siszoo.usuarios.dto.UsuarioResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.MotivoEncerramentoSessao;
import com.siszoo.usuarios.entity.PreferenciaUsuario;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.entity.UsuarioCargoId;
import com.siszoo.usuarios.exception.CargoInvalidoException;
import com.siszoo.usuarios.exception.CrmvObrigatorioException;
import com.siszoo.usuarios.exception.EmailJaCadastradoException;
import com.siszoo.usuarios.exception.UltimoAdministradorException;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.exception.UsuarioNaoPodeAlterarProprioCargoException;
import com.siszoo.usuarios.exception.UsuarioNaoPodeDesativarASiMesmoException;
import com.siszoo.usuarios.exception.UsuarioNaoPodeRedefinirPropriaSenhaException;
import com.siszoo.usuarios.mapper.UsuarioMapper;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.PreferenciaUsuarioRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class UsuarioService {

    private static final String CARGO_VETERINARIO = "Veterinário";
    private static final String CARGO_ADMINISTRADOR = "Administrador";

    private final UsuarioRepository usuarioRepository;
    private final CargoRepository cargoRepository;
    private final UsuarioCargoRepository usuarioCargoRepository;
    private final PreferenciaUsuarioRepository preferenciaUsuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;
    private final AuditoriaEventoService auditoriaEventoService;
    private final SessaoService sessaoService;
    private final Clock clock;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            CargoRepository cargoRepository,
            UsuarioCargoRepository usuarioCargoRepository,
            PreferenciaUsuarioRepository preferenciaUsuarioRepository,
            PasswordEncoder passwordEncoder,
            UsuarioMapper usuarioMapper,
            AuditoriaEventoService auditoriaEventoService,
            SessaoService sessaoService,
            Clock clock) {
        this.usuarioRepository = usuarioRepository;
        this.cargoRepository = cargoRepository;
        this.usuarioCargoRepository = usuarioCargoRepository;
        this.preferenciaUsuarioRepository = preferenciaUsuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioMapper = usuarioMapper;
        this.auditoriaEventoService = auditoriaEventoService;
        this.sessaoService = sessaoService;
        this.clock = clock;
    }

    @Transactional
    public UsuarioResponse criar(CriarUsuarioRequest request, UUID usuarioAutenticadoId) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new EmailJaCadastradoException();
        }

        Cargo cargo = cargoRepository.findByNome(request.cargo())
                .orElseThrow(CargoInvalidoException::new);

        if (CARGO_VETERINARIO.equals(cargo.getNome()) && !StringUtils.hasText(request.crmv())) {
            throw new CrmvObrigatorioException();
        }

        PoliticaSenha.violacao(request.senhaInicial(), request.email(), request.nome(), request.sobrenome())
                .ifPresent(mensagem -> {
                    throw new CampoInvalidoException("senhaInicial", mensagem);
                });

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome());
        usuario.setSobrenome(request.sobrenome());
        usuario.setEmail(request.email());
        usuario.setCrmv(request.crmv());
        usuario.setTelefone(request.telefone());
        usuario.setSenha(passwordEncoder.encode(request.senhaInicial()));
        usuarioRepository.save(usuario);

        UsuarioCargo vinculo = new UsuarioCargo();
        vinculo.setUsuario(usuario);
        vinculo.setCargo(cargo);
        usuarioCargoRepository.save(vinculo);
        usuario.getCargos().add(vinculo);

        PreferenciaUsuario preferencias = new PreferenciaUsuario();
        preferencias.setUsuario(usuario);
        preferenciaUsuarioRepository.save(preferencias);

        // Autor do evento e o administrador que executou a acao; o usuario
        // afetado fica em entidade_id.
        UsuarioResponse response = usuarioMapper.toResponse(usuario);
        auditoriaEventoService.registrar(buscarAutor(usuarioAutenticadoId), AcaoAuditoria.CRIACAO, "usuario",
                usuario.getId(), null, response.semTelefone());

        return response;
    }

    // Edicao pelo Administrador. Vale para outro Administrador, com auditoria; os
    // limites sao o proprio cargo e o ultimo Administrador ativo.
    @Transactional
    public UsuarioResponse atualizar(UUID id, AtualizarUsuarioRequest request, UUID usuarioAutenticadoId) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        Cargo cargo = cargoRepository.findByNome(request.cargo())
                .orElseThrow(CargoInvalidoException::new);
        if (CARGO_VETERINARIO.equals(cargo.getNome()) && !StringUtils.hasText(request.crmv())) {
            throw new CrmvObrigatorioException();
        }

        List<String> cargosAntes = usuarioMapper.cargoNomes(usuario.getCargos());
        boolean cargoMudou = !cargosAntes.equals(List.of(cargo.getNome()));
        if (cargoMudou) {
            if (id.equals(usuarioAutenticadoId)) {
                throw new UsuarioNaoPodeAlterarProprioCargoException();
            }
            if (cargosAntes.contains(CARGO_ADMINISTRADOR)) {
                garantirOutroAdministradorAtivo(usuario);
            }
        }

        String telefoneNovo = StringUtils.hasText(request.telefone()) ? request.telefone() : null;
        UsuarioAuditoriaSnapshot antes = new UsuarioAuditoriaSnapshot(
                usuario.getNome(), usuario.getSobrenome(), usuario.getCrmv(), cargosAntes, false);
        boolean telefoneAlterado = !Objects.equals(usuario.getTelefone(), telefoneNovo);

        usuario.setNome(request.nome().trim());
        usuario.setSobrenome(request.sobrenome().trim());
        usuario.setCrmv(StringUtils.hasText(request.crmv()) ? request.crmv().trim() : null);
        usuario.setTelefone(telefoneNovo);
        if (cargoMudou) {
            trocarCargo(usuario, cargo);
            sessaoService.encerrarDoUsuario(id, MotivoEncerramentoSessao.CARGO_ALTERADO, null);
        }
        usuarioRepository.save(usuario);

        UsuarioAuditoriaSnapshot depois = new UsuarioAuditoriaSnapshot(usuario.getNome(), usuario.getSobrenome(),
                usuario.getCrmv(), List.of(cargo.getNome()), telefoneAlterado);
        auditoriaEventoService.registrar(buscarAutor(usuarioAutenticadoId), AcaoAuditoria.ATUALIZACAO, "usuario", id,
                antes, depois);

        return usuarioMapper.toResponse(usuario);
    }

    // A senha nova e temporaria: reaproveita o primeiro acesso (senha_alterada_em
    // nula), e a pessoa troca ao entrar. O evento so registra o fato.
    @Transactional
    public void redefinirSenha(UUID id, RedefinirSenhaRequest request, UUID usuarioAutenticadoId) {
        if (id.equals(usuarioAutenticadoId)) {
            throw new UsuarioNaoPodeRedefinirPropriaSenhaException();
        }
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        PoliticaSenha.violacao(request.senhaTemporaria(), usuario.getEmail(), usuario.getNome(), usuario.getSobrenome())
                .ifPresent(mensagem -> {
                    throw new CampoInvalidoException("senhaTemporaria", mensagem);
                });

        usuario.setSenha(passwordEncoder.encode(request.senhaTemporaria()));
        usuario.setSenhaAlteradaEm(null);
        usuarioRepository.save(usuario);
        sessaoService.encerrarDoUsuario(id, MotivoEncerramentoSessao.SENHA_REDEFINIDA, null);

        auditoriaEventoService.registrar(buscarAutor(usuarioAutenticadoId), AcaoAuditoria.ATUALIZACAO, "usuario", id,
                null, Map.of("senhaRedefinida", true));
    }

    private void trocarCargo(Usuario usuario, Cargo cargo) {
        usuarioCargoRepository.deleteAll(usuario.getCargos());
        usuario.getCargos().clear();
        usuarioCargoRepository.flush();

        UsuarioCargo vinculo = new UsuarioCargo();
        vinculo.setId(new UsuarioCargoId(usuario.getId(), cargo.getId()));
        vinculo.setUsuario(usuario);
        vinculo.setCargo(cargo);
        usuario.getCargos().add(usuarioCargoRepository.save(vinculo));
    }

    private void garantirOutroAdministradorAtivo(Usuario usuario) {
        boolean temOutro = usuarioRepository.travarAtivosDoCargo(CARGO_ADMINISTRADOR).stream()
                .anyMatch(administrador -> !administrador.getId().equals(usuario.getId()));
        if (!temOutro) {
            throw new UltimoAdministradorException();
        }
    }

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioResponse> listar(String nome, String cargo, Boolean ativo, int pagina, int tamanho) {
        Specification<Usuario> filtro = construirFiltro(nome, cargo, ativo);
        Page<Usuario> paginaUsuarios = usuarioRepository.findAll(
                filtro, Paginacao.pagina(pagina, tamanho, Sort.by("nome").ascending()));

        List<UUID> ids = paginaUsuarios.getContent().stream().map(Usuario::getId).toList();
        Map<UUID, List<String>> cargosPorUsuario = usuarioCargoRepository.findByUsuario_IdIn(ids).stream()
                .collect(Collectors.groupingBy(
                        uc -> uc.getUsuario().getId(),
                        Collectors.mapping(uc -> uc.getCargo().getNome(), Collectors.toList())));

        return PaginaResponse.de(paginaUsuarios.map(usuario -> new UsuarioResponse(
                        usuario.getId(),
                        usuario.getEmail(),
                        usuario.getNome(),
                        usuario.getSobrenome(),
                        usuario.getCrmv(),
                        cargosPorUsuario.getOrDefault(usuario.getId(), List.of()).stream().sorted().toList(),
                        usuario.isAtivo(),
                        usuario.getUltimoAcesso(),
                        usuario.getCriadoEm(),
                        usuario.getSenhaAlteradaEm(),
                        usuario.getTelefone())));
    }

    @Transactional
    public UsuarioResponse alterarStatus(UUID id, AtualizarStatusUsuarioRequest request, UUID usuarioAutenticadoId) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        // NOTA: impede usuario de desativar a si mesmo (DER §3.1, adicionado nesta tarefa).
        if (!Boolean.TRUE.equals(request.ativo()) && id.equals(usuarioAutenticadoId)) {
            throw new UsuarioNaoPodeDesativarASiMesmoException();
        }

        boolean ativoAntes = usuario.isAtivo();
        boolean ativar = Boolean.TRUE.equals(request.ativo());
        if (!ativar && usuarioMapper.cargoNomes(usuario.getCargos()).contains(CARGO_ADMINISTRADOR)) {
            garantirOutroAdministradorAtivo(usuario);
        }
        usuario.setAtivo(ativar);
        usuario.setDesativadoEm(ativar ? null : LocalDateTime.now(clock));
        usuarioRepository.save(usuario);
        // Reativar nao ressuscita sessao antiga: a pessoa entra de novo.
        if (!ativar) {
            sessaoService.encerrarDoUsuario(usuario.getId(), MotivoEncerramentoSessao.USUARIO_DESATIVADO, null);
        }

        // T43: so o estado alterado (ativo), sem os dados pessoais do usuario.
        AcaoAuditoria acao = ativar ? AcaoAuditoria.REATIVACAO : AcaoAuditoria.DESATIVACAO;
        auditoriaEventoService.registrar(buscarAutor(usuarioAutenticadoId), acao, "usuario", usuario.getId(),
                Map.of("ativo", ativoAntes), Map.of("ativo", ativar));

        return usuarioMapper.toResponse(usuario);
    }

    private Usuario buscarAutor(UUID usuarioAutenticadoId) {
        return usuarioRepository.findById(usuarioAutenticadoId).orElseThrow(UsuarioNaoEncontradoException::new);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse atualizarPerfil(UUID id, AtualizarPerfilRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        String telefoneAnterior = usuario.getTelefone();
        String telefoneNovo = StringUtils.hasText(request.telefone()) ? request.telefone() : null;
        usuario.setTelefone(telefoneNovo);
        usuarioRepository.save(usuario);

        // T43/LGPD: auditoria_evento e imutavel e sem expurgo, entao o telefone
        // nao entra no evento — so se mudou, no padrao do denuncianteAlterado
        // da ocorrencia (D23).
        boolean telefoneAlterado = !Objects.equals(telefoneAnterior, telefoneNovo);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "usuario", usuario.getId(),
                Map.of("telefoneAlterado", false), Map.of("telefoneAlterado", telefoneAlterado));

        return usuarioMapper.toResponse(usuario);
    }

    private Specification<Usuario> construirFiltro(String nome, String cargo, Boolean ativo) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (StringUtils.hasText(nome)) {
                String termo = "%" + nome.toLowerCase() + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("nome")), termo),
                        cb.like(cb.lower(root.get("sobrenome")), termo)));
            }

            if (ativo != null) {
                predicados.add(cb.equal(root.get("ativo"), ativo));
            }

            if (StringUtils.hasText(cargo)) {
                query.distinct(true);
                var usuarioCargo = root.join("cargos");
                predicados.add(cb.equal(usuarioCargo.get("cargo").get("nome"), cargo));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
