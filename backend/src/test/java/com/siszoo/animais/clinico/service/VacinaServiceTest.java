package com.siszoo.animais.clinico.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.dto.AtualizarVacinaRequest;
import com.siszoo.animais.clinico.dto.CriarVacinaRequest;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.exception.VacinaJaCadastradaException;
import com.siszoo.animais.clinico.exception.VacinaNaoEncontradaException;
import com.siszoo.animais.clinico.mapper.VacinaMapper;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.comum.exception.CampoInvalidoException;

@ExtendWith(MockitoExtension.class)
class VacinaServiceTest {

    @Mock
    private VacinaRepository vacinaRepository;

    @Mock
    private VacinaMapper vacinaMapper;

    @InjectMocks
    private VacinaService vacinaService;

    // Lastro contra o seed da V5: se a slugificacao mudar, as 8 vacinas
    // existentes deixariam de ser encontradas por codigo.
    @ParameterizedTest
    @CsvSource({
        "Antirrábica, antirrabica",
        "V10, v10",
        "V8, v8",
        "V4 (felinos), v4_felinos",
        "Giárdia, giardia",
        "Gripe canina, gripe_canina",
        "FeLV, felv",
        "Leishmaniose, leishmaniose",
    })
    void deveReproduzirOsCodigosDoSeed(String nome, String codigoEsperado) {
        assertThat(VacinaService.derivarCodigo(nome)).isEqualTo(codigoEsperado);
    }

    @ParameterizedTest
    @CsvSource({
        "'  Raiva  ', raiva",
        "'Gripe   canina', gripe_canina",
        "'ANTIRRÁBICA', antirrabica",
        "'V4 -- felinos!', v4_felinos",
    })
    void deveNormalizarEspacosAcentosEPontuacao(String nome, String codigoEsperado) {
        assertThat(VacinaService.derivarCodigo(nome.trim())).isEqualTo(codigoEsperado);
    }

    // Nunca truncar: nomes diferentes passariam a colidir no mesmo codigo.
    @ParameterizedTest
    @ValueSource(strings = {"!!!", "---", "Vacina polivalente para felinos domesticos adultos"})
    void deveRecusarNomeQueNaoProduzCodigoValido(String nome) {
        assertThatThrownBy(() -> VacinaService.derivarCodigo(nome))
                .isInstanceOf(CampoInvalidoException.class)
                .extracting(erro -> ((CampoInvalidoException) erro).getCampo())
                .isEqualTo("nome");
    }

    @Test
    void deveGravarCodigoDerivadoENomeSemEspacosNasPontas() {
        when(vacinaRepository.findByCodigo("antirrabica")).thenReturn(Optional.empty());

        vacinaService.criar(new CriarVacinaRequest("  Antirrábica  ", 12));

        ArgumentCaptor<Vacina> salva = ArgumentCaptor.forClass(Vacina.class);
        verify(vacinaRepository).save(salva.capture());
        assertThat(salva.getValue().getCodigo()).isEqualTo("antirrabica");
        assertThat(salva.getValue().getNome()).isEqualTo("Antirrábica");
        assertThat(salva.getValue().getIntervaloMeses()).isEqualTo(12);
        assertThat(salva.getValue().isAtivo()).isTrue();
    }

    @Test
    void deveAceitarVacinaSemIntervaloDeReforco() {
        when(vacinaRepository.findByCodigo("teste")).thenReturn(Optional.empty());

        vacinaService.criar(new CriarVacinaRequest("Teste", null));

        ArgumentCaptor<Vacina> salva = ArgumentCaptor.forClass(Vacina.class);
        verify(vacinaRepository).save(salva.capture());
        assertThat(salva.getValue().getIntervaloMeses()).isNull();
    }

    // Nomes diferentes que derivam o mesmo codigo: o usuario nao ve o codigo,
    // entao a mensagem precisa nomear a vacina em conflito.
    @Test
    void deveRecusarNomeQueDerivaCodigoJaUsado() {
        Vacina existente = new Vacina();
        existente.setNome("V4 (felinos)");
        existente.setCodigo("v4_felinos");
        when(vacinaRepository.findByCodigo("v4_felinos")).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> vacinaService.criar(new CriarVacinaRequest("V4 felinos", 12)))
                .isInstanceOf(VacinaJaCadastradaException.class)
                .hasMessageContaining("V4 (felinos)")
                .hasMessageContaining("v4_felinos");

        verify(vacinaRepository, never()).save(any());
    }

    @Test
    void deveOrientarAReativarQuandoAVacinaEmConflitoEstaInativa() {
        Vacina existente = new Vacina();
        existente.setNome("Giárdia");
        existente.setCodigo("giardia");
        existente.setAtivo(false);
        when(vacinaRepository.findByCodigo("giardia")).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> vacinaService.criar(new CriarVacinaRequest("Giardia", 12)))
                .isInstanceOf(VacinaJaCadastradaException.class)
                .hasMessageContaining("Reative-a");

        verify(vacinaRepository, never()).save(any());
    }

    // O codigo e a chave dos registros ja gravados: renomear nao pode mexer
    // nele (mesmo argumento do microchip na RN01).
    @Test
    void naoDeveAlterarOCodigoAoRenomear() {
        UUID id = UUID.randomUUID();
        Vacina vacina = new Vacina();
        vacina.setId(id);
        vacina.setCodigo("antirrabica");
        vacina.setNome("Antirrábica");
        when(vacinaRepository.findById(id)).thenReturn(Optional.of(vacina));

        vacinaService.atualizar(id, new AtualizarVacinaRequest("Antirrábica (anual)", 24, true));

        assertThat(vacina.getCodigo()).isEqualTo("antirrabica");
        assertThat(vacina.getNome()).isEqualTo("Antirrábica (anual)");
        assertThat(vacina.getIntervaloMeses()).isEqualTo(24);
    }

    @Test
    void devePermitirReativarPeloPut() {
        UUID id = UUID.randomUUID();
        Vacina vacina = new Vacina();
        vacina.setId(id);
        vacina.setCodigo("giardia");
        vacina.setAtivo(false);
        when(vacinaRepository.findById(id)).thenReturn(Optional.of(vacina));

        vacinaService.atualizar(id, new AtualizarVacinaRequest("Giárdia", 12, true));

        assertThat(vacina.isAtivo()).isTrue();
    }

    @Test
    void desativarNaoRemoveALinha() {
        UUID id = UUID.randomUUID();
        Vacina vacina = new Vacina();
        vacina.setId(id);
        when(vacinaRepository.findById(id)).thenReturn(Optional.of(vacina));

        vacinaService.desativar(id);

        assertThat(vacina.isAtivo()).isFalse();
        verify(vacinaRepository).save(vacina);
        // delete(any()) seria ambiguo: JpaSpecificationExecutor acrescenta uma
        // sobrecarga delete(Specification).
        verify(vacinaRepository, never()).delete(any(Vacina.class));
    }

    @Test
    void deveRecusarAtualizacaoDeVacinaInexistente() {
        UUID id = UUID.randomUUID();
        when(vacinaRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vacinaService.atualizar(id, new AtualizarVacinaRequest("Teste", 12, true)))
                .isInstanceOf(VacinaNaoEncontradaException.class);
    }
}
