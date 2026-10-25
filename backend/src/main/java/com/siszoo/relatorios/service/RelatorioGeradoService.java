package com.siszoo.relatorios.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.comum.util.Formatadores;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.relatorios.dto.ArquivoRelatorio;
import com.siszoo.relatorios.dto.FiltroRelatorioBruto;
import com.siszoo.relatorios.dto.MetadadosDocumento;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioGeradoResponse;
import com.siszoo.relatorios.dto.TipoRelatorioResponse;
import com.siszoo.relatorios.entity.RelatorioGerado;
import com.siszoo.relatorios.entity.TipoRelatorio;
import com.siszoo.relatorios.repository.RelatorioGeradoRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import tools.jackson.databind.ObjectMapper;

// Orquestra os 4 endpoints de relatorios (T41): despacha para o
// GeradorRelatorio do tipo pedido, gera CSV/PDF e, so em caso de sucesso,
// grava relatorio_gerado na mesma transacao (doc_id consumido via
// ProtocoloService ANTES da geracao do conteudo, para o PDF poder exibi-lo no
// cabecalho). Para os 4 tipos ainda nao implementados (PR2), gerador(tipo)
// recusa com 422 generico — nao ha estado "nao implementado" permanente, so
// enquanto a T41 nao estiver completa.
@Service
public class RelatorioGeradoService {

    private final Map<TipoRelatorio, GeradorRelatorio<?>> geradoresPorTipo;
    private final FiltroRelatorioResolver filtroResolver;
    private final com.siszoo.comum.util.CsvWriter csvWriter;
    private final PdfRelatorioRenderer pdfRenderer;
    private final ProtocoloService protocoloService;
    private final RelatorioGeradoRepository relatorioGeradoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaEventoService auditoriaEventoService;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public RelatorioGeradoService(
            List<GeradorRelatorio<?>> geradores,
            FiltroRelatorioResolver filtroResolver,
            com.siszoo.comum.util.CsvWriter csvWriter,
            PdfRelatorioRenderer pdfRenderer,
            ProtocoloService protocoloService,
            RelatorioGeradoRepository relatorioGeradoRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaEventoService auditoriaEventoService,
            ObjectMapper objectMapper,
            Clock clock) {
        this.geradoresPorTipo = geradores.stream().collect(Collectors.toMap(GeradorRelatorio::tipo, g -> g));
        this.filtroResolver = filtroResolver;
        this.csvWriter = csvWriter;
        this.pdfRenderer = pdfRenderer;
        this.protocoloService = protocoloService;
        this.relatorioGeradoRepository = relatorioGeradoRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaEventoService = auditoriaEventoService;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public List<TipoRelatorioResponse> listarTipos() {
        return java.util.Arrays.stream(TipoRelatorio.values())
                .map(tipo -> new TipoRelatorioResponse(
                        tipo.codigo(), tipo.nomeExibicao(), tipo.filtroEsperado().name().toLowerCase(Locale.ROOT)))
                .toList();
    }

    public Object preview(FiltroRelatorioBruto filtroBruto) {
        PeriodoRelatorio periodo = filtroResolver.resolver(filtroBruto);
        return gerador(filtroBruto.tipo()).gerarPreview(periodo);
    }

    @Transactional
    public ArquivoRelatorio exportar(FiltroRelatorioBruto filtroBruto, String formato, UUID usuarioId) {
        boolean csv = "csv".equalsIgnoreCase(formato);
        boolean pdf = "pdf".equalsIgnoreCase(formato);
        if (!csv && !pdf) {
            throw new CampoInvalidoException("formato", "Formato inválido: use csv ou pdf");
        }

        TipoRelatorio tipo = filtroBruto.tipo();
        GeradorRelatorio<?> gerador = gerador(tipo);
        PeriodoRelatorio periodo = filtroResolver.resolver(filtroBruto);
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);

        // doc_id consumido ANTES do conteudo: o PDF precisa exibi-lo no
        // cabecalho (mesmo padrao de ProtocoloService — um rollback desfaz o
        // incremento, entao nao ha doc_id "perdido" se a geracao falhar depois).
        int numero = protocoloService.proximoNumero(ProtocoloService.Entidade.RELATORIO);
        String docId = String.format("DOC-%d-%04d", Year.now(clock).getValue(), numero);

        byte[] conteudo;
        String contentType;
        String extensao;
        if (csv) {
            conteudo = csvWriter.gerar(gerador.blocosCsv(periodo));
            contentType = "text/csv;charset=UTF-8";
            extensao = "csv";
        } else {
            MetadadosDocumento metadados = new MetadadosDocumento(
                    docId,
                    Formatadores.DATA_HORA.format(LocalDateTime.now(clock)),
                    usuario.nomeCompleto(),
                    Formatadores.DATA.format(periodo.inicio()) + " a " + Formatadores.DATA.format(periodo.fim()));
            conteudo = pdfRenderer.renderizar(tipo, gerador.gerarPreview(periodo), metadados);
            contentType = "application/pdf";
            extensao = "pdf";
        }

        RelatorioGerado registro = new RelatorioGerado();
        registro.setDocId(docId);
        registro.setTipoRelatorio(tipo);
        registro.setPeriodoInicio(periodo.inicio());
        registro.setPeriodoFim(periodo.fim());
        registro.setParametrosJson(serializarParametros(filtroBruto));
        registro.setGeradoPor(usuario);
        registro.setGeradoEm(OffsetDateTime.now(clock));
        registro.setTamanhoBytes(conteudo.length);
        relatorioGeradoRepository.save(registro);

        // T43: EXPORTACAO na mesma transacao — se o evento nao for gravado, o
        // commit falha antes de o controller montar a resposta e o arquivo
        // nao sai. O payload identifica a exportacao; nunca leva o conteudo.
        Map<String, Object> exportacao = new LinkedHashMap<>();
        exportacao.put("docId", docId);
        exportacao.put("tipoRelatorio", tipo.codigo());
        exportacao.put("formato", extensao);
        exportacao.put("periodoInicio", periodo.inicio().toString());
        exportacao.put("periodoFim", periodo.fim().toString());
        exportacao.put("tamanhoBytes", conteudo.length);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.EXPORTACAO, "relatorio_gerado", registro.getId(),
                null, exportacao);

