package com.siszoo.animais.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.animais.dto.AnimalResponse;
import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.DadosDescritivosAnimal;
import com.siszoo.animais.dto.EutanasiaRequest;
import com.siszoo.animais.dto.TransferenciaRequest;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.CondicaoSaude;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.entity.MotivoEntrada;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.entity.TipoDestinoTransferencia;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.exception.BaiaIndisponivelException;
import com.siszoo.animais.exception.BaiaInvalidaException;
import com.siszoo.animais.exception.EspecieInvalidaException;
import com.siszoo.animais.exception.EutanasiaSemResponsavelTecnicoException;
import com.siszoo.animais.exception.LaudoEutanasiaImutavelException;
import com.siszoo.animais.exception.MicrochipImutavelException;
import com.siszoo.animais.exception.MicrochipJaCadastradoException;
import com.siszoo.animais.exception.MotivoEntradaInvalidoException;
import com.siszoo.animais.exception.StatusAnimalInvalidoException;
import com.siszoo.animais.exception.TransferenciaImutavelException;
import com.siszoo.animais.mapper.AnimalMapper;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.CondicaoSaudeRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.animais.repository.MotivoEntradaRepository;
import com.siszoo.animais.repository.StatusAnimalRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.comum.util.BuscaTexto;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.comum.util.Textos;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;
import com.siszoo.usuarios.service.AutoridadeService;

import jakarta.persistence.criteria.Predicate;

@Service
public class AnimalService {

    private static final Pattern ESPACOS = Pattern.compile("\\s+");

    private static final Sort ORDEM_LISTAGEM = Sort.by("nome").ascending().and(Sort.by("id"));

    private final AnimalRepository animalRepository;
    private final BaiaRepository baiaRepository;
    private final EspecieRepository especieRepository;
    private final StatusAnimalRepository statusAnimalRepository;
    private final MotivoEntradaRepository motivoEntradaRepository;
    private final CondicaoSaudeRepository condicaoSaudeRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnimalMapper animalMapper;
    private final FichaCompletaService fichaCompletaService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final AutoridadeService autoridadeService;
    private final MiniaturaFoto miniaturaFoto;
    private final Clock clock;

    private static final String ENTIDADE_AUDITORIA = "animal";

    public AnimalService(
            AnimalRepository animalRepository,
            BaiaRepository baiaRepository,
            EspecieRepository especieRepository,
            StatusAnimalRepository statusAnimalRepository,
            MotivoEntradaRepository motivoEntradaRepository,
            CondicaoSaudeRepository condicaoSaudeRepository,
            UsuarioRepository usuarioRepository,
            AnimalMapper animalMapper,
            FichaCompletaService fichaCompletaService,
            AuditoriaEventoService auditoriaEventoService,
            AutoridadeService autoridadeService,
            MiniaturaFoto miniaturaFoto,
            Clock clock) {
        this.animalRepository = animalRepository;
        this.baiaRepository = baiaRepository;
        this.especieRepository = especieRepository;
        this.statusAnimalRepository = statusAnimalRepository;
        this.motivoEntradaRepository = motivoEntradaRepository;
        this.condicaoSaudeRepository = condicaoSaudeRepository;
        this.usuarioRepository = usuarioRepository;
        this.animalMapper = animalMapper;
        this.fichaCompletaService = fichaCompletaService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.autoridadeService = autoridadeService;
        this.miniaturaFoto = miniaturaFoto;
        this.clock = clock;
    }

