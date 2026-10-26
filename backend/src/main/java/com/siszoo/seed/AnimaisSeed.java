package com.siszoo.seed;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.siszoo.animais.clinico.dto.CriarExameRequest;
import com.siszoo.animais.clinico.dto.CriarPrescricaoRequest;
import com.siszoo.animais.clinico.dto.CriarProcedimentoRequest;
import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.UnidadeFrequencia;
import com.siszoo.animais.clinico.entity.ViaAdministracao;
import com.siszoo.animais.clinico.service.ExameService;
import com.siszoo.animais.clinico.service.PrescricaoService;
import com.siszoo.animais.clinico.service.ProcedimentoService;
import com.siszoo.animais.clinico.service.VacinacaoService;
import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.service.AnexoAnimalService;
import com.siszoo.animais.service.AnimalService;

// Animais do canil com historico clinico, pelos services reais (ficha
// completa, auditoria e regras de baia/eutanasia como na API). Os 11 que saem
// da custodia vem primeiro: entram numa baia, recebem o historico e saem
// (adocao, transferencia, obito), entao a ocupacao nunca passa da capacidade.
// Os valores que importam para os indicadores estao explicitos no plano:
// vacinas vencendo/vencidas, prescricoes terminando em 7 dias, animais sem
// avaliacao em 30 dias, nao castrados disponiveis, fichas incompletas.
class AnimaisSeed {

    static final String GESTAO_ESCRITA = "GESTAO_ANIMAIS:escrita";

    // ── Plano dos animais ──────────────────────────────────────────────

    static final class Animal {
        final int numero;
        final String nome;
        final String especie;
        final String sexo;
        String raca = "SRD";
        String coloracao;
        String pelagem = "curta";
        String porte = "pequeno";
        String idade;
        int diasEntrada;
        boolean microchip;
        boolean microchipDepois;
        Integer diasCastracao;
        String status = "disponivel_adocao";
        String motivo = "recolhimento";
        String baia;
        String destino;
        String laudo;
        boolean medalha;
        Integer corFoto;
        String procedencia;
        String observacoes;

        Animal(int numero, String nome, String especie, String sexo) {
            this.numero = numero;
            this.nome = nome;
            this.especie = especie;
            this.sexo = sexo;
        }

        String chave() {
            return "animal:" + String.format("%03d", numero);
        }

        String numeroMicrochip() {
            return "999000000000" + String.format("%03d", numero);
        }

        Animal raca(String valor) { raca = valor; return this; }
        Animal cor(String valor) { coloracao = valor; return this; }
        Animal longa() { pelagem = "longa"; return this; }
        Animal porte(String valor) { porte = valor; return this; }
        Animal idade(String valor) { idade = valor; return this; }
        Animal entrada(int dias) { diasEntrada = dias; return this; }
        Animal chip() { microchip = true; return this; }
        Animal chipDepois() { microchipDepois = true; return this; }
        Animal castrado(int dias) { diasCastracao = dias; return this; }
        Animal status(String valor) { status = valor; return this; }
        Animal motivo(String valor) { motivo = valor; return this; }
        Animal em(String chaveBaia) { baia = chaveBaia; return this; }
        Animal destino(String valor) { destino = valor; return this; }
        Animal laudo(String valor) { laudo = valor; return this; }
        Animal medalha() { medalha = true; return this; }
        Animal foto(int rgb) { corFoto = rgb; return this; }
        Animal procedencia(String valor) { procedencia = valor; return this; }
        Animal obs(String valor) { observacoes = valor; return this; }
    }

    private static Animal canino(int numero, String nome, String sexo) {
        return new Animal(numero, nome, "canino", sexo);
    }

    private static Animal felino(int numero, String nome, String sexo) {
        return new Animal(numero, nome, "felino", sexo);
    }

