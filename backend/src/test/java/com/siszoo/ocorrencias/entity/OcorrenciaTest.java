package com.siszoo.ocorrencias.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import com.siszoo.ocorrencias.exception.TransicaoStatusInvalidaException;
import com.siszoo.usuarios.entity.Usuario;

// Matriz de transicoes D5, aplicada pela propria entidade.
class OcorrenciaTest {

    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 9, 10, 12, 0);

    @Test
    @DisplayName("[D5] ABERTA -> EM_ATENDIMENTO")
    void iniciarAtendimentoDeAberta() {
        Ocorrencia ocorrencia = new Ocorrencia();

        assertThat(ocorrencia.iniciarAtendimento()).isEqualTo(StatusOcorrencia.ABERTA);
        assertThat(ocorrencia.getStatusOcorrencia()).isEqualTo(StatusOcorrencia.EM_ATENDIMENTO);
    }

    @Test
    @DisplayName("[D5] EM_ATENDIMENTO -> EM_ATENDIMENTO (mesmo status) e recusado")
    void iniciarAtendimentoDuasVezes() {
        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.iniciarAtendimento();

        assertThatThrownBy(ocorrencia::iniciarAtendimento).isInstanceOf(TransicaoStatusInvalidaException.class);
    }

    @Test
    @DisplayName("[D5] EM_ATENDIMENTO -> ENCERRADA com qualquer providencia, preenchendo os campos de encerramento")
    void encerrarDeEmAtendimento() {
        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.iniciarAtendimento();
        Usuario autor = new Usuario();

        StatusOcorrencia anterior = ocorrencia.encerrar(providencia("captura_remocao"), "capturado", AGORA, autor);

        assertThat(anterior).isEqualTo(StatusOcorrencia.EM_ATENDIMENTO);
        assertThat(ocorrencia.getStatusOcorrencia()).isEqualTo(StatusOcorrencia.ENCERRADA);
        assertThat(ocorrencia.getProvidenciaTomada().getCodigo()).isEqualTo("captura_remocao");
        assertThat(ocorrencia.getDescricaoEncerramento()).isEqualTo("capturado");
        assertThat(ocorrencia.getEncerradaEm()).isEqualTo(AGORA);
        assertThat(ocorrencia.getEncerradaPor()).isSameAs(autor);
    }

    static Stream<Arguments> providenciasDeAberta() {
        return Stream.of(
                Arguments.of("sem_acao", true),
                Arguments.of("orientacao_municipe", true),
                Arguments.of("registro_indevido", true),
                Arguments.of("captura_remocao", false),
                Arguments.of("encaminhamento_gepar", false),
                Arguments.of("abertura_processo", false),
                Arguments.of("outro", false));
    }

    @ParameterizedTest(name = "[D5] ABERTA -> ENCERRADA com {0}: permitido = {1}")
    @MethodSource("providenciasDeAberta")
    void encerrarDiretoDeAberta(String codigo, boolean permitido) {
        Ocorrencia ocorrencia = new Ocorrencia();

        if (permitido) {
            assertThat(ocorrencia.encerrar(providencia(codigo), null, AGORA, new Usuario())).isEqualTo(StatusOcorrencia.ABERTA);
            assertThat(ocorrencia.getStatusOcorrencia()).isEqualTo(StatusOcorrencia.ENCERRADA);
        } else {
            assertThatThrownBy(() -> ocorrencia.encerrar(providencia(codigo), "x", AGORA, new Usuario()))
                    .isInstanceOf(TransicaoStatusInvalidaException.class);
            assertThat(ocorrencia.getStatusOcorrencia()).isEqualTo(StatusOcorrencia.ABERTA);
            assertThat(ocorrencia.getProvidenciaTomada()).isNull();
        }
    }

    @Test
    @DisplayName("[D5] ENCERRADA nao volta nem encerra de novo")
    void encerradaNaoTransiciona() {
        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.encerrar(providencia("sem_acao"), null, AGORA, new Usuario());

        assertThatThrownBy(ocorrencia::iniciarAtendimento).isInstanceOf(TransicaoStatusInvalidaException.class);
        assertThatThrownBy(() -> ocorrencia.encerrar(providencia("sem_acao"), null, AGORA, new Usuario()))
                .isInstanceOf(TransicaoStatusInvalidaException.class);
    }

    private static ProvidenciaTomada providencia(String codigo) {
        ProvidenciaTomada providencia = new ProvidenciaTomada();
        providencia.setCodigo(codigo);
        return providencia;
    }
}
