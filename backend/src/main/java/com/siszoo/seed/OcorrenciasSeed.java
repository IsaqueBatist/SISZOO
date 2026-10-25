package com.siszoo.seed;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.function.Function;

import com.siszoo.ocorrencias.dto.AlterarStatusOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CriarNotaRequest;
import com.siszoo.ocorrencias.dto.CriarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.DenunciadoRequest;
import com.siszoo.ocorrencias.dto.DenuncianteRequest;
import com.siszoo.ocorrencias.dto.EncerrarOcorrenciaRequest;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.service.AnexoOcorrenciaService;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

// Ocorrencias pelos services reais (protocolo, movimentacoes, sigilo e
// auditoria como no POST /api/ocorrencias), registradas por agentes. Cobrem os
// tres status, todas as providencias (inclusive o encerramento direto de
// ABERTA permitido pela D5 e o registro_indevido, que sai das contagens),
// denuncias sigilosas e anonimas, notas internas e anexos. As vinculadas a
// processo sao encerradas por ProcessosSeed, depois do processo concluido (D12).
// Dados pessoais 100% ficticios: CPF sempre nulo, telefone invalido de
// proposito (prefixo 0000) e e-mail no dominio reservado exemplo.test.
class OcorrenciasSeed {

    static final String ESCRITA = PermissoesOcorrencia.ESCRITA;

    enum Destino { ABERTA, EM_ATENDIMENTO, ENCERRADA, ENCERRADA_DIRETO, VINCULADA, VINCULADA_PENDENTE }

    enum Sigilo { IDENTIFICADA, SIGILOSA, ANONIMA }

    // `data` recebe as datas do seed; as vinculadas usam a data do processo
    // (ProcessosSeed.dataAbertura) para a ocorrencia vir antes dele.
    record Ocorrencia(int numero, String tipo, Function<DatasSeed, LocalDate> data, String hora, String endereco,
            String bairro, String descricao, boolean urgente, Sigilo sigilo, String denunciante, String denunciado,
            Destino destino, String providencia, String descricaoEncerramento, List<String> notas, boolean anexo) {

        String chave() {
            return chaveOcorrencia(numero);
        }
    }

    static String chaveOcorrencia(int numero) {
        return "ocorrencia:" + String.format("%02d", numero);
    }

    private static Function<DatasSeed, LocalDate> ha(int dias) {
        return datas -> datas.diasAtras(dias);
    }

    private static Function<DatasSeed, LocalDate> antesDoProcesso(int numeroProcesso) {
        return datas -> ProcessosSeed.dataAbertura(numeroProcesso, datas).minusDays(2);
    }

    private static Ocorrencia oc(int n, String tipo, Function<DatasSeed, LocalDate> data, String hora, String endereco,
            String bairro, String descricao, boolean urgente, Sigilo sigilo, String denunciante, String denunciado,
            Destino destino) {
        return new Ocorrencia(n, tipo, data, hora, endereco, bairro, descricao, urgente, sigilo, denunciante,
                denunciado, destino, null, null, List.of(), false);
    }

    private static Ocorrencia encerrada(Ocorrencia base, Destino destino, String providencia, String descricao) {
        return new Ocorrencia(base.numero(), base.tipo(), base.data(), base.hora(), base.endereco(), base.bairro(),
                base.descricao(), base.urgente(), base.sigilo(), base.denunciante(), base.denunciado(), destino,
                providencia, descricao, base.notas(), base.anexo());
    }

    private static Ocorrencia comNotas(Ocorrencia base, boolean anexo, String... notas) {
        return new Ocorrencia(base.numero(), base.tipo(), base.data(), base.hora(), base.endereco(), base.bairro(),
                base.descricao(), base.urgente(), base.sigilo(), base.denunciante(), base.denunciado(), base.destino(),
                base.providencia(), base.descricaoEncerramento(), List.of(notas), anexo);
    }

    private static final Sigilo ID = Sigilo.IDENTIFICADA;

