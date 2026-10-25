package com.siszoo.seed;

import java.time.Clock;
import java.util.List;

import com.siszoo.relatorios.dto.FiltroRelatorioBruto;
import com.siszoo.relatorios.entity.TipoRelatorio;
import com.siszoo.relatorios.service.RelatorioGeradoService;

import jakarta.persistence.EntityManager;

// Uma exportacao real de cada um dos 6 relatorios (RelatorioGeradoService):
// grava relatorio_gerado e o evento EXPORTACAO, como o POST
// /api/relatorios/exportar. O arquivo gerado e descartado (o historico so
// guarda os metadados).
class RelatoriosSeed {

    record Exportacao(String chave, TipoRelatorio tipo, String formato) {
    }

    static final List<Exportacao> PLANO = List.of(
            new Exportacao("relatorio:anual_processos", TipoRelatorio.ANUAL_PROCESSOS, "pdf"),
            new Exportacao("relatorio:vacinacao", TipoRelatorio.VACINACAO, "csv"),
            new Exportacao("relatorio:adocoes", TipoRelatorio.ADOCOES, "pdf"),
            new Exportacao("relatorio:procedimentos", TipoRelatorio.PROCEDIMENTOS, "csv"),
            new Exportacao("relatorio:ocupacao_baias", TipoRelatorio.OCUPACAO_BAIAS, "pdf"),
            new Exportacao("relatorio:ocorrencias_bairro", TipoRelatorio.OCORRENCIAS_BAIRRO, "csv"));

    private final SeedExecutor executor;
    private final RelatorioGeradoService relatorioService;
    private final EntityManager entityManager;
    private final Clock clock;

    RelatoriosSeed(SeedExecutor executor, RelatorioGeradoService relatorioService, EntityManager entityManager,
            Clock clock) {
        this.executor = executor;
        this.relatorioService = relatorioService;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    void executar(UsuariosSeed.Atores atores) {
        DatasSeed datas = new DatasSeed(clock);
        for (int i = 0; i < PLANO.size(); i++) {
            Exportacao exportacao = PLANO.get(i);
            // Metade pelo Administrador, metade por um Veterinario.
            SeedAtor autor = i % 2 == 0 ? atores.admin() : atores.veterinario(i);
            FiltroRelatorioBruto filtro = switch (exportacao.tipo()) {
                case ANUAL_PROCESSOS -> new FiltroRelatorioBruto(exportacao.tipo(), null, null,
                        datas.hoje().getYear(), null);
                case OCUPACAO_BAIAS -> new FiltroRelatorioBruto(exportacao.tipo(), null, null, null,
                        "ultimos_6_meses");
                default -> new FiltroRelatorioBruto(exportacao.tipo(), datas.diasAtras(300), datas.hoje(), null, null);
            };
            executor.garantir(exportacao.chave(), "relatorio_gerado", () -> {
                autor.executar("RELATORIOS:leitura",
                        () -> relatorioService.exportar(filtro, exportacao.formato(), autor.id()));
                // O service so faz save(); a consulta abaixo e JDBC e nao
                // dispara o auto-flush do Hibernate.
                entityManager.flush();
                return executor.idPorConsulta("SELECT id FROM relatorio_gerado WHERE gerado_por_id = ?"
                        + " ORDER BY gerado_em DESC, doc_id DESC LIMIT 1", autor.id())
                        .orElseThrow(() -> new IllegalStateException("exportacao sem relatorio_gerado"));
            });
        }
    }
}
