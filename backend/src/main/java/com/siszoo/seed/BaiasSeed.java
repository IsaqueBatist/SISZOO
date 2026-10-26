package com.siszoo.seed;

import java.util.List;
import java.util.UUID;

import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.service.BaiaService;

// Baias do seed. A ocupacao final (AnimaisSeed) cobre os estados do relatorio
// e do alerta: Canil Externo B1 fica com 2/2 (baia_superlotada usa >=),
// Canil A2 perto do limite, Canil C9 vazia e desativada.
class BaiasSeed {

    record PlanoBaia(String chave, String nome, String tipo, int capacidade, String finalidade, boolean inativa) {
    }

    static final String CANIL_A1 = "baia:01";
    static final String CANIL_A2 = "baia:02";
    static final String CANIL_EXTERNO_B1 = "baia:03";
    static final String GATIL_G1 = "baia:04";
    static final String QUARENTENA_Q1 = "baia:05";
    static final String CANIL_C9 = "baia:06";

    static final List<PlanoBaia> PLANO = List.of(
            new PlanoBaia(CANIL_A1, "Canil A1", "interna", 8, "Adoção", false),
            new PlanoBaia(CANIL_A2, "Canil A2", "interna", 4, "Tratamento clínico", false),
            new PlanoBaia(CANIL_EXTERNO_B1, "Canil Externo B1", "externa", 2, "Cães de grande porte", false),
            new PlanoBaia(GATIL_G1, "Gatil G1", "gatil", 8, "Felinos", false),
            new PlanoBaia(QUARENTENA_Q1, "Quarentena Q1", "interna", 3, "Quarentena", false),
            new PlanoBaia(CANIL_C9, "Canil C9", "externa", 4, "Reserva", true));

    private final SeedExecutor executor;
    private final BaiaService baiaService;

    BaiasSeed(SeedExecutor executor, BaiaService baiaService) {
        this.executor = executor;
        this.baiaService = baiaService;
    }

    void executar(UsuariosSeed.Atores atores) {
        SeedAtor admin = atores.admin();
        for (PlanoBaia plano : PLANO) {
            CriarBaiaRequest request = executor.valido(new CriarBaiaRequest(
                    plano.nome(), plano.tipo(), (short) plano.capacidade(), plano.finalidade(), null));
            UUID id = executor.garantir(plano.chave(), "baia",
                    () -> admin.executar("GESTAO_ANIMAIS:escrita", () -> baiaService.criar(request, admin.id()).id()));
            if (plano.inativa()) {
                executor.garantir(plano.chave() + ":inativa", "baia_status", () -> admin.executar(
                        "GESTAO_ANIMAIS:escrita", () -> baiaService.alterarStatus(
                                id, executor.valido(new AtualizarStatusBaiaRequest(false)), admin.id()).id()));
            }
        }
    }
}
