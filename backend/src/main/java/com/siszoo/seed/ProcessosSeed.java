package com.siszoo.seed;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.AmostraAnimalRequest;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.dto.RegistrarResultadoRequest;
import com.siszoo.processos.dto.ResponsavelProcessoRequest;
import com.siszoo.processos.entity.MaterialBiologico;
import com.siszoo.processos.entity.NivelContato;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.entity.TipoAbrigo;
import com.siszoo.processos.service.ProcessoSanitarioService;

// Processos sanitarios pelos services reais: protocolo, urgencia derivada do
// contato humano, transicoes de um passo, resultado imutavel com retificacao
// e auditoria como na API. Cobrem os 4 status, todas as doencas e
// laboratorios, raiva em cao, gato e morcego (grafico por especie) e febre
// amarela em primata. Positivo nunca e retificado (V21).
//
// E-mail ao municipe (SD-4): processo com resultado notificavel (positivo ou
// inconclusivo, inclusive o que e retificado depois) tem o responsavel SEM
// e-mail — NotificacaoResultadoService nao envia nada e o REQUIRES_NEW de
// registrarNotificacaoMunicipe nunca roda. Os demais usam exemplo.test.
class ProcessosSeed {

    static final String ESCRITA = "PROCESSOS_SANITARIOS:escrita";
    static final Set<String> RESULTADOS_NOTIFICAVEIS = Set.of("positivo", "inconclusivo");

    // Amostra de campo (identificacao propria) ou do canil (animal do seed).
    record Amostra(Integer animalCanil, String especie, String sexo, StatusClinicoAmostra statusClinico,
            TipoAbrigo abrigo, MaterialBiologico material, NivelContato contato, Boolean agrediu,
            List<String> sintomas) {

        static Amostra campo(String especie, String sexo, StatusClinicoAmostra status, TipoAbrigo abrigo,
                MaterialBiologico material, String... sintomas) {
            return new Amostra(null, especie, sexo, status, abrigo, material, null, null, List.of(sintomas));
        }

        static Amostra canil(int animal, StatusClinicoAmostra status, MaterialBiologico material, String... sintomas) {
            return new Amostra(animal, null, null, status, TipoAbrigo.INTRADOMICILIAR, material, null, null,
                    List.of(sintomas));
        }

        Amostra comContato(NivelContato nivel, boolean agrediuHumano) {
            return new Amostra(animalCanil, especie, sexo, statusClinico, abrigo, material, nivel, agrediuHumano,
                    sintomas);
        }
    }

    // `fracao`: posicao da abertura no ano corrente (DatasSeed.noAnoCorrente).
    // `retificacao`: resultado que corrige o primeiro (null = sem correcao).
    // `ocorrencia`: vinculo na criacao; `vincularDepois`: vinculo pelo
    // POST /ocorrencias/{id}/processo depois de criado.
    record Processo(int numero, String doenca, String laboratorio, double fracao, StatusProcesso status,
            String resultado, String retificacao, String desfecho, Integer ocorrencia, boolean vincularDepois,
            String responsavel, String bairro, List<Amostra> amostras) {

        String chave() {
            return "processo:" + String.format("%02d", numero);
        }

        // Set.of recusa contains(null): processo sem resultado nao notifica.
        boolean notificavel() {
            return (resultado != null && RESULTADOS_NOTIFICAVEIS.contains(resultado))
                    || (retificacao != null && RESULTADOS_NOTIFICAVEIS.contains(retificacao));
        }
    }

    private static Processo p(int n, String doenca, String laboratorio, double fracao, StatusProcesso status,
            String resultado, String responsavel, String bairro, Amostra... amostras) {
        return new Processo(n, doenca, laboratorio, fracao, status, resultado, null, null, null, false, responsavel,
                bairro, List.of(amostras));
    }

    private static Processo retificado(Processo base, String correcao) {
        return new Processo(base.numero(), base.doenca(), base.laboratorio(), base.fracao(), base.status(),
                base.resultado(), correcao, base.desfecho(), base.ocorrencia(), base.vincularDepois(),
                base.responsavel(), base.bairro(), base.amostras());
    }