    @Transactional
    public AnimalResponse criar(CriarAnimalRequest request, UUID usuarioAutenticadoId) {
        validarDatas(request.dataEntrada(), request.dataNascimentoAprox(),
                request.esterilizado(), request.dataEsterilizacao());
        String microchip = normalizarMicrochip(request.microchip());
        verificarMicrochipDisponivel(microchip, null);
        String numeroMedalha = Textos.normalizar(request.numeroMedalha());
        verificarMedalhaDisponivel(numeroMedalha, null);
        validarDataImplantacaoChip(request.dataImplantacaoChip(), microchip);
        StatusAnimal status = resolverStatus(request.status());
        Baia baia = resolverBaia(request.baiaId(), status, null);
        Usuario criadoPor = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        Animal animal = new Animal();
        aplicarLaudoEutanasia(animal, null, status, request.laudoEutanasia(), request.eutanasia(), criadoPor);
        animal.setNumeroMedalha(numeroMedalha);
        animal.setDataImplantacaoChip(request.dataImplantacaoChip());
        animal.setProcedencia(Textos.normalizar(request.procedencia()));
        aplicarTransferencia(animal, null, status, request.transferencia(), request.dataEntrada());
        animal.setMicrochip(microchip);
        aplicarDadosDescritivos(animal, request, status, baia);
        animal.setFotoUrl(request.fotoUrl());
        animal.setFotoMiniatura(miniaturaFoto.gerar(request.fotoUrl()));
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
        AnimalResponse antes = animalMapper.toResponse(animal);

        validarDatas(request.dataEntrada(), request.dataNascimentoAprox(),
                request.esterilizado(), request.dataEsterilizacao());
        StatusAnimal status = resolverStatus(request.status());
        Baia baia = resolverBaia(request.baiaId(), status, animal);

        aplicarMicrochipNaAtualizacao(animal, request.microchip());

        String numeroMedalha = Textos.normalizar(request.numeroMedalha());
        verificarMedalhaDisponivel(numeroMedalha, animal.getId());
        validarDataImplantacaoChip(request.dataImplantacaoChip(), animal.getMicrochip());
        aplicarLaudoEutanasia(animal, animal.getStatus(), status, request.laudoEutanasia(), request.eutanasia(), autor);
        aplicarTransferencia(animal, animal.getStatus(), status, request.transferencia(), request.dataEntrada());
        animal.setNumeroMedalha(numeroMedalha);
        animal.setDataImplantacaoChip(request.dataImplantacaoChip());
        animal.setProcedencia(Textos.normalizar(request.procedencia()));

        aplicarDadosDescritivos(animal, request, status, baia);
        if (!Objects.equals(animal.getFotoUrl(), request.fotoUrl())) {
            animal.setFotoUrl(request.fotoUrl());
            animal.setFotoMiniatura(miniaturaFoto.gerar(request.fotoUrl()));
        }

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
            String status, Boolean custodia, String especie, UUID baiaId, String q, int pagina, int tamanho) {
        Specification<Animal> filtro = construirFiltro(status, custodia, especie, baiaId, q);
        Page<Animal> paginaAnimais = animalRepository.findAll(filtro, Paginacao.pagina(pagina, tamanho, ORDEM_LISTAGEM));
        return PaginaResponse.de(paginaAnimais.map(animalMapper::toResponseListagem));
    }

    private void aplicarDadosDescritivos(Animal animal, DadosDescritivosAnimal dados, StatusAnimal status, Baia baia) {
        animal.setNome(dados.nome());
        animal.setEspecie(resolverEspecie(dados.especie()));
        animal.setSexo(dados.sexo());
        animal.setRaca(dados.raca());
        animal.setColoracao(dados.coloracao());
        animal.setPelagem(dados.pelagem());
        animal.setPorte(dados.porte());
        animal.setPesoKg(dados.pesoKg());
        animal.setIdadeAprox(dados.idadeAprox());
        animal.setDataNascimentoAprox(dados.dataNascimentoAprox());
        animal.setEsterilizado(dados.esterilizado());
        animal.setDataEsterilizacao(dados.dataEsterilizacao());
        animal.setStatus(status);
        animal.setMotivoEntrada(resolverMotivoEntrada(dados.motivoEntrada()));
        animal.setDataEntrada(dados.dataEntrada());
        animal.setBaia(baia);
        animal.setObservacoes(dados.observacoes());
        aplicarCondicoes(animal, dados);
    }