    static final List<Animal> PLANO = List.of(
            // Fora da custodia ao final (criados primeiro).
            canino(1, "Thor", "macho").cor("Caramelo").porte("medio").idade("3 anos").entrada(280).chip()
                    .castrado(250).em(BaiasSeed.CANIL_A1).medalha().destino("adotado"),
            canino(2, "Mel", "femea").cor("Preta").idade("2 anos").entrada(220).chip().castrado(200)
                    .motivo("abandono").em(BaiasSeed.CANIL_A1).destino("adotado"),
            felino(3, "Nina", "femea").cor("Tricolor").idade("1 ano").entrada(190).chip().castrado(170)
                    .motivo("entrega_voluntaria").em(BaiasSeed.GATIL_G1).destino("adotado"),
            canino(4, "Fred", "macho").raca("Labrador (mestiço)").cor("Amarela").porte("grande").idade("4 anos")
                    .entrada(160).chip().castrado(140).motivo("resgate").em(BaiasSeed.CANIL_A1).destino("adotado"),
            felino(5, "Luna", "femea").raca("Siamês (mestiço)").cor("Creme").idade("2 anos").entrada(120).chip()
                    .castrado(100).motivo("abandono").em(BaiasSeed.GATIL_G1).destino("adotado"),
            canino(6, "Bento", "macho").cor("Branca").longa().porte("medio").idade("1 ano").entrada(75).chip()
                    .castrado(60).em(BaiasSeed.CANIL_A1).destino("adotado"),
            canino(7, "Pipoca", "femea").cor("Malhada").idade("5 anos").entrada(300).chip().castrado(280)
                    .em(BaiasSeed.CANIL_A1).destino("transferido").obs("Transferida para abrigo parceiro."),
            canino(8, "Tobias", "macho").cor("Cinza").porte("medio").idade("12 anos").entrada(150)
                    .status("em_tratamento").em(BaiasSeed.CANIL_A2).destino("obito_natural"),
            felino(9, "Mingau", "macho").cor("Branca").longa().idade("10 anos").entrada(90).status("em_tratamento")
                    .motivo("entrega_voluntaria").em(BaiasSeed.GATIL_G1).destino("obito_natural"),
            canino(10, "Bolt", "macho").raca("Pit Bull (mestiço)").cor("Tigrada").porte("grande").idade("8 anos")
                    .entrada(200).chip().status("em_tratamento").motivo("apreensao_judicial")
                    .em(BaiasSeed.CANIL_EXTERNO_B1).destino("obito_eutanasia")
                    .laudo("Neoplasia disseminada sem resposta ao tratamento; avaliação do responsável técnico"
                            + " registrada em prontuário."),
            felino(11, "Frida", "femea").cor("Escaminha").idade("9 anos").entrada(60).chip().status("em_tratamento")
                    .motivo("resgate").em(BaiasSeed.GATIL_G1).destino("obito_eutanasia")
                    .laudo("Doença renal crônica em estágio terminal, refratária ao suporte clínico."),
            // Sob custodia.
            canino(12, "Rex", "macho").cor("Preta").porte("medio").idade("6 anos").entrada(420).chip().castrado(400)
                    .em(BaiasSeed.CANIL_A1).medalha().foto(0x5D4037)
                    .procedencia("Recolhido na Rua das Acácias, Vila Nova"),
            canino(13, "Belinha", "femea").cor("Caramelo").idade("5 anos").entrada(380).chip().castrado(360)
                    .motivo("abandono").em(BaiasSeed.CANIL_A1).medalha().foto(0xC68642),
            canino(14, "Duque", "macho").raca("Pastor Alemão (mestiço)").cor("Preta e castanha").porte("grande")
                    .idade("2 anos").entrada(45).chip().motivo("resgate").em(BaiasSeed.CANIL_A1),
            canino(15, "Amora", "femea").cor("Preta").idade("8 meses").entrada(30).motivo("abandono")
                    .em(BaiasSeed.CANIL_A1),
            canino(16, "Zeus", "macho").raca("Rottweiler (mestiço)").cor("Preta").porte("grande").idade("7 anos")
                    .entrada(400).chip().castrado(380).status("em_tratamento").motivo("apreensao_judicial")
                    .em(BaiasSeed.CANIL_A2).medalha(),
            canino(17, "Kiara", "femea").cor("Caramelo").porte("medio").idade("4 anos").entrada(110).chip()
                    .castrado(90).status("em_tratamento").motivo("resgate").em(BaiasSeed.CANIL_A2),
            canino(18, "Faísca", "macho").cor("Ruiva").porte("medio").idade("2 anos").entrada(50).chipDepois()
                    .status("em_tratamento").em(BaiasSeed.CANIL_A2).obs("Chegou com ferida no membro anterior."),
            canino(19, "Trovão", "macho").cor("Cinza").porte("grande").idade("5 anos").entrada(380).chip()
                    .castrado(360).em(BaiasSeed.CANIL_EXTERNO_B1).medalha(),
            // Microchip sem vacina: ficha incompleta ate a primeira vacina (roteiro 3.3).
            canino(20, "Pandora", "femea").cor("Preta").longa().porte("grande").idade("3 anos").entrada(140).chip()
                    .motivo("abandono").em(BaiasSeed.CANIL_EXTERNO_B1),
            felino(21, "Salem", "macho").cor("Preta").idade("4 anos").entrada(210).chip().castrado(190)
                    .em(BaiasSeed.GATIL_G1).medalha().foto(0x212121),
            felino(22, "Princesa", "femea").raca("Persa (mestiço)").cor("Branca").longa().idade("6 anos")
                    .entrada(160).chip().castrado(150).motivo("entrega_voluntaria").em(BaiasSeed.GATIL_G1)
                    .foto(0xE0E0E0),
            felino(23, "Nego", "macho").cor("Preta").idade("1 ano").entrada(70).chip().motivo("abandono")
                    .em(BaiasSeed.GATIL_G1),
            felino(24, "Mia", "femea").cor("Cinza").idade("6 meses").entrada(40).motivo("abandono")
                    .em(BaiasSeed.GATIL_G1),
            felino(25, "Garfield", "macho").cor("Laranja").idade("5 anos").entrada(100).chip().castrado(80)
                    .status("em_tratamento").em(BaiasSeed.GATIL_G1),
            felino(26, "Lua", "femea").cor("Branca").idade("1 ano").entrada(45).chip().castrado(20)
                    .motivo("resgate").em(BaiasSeed.GATIL_G1),
            felino(27, "Bidu", "macho").cor("Cinza e branca").idade("2 anos").entrada(55).chip().castrado(45)
                    .em(BaiasSeed.GATIL_G1),
            canino(28, "Bruce", "macho").cor("Caramelo").porte("medio").idade("3 anos").entrada(10)
                    .status("em_quarentena").em(BaiasSeed.QUARENTENA_Q1),
            new Animal(29, "Chico", "pnh", "macho").raca("Sagui-de-tufo-preto").cor("Cinza").longa().idade("adulto")
                    .entrada(20).status("em_quarentena").motivo("apreensao_judicial").em(BaiasSeed.QUARENTENA_Q1)
                    .procedencia("Apreensão em residência, encaminhado pela fiscalização ambiental"),
            canino(30, "Sol", "femea").cor("Caramelo").idade("2 anos").entrada(3).status("em_quarentena")
                    .obs("Em trânsito: aguardando vaga na quarentena."),
            canino(31, "Paçoca", "macho").cor("Caramelo").porte("medio").idade("3 anos").entrada(130).chip()
                    .castrado(115).em(BaiasSeed.CANIL_A1).medalha().foto(0xD7A86E),
            canino(32, "Bela", "femea").cor("Branca e preta").idade("1 ano").entrada(35).chip().castrado(30)
                    .motivo("entrega_voluntaria").em(BaiasSeed.CANIL_A1));