    static final List<Ocorrencia> PLANO = List.of(
            // Vinculadas a processo sanitario (ProcessosSeed).
            oc(1, "agressivo", antesDoProcesso(1), "16:20", "Rua das Acácias, 120", "Vila Nova",
                    "Cão solto mordeu pedestre na calçada; vítima encaminhada à UBS.", true, ID, "Lúcia Ferraz",
                    "Morador não identificado", Destino.VINCULADA),
            oc(2, "morcegos", antesDoProcesso(2), "09:10", "Rua dos Ipês, 45", "Cidade Nova",
                    "Morcego caído no quintal durante o dia, sem contato com pessoas.", false, ID, "Antônio Ribas",
                    null, Destino.VINCULADA),
            oc(3, "zoonose", antesDoProcesso(4), "14:00", "Rua das Palmeiras, 310", "Brasil",
                    "Cão com feridas nas orelhas e emagrecimento acentuado.", false, Sigilo.SIGILOSA, "Rosa Antunes",
                    null, Destino.VINCULADA),
            oc(4, "zoonose", antesDoProcesso(5), "11:30", "Avenida dos Jequitibás, 88", "Rancho Grande",
                    "Cão com vômitos e apatia após alagamento da rua.", false, ID, "Marcelo Quintana", null,
                    Destino.VINCULADA),
            oc(5, "outros", antesDoProcesso(17), "08:45", "Estrada da Chácara Bela Vista, km 3", "Pirapitingui",
                    "Infestação de carrapatos em cães de chácara.", false, ID, "Valéria Moura", null,
                    Destino.VINCULADA_PENDENTE),
            // Encerradas.
            comNotas(encerrada(oc(6, "irregular", ha(200), "10:15", "Rua das Hortênsias, 72", "São Luiz",
                    "Criação de galinhas e cães em espaço insalubre.", false, ID, "Gilberto Sales",
                    "Morador do imóvel", null), Destino.ENCERRADA, "captura_remocao", null),
                    true, "Vistoria realizada; animais em condições precárias."),
            encerrada(oc(7, "agressivo", ha(150), "18:40", "Rua dos Cedros, 15", "Centro",
                    "Cão de grande porte solto avançando em pedestres.", true, Sigilo.ANONIMA, null, null, null),
                    Destino.ENCERRADA, "captura_remocao", null),
            comNotas(encerrada(oc(8, "irregular", ha(120), "13:05", "Rua das Magnólias, 230", "Vila Padre Bento",
                    "Acúmulo de animais em residência, com mau cheiro.", false, Sigilo.SIGILOSA, "Denise Paiva",
                    "Moradora do imóvel", null), Destino.ENCERRADA, "encaminhamento_gepar", null),
                    false, "Contato com a equipe do GEPAR.", "Caso encaminhado ao GEPAR."),
            encerrada(oc(9, "outros", ha(95), "15:50", "Rua das Violetas, 9", "Itu Novo Centro",
                    "Cão encontrado vagando, aparentemente com tutor.", false, ID, "Henrique Bastos", null, null),
                    Destino.ENCERRADA, "outro", "Animal devolvido ao tutor após identificação pelo microchip."),
            encerrada(oc(10, "outros", ha(80), "10:00", "Rua dos Girassóis, 51", "Jardim Paraíso",
                    "Munícipe pergunta sobre a campanha de vacinação antirrábica.", false, ID, "Cecília Rocha",
                    null, null), Destino.ENCERRADA_DIRETO, "orientacao_municipe", null),
            encerrada(oc(11, "morcegos", ha(60), "19:30", "Rua das Orquídeas, 140", "Centro",
                    "Possíveis morcegos no forro do sobrado.", false, Sigilo.ANONIMA, null, null, null),
                    Destino.ENCERRADA_DIRETO, "sem_acao", null),
            encerrada(oc(12, "outros", ha(45), "09:20", "Rua das Violetas, 9", "Itu Novo Centro",
                    "Registro em duplicidade de chamado já atendido.", false, ID, "Henrique Bastos", null, null),
                    Destino.ENCERRADA_DIRETO, "registro_indevido", null),
            // Em atendimento.
            comNotas(oc(13, "agressivo", ha(30), "17:15", "Rua dos Pinheiros, 300", "Cidade Nova",
                    "Cão bravo ataca outros animais na rua.", true, ID, "Fábio Arantes", null,
                    Destino.EM_ATENDIMENTO), false, "Equipe agendada para vistoria."),
            comNotas(oc(14, "irregular", ha(25), "12:40", "Rua das Begônias, 18", "Brasil",
                    "Cães presos em correntes curtas, sem abrigo.", false, Sigilo.SIGILOSA, "Patrícia Leme",
                    "Morador do imóvel", Destino.EM_ATENDIMENTO), true),
            comNotas(oc(15, "zoonose", ha(20), "16:00", "Rua dos Manacás, 66", "Vila Nova",
                    "Gato com lesões na face, em contato com crianças.", false, ID, "Sandra Teles", null,
                    Destino.EM_ATENDIMENTO), false, "Orientado a manter o animal isolado."),
            oc(16, "morcegos", ha(15), "20:10", "Rua das Tipuanas, 201", "São Luiz",
                    "Morcegos saindo de vão no telhado ao anoitecer.", false, Sigilo.ANONIMA, null, null,
                    Destino.EM_ATENDIMENTO),
            oc(17, "outros", ha(10), "08:30", "Rua das Araucárias, 77", "Rancho Grande",
                    "Animal silvestre ferido em área de mata.", false, ID, "Otávio Nunes", null,
                    Destino.EM_ATENDIMENTO),
            comNotas(oc(18, "irregular", ha(7), "14:25", "Rua dos Flamboyants, 12", "Pirapitingui",
                    "Venda de filhotes sem condições sanitárias.", false, ID, "Regina Lopes", "Vendedor ambulante",
                    Destino.EM_ATENDIMENTO), false, "Aguardando apoio da fiscalização."),
            // Abertas (duas registradas hoje, para o KPI do dashboard).
            oc(19, "agressivo", ha(0), null, "Rua das Acácias, 410", "Vila Nova",
                    "Cão solto rosnando para crianças na saída da escola.", true, ID, "Tatiane Freitas", null,
                    Destino.ABERTA),
            oc(20, "outros", ha(0), null, "Rua dos Ipês, 5", "Centro",
                    "Ninhada de filhotes abandonada em terreno baldio.", false, ID, "Eduardo Prates", null,
                    Destino.ABERTA),
            oc(21, "zoonose", ha(1), "10:50", "Rua das Palmeiras, 90", "Brasil",
                    "Gato com feridas que não cicatrizam.", false, Sigilo.SIGILOSA, "Joana Bittencourt", null,
                    Destino.ABERTA),
            oc(22, "morcegos", ha(2), "21:00", "Rua dos Cedros, 260", "Cidade Nova",
                    "Morcego dentro de casa, sem contato com moradores.", false, ID, "Caio Mendonça", null,
                    Destino.ABERTA),
            oc(23, "irregular", ha(3), "13:35", "Rua das Hortênsias, 150", "São Luiz",
                    "Criação de suínos em área urbana.", false, ID, "Lívia Campos", "Proprietário do lote",
                    Destino.ABERTA),
            oc(24, "outros", ha(5), "09:40", "Rua dos Girassóis, 300", "Jardim Paraíso",
                    "Pombos em excesso em praça pública.", false, ID, "Mauro Pires", null, Destino.ABERTA),
            oc(25, "agressivo", ha(6), "18:05", "Rua das Magnólias, 12", "Vila Padre Bento",
                    "Cão mordeu entregador; tutor identificado.", true, ID, "Bruno Tavares", "Tutor do animal",
                    Destino.ABERTA),
            oc(26, "zoonose", ha(8), "11:15", "Avenida dos Jequitibás, 500", "Itu Novo Centro",
                    "Ratos em área de descarte irregular de lixo.", false, ID, "Simone Araújo", null,
                    Destino.ABERTA));

