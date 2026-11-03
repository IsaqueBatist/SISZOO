package com.siszoo.seed;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
import com.siszoo.animais.dto.EutanasiaRequest;
import com.siszoo.animais.dto.TransferenciaRequest;
import com.siszoo.animais.entity.TipoDestinoTransferencia;
import com.siszoo.animais.service.AnexoAnimalService;
import com.siszoo.animais.service.AnimalService;

class AnimaisSeed {

    static final String GESTAO_ESCRITA = "GESTAO_ANIMAIS:escrita";
    private static final String STATUS_TRANSFERIDO = "transferido";
    private static final EutanasiaRequest EUTANASIA =
            new EutanasiaRequest("Anestesia geral seguida de agente eutanásico intravenoso", true);

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
        Integer horasEntrada;
        boolean microchip;
        boolean microchipDepois;
        Integer diasCastracao;
        boolean castracaoNaoInformada;
        Integer diasNascimento;
        String status = "disponivel_adocao";
        String motivo = "recolhimento";
        String baia;
        String destino;
        String tipoDestino = TipoDestinoTransferencia.ENTIDADE_PROTECAO.name();
        boolean documentoDepois;
        String laudo;
        boolean medalha;
        String procedencia;
        String observacoes;
        List<String> condicoes;
        String condicoesOutras;

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

        String foto() {
            return ArquivosFicticios.nomeDaFoto(numero, nome);
        }

        Animal raca(String valor) { raca = valor; return this; }
        Animal cor(String valor) { coloracao = valor; return this; }
        Animal longa() { pelagem = "longa"; return this; }
        Animal porte(String valor) { porte = valor; return this; }
        Animal idade(String valor) { idade = valor; return this; }
        Animal entrada(int dias) { diasEntrada = dias; return this; }
        Animal entradaEmHoras(int horas) { horasEntrada = horas; return this; }
        Animal chip() { microchip = true; return this; }
        Animal chipDepois() { microchipDepois = true; return this; }
        Animal castrado(int dias) { diasCastracao = dias; return this; }
        Animal castracaoNaoInformada() { castracaoNaoInformada = true; return this; }
        Animal nascimento(int diasAtras) { diasNascimento = diasAtras; return this; }
        Animal status(String valor) { status = valor; return this; }
        Animal motivo(String valor) { motivo = valor; return this; }
        Animal em(String chaveBaia) { baia = chaveBaia; return this; }
        Animal destino(String valor) { destino = valor; return this; }
        Animal tipoDestino(TipoDestinoTransferencia valor) { tipoDestino = valor.name(); return this; }
        Animal documentoDepois() { documentoDepois = true; return this; }
        Animal laudo(String valor) { laudo = valor; return this; }
        Animal medalha() { medalha = true; return this; }
        Animal procedencia(String valor) { procedencia = valor; return this; }
        Animal obs(String valor) { observacoes = valor; return this; }
        Animal condicoes(String... codigos) { condicoes = List.of(codigos); return this; }
        Animal condicoesOutras(String descricao) { condicoesOutras = descricao; return this; }

        /** Esterilização em três estados (V31): {@code true}, {@code false} e {@code null}. */
        Boolean esterilizado() {
            return castracaoNaoInformada ? null : diasCastracao != null;
        }

