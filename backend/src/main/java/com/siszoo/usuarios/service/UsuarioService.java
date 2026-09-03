package com.siszoo.usuarios.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AtualizarPerfilRequest;
import com.siszoo.usuarios.dto.AtualizarStatusUsuarioRequest;
import com.siszoo.usuarios.dto.CriarUsuarioRequest;
import com.siszoo.usuarios.dto.UsuarioResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.PreferenciaUsuario;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.exception.CargoInvalidoException;
import com.siszoo.usuarios.exception.CrmvObrigatorioException;
import com.siszoo.usuarios.exception.EmailJaCadastradoException;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.exception.UsuarioNaoPodeDesativarASiMesmoException;
import com.siszoo.usuarios.mapper.UsuarioMapper;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.PreferenciaUsuarioRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class UsuarioService {

    private static final String CARGO_VETERINARIO = "Veterinário";

    private final UsuarioRepository usuarioRepository;
    private final CargoRepository cargoRepository;
    private final UsuarioCargoRepository usuarioCargoRepository;
    private final PreferenciaUsuarioRepository preferenciaUsuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            CargoRepository cargoRepository,
            UsuarioCargoRepository usuarioCargoRepository,
            PreferenciaUsuarioRepository preferenciaUsuarioRepository,
            PasswordEncoder passwordEncoder,
            UsuarioMapper usuarioMapper,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.usuarioRepository = usuarioRepository;
        this.cargoRepository = cargoRepository;
        this.usuarioCargoRepository = usuarioCargoRepository;
        this.preferenciaUsuarioRepository = preferenciaUsuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioMapper = usuarioMapper;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

    @Transactional
    public UsuarioResponse criar(CriarUsuarioRequest request) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new EmailJaCadastradoException();
        }

        Cargo cargo = cargoRepository.findByNome(request.cargo())
                .orElseThrow(CargoInvalidoException::new);

        if (CARGO_VETERINARIO.equals(cargo.getNome()) && !StringUtils.hasText(request.crmv())) {
            throw new CrmvObrigatorioException();
        }

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

        UsuarioResponse response = usuarioMapper.toResponse(usuario);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.CRIACAO, "usuario", null, response);

        return response;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioResponse> listar(String nome, String cargo, Boolean ativo, int pagina, int tamanho) {
        Specification<Usuario> filtro = construirFiltro(nome, cargo, ativo);
        Page<Usuario> paginaUsuarios = usuarioRepository.findAll(
                filtro, PageRequest.of(pagina, tamanho, Sort.by("nome").ascending()));

        List<UUID> ids = paginaUsuarios.getContent().stream().map(Usuario::getId).toList();
        Map<UUID, List<String>> cargosPorUsuario = usuarioCargoRepository.findByUsuario_IdIn(ids).stream()
                .collect(Collectors.groupingBy(
                        uc -> uc.getUsuario().getId(),
                        Collectors.mapping(uc -> uc.getCargo().getNome(), Collectors.toList())));

        List<UsuarioResponse> itens = paginaUsuarios.getContent().stream()
                .map(usuario -> new UsuarioResponse(
                        usuario.getId(),
                        usuario.getEmail(),
                        usuario.getNome(),
                        usuario.getSobrenome(),
                        usuario.getCrmv(),
                        cargosPorUsuario.getOrDefault(usuario.getId(), List.of()).stream().sorted().toList(),
                        usuario.isAtivo(),
                        usuario.getUltimoAcesso(),
                        usuario.getCriadoEm(),
                        usuario.getSenhaAlteradaEm()))
                .toList();

        return new PaginaResponse<>(
                itens,
                paginaUsuarios.getNumber(),
                paginaUsuarios.getSize(),
                paginaUsuarios.getTotalElements(),
                paginaUsuarios.getTotalPages());
    }

    @Transactional
    public UsuarioResponse alterarStatus(UUID id, AtualizarStatusUsuarioRequest request, UUID usuarioAutenticadoId) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        // NOTA: impede usuario de desativar a si mesmo (DER §3.1, adicionado nesta tarefa).
        if (!Boolean.TRUE.equals(request.ativo()) && id.equals(usuarioAutenticadoId)) {
            throw new UsuarioNaoPodeDesativarASiMesmoException();
        }

        boolean ativar = Boolean.TRUE.equals(request.ativo());
        usuario.setAtivo(ativar);
        usuario.setDesativadoEm(ativar ? null : LocalDateTime.now(clock));
        usuarioRepository.save(usuario);

        AcaoAuditoria acao = ativar ? AcaoAuditoria.REATIVACAO : AcaoAuditoria.DESATIVACAO;
        auditoriaEventoService.registrar(usuario, acao, "usuario", null, null);

        return usuarioMapper.toResponse(usuario);
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

        Map<String, String> antes = new HashMap<>();
        antes.put("telefone", telefoneAnterior);
        Map<String, String> depois = new HashMap<>();
        depois.put("telefone", telefoneNovo);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "usuario", antes, depois);

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