        String nomeArquivo = tipo.codigo() + "-" + periodo.inicio() + "_" + periodo.fim() + "." + extensao;
        return new ArquivoRelatorio(conteudo, nomeArquivo, contentType);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<RelatorioGeradoResponse> historico(int pagina, int tamanho) {
        var page = relatorioGeradoRepository
                .findAll(Paginacao.pagina(pagina, tamanho, Sort.by("geradoEm").descending()))
                .map(this::toResponse);
        return PaginaResponse.de(page);
    }

    private GeradorRelatorio<?> gerador(TipoRelatorio tipo) {
        GeradorRelatorio<?> gerador = geradoresPorTipo.get(tipo);
        if (gerador == null) {
            throw new CampoInvalidoException("tipo", "Tipo de relatório ainda não implementado");
        }
        return gerador;
    }

    private String serializarParametros(FiltroRelatorioBruto filtro) {
        Map<String, Object> parametros = new LinkedHashMap<>();
        parametros.put("tipo", filtro.tipo().codigo());
        if (filtro.periodoInicio() != null) {
            parametros.put("periodoInicio", filtro.periodoInicio().toString());
        }
        if (filtro.periodoFim() != null) {
            parametros.put("periodoFim", filtro.periodoFim().toString());
        }
        if (filtro.ano() != null) {
            parametros.put("ano", filtro.ano());
        }
        if (filtro.janela() != null) {
            parametros.put("janela", filtro.janela());
        }
        // Jackson 3: writeValueAsString lança tools.jackson.core.JacksonException,
        // unchecked — mesmo padrao de AuditoriaEventoService#serializar.
        return objectMapper.writeValueAsString(parametros);
    }

    private RelatorioGeradoResponse toResponse(RelatorioGerado registro) {
        Usuario geradoPor = registro.getGeradoPor();
        return new RelatorioGeradoResponse(
                registro.getDocId(),
                registro.getTipoRelatorio().codigo(),
                registro.getTipoRelatorio().nomeExibicao(),
                registro.getPeriodoInicio(),
                registro.getPeriodoFim(),
                geradoPor.nomeCompleto(),
                registro.getGeradoEm(),
                registro.getTamanhoBytes(),
                registro.getParametrosJson());
    }
}
