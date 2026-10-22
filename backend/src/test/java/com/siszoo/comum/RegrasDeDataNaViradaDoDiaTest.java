package com.siszoo.comum;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.alertas.mapper.AlertaVacinalMapper;
import com.siszoo.alertas.service.AlertaVacinalService;
import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.exception.DataAplicacaoFuturaException;
import com.siszoo.animais.clinico.mapper.VacinacaoMapper;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.clinico.service.VacinacaoService;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.service.FichaCompletaService;
import com.siszoo.comum.config.ClockConfig;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

// Datas de negocio na virada do dia UTC x Itu (DER §5 regra 4; AC-1/AC-2):
// entre 21:00 e 23:59 em Sao Paulo o dia UTC ja e o seguinte. Cada caso fixa
// o instante com o fuso do Clock de PRODUCAO (ClockConfig), nao com um fuso
// escrito no teste: trocar a zona de ClockConfig (ou um servico ler o relogio
// da JVM) quebra estes testes em qualquer hora em que a suite rode. Os
// instantes ficam em 2030/2031 para nunca coincidirem com o dia real.
@ExtendWith(MockitoExtension.class)
class RegrasDeDataNaViradaDoDiaTest {

    @Mock private VacinacaoRepository vacinacaoRepository;
    @Mock private VacinaRepository vacinaRepository;
    @Mock private AnimalRepository animalRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private VacinacaoMapper vacinacaoMapper;
    @Mock private AuditoriaEventoService auditoriaEventoService;
    @Mock private FichaCompletaService fichaCompletaService;
    @Mock private AlertaVacinalMapper alertaVacinalMapper;
    @Mock private JdbcTemplate jdbcTemplate;

    // instante UTC, dia civil esperado em Itu
    static Stream<Arguments> viradasDoDia() {
        return Stream.of(
                Arguments.of("20:59 BRT (23:59 UTC, mesmo dia)", "2030-03-15T23:59:00Z", "2030-03-15"),
                Arguments.of("21:00 BRT (00:00 UTC do dia seguinte)", "2030-03-16T00:00:00Z", "2030-03-15"),
                Arguments.of("23:59 BRT", "2030-03-16T02:59:00Z", "2030-03-15"),
                Arguments.of("00:00 BRT", "2030-03-16T03:00:00Z", "2030-03-16"),
                Arguments.of("30/04 21:30 BRT (virada de mes em UTC)", "2030-05-01T00:30:00Z", "2030-04-30"),
                Arguments.of("31/12 21:30 BRT (virada de ano em UTC)", "2031-01-01T00:30:00Z", "2030-12-31"));
    }

    private static Clock relogioDeProducaoNoInstante(String instante) {
        return Clock.fixed(Instant.parse(instante), new ClockConfig().clock().getZone());
    }

    @ParameterizedTest(name = "{0}: hoje = {2}")
    @MethodSource("viradasDoDia")
    void hojeEODiaCivilDeItu(String caso, String instante, String hoje) {
        assertThat(LocalDate.now(relogioDeProducaoNoInstante(instante))).isEqualTo(LocalDate.parse(hoje));
    }

    @ParameterizedTest(name = "{0}: aplicacao em {2} e aceita")
    @MethodSource("viradasDoDia")
    void vacinacaoAceitaODiaDeItu(String caso, String instante, String hoje) {
        VacinacaoService service = vacinacaoService(instante);
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        stubAnimalEUsuario(animalId, usuarioId);
        when(vacinaRepository.findByCodigo("antirrabica")).thenReturn(Optional.of(new Vacina()));
        when(vacinacaoMapper.toResponse(any(Vacinacao.class), isNull())).thenReturn(null);

        service.criar(vacinacao(animalId, LocalDate.parse(hoje)), usuarioId);

        verify(vacinacaoRepository).save(any(Vacinacao.class));
    }