    private static Processo comDesfecho(Processo base, String desfecho) {
        return new Processo(base.numero(), base.doenca(), base.laboratorio(), base.fracao(), base.status(),
                base.resultado(), base.retificacao(), desfecho, base.ocorrencia(), base.vincularDepois(),
                base.responsavel(), base.bairro(), base.amostras());
    }

    private static Processo vinculado(Processo base, int ocorrencia, boolean depois) {
        return new Processo(base.numero(), base.doenca(), base.laboratorio(), base.fracao(), base.status(),
                base.resultado(), base.retificacao(), base.desfecho(), ocorrencia, depois, base.responsavel(),
                base.bairro(), base.amostras());
    }

    private static final StatusClinicoAmostra SINTOMATICO = StatusClinicoAmostra.SINTOMATICO;
    private static final StatusClinicoAmostra ASSINTOMATICO = StatusClinicoAmostra.ASSINTOMATICO;
    private static final StatusClinicoAmostra OBITO = StatusClinicoAmostra.OBITO;

    static final List<Processo> PLANO = List.of(
            // Concluidos (4 vinculados a ocorrencias, encerradas no fim).
            vinculado(p(1, "raiva", "pasteur_sp", 0.05, StatusProcesso.CONCLUIDO, "negativo", "Lúcia Ferraz",
                    "Vila Nova", Amostra.campo("canino", "macho", OBITO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.TECIDO_ENCEFALICO).comContato(NivelContato.DIRETA, true)), 1, false),
            vinculado(p(2, "raiva", "pasteur_sp", 0.10, StatusProcesso.CONCLUIDO, "positivo", "Antônio Ribas",
                    "Cidade Nova", Amostra.campo("quiroptero", "nao_identificado", OBITO, TipoAbrigo.SILVESTRE,
                            MaterialBiologico.TECIDO_ENCEFALICO).comContato(NivelContato.INDIRETA, false)), 2, false),
            comDesfecho(p(3, "esporotricose", "ccz_sp", 0.15, StatusProcesso.CONCLUIDO, "positivo", "Nair Prudente",
                    "Brasil", Amostra.campo("felino", "femea", SINTOMATICO, TipoAbrigo.INTRADOMICILIAR,
                            MaterialBiologico.SANGUE, "ulcera_pele", "descamacao")), "em_acompanhamento"),
            vinculado(comDesfecho(p(4, "leishmaniose_visceral", "ial_sorocaba", 0.20, StatusProcesso.CONCLUIDO,
                    "positivo", "Rosa Antunes", "Brasil", Amostra.campo("canino", "macho", SINTOMATICO,
                            TipoAbrigo.PERIDOMICILIAR, MaterialBiologico.SORO, "emagrecimento", "aumento_linfonodo",
                            "descamacao")), "obito_eutanasia"), 3, false),
            vinculado(p(5, "leptospirose", "ial_sorocaba", 0.25, StatusProcesso.CONCLUIDO, "negativo",
                    "Marcelo Quintana", "Rancho Grande", Amostra.campo("canino", "femea", SINTOMATICO,
                            TipoAbrigo.PERIDOMICILIAR, MaterialBiologico.URINA, "vomito", "apatia")), 4, false),
            p(6, "febre_maculosa", "ial_sorocaba", 0.30, StatusProcesso.CONCLUIDO, "negativo", "Ivone Castelo",
                    "Pirapitingui", Amostra.campo("canino", "macho", ASSINTOMATICO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.SANGUE)),
            p(7, "raiva", "itu_ll01", 0.35, StatusProcesso.CONCLUIDO, "nao_realizado", "Wagner Dutra", "Centro",
                    Amostra.campo("felino", "macho", OBITO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.TECIDO_ENCEFALICO)),
            // Com resultado (duas retificacoes).
            p(8, "raiva", "pasteur_sp", 0.45, StatusProcesso.COM_RESULTADO, "negativo", "Kátia Sobral", "Vila Nova",
                    Amostra.canil(14, ASSINTOMATICO, MaterialBiologico.SORO).comContato(NivelContato.DIRETA, true)),
            retificado(p(9, "febre_amarela", "ial_sorocaba", 0.50, StatusProcesso.COM_RESULTADO, "inconclusivo",
                    "Elias Fontoura", "Pirapitingui", Amostra.campo("pnh", "macho", OBITO, TipoAbrigo.SILVESTRE,
                            MaterialBiologico.SANGUE)), "negativo"),
            retificado(p(10, "leishmaniose_visceral", "ial_sorocaba", 0.55, StatusProcesso.COM_RESULTADO,
                    "material_inadequado", "Gustavo Brandão", "Centro",
                    Amostra.canil(31, ASSINTOMATICO, MaterialBiologico.SORO)), "negativo"),
            p(11, "esporotricose", "ccz_sp", 0.60, StatusProcesso.COM_RESULTADO, "negativo", "Sônia Varela",
                    "São Luiz", Amostra.campo("felino", "macho", SINTOMATICO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.SANGUE, "ulcera_pele")),
            p(12, "leptospirose", "ial_sorocaba", 0.65, StatusProcesso.COM_RESULTADO, "negativo", "Ronaldo Salles",
                    "Rancho Grande", Amostra.campo("canino", "macho", SINTOMATICO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.URINA, "apatia")),
            p(13, "raiva", "pasteur_sp", 0.70, StatusProcesso.COM_RESULTADO, "positivo", "Mirela Cardoso",
                    "Cidade Nova", Amostra.campo("quiroptero", "nao_identificado", OBITO, TipoAbrigo.SILVESTRE,
                            MaterialBiologico.TECIDO_ENCEFALICO)),
            // Aguardando resultado (um vinculado depois de criado).
            p(14, "esporotricose", "ccz_sp", 1.0, StatusProcesso.AGUARDANDO_RESULTADO, null, "CCZ Itu (canil)",
                    "Centro", Amostra.canil(25, SINTOMATICO, MaterialBiologico.SANGUE, "ulcera_pele", "coriza")),
            p(15, "raiva", "pasteur_sp", 0.80, StatusProcesso.AGUARDANDO_RESULTADO, null, "Adriana Lustosa",
                    "Itu Novo Centro", Amostra.campo("canino", "femea", OBITO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.TECIDO_ENCEFALICO).comContato(NivelContato.DIRETA, true)),
            p(16, "leishmaniose_visceral", "ial_sorocaba", 0.82, StatusProcesso.AGUARDANDO_RESULTADO, null,
                    "CCZ Itu (canil)", "Centro", Amostra.canil(16, SINTOMATICO, MaterialBiologico.SORO,
                            "emagrecimento")),
            vinculado(p(17, "febre_maculosa", "ial_sorocaba", 0.85, StatusProcesso.AGUARDANDO_RESULTADO, null,
                    "Valéria Moura", "Pirapitingui", Amostra.campo("canino", "macho", ASSINTOMATICO,
                            TipoAbrigo.PERIDOMICILIAR, MaterialBiologico.SANGUE)), 5, true),
            p(18, "leptospirose", "ial_sorocaba", 0.88, StatusProcesso.AGUARDANDO_RESULTADO, null, "Hélio Barreto",
                    "Brasil", Amostra.campo("canino", "femea", SINTOMATICO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.URINA, "vomito", "diarreia")),
            p(19, "raiva", "pasteur_sp", 0.90, StatusProcesso.AGUARDANDO_RESULTADO, null, "Lorena Abreu",
                    "Vila Padre Bento", Amostra.campo("felino", "macho", SINTOMATICO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.SALIVA, "alt_comportamental", "salivacao_excessiva")
                            .comContato(NivelContato.INDIRETA, false)),
            // Abertos.
            p(20, "raiva", "pasteur_sp", 0.93, StatusProcesso.ABERTO, null, "Diogo Vasques", "Cidade Nova",
                    Amostra.campo("quiroptero", "nao_identificado", OBITO, TipoAbrigo.SILVESTRE,
                            MaterialBiologico.TECIDO_ENCEFALICO)),
            p(21, "esporotricose", "ccz_sp", 0.95, StatusProcesso.ABERTO, null, "Celina Godoy", "São Luiz",
                    Amostra.campo("felino", "femea", SINTOMATICO, TipoAbrigo.INTRADOMICILIAR,
                            MaterialBiologico.SANGUE, "ulcera_pele")),
            p(22, "leishmaniose_visceral", "ial_sorocaba", 0.97, StatusProcesso.ABERTO, null, "Ulisses Peixoto",
                    "Jardim Paraíso", Amostra.campo("canino", "macho", SINTOMATICO, TipoAbrigo.PERIDOMICILIAR,
                            MaterialBiologico.SORO, "emagrecimento", "ceratoconjuntivite")),
            p(23, "febre_amarela", "ial_sorocaba", 0.99, StatusProcesso.ABERTO, null, "Fiscalização ambiental",
                    "Pirapitingui", Amostra.campo("pnh", "femea", OBITO, TipoAbrigo.SILVESTRE,
                            MaterialBiologico.SANGUE)),
            p(24, "leptospirose", "itu_ll01", 1.0, StatusProcesso.ABERTO, null, "CCZ Itu (canil)", "Centro",
                    Amostra.canil(28, ASSINTOMATICO, MaterialBiologico.URINA)));