    // ── Plano do historico clinico ──────────────────────────────────────

    // dias > 0: aplicada ha `dias`; validadeEm != null: aplicada para vencer
    // em hoje + validadeEm (negativo = ja vencida).
    record Vacina(int animal, int ordem, String vacina, int dias, Integer validadeEm, String lote) {
        String chave() {
            return "vacinacao:" + String.format("%03d", animal) + "." + ordem;
        }
    }

    record Procedimento(int animal, int ordem, String tipo, int dias, String descricao, String resultado) {
        String chave() {
            return "procedimento:" + String.format("%03d", animal) + "." + ordem;
        }
    }

    // Datas relativas a hoje: negativo = passado, positivo = futuro.
    record Prescricao(int animal, String medicamento, int inicio, Integer fimPrevisto, Integer fimReal,
            StatusPrescricao status, int frequencia, UnidadeFrequencia unidadeFrequencia, String dose,
            UnidadeDose unidadeDose, ViaAdministracao via) {
        String chave() {
            return "prescricao:" + String.format("%03d", animal) + ".1";
        }
    }

    record Exame(int animal, String tipo, String laboratorio, int solicitacao, Integer resultadoEm, String resultado) {
        String chave() {
            return "exame:" + String.format("%03d", animal) + ".1";
        }
    }

    record Anexo(int animal, String nomeArquivo, String descricao, boolean pdf) {
        String chave() {
            return "anexo-animal:" + String.format("%03d", animal) + ".1";
        }
    }

