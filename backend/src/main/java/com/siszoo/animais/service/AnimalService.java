package com.siszoo.animais.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final BaiaRepository baiaRepository;
    private final EspecieRepository especieRepository;
    private final StatusAnimalRepository statusAnimalRepository;
    private final MotivoEntradaRepository motivoEntradaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnimalMapper animalMapper;

    public AnimalService(
            AnimalRepository animalRepository,
            BaiaRepository baiaRepository,
            EspecieRepository especieRepository,
            StatusAnimalRepository statusAnimalRepository,
            MotivoEntradaRepository motivoEntradaRepository,
            UsuarioRepository usuarioRepository,
            AnimalMapper animalMapper) {
        this.animalRepository = animalRepository;
        this.baiaRepository = baiaRepository;
        this.especieRepository = especieRepository;
        this.statusAnimalRepository = statusAnimalRepository;
        this.motivoEntradaRepository = motivoEntradaRepository;
        this.usuarioRepository = usuarioRepository;
        this.animalMapper = animalMapper;
    }

    @Transactional
    public AnimalResponse criar(CriarAnimalRequest request, UUID usuarioAutenticadoId) {
        verificarMicrochipDisponivel(request.microchip(), null);

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
        animal.setMicrochip(normalizarMicrochip(request.microchip()));
        animal.setEsterilizado(request.esterilizado());
        animal.setDataEsterilizacao(request.dataEsterilizacao());
        animal.setStatus(resolverStatus(request.status()));
        animal.setMotivoEntrada(resolverMotivoEntrada(request.motivoEntrada()));
        animal.setDataEntrada(request.dataEntrada());
        animal.setBaia(resolverBaia(request.baiaId()));
        animal.setFotoUrl(request.fotoUrl());
        animal.setObservacoes(request.observacoes());

        Usuario criadoPor = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        animal.setCriadoPor(criadoPor);

        animal.setFichaCompleta(calcularFichaCompleta(animal));

        animalRepository.save(animal);
        return animalMapper.toResponse(animal);
    }

    @Transactional
    public AnimalResponse atualizar(UUID id, AtualizarAnimalRequest request) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(AnimalNaoEncontradoException::new);

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
        animal.setStatus(resolverStatus(request.status()));
        animal.setMotivoEntrada(resolverMotivoEntrada(request.motivoEntrada()));
        animal.setDataEntrada(request.dataEntrada());
        animal.setBaia(resolverBaia(request.baiaId()));
        animal.setFotoUrl(request.fotoUrl());
        animal.setObservacoes(request.observacoes());

        animal.setFichaCompleta(calcularFichaCompleta(animal));

        animalRepository.save(animal);
        return animalMapper.toResponse(animal);
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
    // permanente (regra critica do CLAUDE.md sobre imutabilidade de identificadores/
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

    private void verificarMicrochipDisponivel(String microchip, UUID idAtual) {
        if (!StringUtils.hasText(microchip)) {
            return;
        }
        animalRepository.findByMicrochip(microchip)
                .filter(existente -> idAtual == null || !existente.getId().equals(idAtual))
                .ifPresent(existente -> {
                    throw new MicrochipJaCadastradoException();
                });
    }

    private String normalizarMicrochip(String microchip) {
        return StringUtils.hasText(microchip) ? microchip : null;
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

    private Baia resolverBaia(UUID baiaId) {
        if (baiaId == null) {
            return null;
        }
        return baiaRepository.findById(baiaId).orElseThrow(BaiaInvalidaException::new);
    }

    // DER §3.2: ficha_completa = todos campos obrigatorios + microchip + ao menos 1
    // vacina. Os campos obrigatorios ja sao garantidos por Bean Validation no request
    // e NOT NULL no schema. A clausula "ao menos 1 vacina" fica pendente do modulo de
    // vacinacao (T20-24), que ainda nao existe neste codigo-base.
    // TODO: incluir a checagem de vacina quando o modulo de vacinacao existir.
    private boolean calcularFichaCompleta(Animal animal) {
        return StringUtils.hasText(animal.getMicrochip());
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
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("nome")), termo),
                        cb.like(cb.lower(root.get("microchip")), termo)));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