        LocalDateTime dataEntrada(DatasSeed datas) {
            return horasEntrada == null ? datas.entradaHa(diasEntrada) : datas.entradaHorasAtras(horasEntrada);
        }
    }

    private static Animal canino(int numero, String nome, String sexo) {
        return new Animal(numero, nome, "canino", sexo);
    }

    private static Animal felino(int numero, String nome, String sexo) {
        return new Animal(numero, nome, "felino", sexo);
    }

    private static Animal quiroptero(int numero, String nome, String sexo) {
        return new Animal(numero, nome, "quiroptero", sexo);
    }

    private static Animal pnh(int numero, String nome, String sexo) {
        return new Animal(numero, nome, "pnh", sexo);
    }

    static final List<Animal> PLANO = List.of(
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
            // Animais fora da custódia vêm antes dos sob custódia (invariante do SeedPlanoTest).
            quiroptero(35, "Noite", "femea").raca("Morcego insetívoro").cor("Marrom escura").idade("adulto")
                    .entrada(26).status("em_quarentena").motivo("recolhimento").castracaoNaoInformada()
                    .em(BaiasSeed.ISOLAMENTO_I1).destino("obito_natural")
                    .procedencia("Recolhido em forro de residência na Rua XV de Novembro, Centro"),
            pnh(37, "Juca", "macho").raca("Sagui-de-tufo-branco").cor("Acinzentada").longa().idade("jovem")
                    .entrada(70).status("em_quarentena").motivo("apreensao_judicial").castracaoNaoInformada()
                    .em(BaiasSeed.ISOLAMENTO_I1).destino("transferido")
                    .tipoDestino(TipoDestinoTransferencia.ORGAO_PUBLICO)
                    .obs("Encaminhado ao órgão ambiental competente para destinação de fauna silvestre."),
            canino(48, "Tufao", "macho").raca("Husky (mestiço)").cor("Cinza e branca").longa().porte("grande")
                    .idade("4 anos").entrada(95).chip().castrado(80).motivo("entrega_voluntaria")
                    .em(BaiasSeed.CANIL_A3).destino("transferido")
                    .tipoDestino(TipoDestinoTransferencia.OUTRO_CCZ)
                    .obs("Transferido para o CCZ da cidade de origem do tutor."),
            felino(49, "Serena", "femea").cor("Cinza azulada").idade("3 anos").entrada(85).chip().castrado(70)
                    .motivo("resgate").em(BaiasSeed.GATIL_G2).destino("transferido")
                    .tipoDestino(TipoDestinoTransferencia.OUTRO).documentoDepois()
                    .obs("Transferida sem ofício; documento juntado ao prontuário depois."),
            canino(12, "Rex", "macho").cor("Preta").porte("medio").idade("6 anos").entrada(420).chip().castrado(400)
                    .em(BaiasSeed.CANIL_A1).medalha()
                    .procedencia("Recolhido na Rua das Acácias, Vila Nova"),
            canino(13, "Belinha", "femea").cor("Caramelo").idade("5 anos").entrada(380).chip().castrado(360)
                    .motivo("abandono").em(BaiasSeed.CANIL_A1).medalha(),
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
            canino(20, "Pandora", "femea").cor("Preta").longa().porte("grande").idade("3 anos").entrada(140).chip()
                    .motivo("abandono").em(BaiasSeed.CANIL_EXTERNO_B1),
            felino(21, "Salem", "macho").cor("Preta").idade("4 anos").entrada(210).chip().castrado(190)
                    .em(BaiasSeed.GATIL_G1).medalha(),
            felino(22, "Princesa", "femea").raca("Persa (mestiço)").cor("Branca").longa().idade("6 anos")
                    .entrada(160).chip().castrado(150).motivo("entrega_voluntaria").em(BaiasSeed.GATIL_G1),
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
                    .castrado(115).em(BaiasSeed.CANIL_A1).medalha(),
            canino(32, "Bela", "femea").cor("Branca e preta").idade("1 ano").entrada(35).chip().castrado(30)
                    .motivo("entrega_voluntaria").em(BaiasSeed.CANIL_A1),

            // ── Quirópteros e primatas: as duas espécies do catálogo sem animal no canil ──
            quiroptero(33, "Sombra", "macho").raca("Morcego hematófago").cor("Marrom").idade("adulto")
                    .entrada(5).status("em_quarentena").motivo("resgate").castracaoNaoInformada()
                    .em(BaiasSeed.ISOLAMENTO_I1)
                    .procedencia("Encontrado em via pública no bairro Brasil, em horário diurno")
                    .obs("Captura diurna de morcego hematófago: amostra encaminhada para raiva."),
            quiroptero(34, "Breu", "macho").raca("Morcego insetívoro").cor("Preta").idade("adulto")
                    .entrada(9).status("em_quarentena").motivo("recolhimento").castracaoNaoInformada()
                    .em(BaiasSeed.ISOLAMENTO_I1)
                    .procedencia("Recolhido em creche municipal no Jardim Paraíso"),
            pnh(36, "Tiao", "macho").raca("Sagui-de-tufo-preto").cor("Marrom e cinza").longa().idade("adulto")
                    .entrada(15).status("em_quarentena").motivo("apreensao_judicial").castracaoNaoInformada()
                    .em(BaiasSeed.ISOLAMENTO_I1).condicoes("agressividade")
                    .procedencia("Apreensão em cativeiro doméstico irregular, Pirapitingui"),

            // ── Limites do alerta de esterilização (72 h desde a entrada) ──
            canino(38, "Pretinha", "femea").cor("Preta").porte("medio").idade("2 anos").entradaEmHoras(6)
                    .motivo("recolhimento").em(BaiasSeed.CANIL_A3).nascimento(730)
                    .obs("Recolhida hoje: prazo de 72 horas à disposição do responsável em curso."),
            canino(39, "Caramelo", "macho").cor("Caramelo").porte("medio").idade("3 anos").entradaEmHoras(60)
                    .motivo("recolhimento").em(BaiasSeed.CANIL_A3).nascimento(1095)
                    .obs("Dentro das 72 horas à disposição do responsável."),
            felino(40, "Nuvem", "femea").cor("Branca").idade("1 ano").entradaEmHoras(73).motivo("recolhimento")
                    .em(BaiasSeed.GATIL_G2).nascimento(400)
                    .obs("Prazo de 72 horas vencido: apta à esterilização."),
            canino(41, "Teimoso", "macho").cor("Malhada").porte("pequeno").idade("5 anos").entradaEmHoras(200)
                    .motivo("abandono").em(BaiasSeed.CANIL_A3).nascimento(1825),
            felino(42, "Pinta", "femea").cor("Malhada").idade("2 anos").entradaEmHoras(150).motivo("abandono")
                    .castracaoNaoInformada().nascimento(760)
                    .obs("Castração não informada na entrada e em trânsito, sem baia definida."),

            // ── Condições de saúde (V33) e data de nascimento aproximada ──
            // Residentes antigos: a vacinação de reforço precisa de data de aplicação posterior à
            // entrada, e as validades-limite ficam 12 meses atrás (aplicacaoComValidadeEm).
            canino(43, "Lola", "femea").raca("Beagle (mestiço)").cor("Tricolor").porte("medio").idade("7 anos")
                    .entrada(400).chip().castrado(380).motivo("entrega_voluntaria").em(BaiasSeed.CANIL_A3)
                    .nascimento(2555).condicoes("epilepsia", "cardiopatia")
                    .obs("Tutora entregou por impossibilidade de custear o tratamento contínuo."),
            felino(44, "Thiago", "macho").cor("Laranja e branca").idade("8 anos").entrada(390).chip()
                    .status("em_tratamento").motivo("resgate").em(BaiasSeed.GATIL_G2).nascimento(2920)
                    .condicoes("diabetes"),
            canino(45, "Branca", "femea").cor("Branca").longa().porte("medio").idade("11 anos").entrada(430)
                    .chip().castrado(410).motivo("abandono").em(BaiasSeed.CANIL_A3).nascimento(4015)
                    .condicoes("cegueira", "surdez")
                    .obs("Idosa, com perda visual e auditiva; adoção responsável acompanhada."),
            canino(46, "Jeca", "macho").cor("Caramelo").porte("medio").idade("4 anos").entrada(410).chip()
                    .castrado(390).motivo("resgate").em(BaiasSeed.CANIL_A3).nascimento(1460)
                    .condicoes("outras").condicoesOutras("Amputação do membro posterior direito após atropelamento."),

            // ── Sexo não identificado (exclui o animal das castrações do relatório) ──
            new Animal(47, "Morena", "felino", "nao_identificado").cor("Preta").idade("6 meses").entrada(12)
                    .motivo("recolhimento").em(BaiasSeed.GATIL_G2).castrado(6).nascimento(180)
                    .obs("Sexo não identificado na triagem; confirmar na próxima avaliação."),

            // ── Histórico clínico longo e anexos até perto do limite (10 por animal) ──
            canino(50, "Canela", "femea").raca("Boxer (mestiço)").cor("Caramelo").porte("grande").idade("6 anos")
                    .entrada(420).chip().castrado(400).status("em_tratamento").motivo("recolhimento")
                    .em(BaiasSeed.CANIL_A3).medalha().nascimento(2190)
                    .procedencia("Recolhida na Av. Dr. Otaviano Pereira Mendes, Vila Nova")
                    .obs("Acompanhamento clínico longo: dermatopatia crônica em investigação."));

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

    record Prescricao(int animal, String medicamento, int inicio, Integer fimPrevisto, Integer fimReal,
            StatusPrescricao status, int frequencia, UnidadeFrequencia unidadeFrequencia, String dose,
            UnidadeDose unidadeDose, ViaAdministracao via) {
        String chave() {
            return "prescricao:" + String.format("%03d", animal) + ".1";
        }
    }

    record Exame(int animal, int ordem, String tipo, String laboratorio, int solicitacao, Integer resultadoEm,
            String resultado, String observacoes) {
        String chave() {
            return "exame:" + String.format("%03d", animal) + "." + ordem;
        }
    }

    record Anexo(int animal, int ordem, String nomeArquivo, String descricao, boolean pdf) {
        String chave() {
            return "anexo-animal:" + String.format("%03d", animal) + "." + ordem;
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
            new Vacina(32, 1, "v10", 30, null, "V10-2026-025"),
            // Limites da janela de 7 dias do AlertaVacinalService: 0 e +7 entram (A_VENCER),
            // +8 fica de fora, -1 entra como VENCIDA.
            new Vacina(43, 1, "antirrabica", 0, 0, "ARB-2026-061"),
            new Vacina(45, 1, "antirrabica", 0, 7, "ARB-2026-062"),
            new Vacina(46, 1, "antirrabica", 0, 8, "ARB-2026-063"),
            new Vacina(50, 1, "antirrabica", 0, -1, "ARB-2026-064"),
            new Vacina(50, 2, "v10", 0, 25, "V10-2026-048"),
            // Única vacina do catálogo que o seed nunca aplicou.
            new Vacina(50, 3, "gripe_canina", 110, null, "GRC-2026-002"),
            new Vacina(43, 2, "v10", 20, null, "V10-2026-049"),
            new Vacina(44, 1, "v4_felinos", 0, 3, "V4F-2026-022"),
            new Vacina(47, 1, "v4_felinos", 10, null, "V4F-2026-023"),
            new Vacina(48, 1, "v10", 90, null, "V10-2026-031"));

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
            new Procedimento(11, 2, "atendimento_clinico", 50, "Desidratação e anorexia.", "Fluidoterapia."),
            // Triagem dos silvestres. O alerta sem_avaliacao_30d conta quem NÃO tem procedimento
            // nos últimos 30 dias: 33 e 34 ficam de fora, 36 (40 dias) entra.
            new Procedimento(33, 1, "atendimento_clinico", 5, "Triagem de morcego hematófago capturado em via pública.",
                    "Sem sinais neurológicos; amostra encaminhada para raiva."),
            new Procedimento(34, 1, "atendimento_clinico", 9, "Triagem de morcego insetívoro recolhido em creche.",
                    "Asa direita com lesão antiga consolidada; mantido em isolamento."),
            new Procedimento(36, 1, "atendimento_clinico", 40, "Triagem de primata apreendido em cativeiro irregular.",
                    "Comportamento agressivo ao manejo; sem alterações clínicas."),
            // Único tipo de procedimento do catálogo que o seed nunca registrou.
            new Procedimento(50, 2, "vacinacao", 110, "Aplicação de reforço vacinal em campanha interna.",
                    "Sem reação adversa imediata."),
            new Procedimento(50, 3, "atendimento_clinico", 45, "Dermatopatia crônica em região dorsal.",
                    "Coleta para citologia e ultrassonografia abdominal."),
            new Procedimento(50, 4, "cirurgia_maior", 30, "Exérese de nódulo cutâneo em flanco esquerdo.",
                    "Boa recuperação anestésica; material enviado para análise."),
            new Procedimento(50, 5, "atendimento_clinico", 10, "Retorno: avaliação das lesões dorsais.",
                    "Lesões em regressão; manter antibiótico até o fim do ciclo."),
            new Procedimento(43, 2, "atendimento_clinico", 12, "Avaliação cardiológica de rotina.",
                    "Sopro sistólico grau II mantido; conduta inalterada."),
            new Procedimento(44, 2, "atendimento_clinico", 14, "Controle glicêmico em felino diabético.",
                    "Ajuste da dose de insulina; orientação de dieta."),
            new Procedimento(45, 2, "atendimento_clinico", 20, "Avaliação geriátrica.", "Sem alterações agudas."),
            new Procedimento(47, 2, "atendimento_clinico", 11, "Triagem de entrada de filhote.",
                    "Sexo não identificado à inspeção; reavaliar com o crescimento."));

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
                    UnidadeFrequencia.HORAS, "100", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            // Limites do alerta medicacao_ativa (prescrição ATIVA com fim previsto entre hoje e
            // hoje+7): a de Thiago entra no último dia da janela, a de Lola fica um dia fora.
            new Prescricao(44, "medicamento:02", -5, 7, null, StatusPrescricao.ATIVA, 24,
                    UnidadeFrequencia.HORAS, "2", UnidadeDose.UNIDADE_INTERNACIONAL, ViaAdministracao.SUBCUTANEA),
            new Prescricao(43, "medicamento:06", -10, 8, null, StatusPrescricao.ATIVA, 1,
                    UnidadeFrequencia.DIAS, "5", UnidadeDose.MILIGRAMA, ViaAdministracao.ORAL),
            new Prescricao(50, "medicamento:03", -28, -14, -12, StatusPrescricao.CONCLUIDA, 8,
                    UnidadeFrequencia.HORAS, "250", UnidadeDose.MILIGRAMA, ViaAdministracao.INTRAVENOSA),
            new Prescricao(46, "medicamento:04", -380, -373, -373, StatusPrescricao.CONCLUIDA, 7,
                    UnidadeFrequencia.DIAS, "0.4", UnidadeDose.MILILITRO, ViaAdministracao.TOPICA));

    static final String PRESCRICAO_RETIFICADA = "prescricao:022.1";

    static final List<Exame> EXAMES = List.of(
            new Exame(25, 1, "raspado_pele", null, -2, null, null, null),
            new Exame(12, 1, "hemograma", null, -15, -13, "Sem alterações dignas de nota.", null),
            new Exame(16, 1, "bioquimico", null, -6, -4, "Ureia e creatinina discretamente elevadas.", null),
            new Exame(17, 1, "hemograma", null, -3, null, null, null),
            new Exame(13, 1, "parasitologico", null, -25, -22, "Negativo para ovos e cistos.", null),
            new Exame(31, 1, "sorologia", "ial_sorocaba", -30, -20, "Leishmaniose: não reagente.", null),
            new Exame(8, 1, "urinalise", null, -145, -143, "Densidade baixa e proteinúria.", null),
            new Exame(21, 1, "citologia", null, -101, -99, "Processo inflamatório inespecífico.", null),
            new Exame(18, 1, "radiografia", null, -12, -12, "Sem fraturas; edema de tecidos moles.", null),
            new Exame(2, 1, "hemograma", null, -215, -214, "Sem alterações.", null),
            // Único tipo do catálogo nunca usado, com laboratório e observações preenchidos.
            new Exame(50, 1, "ultrassonografia", "itu_ll01", -40, -38,
                    "Fígado e baço sem alterações; linfonodos mesentéricos discretamente aumentados.",
                    "Exame realizado sob sedação leve; jejum de 8 horas cumprido."),
            new Exame(50, 2, "citologia", "ial_sorocaba", -18, -11,
                    "Dermatite com infiltrado eosinofílico; sem agentes fúngicos visualizados.",
                    "Material colhido de três lesões distintas da região dorsal."),
            new Exame(50, 3, "hemograma", null, -4, null, null, "Reavaliação após o ciclo de antibiótico."),
            new Exame(44, 1, "bioquimico", "ial_sorocaba", -14, -12,
                    "Glicemia de 310 mg/dL; demais parâmetros dentro da referência.",
                    "Coleta em jejum para controle do diabetes."),
            new Exame(43, 1, "radiografia", null, -20, -20, "Silhueta cardíaca aumentada (VHS 11,2).",
                    "Projeções latero-lateral e ventrodorsal."));

    static final String EXAME_RETIFICADO = "exame:012.1";

    static final List<Anexo> ANEXOS = List.of(
            new Anexo(12, 1, "foto-entrada.png", "Foto de entrada", false),
            new Anexo(18, 1, "raio-x-membro.png", "Radiografia do membro anterior", false),
            new Anexo(10, 1, "laudo-eutanasia.pdf", "Laudo do responsável técnico", true),
            // Prontuário cheio: 5 anexos num mesmo animal (o limite é 10, AnexoAnimalService).
            new Anexo(50, 1, "foto-entrada.png", "Foto de entrada", false),
            new Anexo(50, 2, "lesoes-dorso.png", "Lesões da região dorsal na admissão", false),
            new Anexo(50, 3, "ultrassom-abdominal.pdf", "Laudo da ultrassonografia abdominal", true),
            new Anexo(50, 4, "citologia-pele.pdf", "Laudo da citologia de pele", true),
            new Anexo(50, 5, "evolucao-clinica.pdf", "Resumo da evolução clínica", true));

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
                                executor.valido(atualizacao(animal, datas, true, animal.status, false, true)),
                                veterinario.id()).id()));
            }
            if (animal.destino != null) {
                executor.garantir(animal.chave() + ":desfecho", "animal_desfecho",
                        () -> veterinario.executar(GESTAO_ESCRITA, () -> animalService.atualizar(id,
                                executor.valido(atualizacao(animal, datas, animal.microchip, animal.destino, true,
                                        !animal.documentoDepois)),
                                veterinario.id()).id()));
            }
            if (animal.documentoDepois) {
                executor.garantir(animal.chave() + ":documento", "animal_transferencia",
                        () -> veterinario.executar(GESTAO_ESCRITA, () -> animalService.atualizar(id,
                                executor.valido(atualizacao(animal, datas, animal.microchip, animal.destino, true,
                                        true)),
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
                Exame corrigido = new Exame(exame.animal(), exame.ordem(), exame.tipo(), exame.laboratorio(),
                        exame.solicitacao(), exame.resultadoEm(),
                        "Discreta eosinofilia; demais parâmetros dentro da referência.", exame.observacoes());
                executor.garantir(exame.chave() + ":retificacao", "exame",
                        () -> criarExame(veterinario, animalId, corrigido, datas, exameId));
            }
        }
        for (Anexo anexo : ANEXOS) {
            if (anexo.animal() != animal.numero) {
                continue;
            }
            byte[] conteudo = anexo.pdf()
                    ? ArquivosFicticios.pdf("SISZOO - documento ficticio de " + animal.nome + " - " + anexo.descricao())
                    : ArquivosFicticios.png(0x4E7D5B + animal.numero * 0x0A0A0A + anexo.ordem() * 0x001533);
            BytesMultipartFile arquivo = new BytesMultipartFile(
                    anexo.nomeArquivo(), anexo.pdf() ? "application/pdf" : "image/png", conteudo);
            executor.garantir(anexo.chave(), "anexo_animal", () -> veterinario.executar(GESTAO_ESCRITA,
                    () -> anexoAnimalService.adicionar(animalId, arquivo, anexo.descricao(), veterinario.id()).id()));
        }
    }

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
                exame.resultado(), exame.observacoes(), retificaId));
        return veterinario.executar(GESTAO_ESCRITA, () -> exameService.criar(request, veterinario.id()).id());
    }

    private CriarAnimalRequest criacao(Animal animal, DatasSeed datas) {
        return new CriarAnimalRequest(animal.nome, animal.especie, animal.sexo, animal.raca, animal.coloracao,
                animal.pelagem, animal.porte, peso(animal), animal.idade, nascimento(animal, datas),
                animal.microchip ? animal.numeroMicrochip() : null,
                animal.esterilizado(), castracao(animal, datas),
                animal.status, animal.motivo, animal.dataEntrada(datas), baiaId(animal),
                ArquivosFicticios.fotoDataUri(animal.foto()), animal.observacoes,
                animal.medalha ? "SEED-" + String.format("%04d", animal.numero) : null,
                animal.medalha && animal.microchip ? datas.diasAtras(animal.diasEntrada) : null,
                animal.procedencia, null, animal.condicoes, animal.condicoesOutras);
    }

    private AtualizarAnimalRequest atualizacao(Animal animal, DatasSeed datas, boolean comMicrochip, String status,
            boolean desfecho, boolean comDocumento) {
        boolean implantadoAgora = animal.microchipDepois && comMicrochip;
        String observacoes = desfecho && animal.destino.startsWith("obito")
                ? "Óbito registrado no prontuário."
                : animal.observacoes;
        return new AtualizarAnimalRequest(animal.nome, animal.especie, animal.sexo, animal.raca, animal.coloracao,
                animal.pelagem, animal.porte, peso(animal), animal.idade, nascimento(animal, datas),
                comMicrochip ? animal.numeroMicrochip() : null,
                animal.esterilizado(), castracao(animal, datas),
                status, animal.motivo, animal.dataEntrada(datas), desfecho ? null : baiaId(animal),
                ArquivosFicticios.fotoDataUri(animal.foto()), observacoes,
                animal.medalha ? "SEED-" + String.format("%04d", animal.numero) : null,
                implantadoAgora ? datas.diasAtras(11)
                        : animal.medalha && animal.microchip ? datas.diasAtras(animal.diasEntrada) : null,
                animal.procedencia, desfecho ? animal.laudo : null, animal.condicoes, animal.condicoesOutras,
                STATUS_TRANSFERIDO.equals(status) ? transferencia(animal, datas, comDocumento) : null,
                desfecho && animal.laudo != null ? EUTANASIA : null);
    }

    /**
     * O documento é o único dado da transferência que pode ser preenchido depois
     * ({@code AnimalService.exigirTransferenciaInalterada}); os demais são imutáveis.
     */
    private static TransferenciaRequest transferencia(Animal animal, DatasSeed datas, boolean comDocumento) {
        String destino = switch (TipoDestinoTransferencia.valueOf(animal.tipoDestino)) {
            case ORGAO_PUBLICO -> "Órgão ambiental estadual (dado fictício do seed)";
            case OUTRO_CCZ -> "CCZ de município vizinho (dado fictício do seed)";
            case OUTRO -> "Clínica veterinária parceira (dado fictício do seed)";
            case ENTIDADE_PROTECAO -> "Abrigo parceiro (dado fictício do seed)";
        };
        String documento = comDocumento ? "Ofício SEED-" + String.format("%03d", animal.numero) : null;
        return new TransferenciaRequest(animal.tipoDestino, destino, datas.entradaHa(1), documento);
    }

    private static LocalDate nascimento(Animal animal, DatasSeed datas) {
        return animal.diasNascimento == null ? null : datas.diasAtras(animal.diasNascimento);
    }

    private UUID baiaId(Animal animal) {
        return animal.baia == null ? null : executor.idObrigatorio(animal.baia);
    }

    private static LocalDate castracao(Animal animal, DatasSeed datas) {
        return animal.diasCastracao == null ? null : datas.diasAtras(animal.diasCastracao);
    }

    private static BigDecimal peso(Animal animal) {
        double base = switch (animal.especie) {
            case "felino" -> 3.6;
            case "pnh" -> 0.35;
            case "quiroptero" -> 0.03;
            default -> switch (animal.porte) {
                case "grande" -> 28.0;
                case "medio" -> 14.0;
                default -> 6.5;
            };
        };
        boolean silvestreLeve = "pnh".equals(animal.especie) || "quiroptero".equals(animal.especie);
        double variacao = silvestreLeve ? 0.01 * (animal.numero % 5) : 0.3 * (animal.numero % 5);
        return BigDecimal.valueOf(base + variacao).setScale(2, RoundingMode.HALF_UP);
    }
}
