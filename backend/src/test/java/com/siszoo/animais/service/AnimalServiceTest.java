package com.siszoo.animais.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.entity.MotivoEntrada;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.exception.BaiaIndisponivelException;
import com.siszoo.animais.mapper.AnimalMapper;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.animais.repository.MotivoEntradaRepository;
import com.siszoo.animais.repository.StatusAnimalRepository;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@ExtendWith(MockitoExtension.class)
class AnimalServiceTest {

    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);
    private static final LocalDateTime ENTRADA = HOJE.atTime(9, 30);

    @Mock
    private com.siszoo.animais.repository.CondicaoSaudeRepository condicaoSaudeRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private BaiaRepository baiaRepository;

    @Mock
    private EspecieRepository especieRepository;

    @Mock
    private StatusAnimalRepository statusAnimalRepository;

    @Mock
    private MotivoEntradaRepository motivoEntradaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AnimalMapper animalMapper;

    @Mock
    private FichaCompletaService fichaCompletaService;

    @Mock
    private AuditoriaEventoService auditoriaEventoService;

    private AnimalService animalService;

    @BeforeEach
    void criarService() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        animalService = new AnimalService(animalRepository, baiaRepository, especieRepository, statusAnimalRepository,
                motivoEntradaRepository, condicaoSaudeRepository, usuarioRepository, animalMapper, fichaCompletaService,
                auditoriaEventoService,
                new MiniaturaFoto(), clock);
        lenient().when(usuarioRepository.findById(usuarioComId().getId())).thenReturn(Optional.of(usuarioComId()));
    }

    @Test
    void deveRecusarDataDeEntradaFutura() {
        assertRecusaCampo(criar(HOJE.plusDays(1).atStartOfDay(), null, false, null, null, "em_tratamento"),
                "dataEntrada");
    }

    @Test
    void deveRecusarNascimentoFuturo() {
        assertRecusaCampo(criar(ENTRADA, HOJE.plusDays(1), false, null, null, "em_tratamento"),
                "dataNascimentoAprox");
    }

    @Test
    void deveRecusarNascimentoPosteriorAEntrada() {
        assertRecusaCampo(criar(ENTRADA.minusDays(10), HOJE.minusDays(5), false, null, null, "em_tratamento"),
                "dataNascimentoAprox");
    }

    @Test
    void deveRecusarDataDeCastracaoEmAnimalNaoCastrado() {
        assertRecusaCampo(criar(ENTRADA, null, false, HOJE.minusDays(1), null, "em_tratamento"),
                "dataEsterilizacao");
    }

    @Test
    void deveRecusarCastracaoFutura() {
        assertRecusaCampo(criar(ENTRADA, null, true, HOJE.plusDays(1), null, "em_tratamento"),
                "dataEsterilizacao");
    }

    @Test
    void deveAceitarDatasDeHojeENascimentoNoDiaDaEntrada() {
        prepararCatalogos("em_tratamento");

        animalService.criar(criar(ENTRADA, HOJE, true, HOJE, null, "em_tratamento"), usuarioComId().getId());

        verify(animalRepository).save(any(Animal.class));
    }

    @Test
    void deveRecusarBaiaInativaNoCadastro() {
        Baia baia = baia(5, false);
        when(statusAnimalRepository.findByCodigo("em_tratamento")).thenReturn(Optional.of(status("em_tratamento")));
        when(baiaRepository.findByIdForUpdate(baia.getId())).thenReturn(Optional.of(baia));

        assertThatThrownBy(() -> animalService.criar(
                criar(ENTRADA, null, false, null, baia.getId(), "em_tratamento"), UUID.randomUUID()))
                .isInstanceOf(BaiaIndisponivelException.class)
                .hasMessageContaining("inativa");
        verify(animalRepository, never()).save(any());
    }

    @Test
    void deveRecusarBaiaCheiaNoCadastro() {
        Baia baia = baia(2, true);
        when(statusAnimalRepository.findByCodigo("em_tratamento")).thenReturn(Optional.of(status("em_tratamento")));
        when(baiaRepository.findByIdForUpdate(baia.getId())).thenReturn(Optional.of(baia));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(baia.getId()), anyCollection())).thenReturn(2L);

        assertThatThrownBy(() -> animalService.criar(
                criar(ENTRADA, null, false, null, baia.getId(), "em_tratamento"), UUID.randomUUID()))
                .isInstanceOf(BaiaIndisponivelException.class)
                .hasMessageContaining("capacidade");
        verify(animalRepository, never()).save(any());
    }

    @Test
    void deveAceitarBaiaComVagaNoCadastro() {
        Baia baia = baia(2, true);
        prepararCatalogos("em_tratamento");
        when(baiaRepository.findByIdForUpdate(baia.getId())).thenReturn(Optional.of(baia));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(baia.getId()), anyCollection())).thenReturn(1L);

        animalService.criar(criar(ENTRADA, null, false, null, baia.getId(), "em_tratamento"), usuarioComId().getId());

        verify(animalRepository).save(any(Animal.class));
    }

    @Test
    void naoConfereBaiaQuandoStatusNovoEstaForaDaCustodia() {
        Baia baia = baia(1, false);
        prepararCatalogos("adotado");
        when(baiaRepository.findById(baia.getId())).thenReturn(Optional.of(baia));

        animalService.criar(criar(ENTRADA, null, false, null, baia.getId(), "adotado"), usuarioComId().getId());

        verify(animalRepository, never()).countByBaia_IdAndStatus_CodigoNotIn(any(), anyCollection());
        verify(animalRepository).save(any(Animal.class));
    }

    @Test
    void edicaoDeQuemJaOcupaABaiaNaoEBarradaPorLotacaoOuInatividade() {
        Baia baia = baia(1, false);
        Animal animal = animalNaBaia(baia, "em_tratamento");
        prepararCatalogosEdicao("em_tratamento");
        when(animalRepository.findById(animal.getId())).thenReturn(Optional.of(animal));
        when(baiaRepository.findById(baia.getId())).thenReturn(Optional.of(baia));

        animalService.atualizar(animal.getId(), atualizar(baia.getId(), "em_tratamento"), usuarioComId().getId());

        verify(animalRepository, never()).countByBaia_IdAndStatus_CodigoNotIn(any(), anyCollection());
        assertThat(animal.getBaia()).isSameAs(baia);
    }

    @Test
    void trocaParaBaiaCheiaNaEdicaoERecusada() {
        Baia origem = baia(5, true);
        Baia destino = baia(1, true);
        Animal animal = animalNaBaia(origem, "em_tratamento");
        when(animalRepository.findById(animal.getId())).thenReturn(Optional.of(animal));
        when(statusAnimalRepository.findByCodigo("em_tratamento")).thenReturn(Optional.of(status("em_tratamento")));
        when(baiaRepository.findByIdForUpdate(destino.getId())).thenReturn(Optional.of(destino));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(destino.getId()), anyCollection())).thenReturn(1L);

        assertThatThrownBy(() -> animalService.atualizar(animal.getId(), atualizar(destino.getId(), "em_tratamento"), usuarioComId().getId()))
                .isInstanceOf(BaiaIndisponivelException.class);
        assertThat(animal.getBaia()).isSameAs(origem);
    }

    @Test
    void voltaACustodiaNaMesmaBaiaCheiaERecusada() {
        Baia baia = baia(1, true);
        Animal animal = animalNaBaia(baia, "transferido");
        when(animalRepository.findById(animal.getId())).thenReturn(Optional.of(animal));
        when(statusAnimalRepository.findByCodigo("em_tratamento")).thenReturn(Optional.of(status("em_tratamento")));
        when(baiaRepository.findByIdForUpdate(baia.getId())).thenReturn(Optional.of(baia));
        when(animalRepository.countByBaia_IdAndStatus_CodigoNotIn(eq(baia.getId()), anyCollection())).thenReturn(1L);

        assertThatThrownBy(() -> animalService.atualizar(animal.getId(), atualizar(baia.getId(), "em_tratamento"), usuarioComId().getId()))
                .isInstanceOf(BaiaIndisponivelException.class);
    }

    @Test
    void fichaCompletaVemDoFichaCompletaService() {
        prepararCatalogos("em_tratamento");
        when(fichaCompletaService.calcular(any(Animal.class))).thenReturn(true);

        animalService.criar(criar(ENTRADA, null, false, null, null, "em_tratamento"), usuarioComId().getId());

        verify(animalRepository).save(org.mockito.ArgumentMatchers.argThat(Animal::isFichaCompleta));
    }

    private void assertRecusaCampo(CriarAnimalRequest request, String campo) {
        assertThatThrownBy(() -> animalService.criar(request, UUID.randomUUID()))
                .isInstanceOf(CampoInvalidoException.class)
                .satisfies(e -> assertThat(((CampoInvalidoException) e).getCampo()).isEqualTo(campo));
        verify(animalRepository, never()).save(any());
    }

    private Usuario usuarioCriador;

    private Usuario usuarioComId() {
        if (usuarioCriador == null) {
            usuarioCriador = new Usuario();
            usuarioCriador.setId(UUID.randomUUID());
        }
        return usuarioCriador;
    }

    private void prepararCatalogos(String statusCodigo) {
        when(statusAnimalRepository.findByCodigo(statusCodigo)).thenReturn(Optional.of(status(statusCodigo)));
        when(especieRepository.findByCodigo("canino")).thenReturn(Optional.of(new Especie()));
        when(motivoEntradaRepository.findByCodigo("resgate")).thenReturn(Optional.of(new MotivoEntrada()));
    }

    private void prepararCatalogosEdicao(String statusCodigo) {
        when(statusAnimalRepository.findByCodigo(statusCodigo)).thenReturn(Optional.of(status(statusCodigo)));
        when(especieRepository.findByCodigo("canino")).thenReturn(Optional.of(new Especie()));
        when(motivoEntradaRepository.findByCodigo("resgate")).thenReturn(Optional.of(new MotivoEntrada()));
    }

    private static StatusAnimal status(String codigo) {
        StatusAnimal status = new StatusAnimal();
        status.setId(UUID.randomUUID());
        status.setCodigo(codigo);
        return status;
    }

    private static Baia baia(int capacidade, boolean ativa) {
        Baia baia = new Baia();
        baia.setId(UUID.randomUUID());
        baia.setCapacidade((short) capacidade);
        baia.setAtiva(ativa);
        return baia;
    }

    private static Animal animalNaBaia(Baia baia, String statusCodigo) {
        Animal animal = new Animal();
        animal.setId(UUID.randomUUID());
        animal.setBaia(baia);
        animal.setStatus(status(statusCodigo));
        return animal;
    }

    private static CriarAnimalRequest criar(LocalDateTime entrada, LocalDate nascimento, boolean esterilizado,
            LocalDate castracao, UUID baiaId, String status) {
        return new CriarAnimalRequest("Rex", "canino", "macho", null, null, null, null, null, null, nascimento,
                null, esterilizado, castracao, status, "resgate", entrada, baiaId, null, null, null, null, null, null);
    }

    private static AtualizarAnimalRequest atualizar(UUID baiaId, String status) {
        return new AtualizarAnimalRequest("Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, status, "resgate", ENTRADA, baiaId, null, null, null, null, null, null);
    }
}