    // Data de abertura de cada processo (tambem usada pelas ocorrencias
    // vinculadas, que vem 2 dias antes).
    static LocalDate dataAbertura(int numero, DatasSeed datas) {
        Processo processo = PLANO.stream().filter(p -> p.numero() == numero).findFirst().orElseThrow();
        return datas.noAnoCorrente(processo.fracao());
    }

    private final SeedExecutor executor;
    private final ProcessoSanitarioService processoService;
    private final OcorrenciaService ocorrenciaService;
    private final OcorrenciasSeed ocorrenciasSeed;
    private final Clock clock;

    ProcessosSeed(SeedExecutor executor, ProcessoSanitarioService processoService, OcorrenciaService ocorrenciaService,
            OcorrenciasSeed ocorrenciasSeed, Clock clock) {
        this.executor = executor;
        this.processoService = processoService;
        this.ocorrenciaService = ocorrenciaService;
        this.ocorrenciasSeed = ocorrenciasSeed;
        this.clock = clock;
    }

    void executar(UsuariosSeed.Atores atores) {
        DatasSeed datas = new DatasSeed(clock);
        for (Processo processo : PLANO) {
            // Vincular a ocorrencia exige OCORRENCIAS_DENUNCIAS:escrita (D33):
            // quem abre o processo vinculado e o agente; os demais, o veterinario.
            SeedAtor autor = processo.ocorrencia() != null
                    ? atores.agente(processo.numero())
                    : atores.veterinario(processo.numero());
            SeedAtor veterinario = atores.veterinario(processo.numero());
            avancarPorPassos(processo, autor, veterinario, datas);
            if (processo.ocorrencia() != null && processo.status() == StatusProcesso.CONCLUIDO) {
                ocorrenciasSeed.encerrarVinculada(processo.ocorrencia(), autor);
            }
        }
    }

