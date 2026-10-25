package com.siszoo.seed;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.siszoo.animais.clinico.dto.CriarCategoriaFarmacologicaRequest;
import com.siszoo.animais.clinico.dto.CriarMedicamentoRequest;
import com.siszoo.animais.clinico.service.CategoriaFarmacologicaService;
import com.siszoo.animais.clinico.service.MedicamentoService;

// Categorias farmacologicas e medicamentos (nenhuma migration os semeia: V5
// so cria as tabelas). Um medicamento inativo exercita o filtro ?ativo=true
// do modal de prescricao.
class CatalogoClinicoSeed {

    record PlanoMedicamento(String chave, String nome, String categoria, boolean inativo) {
    }

    static final List<String> CATEGORIAS = List.of(
            "Antibióticos", "Antiparasitários", "Anti-inflamatórios", "Analgésicos");

    static final List<PlanoMedicamento> MEDICAMENTOS = List.of(
            new PlanoMedicamento("medicamento:01", "Amoxicilina 250 mg", "Antibióticos", false),
            new PlanoMedicamento("medicamento:02", "Doxiciclina 100 mg", "Antibióticos", false),
            new PlanoMedicamento("medicamento:03", "Metronidazol 250 mg", "Antibióticos", false),
            new PlanoMedicamento("medicamento:04", "Ivermectina 1%", "Antiparasitários", false),
            new PlanoMedicamento("medicamento:05", "Meloxicam 0,2%", "Anti-inflamatórios", false),
            new PlanoMedicamento("medicamento:06", "Prednisolona 20 mg", "Anti-inflamatórios", false),
            new PlanoMedicamento("medicamento:07", "Dipirona 500 mg", "Analgésicos", false),
            new PlanoMedicamento("medicamento:08", "Tramadol 50 mg", "Analgésicos", true));

    private final SeedExecutor executor;
    private final CategoriaFarmacologicaService categoriaService;
    private final MedicamentoService medicamentoService;

    CatalogoClinicoSeed(SeedExecutor executor, CategoriaFarmacologicaService categoriaService,
            MedicamentoService medicamentoService) {
        this.executor = executor;
        this.categoriaService = categoriaService;
        this.medicamentoService = medicamentoService;
    }

    static String chaveCategoria(String nome) {
        return "categoria:" + nome;
    }

    void executar(UsuariosSeed.Atores atores) {
        SeedAtor veterinario = atores.veterinario(0);
        for (String nome : CATEGORIAS) {
            executor.garantir(chaveCategoria(nome), "categoria_farmacologica",
                    () -> categoriaPorNome(nome),
                    () -> veterinario.executar("GESTAO_ANIMAIS:escrita", () -> categoriaService
                            .criar(executor.valido(new CriarCategoriaFarmacologicaRequest(nome))).id()));
        }
        for (PlanoMedicamento plano : MEDICAMENTOS) {
            UUID categoriaId = executor.idObrigatorio(chaveCategoria(plano.categoria()));
            UUID id = executor.garantir(plano.chave(), "medicamento",
                    () -> veterinario.executar("GESTAO_ANIMAIS:escrita", () -> medicamentoService
                            .criar(executor.valido(new CriarMedicamentoRequest(plano.nome(), categoriaId))).id()));
            if (plano.inativo()) {
                // Desativar exige GESTAO_ANIMAIS:exclusao: so o Administrador.
                executor.garantir(plano.chave() + ":inativo", "medicamento_status", () -> atores.admin()
                        .executar("GESTAO_ANIMAIS:exclusao", () -> medicamentoService.desativar(id).id()));
            }
        }
    }

    private Optional<UUID> categoriaPorNome(String nome) {
        return executor.idPorConsulta("SELECT id FROM categoria_farmacologica WHERE lower(nome) = lower(?)", nome);
    }
}