    // Centro aproximado da area urbana de Itu, com deslocamento pequeno por
    // ocorrencia (o mapa so precisa de pontos plausiveis, nao enderecos reais).
    private static final double LATITUDE_BASE = -23.2640;
    private static final double LONGITUDE_BASE = -47.2990;

    private final SeedExecutor executor;
    private final OcorrenciaService ocorrenciaService;
    private final AnexoOcorrenciaService anexoService;
    private final Clock clock;

    OcorrenciasSeed(SeedExecutor executor, OcorrenciaService ocorrenciaService, AnexoOcorrenciaService anexoService,
            Clock clock) {
        this.executor = executor;
        this.ocorrenciaService = ocorrenciaService;
        this.anexoService = anexoService;
        this.clock = clock;
    }

    // Um passo (chave + transacao propria) por acao, como uma requisicao por
    // acao na tela: registrar, cada nota, o anexo, iniciar atendimento, encerrar.
    void executar(UsuariosSeed.Atores atores) {
        DatasSeed datas = new DatasSeed(clock);
        for (Ocorrencia plano : PLANO) {
            SeedAtor agente = atores.agente(plano.numero());
            PermissoesOcorrencia permissoes = agente.permissoes();
            UUID id = executor.garantir(plano.chave(), "ocorrencia", () -> criar(plano, agente, datas));

            for (int i = 0; i < plano.notas().size(); i++) {
                String nota = plano.notas().get(i);
                executor.garantir(plano.chave() + ":nota:" + (i + 1), "ocorrencia_nota", () -> agente.executar(
                        ESCRITA, () -> ocorrenciaService.adicionarNota(
                                id, executor.valido(new CriarNotaRequest(nota)), permissoes).id()));
            }
            if (plano.anexo()) {
                BytesMultipartFile foto = new BytesMultipartFile("foto-local.png", "image/png",
                        ArquivosFicticios.png(0x8D6E63 + plano.numero() * 0x050505));
                executor.garantir(plano.chave() + ":anexo", "anexo_ocorrencia", () -> agente.executar(
                        ESCRITA, () -> anexoService.adicionarAnexo(id, foto, permissoes).id()));
            }
            boolean passaPorAtendimento = switch (plano.destino()) {
                case EM_ATENDIMENTO, ENCERRADA, VINCULADA, VINCULADA_PENDENTE -> true;
                case ABERTA, ENCERRADA_DIRETO -> false;
            };
            if (passaPorAtendimento) {
                executor.garantir(plano.chave() + ":atendimento", "ocorrencia_status", () -> agente.executar(
                        ESCRITA, () -> ocorrenciaService.alterarStatus(id, executor.valido(
                                new AlterarStatusOcorrenciaRequest(StatusOcorrencia.EM_ATENDIMENTO)), permissoes).id()));
            }
            if (plano.destino() == Destino.ENCERRADA || plano.destino() == Destino.ENCERRADA_DIRETO) {
                executor.garantir(plano.chave() + ":encerramento", "ocorrencia_encerramento", () -> agente.executar(
                        ESCRITA, () -> ocorrenciaService.encerrar(id, executor.valido(new EncerrarOcorrenciaRequest(
                                plano.providencia(), plano.descricaoEncerramento())), permissoes).id()));
            }
        }
    }