    static final List<Vacina> VACINAS = List.of(
            new Vacina(1, 1, "antirrabica", 270, null, "ARB-2025-118"), new Vacina(1, 2, "v10", 270, null, "V10-2025-031"),
            new Vacina(2, 1, "antirrabica", 210, null, "ARB-2025-131"), new Vacina(2, 2, "v10", 210, null, "V10-2025-044"),
            new Vacina(3, 1, "v4_felinos", 180, null, "V4F-2025-012"), new Vacina(3, 2, "antirrabica", 180, null, "ARB-2025-140"),
            new Vacina(4, 1, "antirrabica", 150, null, "ARB-2026-002"),
            new Vacina(5, 1, "v4_felinos", 110, null, "V4F-2026-003"),
            new Vacina(6, 1, "v10", 70, null, "V10-2026-010"), new Vacina(6, 2, "antirrabica", 70, null, "ARB-2026-015"),
            new Vacina(7, 1, "antirrabica", 290, null, "ARB-2025-101"),
            new Vacina(10, 1, "antirrabica", 190, null, "ARB-2025-150"),
            new Vacina(12, 1, "antirrabica", 0, -15, "ARB-2025-077"), new Vacina(12, 2, "v10", 100, null, "V10-2026-004"),
            new Vacina(12, 3, "giardia", 0, 4, "GIA-2025-009"),
            new Vacina(13, 1, "v10", 0, 2, "V10-2025-020"), new Vacina(13, 2, "antirrabica", 200, null, "ARB-2025-133"),
            new Vacina(14, 1, "antirrabica", 40, null, "ARB-2026-030"),
            new Vacina(16, 1, "antirrabica", 0, -40, "ARB-2025-060"), new Vacina(16, 2, "v10", 300, null, "V10-2025-015"),
            new Vacina(17, 1, "v10", 100, null, "V10-2026-005"),
            new Vacina(18, 1, "v10", 45, null, "V10-2026-021"),
            new Vacina(19, 1, "v8", 0, 6, "V8-2025-011"), new Vacina(19, 2, "antirrabica", 360, null, "ARB-2025-090"),
            new Vacina(21, 1, "v4_felinos", 200, null, "L2026-004"), new Vacina(21, 2, "antirrabica", 200, null, "ARB-2025-129"),
            new Vacina(22, 1, "v4_felinos", 150, null, "V4F-2026-001"), new Vacina(22, 2, "felv", 150, null, "FLV-2026-001"),
            new Vacina(23, 1, "v4_felinos", 60, null, "V4F-2026-009"),
            new Vacina(25, 1, "v4_felinos", 90, null, "V4F-2026-005"),
            new Vacina(26, 1, "v4_felinos", 20, null, "V4F-2026-014"),
            new Vacina(27, 1, "v4_felinos", 50, null, "V4F-2026-011"), new Vacina(27, 2, "antirrabica", 50, null, "ARB-2026-028"),
            new Vacina(31, 1, "v10", 120, null, "V10-2026-003"), new Vacina(31, 2, "antirrabica", 120, null, "ARB-2026-008"),
            new Vacina(31, 3, "leishmaniose", 110, null, "LSH-2026-002"),
            new Vacina(32, 1, "v10", 30, null, "V10-2026-025"));

    // Lote digitado errado na vacinacao 021.1: a correcao e um registro novo.
    static final String VACINA_RETIFICADA = "vacinacao:021.1";
    static final String LOTE_CORRIGIDO = "L2026-040";

    static final List<Procedimento> PROCEDIMENTOS_AVULSOS = List.of(
            new Procedimento(12, 2, "atendimento_clinico", 10, "Avaliação clínica de rotina.", "Sem alterações."),
            new Procedimento(13, 2, "atendimento_clinico", 20, "Avaliação de pele", "Otite leve; limpeza indicada."),
            new Procedimento(16, 2, "atendimento_clinico", 5, "Retorno: dermatite em região dorsal.", "Em melhora."),
            new Procedimento(17, 2, "atendimento_clinico", 3, "Claudicação em membro posterior esquerdo.",
                    "Repouso e anti-inflamatório."),
            new Procedimento(18, 2, "atendimento_clinico", 12, "Ferida lacerada em membro anterior direito.",
                    "Encaminhado para sutura."),
            new Procedimento(18, 3, "cirurgia_maior", 11, "Sutura de laceração em membro anterior direito.",
                    "Boa recuperação anestésica."),
            new Procedimento(21, 2, "atendimento_clinico", 15, "Avaliação de rotina.", "Sem alterações."),
            new Procedimento(25, 2, "atendimento_clinico", 2, "Lesões ulceradas em face: suspeita de esporotricose.",
                    "Coleta para raspado de pele; isolamento no gatil."),
            new Procedimento(27, 2, "atendimento_clinico", 25, "Avaliação de rotina.", "Sem alterações."),
            new Procedimento(28, 1, "atendimento_clinico", 8, "Triagem de entrada.", "Mantido em quarentena."),
            new Procedimento(31, 2, "atendimento_clinico", 28, "Avaliação de rotina.", "Sem alterações."),
            new Procedimento(8, 2, "atendimento_clinico", 140, "Insuficiência renal crônica.", "Suporte clínico."),
            new Procedimento(9, 1, "atendimento_clinico", 85, "Apatia e emagrecimento progressivo.", "Suporte clínico."),
            new Procedimento(10, 2, "atendimento_clinico", 180, "Massa em região cervical.", "Biópsia indicada."),
            new Procedimento(11, 2, "atendimento_clinico", 50, "Desidratação e anorexia.", "Fluidoterapia."));

