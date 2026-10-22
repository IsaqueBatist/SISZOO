package com.siszoo.animais.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.animais.dto.AnimalResponse;
import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.entity.MotivoEntrada;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.exception.BaiaIndisponivelException;
import com.siszoo.animais.exception.BaiaInvalidaException;
import com.siszoo.animais.exception.EspecieInvalidaException;
import com.siszoo.animais.exception.MicrochipImutavelException;
import com.siszoo.animais.exception.MicrochipJaCadastradoException;
import com.siszoo.animais.exception.MotivoEntradaInvalidoException;
import com.siszoo.animais.exception.StatusAnimalInvalidoException;
import com.siszoo.animais.mapper.AnimalMapper;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.animais.repository.MotivoEntradaRepository;
import com.siszoo.animais.repository.StatusAnimalRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;

@Service
public class AnimalService {

    private static final Pattern ESPACOS = Pattern.compile("\\s+");

    private final AnimalRepository animalRepository;
    private final BaiaRepository baiaRepository;
    private final EspecieRepository especieRepository;
    private final StatusAnimalRepository statusAnimalRepository;
    private final MotivoEntradaRepository motivoEntradaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnimalMapper animalMapper;
    private final FichaCompletaService fichaCompletaService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    // RNF10 (F2-078/F2-029): o cadastro do animal e alteracao critica — cada
    // criacao e edicao gera AuditoriaEvento com o estado antes/depois.
    private static final String ENTIDADE_AUDITORIA = "animal";