    @ParameterizedTest(name = "{0}: aplicacao no dia seguinte a {2} e recusada")
    @MethodSource("viradasDoDia")
    void vacinacaoRecusaODiaSeguinteAoDeItu(String caso, String instante, String hoje) {
        VacinacaoService service = vacinacaoService(instante);
        UUID animalId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        stubAnimalEUsuario(animalId, usuarioId);

        assertThatThrownBy(() -> service.criar(vacinacao(animalId, LocalDate.parse(hoje).plusDays(1)), usuarioId))
                .isInstanceOf(DataAplicacaoFuturaException.class);
        verify(vacinacaoRepository, never()).save(any(Vacinacao.class));
    }

    @ParameterizedTest(name = "{0}: validade em hoje + 7 entra no alerta")
    @MethodSource("viradasDoDia")
    void alertaIncluiValidadeEmHojeMaisSete(String caso, String instante, String hoje) {
        LocalDate validade = LocalDate.parse(hoje).plusDays(7);
        when(vacinacaoRepository.findVigentesParaAlertaVacinal(any())).thenReturn(List.of(vacinacaoComValidade(validade)));

        assertThat(alertaVacinalService(instante).listarAlertasVacinais()).hasSize(1);
        verify(alertaVacinalMapper).toItem(any(Vacinacao.class), eq(validade), eq(7L), any());
    }

    @ParameterizedTest(name = "{0}: validade em hoje + 8 fica fora do alerta")
    @MethodSource("viradasDoDia")
    void alertaExcluiValidadeEmHojeMaisOito(String caso, String instante, String hoje) {
        LocalDate validade = LocalDate.parse(hoje).plusDays(8);
        when(vacinacaoRepository.findVigentesParaAlertaVacinal(any())).thenReturn(List.of(vacinacaoComValidade(validade)));

        assertThat(alertaVacinalService(instante).listarAlertasVacinais()).isEmpty();
    }

    // Protocolo NNN/AAAA: o ano e o do registro em Itu, nao o de UTC.
    @ParameterizedTest(name = "{0} -> protocolo do ano {2}")
    @CsvSource({
            "31/12 21:30 BRT, 2031-01-01T00:30:00Z, 2030",
            "31/12 23:59 BRT, 2031-01-01T02:59:00Z, 2030",
            "01/01 00:00 BRT, 2031-01-01T03:00:00Z, 2031",
    })
    void protocoloUsaOAnoDeItu(String caso, String instante, int ano) {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq("PROCESSO"), eq(ano))).thenReturn(1);

        String protocolo = new ProtocoloService(jdbcTemplate, relogioDeProducaoNoInstante(instante))
                .proximo(ProtocoloService.Entidade.PROCESSO);

        assertThat(protocolo).isEqualTo("001/" + ano);
    }

    private VacinacaoService vacinacaoService(String instante) {
        return new VacinacaoService(vacinacaoRepository, vacinaRepository, animalRepository, usuarioRepository,
                vacinacaoMapper, auditoriaEventoService, fichaCompletaService, relogioDeProducaoNoInstante(instante));
    }

    private AlertaVacinalService alertaVacinalService(String instante) {
        return new AlertaVacinalService(vacinacaoRepository, alertaVacinalMapper, relogioDeProducaoNoInstante(instante));
    }

    private void stubAnimalEUsuario(UUID animalId, UUID usuarioId) {
        Animal animal = new Animal();
        animal.setId(animalId);
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        when(animalRepository.findById(animalId)).thenReturn(Optional.of(animal));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
    }

    private static CriarVacinacaoRequest vacinacao(UUID animalId, LocalDate dataAplicacao) {
        return new CriarVacinacaoRequest(
                animalId, "antirrabica", dataAplicacao, 1, new BigDecimal("1.000"), UnidadeDose.MILILITRO, "LOTE1", null, null);
    }

    // Reforco anual: validade = aplicacao + 12 meses (AlertaVacinalService#calcularDataValidade).
    private static Vacinacao vacinacaoComValidade(LocalDate validade) {
        Vacina vacina = new Vacina();
        vacina.setIntervaloMeses(12);
        Animal animal = new Animal();
        animal.setId(UUID.randomUUID());
        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setVacina(vacina);
        vacinacao.setAnimal(animal);
        vacinacao.setDataAplicacao(validade.minusMonths(12));
        return vacinacao;
    }
}