    // Descricao do atendimento 013.2 corrigida depois (registro imutavel).
    static final String PROCEDIMENTO_RETIFICADO = "procedimento:013.2";

    static final List<Prescricao> PRESCRICOES = List.of(
            new Prescricao(16, "medicamento:01", -5, 2, null, StatusPrescricao.ATIVA, 12, UnidadeFrequencia.HORAS,
                    "250", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            new Prescricao(17, "medicamento:05", -3, 4, null, StatusPrescricao.ATIVA, 1, UnidadeFrequencia.DIAS,
                    "0.2", UnidadeDose.MILILITRO, ViaAdministracao.ORAL),
            new Prescricao(25, "medicamento:02", -2, 6, null, StatusPrescricao.ATIVA, 12, UnidadeFrequencia.HORAS,
                    "50", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            new Prescricao(12, "medicamento:04", -10, 20, null, StatusPrescricao.ATIVA, 7, UnidadeFrequencia.DIAS,
                    "0.3", UnidadeDose.MILILITRO, ViaAdministracao.SUBCUTANEA),
            new Prescricao(18, "medicamento:06", -12, 15, null, StatusPrescricao.ATIVA, 1, UnidadeFrequencia.DIAS,
                    "10", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            new Prescricao(1, "medicamento:01", -260, -250, -250, StatusPrescricao.CONCLUIDA, 12,
                    UnidadeFrequencia.HORAS, "250", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            new Prescricao(21, "medicamento:03", -100, -93, -93, StatusPrescricao.CONCLUIDA, 12,
                    UnidadeFrequencia.HORAS, "125", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            new Prescricao(13, "medicamento:07", -40, -37, -37, StatusPrescricao.CONCLUIDA, 8,
                    UnidadeFrequencia.HORAS, "0.5", UnidadeDose.MILILITRO, ViaAdministracao.ORAL),
            new Prescricao(10, "medicamento:07", -185, -175, null, StatusPrescricao.SUSPENSA, 8,
                    UnidadeFrequencia.HORAS, "1", UnidadeDose.MILILITRO, ViaAdministracao.INTRAMUSCULAR),
            new Prescricao(19, "medicamento:05", -60, -55, null, StatusPrescricao.CANCELADA, 1,
                    UnidadeFrequencia.DIAS, "0.4", UnidadeDose.MILILITRO, ViaAdministracao.ORAL),
            new Prescricao(22, "medicamento:01", -60, -50, null, StatusPrescricao.ATIVA, 12,
                    UnidadeFrequencia.HORAS, "100", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL));

    // A prescricao 022.1 ficou ATIVA apos o fim: a correcao a conclui.
    static final String PRESCRICAO_RETIFICADA = "prescricao:022.1";

    static final List<Exame> EXAMES = List.of(
            new Exame(25, "raspado_pele", null, -2, null, null),
            new Exame(12, "hemograma", null, -15, -13, "Sem alterações dignas de nota."),
            new Exame(16, "bioquimico", null, -6, -4, "Ureia e creatinina discretamente elevadas."),
            new Exame(17, "hemograma", null, -3, null, null),
            new Exame(13, "parasitologico", null, -25, -22, "Negativo para ovos e cistos."),
            new Exame(31, "sorologia", "ial_sorocaba", -30, -20, "Leishmaniose: não reagente."),
            new Exame(8, "urinalise", null, -145, -143, "Densidade baixa e proteinúria."),
            new Exame(21, "citologia", null, -101, -99, "Processo inflamatório inespecífico."),
            new Exame(18, "radiografia", null, -12, -12, "Sem fraturas; edema de tecidos moles."),
            new Exame(2, "hemograma", null, -215, -214, "Sem alterações."));

    // Resultado do hemograma 012.1 corrigido (registro imutavel).
    static final String EXAME_RETIFICADO = "exame:012.1";

    static final List<Anexo> ANEXOS = List.of(
            new Anexo(12, "foto-entrada.png", "Foto de entrada", false),
            new Anexo(18, "raio-x-membro.png", "Radiografia do membro anterior", false),
            new Anexo(10, "laudo-eutanasia.pdf", "Laudo do responsável técnico", true));

    // ── Execucao ────────────────────────────────────────────────────────

    private final SeedExecutor executor;
    private final AnimalService animalService;
    private final VacinacaoService vacinacaoService;
    private final ProcedimentoService procedimentoService;
    private final PrescricaoService prescricaoService;
    private final ExameService exameService;
    private final AnexoAnimalService anexoAnimalService;
    private final Clock clock;

    AnimaisSeed(SeedExecutor executor, AnimalService animalService, VacinacaoService vacinacaoService,
            ProcedimentoService procedimentoService, PrescricaoService prescricaoService, ExameService exameService,
            AnexoAnimalService anexoAnimalService, Clock clock) {
        this.executor = executor;
        this.animalService = animalService;
        this.vacinacaoService = vacinacaoService;
        this.procedimentoService = procedimentoService;
        this.prescricaoService = prescricaoService;
        this.exameService = exameService;
        this.anexoAnimalService = anexoAnimalService;
        this.clock = clock;
    }

    static String chaveAnimal(int numero) {
        return "animal:" + String.format("%03d", numero);
    }

    void executar(UsuariosSeed.Atores atores) {
        DatasSeed datas = new DatasSeed(clock);
        for (Animal animal : PLANO) {
            SeedAtor veterinario = atores.veterinario(animal.numero);
            UUID id = executor.garantir(animal.chave(), "animal",
                    () -> animal.microchip
                            ? executor.idPorConsulta("SELECT id FROM animal WHERE microchip = ?", animal.numeroMicrochip())
                            : Optional.empty(),
                    () -> veterinario.executar(GESTAO_ESCRITA,
                            () -> animalService.criar(executor.valido(criacao(animal, datas)), veterinario.id()).id()));
            historico(animal, id, veterinario, datas);
            if (animal.microchipDepois) {
                executor.garantir(animal.chave() + ":microchip", "animal_microchip",
                        () -> veterinario.executar(GESTAO_ESCRITA, () -> animalService.atualizar(id,
                                executor.valido(atualizacao(animal, datas, true, animal.status, false)),
                                veterinario.id()).id()));
            }
            if (animal.destino != null) {
                executor.garantir(animal.chave() + ":desfecho", "animal_desfecho",
                        () -> veterinario.executar(GESTAO_ESCRITA, () -> animalService.atualizar(id,
                                executor.valido(atualizacao(animal, datas, animal.microchip, animal.destino, true)),
                                veterinario.id()).id()));
            }
        }
    }

    private void historico(Animal animal, UUID animalId, SeedAtor veterinario, DatasSeed datas) {
        for (Vacina vacina : VACINAS) {
            if (vacina.animal() != animal.numero) {
                continue;
            }
            LocalDate aplicacao = vacina.validadeEm() != null
                    ? datas.aplicacaoComValidadeEm(vacina.validadeEm())
                    : datas.diasAtras(vacina.dias());
            UUID vacinaId = executor.garantir(vacina.chave(), "vacinacao", () -> criarVacinacao(
                    veterinario, animalId, vacina.vacina(), aplicacao, vacina.lote(), null));
            if (vacina.chave().equals(VACINA_RETIFICADA)) {
                executor.garantir(vacina.chave() + ":retificacao", "vacinacao", () -> criarVacinacao(
                        veterinario, animalId, vacina.vacina(), aplicacao, LOTE_CORRIGIDO, vacinaId));
            }
        }
        for (Procedimento procedimento : procedimentosDo(animal)) {
            UUID procedimentoId = executor.garantir(procedimento.chave(), "procedimento", () -> criarProcedimento(
                    veterinario, animalId, procedimento, datas.diasAtras(procedimento.dias()), null));
            if (procedimento.chave().equals(PROCEDIMENTO_RETIFICADO)) {
                Procedimento corrigido = new Procedimento(procedimento.animal(), procedimento.ordem(),
                        procedimento.tipo(), procedimento.dias(), "Avaliação de pele e orelhas.", procedimento.resultado());
                executor.garantir(procedimento.chave() + ":retificacao", "procedimento", () -> criarProcedimento(
                        veterinario, animalId, corrigido, datas.diasAtras(procedimento.dias()), procedimentoId));
            }
        }
        for (Prescricao prescricao : PRESCRICOES) {
            if (prescricao.animal() != animal.numero) {
                continue;
            }
            UUID prescricaoId = executor.garantir(prescricao.chave(), "prescricao",
                    () -> criarPrescricao(veterinario, animalId, prescricao, datas, null));
            if (prescricao.chave().equals(PRESCRICAO_RETIFICADA)) {
                Prescricao concluida = new Prescricao(prescricao.animal(), prescricao.medicamento(), prescricao.inicio(),
                        prescricao.fimPrevisto(), -52, StatusPrescricao.CONCLUIDA, prescricao.frequencia(),
                        prescricao.unidadeFrequencia(), prescricao.dose(), prescricao.unidadeDose(), prescricao.via());
                executor.garantir(prescricao.chave() + ":retificacao", "prescricao",
                        () -> criarPrescricao(veterinario, animalId, concluida, datas, prescricaoId));
            }
        }
        for (Exame exame : EXAMES) {
            if (exame.animal() != animal.numero) {
                continue;
            }
            UUID exameId = executor.garantir(exame.chave(), "exame",
                    () -> criarExame(veterinario, animalId, exame, datas, null));
            if (exame.chave().equals(EXAME_RETIFICADO)) {
                Exame corrigido = new Exame(exame.animal(), exame.tipo(), exame.laboratorio(), exame.solicitacao(),
                        exame.resultadoEm(), "Discreta eosinofilia; demais parâmetros dentro da referência.");
                executor.garantir(exame.chave() + ":retificacao", "exame",
                        () -> criarExame(veterinario, animalId, corrigido, datas, exameId));
            }
        }
        for (Anexo anexo : ANEXOS) {
            if (anexo.animal() != animal.numero) {
                continue;
            }
            byte[] conteudo = anexo.pdf()
                    ? ArquivosFicticios.pdf("SISZOO - documento ficticio de " + animal.nome)
                    : ArquivosFicticios.png(0x4E7D5B + animal.numero * 0x0A0A0A);
            BytesMultipartFile arquivo = new BytesMultipartFile(
                    anexo.nomeArquivo(), anexo.pdf() ? "application/pdf" : "image/png", conteudo);
            executor.garantir(anexo.chave(), "anexo_animal", () -> veterinario.executar(GESTAO_ESCRITA,
                    () -> anexoAnimalService.adicionar(animalId, arquivo, anexo.descricao(), veterinario.id()).id()));
        }
    }

    // Castracoes geradas a partir da data de esterilizacao da ficha, mais os
    // atendimentos avulsos do plano.
    static List<Procedimento> procedimentosDo(Animal animal) {
        List<Procedimento> lista = new ArrayList<>();
        if (animal.diasCastracao != null) {
            lista.add(new Procedimento(animal.numero, 1, "castracao", animal.diasCastracao,
                    "Orquiectomia/ovariohisterectomia eletiva.", "Sem intercorrências."));
        }
        PROCEDIMENTOS_AVULSOS.stream().filter(p -> p.animal() == animal.numero).forEach(lista::add);
        return lista;
    }

    private UUID criarVacinacao(SeedAtor veterinario, UUID animalId, String vacina, LocalDate aplicacao, String lote,
            UUID retificaId) {
        CriarVacinacaoRequest request = executor.valido(new CriarVacinacaoRequest(
                animalId, vacina, aplicacao, 1, new BigDecimal("1.000"), UnidadeDose.MILILITRO, lote, null, retificaId));
        return veterinario.executar(GESTAO_ESCRITA, () -> vacinacaoService.criar(request, veterinario.id()).id());
    }

    private UUID criarProcedimento(SeedAtor veterinario, UUID animalId, Procedimento procedimento, LocalDate data,
            UUID retificaId) {
        CriarProcedimentoRequest request = executor.valido(new CriarProcedimentoRequest(animalId,
                procedimento.tipo(), data, procedimento.descricao(), procedimento.resultado(), retificaId));
        return veterinario.executar(GESTAO_ESCRITA, () -> procedimentoService.criar(request, veterinario.id()).id());
    }

    private UUID criarPrescricao(SeedAtor veterinario, UUID animalId, Prescricao prescricao, DatasSeed datas,
            UUID retificaId) {
        UUID medicamentoId = executor.idObrigatorio(prescricao.medicamento());
        CriarPrescricaoRequest request = executor.valido(new CriarPrescricaoRequest(
                animalId, medicamentoId, datas.diasAFrente(prescricao.inicio()),
                prescricao.fimPrevisto() == null ? null : datas.diasAFrente(prescricao.fimPrevisto()),
                prescricao.fimReal() == null ? null : datas.diasAFrente(prescricao.fimReal()),
                prescricao.frequencia(), prescricao.unidadeFrequencia(), new BigDecimal(prescricao.dose()),
                prescricao.unidadeDose(), prescricao.via(), prescricao.status(), retificaId));
        return veterinario.executar(GESTAO_ESCRITA, () -> prescricaoService.criar(request, veterinario.id()).id());
    }

    private UUID criarExame(SeedAtor veterinario, UUID animalId, Exame exame, DatasSeed datas, UUID retificaId) {
        CriarExameRequest request = executor.valido(new CriarExameRequest(animalId, exame.tipo(), exame.laboratorio(),
                datas.diasAFrente(exame.solicitacao()),
                exame.resultadoEm() == null ? null : datas.diasAFrente(exame.resultadoEm()),
                exame.resultado(), null, retificaId));
        return veterinario.executar(GESTAO_ESCRITA, () -> exameService.criar(request, veterinario.id()).id());
    }

    private CriarAnimalRequest criacao(Animal animal, DatasSeed datas) {
        return new CriarAnimalRequest(animal.nome, animal.especie, animal.sexo, animal.raca, animal.coloracao,
                animal.pelagem, animal.porte, peso(animal), animal.idade, null,
                animal.microchip ? animal.numeroMicrochip() : null,
                animal.diasCastracao != null, castracao(animal, datas),
                animal.status, animal.motivo, datas.entradaHa(animal.diasEntrada), baiaId(animal),
                animal.corFoto == null ? null : ArquivosFicticios.fotoDataUri(animal.corFoto), animal.observacoes,
                animal.medalha ? "SEED-" + String.format("%04d", animal.numero) : null,
                animal.medalha && animal.microchip ? datas.diasAtras(animal.diasEntrada) : null,
                animal.procedencia, null);
    }

    // PUT completo (a API substitui a ficha): mesmos dados da criacao, com o
    // microchip implantado depois (RN-AN04 recalcula a ficha) ou o destino
    // final. Fora da custodia o animal sai da baia.
    private AtualizarAnimalRequest atualizacao(Animal animal, DatasSeed datas, boolean comMicrochip, String status,
            boolean desfecho) {
        boolean implantadoAgora = animal.microchipDepois && comMicrochip;
        String observacoes = desfecho && animal.destino.startsWith("obito")
                ? "Óbito registrado no prontuário."
                : animal.observacoes;
        return new AtualizarAnimalRequest(animal.nome, animal.especie, animal.sexo, animal.raca, animal.coloracao,
                animal.pelagem, animal.porte, peso(animal), animal.idade, null,
                comMicrochip ? animal.numeroMicrochip() : null,
                animal.diasCastracao != null, castracao(animal, datas),
                status, animal.motivo, datas.entradaHa(animal.diasEntrada), desfecho ? null : baiaId(animal),
                animal.corFoto == null ? null : ArquivosFicticios.fotoDataUri(animal.corFoto), observacoes,
                animal.medalha ? "SEED-" + String.format("%04d", animal.numero) : null,
                implantadoAgora ? datas.diasAtras(11)
                        : animal.medalha && animal.microchip ? datas.diasAtras(animal.diasEntrada) : null,
                animal.procedencia, desfecho ? animal.laudo : null);
    }

    private UUID baiaId(Animal animal) {
        return animal.baia == null ? null : executor.idObrigatorio(animal.baia);
    }

    private static LocalDate castracao(Animal animal, DatasSeed datas) {
        return animal.diasCastracao == null ? null : datas.diasAtras(animal.diasCastracao);
    }

    // Peso coerente com especie e porte, com pequena variacao pelo numero.
    private static BigDecimal peso(Animal animal) {
        double base = switch (animal.especie) {
            case "felino" -> 3.6;
            case "pnh" -> 0.35;
            default -> switch (animal.porte) {
                case "grande" -> 28.0;
                case "medio" -> 14.0;
                default -> 6.5;
            };
        };
        double variacao = "pnh".equals(animal.especie) ? 0.01 * (animal.numero % 5) : 0.3 * (animal.numero % 5);
        return BigDecimal.valueOf(base + variacao).setScale(2, RoundingMode.HALF_UP);
    }
}