    public AnimalService(
            AnimalRepository animalRepository,
            BaiaRepository baiaRepository,
            EspecieRepository especieRepository,
            StatusAnimalRepository statusAnimalRepository,
            MotivoEntradaRepository motivoEntradaRepository,
            UsuarioRepository usuarioRepository,
            AnimalMapper animalMapper,
            FichaCompletaService fichaCompletaService,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.animalRepository = animalRepository;
        this.baiaRepository = baiaRepository;
        this.especieRepository = especieRepository;
        this.statusAnimalRepository = statusAnimalRepository;
        this.motivoEntradaRepository = motivoEntradaRepository;
        this.usuarioRepository = usuarioRepository;
        this.animalMapper = animalMapper;
        this.fichaCompletaService = fichaCompletaService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

    @Transactional
    public AnimalResponse criar(CriarAnimalRequest request, UUID usuarioAutenticadoId) {
        validarDatas(request.dataEntrada(), request.dataNascimentoAprox(),
                request.esterilizado(), request.dataEsterilizacao());
        String microchip = normalizarMicrochip(request.microchip());
        verificarMicrochipDisponivel(microchip, null);
        StatusAnimal status = resolverStatus(request.status());
        Baia baia = resolverBaia(request.baiaId(), status, null);

        Animal animal = new Animal();
        animal.setNome(request.nome());
        animal.setEspecie(resolverEspecie(request.especie()));
        animal.setSexo(request.sexo());
        animal.setRaca(request.raca());
        animal.setColoracao(request.coloracao());
        animal.setPelagem(request.pelagem());
        animal.setPorte(request.porte());
        animal.setPesoKg(request.pesoKg());
        animal.setIdadeAprox(request.idadeAprox());
        animal.setDataNascimentoAprox(request.dataNascimentoAprox());
        animal.setMicrochip(microchip);
        animal.setEsterilizado(request.esterilizado());
        animal.setDataEsterilizacao(request.dataEsterilizacao());
        animal.setStatus(status);
        animal.setMotivoEntrada(resolverMotivoEntrada(request.motivoEntrada()));
        animal.setDataEntrada(request.dataEntrada());
        animal.setBaia(baia);
        animal.setFotoUrl(request.fotoUrl());
        animal.setObservacoes(request.observacoes());

        Usuario criadoPor = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        animal.setCriadoPor(criadoPor);

        animal.setFichaCompleta(fichaCompletaService.calcular(animal));

        animalRepository.save(animal);
        AnimalResponse response = animalMapper.toResponse(animal);
        auditoriaEventoService.registrar(criadoPor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, animal.getId(), null, response);
        return response;
    }

    @Transactional
    public AnimalResponse atualizar(UUID id, AtualizarAnimalRequest request, UUID usuarioAutenticadoId) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(AnimalNaoEncontradoException::new);
        Usuario autor = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        // Estado anterior para a auditoria (RNF10), antes de qualquer setter.
        AnimalResponse antes = animalMapper.toResponse(animal);

        validarDatas(request.dataEntrada(), request.dataNascimentoAprox(),
                request.esterilizado(), request.dataEsterilizacao());
        // Status e baia antes de qualquer setter: a contagem de ocupacao e uma
        // query, e com o animal ja alterado o flush automatico a faria contar o
        // estado novo, e nao o gravado.
        StatusAnimal status = resolverStatus(request.status());
        Baia baia = resolverBaia(request.baiaId(), status, animal);

        aplicarMicrochipNaAtualizacao(animal, request.microchip());

        animal.setNome(request.nome());
        animal.setEspecie(resolverEspecie(request.especie()));
        animal.setSexo(request.sexo());
        animal.setRaca(request.raca());
        animal.setColoracao(request.coloracao());
        animal.setPelagem(request.pelagem());
        animal.setPorte(request.porte());
        animal.setPesoKg(request.pesoKg());
        animal.setIdadeAprox(request.idadeAprox());
        animal.setDataNascimentoAprox(request.dataNascimentoAprox());
        animal.setEsterilizado(request.esterilizado());
        animal.setDataEsterilizacao(request.dataEsterilizacao());
        animal.setStatus(status);
        animal.setMotivoEntrada(resolverMotivoEntrada(request.motivoEntrada()));
        animal.setDataEntrada(request.dataEntrada());
        animal.setBaia(baia);
        animal.setFotoUrl(request.fotoUrl());
        animal.setObservacoes(request.observacoes());

        animal.setFichaCompleta(fichaCompletaService.calcular(animal));

        animalRepository.save(animal);
        AnimalResponse depois = animalMapper.toResponse(animal);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, animal.getId(), antes, depois);
        return depois;
    }

    @Transactional(readOnly = true)
    public AnimalResponse buscarPorId(UUID id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(AnimalNaoEncontradoException::new);
        return animalMapper.toResponse(animal);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AnimalResponse> listar(
            String status, String especie, UUID baiaId, String q, int pagina, int tamanho) {
        Specification<Animal> filtro = construirFiltro(status, especie, baiaId, q);
        Page<Animal> paginaAnimais = animalRepository.findAll(
                filtro, PageRequest.of(pagina, tamanho, Sort.by("nome").ascending()));
        return PaginaResponse.de(paginaAnimais.map(animalMapper::toResponse));
    }

    // Microchip e o identificador fisico implantado no animal: uma vez definido, e
    // permanente (regra critica de negocio sobre imutabilidade de identificadores/
    // registros criticos). O PUT so pode ACEITAR um microchip quando o animal ainda
    // nao tem um; se ja tem, qualquer valor diferente do atual e rejeitado.
    private void aplicarMicrochipNaAtualizacao(Animal animal, String microchipRequest) {
        String atual = animal.getMicrochip();
        String novo = normalizarMicrochip(microchipRequest);

        if (StringUtils.hasText(atual)) {
            if (novo != null && !novo.equals(atual)) {
                throw new MicrochipImutavelException();
            }
            return;
        }

        if (novo == null) {
            return;
        }

        verificarMicrochipDisponivel(novo, animal.getId());
        animal.setMicrochip(novo);
    }

    // Recebe o microchip ja normalizado (normalizarMicrochip).
    private void verificarMicrochipDisponivel(String microchip, UUID idAtual) {
        if (microchip == null) {
            return;
        }
        animalRepository.findByMicrochip(microchip)
                .filter(existente -> idAtual == null || !existente.getId().equals(idAtual))
                .ifPresent(existente -> {
                    throw new MicrochipJaCadastradoException();
                });
    }

    // RN01/RN07: microchip opcional, unico quando presente. Forma unica usada
    // no cadastro, na edicao, na checagem de duplicidade e na busca: sem
    // espacos (nas pontas e no meio); vazio vira null (sem microchip). A V16
    // aplicou a mesma regra aos dados existentes.
    static String normalizarMicrochip(String microchip) {
        if (microchip == null) {
            return null;
        }
        String normalizado = ESPACOS.matcher(microchip).replaceAll("");
        return normalizado.isEmpty() ? null : normalizado;
    }

    private Especie resolverEspecie(String codigo) {
        return especieRepository.findByCodigo(codigo).orElseThrow(EspecieInvalidaException::new);
    }

    private StatusAnimal resolverStatus(String codigo) {
        return statusAnimalRepository.findByCodigo(codigo).orElseThrow(StatusAnimalInvalidoException::new);
    }

    private MotivoEntrada resolverMotivoEntrada(String codigo) {
        return motivoEntradaRepository.findByCodigo(codigo).orElseThrow(MotivoEntradaInvalidoException::new);
    }

    // DER §3.2 (baia_id so em baia com ocupacao < capacidade) e §5 regra 6
    // (baia ativa). Vale so quando o animal PASSA a ocupar a baia: cadastro,
    // troca de baia ou volta a custodia. Um animal que ja ocupa a baia nao e
    // barrado por ela ter sido desativada ou ter tido a capacidade reduzida
    // depois (BaiaService permite as duas coisas com animais dentro), senao
    // nenhuma outra edicao dele passaria. Animal fora da custodia nao ocupa
    // baia (DER §5, regra 7) e nao e conferido.
    // Quem passa a ocupar trava a baia (findByIdForUpdate) ate o commit, ja
    // com a gravacao do animal: dois cadastros simultaneos na ultima vaga sao
    // serializados e o segundo conta o primeiro (BaiaConcorrenciaIT). Os
    // outros casos nao aumentam a ocupacao e leem sem trava.
    private Baia resolverBaia(UUID baiaId, StatusAnimal statusNovo, Animal atual) {
        if (baiaId == null) {
            return null;
        }
        boolean jaOcupava = atual != null
                && atual.getBaia() != null
                && atual.getBaia().getId().equals(baiaId)
                && ocupaBaia(atual.getStatus());
        if (!ocupaBaia(statusNovo) || jaOcupava) {
            return baiaRepository.findById(baiaId).orElseThrow(BaiaInvalidaException::new);
        }

        Baia baia = baiaRepository.findByIdForUpdate(baiaId).orElseThrow(BaiaInvalidaException::new);
        if (!baia.isAtiva()) {
            throw BaiaIndisponivelException.inativa();
        }
        // O proprio animal nao entra na contagem: ou estava em outra baia, ou
        // estava fora da custodia (que a contagem ja exclui).
        long ocupacao = animalRepository.countByBaia_IdAndStatus_CodigoNotIn(
                baiaId, StatusAnimal.CODIGOS_FORA_DA_CUSTODIA);
        if (ocupacao >= baia.getCapacidade()) {
            throw BaiaIndisponivelException.superlotada();
        }
        return baia;
    }

    private boolean ocupaBaia(StatusAnimal status) {
        return status != null && !StatusAnimal.CODIGOS_FORA_DA_CUSTODIA.contains(status.getCodigo());
    }

    // Datas de fato ocorrido: nao podem ser futuras, com "hoje" do Clock do
    // projeto (nao @PastOrPresent, que usaria o relogio da JVM — mesmo motivo
    // do RN-C06 em VacinacaoService). A coerencia da castracao vale para os
    // dois caminhos (cadastro e edicao).
    private void validarDatas(
            LocalDateTime dataEntrada, LocalDate dataNascimento, boolean esterilizado, LocalDate dataEsterilizacao) {
        LocalDate hoje = LocalDate.now(clock);

        if (dataEntrada != null && dataEntrada.toLocalDate().isAfter(hoje)) {
            throw new CampoInvalidoException("dataEntrada", "Data de entrada nao pode ser futura");
        }
        if (dataNascimento != null) {
            if (dataNascimento.isAfter(hoje)) {
                throw new CampoInvalidoException("dataNascimentoAprox", "Data de nascimento nao pode ser futura");
            }
            if (dataEntrada != null && dataNascimento.isAfter(dataEntrada.toLocalDate())) {
                throw new CampoInvalidoException("dataNascimentoAprox",
                        "Data de nascimento nao pode ser posterior a data de entrada");
            }
        }
        if (dataEsterilizacao != null) {
            if (!esterilizado) {
                throw new CampoInvalidoException("dataEsterilizacao",
                        "Data da castracao so pode ser informada para animal castrado");
            }
            if (dataEsterilizacao.isAfter(hoje)) {
                throw new CampoInvalidoException("dataEsterilizacao", "Data da castracao nao pode ser futura");
            }
        }
    }

    private Specification<Animal> construirFiltro(String status, String especie, UUID baiaId, String q) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (StringUtils.hasText(status)) {
                predicados.add(cb.equal(root.get("status").get("codigo"), status));
            }

            if (StringUtils.hasText(especie)) {
                predicados.add(cb.equal(root.get("especie").get("codigo"), especie));
            }

            if (baiaId != null) {
                predicados.add(cb.equal(root.get("baia").get("id"), baiaId));
            }

            if (StringUtils.hasText(q)) {
                String termo = "%" + q.toLowerCase() + "%";
                // O microchip e comparado na forma normalizada: " 985" acha "985".
                String microchip = normalizarMicrochip(q);
                Predicate porNome = cb.like(cb.lower(root.get("nome")), termo);
                predicados.add(microchip == null
                        ? porNome
                        : cb.or(porNome, cb.like(cb.lower(root.get("microchip")), "%" + microchip.toLowerCase() + "%")));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