    private void aplicarCondicoes(Animal animal, DadosDescritivosAnimal dados) {
        Set<String> codigos = dados.condicoes() == null ? Set.of() : new HashSet<>(dados.condicoes());
        List<CondicaoSaude> condicoes = codigos.isEmpty() ? List.of() : condicaoSaudeRepository.findByCodigoIn(codigos)
                .stream().filter(CondicaoSaude::isAtivo).toList();
        if (condicoes.size() != codigos.size()) {
            throw new CampoInvalidoException("condicoes", "Selecione apenas condições da lista.");
        }
        String outras = StringUtils.hasText(dados.condicoesOutras()) ? dados.condicoesOutras().trim() : null;
        boolean marcouOutras = codigos.contains(CondicaoSaude.CODIGO_OUTRAS);
        if (marcouOutras && outras == null) {
            throw new CampoInvalidoException("condicoesOutras", "Descreva qual é a outra condição.");
        }
        animal.setCondicoes(new HashSet<>(condicoes));
        animal.setCondicoesOutras(marcouOutras ? outras : null);
    }

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
        if (microchip == null) {
            return;
        }
        animalRepository.findByMicrochip(microchip)
                .filter(existente -> idAtual == null || !existente.getId().equals(idAtual))
                .ifPresent(existente -> {
                    throw new MicrochipJaCadastradoException();
                });
    }

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

    private static final String STATUS_OBITO_EUTANASIA = "obito_eutanasia";
    private static final String STATUS_TRANSFERIDO = "transferido";
    private static final String AUTORIDADE_EUTANASIA = "GESTAO_ANIMAIS:eutanasia:escrita";

    private void verificarMedalhaDisponivel(String numeroMedalha, UUID animalIdAtual) {
        if (numeroMedalha == null) {
            return;
        }
        animalRepository.findByNumeroMedalha(numeroMedalha)
                .filter(outro -> animalIdAtual == null || !outro.getId().equals(animalIdAtual))
                .ifPresent(outro -> {
                    throw new CampoInvalidoException("numeroMedalha", "Este número de medalha já está cadastrado em outro animal.");
                });
    }

    private void validarDataImplantacaoChip(LocalDate dataImplantacao, String microchip) {
        if (dataImplantacao == null) {
            return;
        }
        if (!StringUtils.hasText(microchip)) {
            throw new CampoInvalidoException("dataImplantacaoChip",
                    "Informe a data de implantação apenas junto com o microchip.");
        }
        if (dataImplantacao.isAfter(LocalDate.now(clock))) {
            throw new CampoInvalidoException("dataImplantacaoChip", "A data de implantação não pode ser futura.");
        }
    }

    private void aplicarLaudoEutanasia(Animal animal, StatusAnimal statusAnterior, StatusAnimal statusNovo,
            String laudoInformado, EutanasiaRequest eutanasia, Usuario autor) {
        String laudo = Textos.normalizar(laudoInformado);
        String metodo = eutanasia == null ? null : Textos.normalizar(eutanasia.metodo());
        Boolean insensibilizacao = eutanasia == null ? null : eutanasia.insensibilizacaoPrevia();
        if (animal.getLaudoEutanasia() != null) {
            exigirLaudoInalterado(animal, laudo, metodo, insensibilizacao);
            return;
        }
        boolean eutanasiaNoStatus = statusNovo != null && STATUS_OBITO_EUTANASIA.equals(statusNovo.getCodigo());
        boolean entrandoEmEutanasia = eutanasiaNoStatus
                && (statusAnterior == null || !STATUS_OBITO_EUTANASIA.equals(statusAnterior.getCodigo()));
        boolean informado = laudo != null || metodo != null || insensibilizacao != null;
        if (!eutanasiaNoStatus || (!entrandoEmEutanasia && !informado)) {
            return;
        }
        exigirResponsavelTecnico(autor);
        if (laudo == null) {
            throw new CampoInvalidoException("laudoEutanasia",
                    "Informe o laudo do responsável técnico que justifica a eutanásia.");
        }
        if (metodo == null) {
            throw new CampoInvalidoException("eutanasia.metodo", "Informe o método de eutanásia.");
        }
        if (insensibilizacao == null) {
            throw new CampoInvalidoException("eutanasia.insensibilizacaoPrevia",
                    "Informe se houve insensibilização prévia.");
        }
        if (!insensibilizacao) {
            throw new CampoInvalidoException("eutanasia.insensibilizacaoPrevia",
                    "O registro exige insensibilização prévia do animal (Lei estadual nº 11.977/2005, art. 12, parágrafo único).");
        }
        animal.setLaudoEutanasia(laudo);
        animal.setLaudoEutanasiaResponsavel(autor);
        animal.setLaudoEutanasiaCrmv(autor.getCrmv().trim());
        animal.setLaudoEutanasiaMetodo(metodo);
        animal.setLaudoEutanasiaInsensibilizacaoPrevia(true);
        animal.setLaudoEutanasiaRegistradoEm(LocalDateTime.now(clock));
    }

    private void exigirResponsavelTecnico(Usuario autor) {
        Set<String> cargos = new HashSet<>();
        autor.getCargos().forEach(vinculo -> cargos.add(vinculo.getCargo().getNome()));
        boolean podeRegistrar = autoridadeService.resolverAutoridades(cargos).stream()
                .anyMatch(autoridade -> AUTORIDADE_EUTANASIA.equals(autoridade.getAuthority()));
        if (!podeRegistrar || !StringUtils.hasText(autor.getCrmv())) {
            throw new EutanasiaSemResponsavelTecnicoException();
        }
    }

    private static void exigirLaudoInalterado(Animal animal, String laudo, String metodo, Boolean insensibilizacao) {
        boolean alterou = (laudo != null && !laudo.equals(animal.getLaudoEutanasia()))
                || (metodo != null && !metodo.equals(animal.getLaudoEutanasiaMetodo()))
                || (insensibilizacao != null && !insensibilizacao.equals(animal.getLaudoEutanasiaInsensibilizacaoPrevia()));
        if (alterou) {
            throw new LaudoEutanasiaImutavelException();
        }
    }

    private void aplicarTransferencia(Animal animal, StatusAnimal statusAnterior, StatusAnimal statusNovo,
            TransferenciaRequest transferencia, LocalDateTime dataEntrada) {
        boolean informada = transferencia != null && transferencia.temAlgumDado();
        if (animal.getDataSaida() != null) {
            if (informada) {
                exigirTransferenciaInalterada(animal, transferencia);
            }
            return;
        }
        boolean transferido = statusNovo != null && STATUS_TRANSFERIDO.equals(statusNovo.getCodigo());
        boolean entrandoEmTransferencia = transferido
                && (statusAnterior == null || !STATUS_TRANSFERIDO.equals(statusAnterior.getCodigo()));
        if (!transferido) {
            if (informada) {
                throw new CampoInvalidoException("transferencia",
                        "Informe o destino apenas quando o status for Transferido.");
            }
            return;
        }
        if (!entrandoEmTransferencia && !informada) {
            return;
        }
        if (transferencia == null || !StringUtils.hasText(transferencia.tipoDestino())) {
            throw new CampoInvalidoException("transferencia.tipoDestino", "Selecione o tipo de destino da transferência.");
        }
        TipoDestinoTransferencia tipo = resolverTipoDestino(transferencia.tipoDestino());
        String destino = Textos.normalizar(transferencia.destino());
        if (destino == null) {
            throw new CampoInvalidoException("transferencia.destino", "Informe o órgão ou a entidade de destino.");
        }
        LocalDateTime dataSaida = transferencia.dataSaida();
        if (dataSaida == null) {
            throw new CampoInvalidoException("transferencia.dataSaida", "Informe a data de saída do animal.");
        }
        if (dataSaida.toLocalDate().isAfter(LocalDate.now(clock))) {
            throw new CampoInvalidoException("transferencia.dataSaida", "A data de saída não pode ser futura.");
        }
        if (dataEntrada != null && dataSaida.isBefore(dataEntrada)) {
            throw new CampoInvalidoException("transferencia.dataSaida",
                    "A data de saída não pode ser anterior à data de entrada.");
        }
        animal.setTipoDestinoTransferencia(tipo);
        animal.setDestinoTransferencia(destino);
        animal.setDataSaida(dataSaida);
        animal.setDocumentoTransferencia(Textos.normalizar(transferencia.documento()));
    }

    private static void exigirTransferenciaInalterada(Animal animal, TransferenciaRequest transferencia) {
        String tipo = transferencia.tipoDestino();
        String destino = Textos.normalizar(transferencia.destino());
        String documento = Textos.normalizar(transferencia.documento());
        boolean alterou = (StringUtils.hasText(tipo) && !tipo.equals(animal.getTipoDestinoTransferencia().name()))
                || (destino != null && !destino.equals(animal.getDestinoTransferencia()))
                || (transferencia.dataSaida() != null && !transferencia.dataSaida().equals(animal.getDataSaida()))
                || (documento != null && animal.getDocumentoTransferencia() != null
                        && !documento.equals(animal.getDocumentoTransferencia()));
        if (alterou) {
            throw new TransferenciaImutavelException();
        }
        if (documento != null && animal.getDocumentoTransferencia() == null) {
            animal.setDocumentoTransferencia(documento);
        }
    }

    private static TipoDestinoTransferencia resolverTipoDestino(String codigo) {
        try {
            return TipoDestinoTransferencia.valueOf(codigo.trim());
        } catch (IllegalArgumentException ex) {
            throw new CampoInvalidoException("transferencia.tipoDestino", "Selecione um tipo de destino da lista.");
        }
    }

    private void validarDatas(
            LocalDateTime dataEntrada, LocalDate dataNascimento, Boolean esterilizado, LocalDate dataEsterilizacao) {
        LocalDate hoje = LocalDate.now(clock);

        if (dataEntrada != null && dataEntrada.toLocalDate().isAfter(hoje)) {
            throw new CampoInvalidoException("dataEntrada", "A data de entrada não pode ser futura.");
        }
        if (dataNascimento != null) {
            if (dataNascimento.isAfter(hoje)) {
                throw new CampoInvalidoException("dataNascimentoAprox", "A data de nascimento não pode ser futura.");
            }
            if (dataEntrada != null && dataNascimento.isAfter(dataEntrada.toLocalDate())) {
                throw new CampoInvalidoException("dataNascimentoAprox",
                        "A data de nascimento não pode ser posterior à data de entrada.");
            }
        }
        if (dataEsterilizacao != null) {
            if (!Boolean.TRUE.equals(esterilizado)) {
                throw new CampoInvalidoException("dataEsterilizacao",
                        "Informe a data da castração apenas para animal castrado.");
            }
            if (dataEsterilizacao.isAfter(hoje)) {
                throw new CampoInvalidoException("dataEsterilizacao", "A data da castração não pode ser futura.");
            }
        }
    }

    private Specification<Animal> construirFiltro(String status, Boolean custodia, String especie, UUID baiaId, String q) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (StringUtils.hasText(status)) {
                predicados.add(cb.equal(root.get("status").get("codigo"), status));
            }

            if (Boolean.TRUE.equals(custodia)) {
                predicados.add(cb.not(root.get("status").get("codigo").in(StatusAnimal.CODIGOS_FORA_DA_CUSTODIA)));
            }

            if (StringUtils.hasText(especie)) {
                predicados.add(cb.equal(root.get("especie").get("codigo"), especie));
            }

            if (baiaId != null) {
                predicados.add(cb.equal(root.get("baia").get("id"), baiaId));
            }

            if (StringUtils.hasText(q)) {
                String termo = BuscaTexto.padrao(q);
                String microchip = normalizarMicrochip(q);
                Predicate porIdentificacao = cb.or(
                        BuscaTexto.contem(cb, root.get("nome"), termo),
                        BuscaTexto.contem(cb, root.get("numeroMedalha"), termo));
                predicados.add(microchip == null
                        ? porIdentificacao
                        : cb.or(porIdentificacao, BuscaTexto.contem(cb, root.get("microchip"), BuscaTexto.padrao(microchip))));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
