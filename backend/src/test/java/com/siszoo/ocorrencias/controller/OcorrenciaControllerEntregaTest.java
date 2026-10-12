package com.siszoo.ocorrencias.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.siszoo.ocorrencias.dto.ArquivoAnexo;
import com.siszoo.ocorrencias.dto.EntregaAuditada;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.dto.VisualizacaoAuditada;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletResponseWrapper;
import tools.jackson.databind.json.JsonMapper;

// T26: a escrita do corpo de uma leitura auditada que falha depois do
// VISUALIZACAO commitado gera ENTREGA_INTERROMPIDA. Unitario porque a falha de
// escrita no socket nao e reproduzivel de forma deterministica por HTTP real;
// a persistencia do evento compensatorio e provada em AuditoriaSigiloIT.
class OcorrenciaControllerEntregaTest {

    private static final UUID OCORRENCIA_ID = UUID.randomUUID();
    private static final UUID ANEXO_ID = UUID.randomUUID();
    private static final UUID USUARIO_ID = UUID.randomUUID();
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final VisualizacaoAuditada VISUALIZACAO =
            new VisualizacaoAuditada(UUID.randomUUID(), "anexo_ocorrencia", ANEXO_ID, OCORRENCIA_ID);

    private final OcorrenciaService service = mock(OcorrenciaService.class);
    private final OcorrenciaController controller = new OcorrenciaController(service, JsonMapper.builder().build());
    private final Authentication autenticacao = new UsernamePasswordAuthenticationToken(USUARIO_ID.toString(), null,
            List.of(new SimpleGrantedAuthority(PermissoesOcorrencia.SIGILO)));

    @Test
    @DisplayName("[T26] download entregue: escreve o arquivo e nao registra ENTREGA_INTERROMPIDA")
    void downloadEntregueNaoCompensa() throws IOException {
        when(service.baixarAnexo(eq(OCORRENCIA_ID), eq(ANEXO_ID), any()))
                .thenReturn(new EntregaAuditada<>(new ArquivoAnexo("foto.png", "image/png", PNG), VISUALIZACAO));
        MockHttpServletResponse response = new MockHttpServletResponse();

        controller.baixarAnexo(autenticacao, OCORRENCIA_ID, ANEXO_ID, response);

        assertThat(response.getContentAsByteArray()).isEqualTo(PNG);
        assertThat(response.getContentType()).isEqualTo("image/png");
        assertThat(response.getHeader("Content-Disposition")).contains("foto.png");
        assertThat(response.isCommitted()).isTrue();
        verify(service, never()).registrarEntregaInterrompida(any(), any());
    }

    @Test
    @DisplayName("[T26] download auditado com falha ao descarregar o corpo: registra ENTREGA_INTERROMPIDA e relanca")
    void falhaNoDownloadAuditadoCompensa() {
        when(service.baixarAnexo(eq(OCORRENCIA_ID), eq(ANEXO_ID), any()))
                .thenReturn(new EntregaAuditada<>(new ArquivoAnexo("foto.png", "image/png", PNG), VISUALIZACAO));

        assertThatThrownBy(() -> controller.baixarAnexo(autenticacao, OCORRENCIA_ID, ANEXO_ID, new FalhaAoDescarregar()))
                .isInstanceOf(IOException.class)
                .hasMessage("cliente desconectou");

        verify(service).registrarEntregaInterrompida(eq(VISUALIZACAO),
                eq(new PermissoesOcorrencia(USUARIO_ID, true, false)));
    }

    @Test
    @DisplayName("[T26] leitura nao auditada com falha de escrita: nada a compensar, so relanca")
    void falhaSemVisualizacaoNaoCompensa() {
        when(service.baixarAnexo(eq(OCORRENCIA_ID), eq(ANEXO_ID), any()))
                .thenReturn(new EntregaAuditada<>(new ArquivoAnexo("foto.png", "image/png", PNG), null));

        assertThatThrownBy(() -> controller.baixarAnexo(autenticacao, OCORRENCIA_ID, ANEXO_ID, new FalhaAoDescarregar()))
                .isInstanceOf(IOException.class);

        verify(service, never()).registrarEntregaInterrompida(any(), any());
    }

    @Test
    @DisplayName("[T26] detalhe auditado com falha ao escrever o corpo: registra ENTREGA_INTERROMPIDA e relanca")
    void falhaNoDetalheAuditadoCompensa() {
        VisualizacaoAuditada visualizacao =
                new VisualizacaoAuditada(UUID.randomUUID(), "denunciante", UUID.randomUUID(), OCORRENCIA_ID);
        when(service.buscarPorId(eq(OCORRENCIA_ID), any()))
                .thenReturn(new EntregaAuditada<OcorrenciaResponse>(null, visualizacao));

        assertThatThrownBy(() -> controller.buscarPorId(autenticacao, OCORRENCIA_ID, new FalhaAoEscrever()))
                .isInstanceOf(IOException.class);

        verify(service).registrarEntregaInterrompida(eq(visualizacao), any());
    }

    @Test
    @DisplayName("[T26] se a propria compensacao falhar, a excecao original sobe com a da compensacao como suppressed")
    void falhaNaCompensacaoNaoEscondeAOriginal() {
        when(service.baixarAnexo(eq(OCORRENCIA_ID), eq(ANEXO_ID), any()))
                .thenReturn(new EntregaAuditada<>(new ArquivoAnexo("foto.png", "image/png", PNG), VISUALIZACAO));
        IllegalStateException falhaNaCompensacao = new IllegalStateException("banco indisponivel");
        doThrow(falhaNaCompensacao).when(service).registrarEntregaInterrompida(any(), any());

        assertThatThrownBy(() -> controller.baixarAnexo(autenticacao, OCORRENCIA_ID, ANEXO_ID, new FalhaAoDescarregar()))
                .isInstanceOf(IOException.class)
                .hasMessage("cliente desconectou")
                .satisfies(e -> assertThat(e.getSuppressed()).containsExactly(falhaNaCompensacao));
    }

    // Cliente que desconecta: o corpo cabe no buffer, a falha vem ao descarregar.
    private static final class FalhaAoDescarregar extends HttpServletResponseWrapper {
        FalhaAoDescarregar() {
            super(new MockHttpServletResponse());
        }

        @Override
        public void flushBuffer() throws IOException {
            throw new IOException("cliente desconectou");
        }
    }

    // Falha ja na escrita do corpo.
    private static final class FalhaAoEscrever extends MockHttpServletResponse {
        @Override
        public ServletOutputStream getOutputStream() {
            return new ServletOutputStream() {
                @Override
                public void write(int b) throws IOException {
                    throw new IOException("conexao encerrada");
                }

                @Override
                public void write(byte[] b, int off, int len) throws IOException {
                    throw new IOException("conexao encerrada");
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setWriteListener(WriteListener writeListener) {
                }
            };
        }
    }
}