    // Um passo (chave + transacao propria) por acao, como uma requisicao por
    // acao na tela: abrir, vincular, enviar ao laboratorio, lancar resultado,
    // corrigir, concluir. O resultado de cada passo ja gravado e lido de novo
    // pelo id em seed_controle numa reexecucao.
    private void avancarPorPassos(Processo plano, SeedAtor autor, SeedAtor veterinario, DatasSeed datas) {
        LocalDate abertura = datas.noAnoCorrente(plano.fracao());
        UUID ocorrenciaNaCriacao = plano.ocorrencia() != null && !plano.vincularDepois()
                ? executor.idObrigatorio(OcorrenciasSeed.chaveOcorrencia(plano.ocorrencia()))
                : null;
        CriarProcessoRequest request = executor.valido(new CriarProcessoRequest(abertura, plano.doenca(),
                plano.laboratorio(), ocorrenciaNaCriacao, responsavel(plano), amostras(plano, abertura),
                "Processo ficticio do seed de desenvolvimento.",
                plano.numero() % 3 == 0 ? "GAL-SEED-" + String.format("%04d", plano.numero()) : null,
                plano.numero() % 4 == 0 ? "SINAN-SEED-" + String.format("%04d", plano.numero()) : null));
        PermissoesOcorrencia permissoes = autor.permissoes();
        UUID id = executor.garantir(plano.chave(), "processo_sanitario",
                () -> autor.executar(ESCRITA, () -> processoService.criar(request, permissoes).id()));

        if (plano.vincularDepois()) {
            UUID ocorrenciaId = executor.idObrigatorio(OcorrenciasSeed.chaveOcorrencia(plano.ocorrencia()));
            executor.garantir(plano.chave() + ":vinculo", "processo_vinculo", () -> autor.executar(
                    OcorrenciasSeed.ESCRITA, () -> ocorrenciaService.vincularProcesso(ocorrenciaId, id, permissoes))
                    .id());
        }
        if (plano.status() == StatusProcesso.ABERTO) {
            return;
        }
        avancar(plano, ":aguardando", id, StatusProcesso.AGUARDANDO_RESULTADO, veterinario);
        if (plano.status() == StatusProcesso.AGUARDANDO_RESULTADO) {
            return;
        }

        LocalDate dataResultado = datas.minimo(abertura.plusDays(7 + plano.numero() % 9), datas.hoje());
        UUID original = executor.garantir(plano.chave() + ":resultado", "resultado_processo", () -> {
            ProcessoSanitarioResponse resposta = veterinario.executar(ESCRITA, () -> processoService
                    .registrarResultado(id, executor.valido(new RegistrarResultadoRequest(plano.resultado(),
                            dataResultado, "Laudo do laboratório anexado ao prontuário.", null,
                            plano.retificacao() == null ? plano.desfecho() : null)), veterinario.id()));
            return resposta.resultados().getLast().id();
        });
        if (plano.retificacao() != null) {
            LocalDate dataCorrecao = datas.minimo(dataResultado.plusDays(3), datas.hoje());
            executor.garantir(plano.chave() + ":retificacao", "resultado_processo", () -> {
                ProcessoSanitarioResponse resposta = veterinario.executar(ESCRITA, () -> processoService
                        .registrarResultado(id, executor.valido(new RegistrarResultadoRequest(plano.retificacao(),
                                dataCorrecao, "Nova análise do laboratório corrige o laudo anterior.", original,
                                plano.desfecho())), veterinario.id()));
                return resposta.resultados().getLast().id();
            });
        }
        if (plano.status() == StatusProcesso.CONCLUIDO) {
            avancar(plano, ":conclusao", id, StatusProcesso.CONCLUIDO, veterinario);
        }
    }