    // Encerramento de uma vinculada, chamado por ProcessosSeed com o processo
    // ja concluido.
    void encerrarVinculada(int numero, SeedAtor agente) {
        UUID id = executor.idObrigatorio(chaveOcorrencia(numero));
        executor.garantir(chaveOcorrencia(numero) + ":encerramento", "ocorrencia_encerramento", () -> {
            PermissoesOcorrencia permissoes = agente.permissoes();
            return agente.executar(ESCRITA, () -> ocorrenciaService.encerrar(id, executor.valido(
                    new EncerrarOcorrenciaRequest("abertura_processo", "Processo sanitário concluído.")),
                    permissoes).id());
        });
    }

    private UUID criar(Ocorrencia plano, SeedAtor agente, DatasSeed datas) {
        PermissoesOcorrencia permissoes = agente.permissoes();
        CriarOcorrenciaRequest request = executor.valido(new CriarOcorrenciaRequest(
                plano.tipo(), plano.data().apply(datas), plano.hora() == null ? null : LocalTime.parse(plano.hora()),
                plano.endereco(), plano.bairro(), null, plano.descricao(), plano.urgente(),
                plano.sigilo() == Sigilo.SIGILOSA, plano.sigilo() == Sigilo.ANONIMA,
                coordenada(LATITUDE_BASE, plano.numero(), 7), coordenada(LONGITUDE_BASE, plano.numero(), 11),
                denunciante(plano), denunciado(plano)));
        return agente.executar(ESCRITA, () -> ocorrenciaService.criar(request, permissoes).id());
    }

    private static DenuncianteRequest denunciante(Ocorrencia plano) {
        if (plano.denunciante() == null) {
            return null;
        }
        return new DenuncianteRequest(plano.denunciante(), null, telefone(plano.numero()),
                emailFicticio(plano.denunciante()), null, null, plano.bairro());
    }

    private static DenunciadoRequest denunciado(Ocorrencia plano) {
        if (plano.denunciado() == null) {
            return null;
        }
        return new DenunciadoRequest(plano.denunciado(), null, null, plano.endereco(), "Dado ficticio do seed.");
    }

    // Prefixo 0000 nao existe na numeracao brasileira: nunca e um telefone real.
    static String telefone(int numero) {
        return "(11) 0000-" + String.format("%04d", numero);
    }

    static String emailFicticio(String nome) {
        String semAcento = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase(Locale.ROOT).replace(' ', '.') + "@exemplo.test";
    }

    private static BigDecimal coordenada(double base, int numero, int passo) {
        double deslocamento = ((numero * passo) % 41 - 20) * 0.0011;
        return BigDecimal.valueOf(base + deslocamento).setScale(6, RoundingMode.HALF_UP);
    }
}
