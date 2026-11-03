package com.siszoo.seed;

import java.util.List;
import java.util.UUID;

import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.service.BaiaService;

class BaiasSeed {

    record PlanoBaia(String chave, String nome, String tipo, int capacidade, String finalidade, boolean inativa) {
    }

    static final String CANIL_A1 = "baia:01";
    static final String CANIL_A2 = "baia:02";
    static final String CANIL_EXTERNO_B1 = "baia:03";
    static final String GATIL_G1 = "baia:04";
    static final String QUARENTENA_Q1 = "baia:05";
    static final String CANIL_C9 = "baia:06";
    static final String ISOLAMENTO_I1 = "baia:07";
    static final String CANIL_A3 = "baia:08";
    static final String GATIL_G2 = "baia:09";

    static final List<PlanoBaia> PLANO = List.of(
            new PlanoBaia(CANIL_A1, "Canil A1", "interna", 8, "Adoção", false),
            new PlanoBaia(CANIL_A2, "Canil A2", "interna", 4, "Tratamento clínico", false),
            new PlanoBaia(CANIL_EXTERNO_B1, "Canil Externo B1", "externa", 2, "Cães de grande porte", false),
            new PlanoBaia(GATIL_G1, "Gatil G1", "gatil", 8, "Felinos", false),
            new PlanoBaia(QUARENTENA_Q1, "Quarentena Q1", "interna", 3, "Quarentena", false),
            new PlanoBaia(CANIL_C9, "Canil C9", "externa", 4, "Reserva", true),
            // As seis baias acima não têm vaga para os animais novos sem virar superlotada e
            // desfigurar os indicadores de ocupação. Silvestres (quirópteros e primatas) também não
            // dividem recinto com cães e gatos: o isolamento é o destino real desses animais.
            new PlanoBaia(ISOLAMENTO_I1, "Isolamento I1", "interna", 4, "Animais silvestres em observação", false),
            new PlanoBaia(CANIL_A3, "Canil A3", "interna", 8, "Adoção", false),
            new PlanoBaia(GATIL_G2, "Gatil G2", "gatil", 6, "Felinos", false));

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