    private void avancar(Processo plano, String sufixo, UUID id, StatusProcesso destino, SeedAtor veterinario) {
        executor.garantir(plano.chave() + sufixo, "processo_status", () -> veterinario.executar(ESCRITA,
                () -> processoService.alterarStatus(
                        id, executor.valido(new AlterarStatusProcessoRequest(destino)), veterinario.id()).id()));
    }

    // Sem e-mail quando ha resultado notificavel (SD-4) ou o responsavel e o
    // proprio servico publico.
    static ResponsavelProcessoRequest responsavel(Processo plano) {
        String email = plano.notificavel() || plano.responsavel().startsWith("CCZ")
                || plano.responsavel().startsWith("Fiscaliza")
                ? null
                : OcorrenciasSeed.emailFicticio(plano.responsavel());
        return new ResponsavelProcessoRequest(plano.responsavel(), null,
                OcorrenciasSeed.telefone(100 + plano.numero()), email, null,
                "Endereço fictício " + plano.numero(), plano.bairro(), plano.bairro());
    }

    private List<AmostraAnimalRequest> amostras(Processo plano, LocalDate abertura) {
        return plano.amostras().stream().map(a -> {
            UUID animalId = a.animalCanil() == null ? null : executor.idObrigatorio(AnimaisSeed.chaveAnimal(a.animalCanil()));
            boolean doCanil = animalId != null;
            boolean contato = a.contato() != null;
            return new AmostraAnimalRequest(animalId,
                    doCanil ? null : a.especie(), doCanil ? null : a.sexo(), null, null, null, null,
                    doCanil ? null : pesoDeCampo(a.especie()),
                    a.statusClinico(), a.abrigo(), null, abertura.minusDays(1), a.material(), contato,
                    a.contato(), a.agrediu(), null, a.sintomas().isEmpty() ? null : a.sintomas());
        }).toList();
    }

    private static BigDecimal pesoDeCampo(String especie) {
        return switch (especie) {
            case "felino" -> new BigDecimal("4.20");
            case "pnh" -> new BigDecimal("0.40");
            case "quiroptero" -> null;
            default -> new BigDecimal("12.50");
        };
    }
}
