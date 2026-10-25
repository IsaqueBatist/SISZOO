package com.siszoo.seed;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.usuarios.service.PoliticaSenha;

// Coerencia das tabelas-plano do seed sem subir banco: o que os services
// recusariam no meio da execucao falha aqui primeiro.
class SeedPlanoTest {

    private static final Pattern EMAIL_INSTITUCIONAL = Pattern.compile("^[a-z.]+@itu\\.sp\\.gov\\.br$");

    @Test
    void usuariosTemEmailInstitucionalESenhaDentroDaPolitica() {
        for (UsuariosSeed.PlanoUsuario usuario : UsuariosSeed.PLANO) {
            assertThat(usuario.email()).as(usuario.chave()).matches(EMAIL_INSTITUCIONAL);
            assertThat(PoliticaSenha.violacao(UsuariosSeed.SENHA_FICTICIA, usuario.email(), usuario.nome(),
                    usuario.sobrenome())).as(usuario.chave()).isEmpty();
            assertThat(usuario.cargo().equals(UsuariosSeed.VETERINARIO)).isEqualTo(usuario.crmv() != null);
        }
    }

    @Test
    void ocupacaoFinalCabeNasBaiasEUmaFicaLotada() {
        Map<String, Long> ocupacao = AnimaisSeed.PLANO.stream()
                .filter(a -> a.destino == null && a.baia != null)
                .collect(Collectors.groupingBy(a -> a.baia, Collectors.counting()));
        for (BaiasSeed.PlanoBaia baia : BaiasSeed.PLANO) {
            long ocupada = ocupacao.getOrDefault(baia.chave(), 0L);
            assertThat(ocupada).as(baia.nome()).isLessThanOrEqualTo(baia.capacidade());
            if (baia.inativa()) {
                assertThat(ocupada).as(baia.nome()).isZero();
            }
        }
        assertThat(ocupacao.get(BaiasSeed.CANIL_EXTERNO_B1)).isEqualTo(2L);
    }

    @Test
    void laudoSoNaEutanasiaEAnimaisForaDaCustodiaVemPrimeiro() {
        boolean jaApareceuSobCustodia = false;
        for (AnimaisSeed.Animal animal : AnimaisSeed.PLANO) {
            assertThat(animal.laudo != null).as(animal.chave()).isEqualTo("obito_eutanasia".equals(animal.destino));
            if (animal.destino == null) {
                jaApareceuSobCustodia = true;
            } else {
                assertThat(jaApareceuSobCustodia).as("fora da custodia depois de um sob custodia: " + animal.chave())
                        .isFalse();
            }
            if (animal.diasCastracao != null) {
                assertThat(animal.diasCastracao).as(animal.chave()).isLessThanOrEqualTo(animal.diasEntrada);
            }
        }
    }

    @Test
    void prescricoesConcluidasTemTerminoReal() {
        for (AnimaisSeed.Prescricao prescricao : AnimaisSeed.PRESCRICOES) {
            if (prescricao.status() == StatusPrescricao.CONCLUIDA) {
                assertThat(prescricao.fimReal()).as(prescricao.chave()).isNotNull();
            }
            if (prescricao.fimPrevisto() != null) {
                assertThat(prescricao.fimPrevisto()).isGreaterThanOrEqualTo(prescricao.inicio());
            }
        }
    }

    @Test
    void processosRespeitamResultadoSigiloEAmostras() {
        for (ProcessosSeed.Processo processo : ProcessosSeed.PLANO) {
            boolean temResultado = processo.status() == StatusProcesso.COM_RESULTADO
                    || processo.status() == StatusProcesso.CONCLUIDO;
            assertThat(processo.resultado() != null).as(processo.chave()).isEqualTo(temResultado);
            // V21: positivo e definitivo. Correcao so em COM_RESULTADO.
            if (processo.retificacao() != null) {
                assertThat(processo.resultado()).isNotEqualTo("positivo");
                assertThat(processo.status()).isEqualTo(StatusProcesso.COM_RESULTADO);
            }
            if (processo.notificavel()) {
                assertThat(ProcessosSeed.responsavel(processo).email()).as(processo.chave()).isNull();
            }
            for (ProcessosSeed.Amostra amostra : processo.amostras()) {
                if (!amostra.sintomas().isEmpty()) {
                    assertThat(amostra.statusClinico()).isEqualTo(StatusClinicoAmostra.SINTOMATICO);
                }
                assertThat(amostra.contato() != null).isEqualTo(amostra.agrediu() != null);
                if (amostra.animalCanil() == null) {
                    assertThat(amostra.especie()).isNotBlank();
                    assertThat(amostra.sexo()).isNotBlank();
                }
            }
        }
    }

    @Test
    void ocorrenciasVinculadasBatemComOsProcessos() {
        Map<Integer, ProcessosSeed.Processo> porOcorrencia = ProcessosSeed.PLANO.stream()
                .filter(p -> p.ocorrencia() != null)
                .collect(Collectors.toMap(ProcessosSeed.Processo::ocorrencia, p -> p));
        for (OcorrenciasSeed.Ocorrencia ocorrencia : OcorrenciasSeed.PLANO) {
            ProcessosSeed.Processo processo = porOcorrencia.get(ocorrencia.numero());
            switch (ocorrencia.destino()) {
                case VINCULADA -> assertThat(processo.status()).isEqualTo(StatusProcesso.CONCLUIDO);
                case VINCULADA_PENDENTE -> assertThat(processo.status()).isNotEqualTo(StatusProcesso.CONCLUIDO);
                default -> assertThat(processo).as(ocorrencia.chave()).isNull();
            }
            // D32: anonima nao tem denunciante; identificada exige o nome (D19).
            switch (ocorrencia.sigilo()) {
                case ANONIMA -> assertThat(ocorrencia.denunciante()).isNull();
                case IDENTIFICADA, SIGILOSA -> assertThat(ocorrencia.denunciante()).isNotBlank();
            }
        }
    }

    @Test
    void chavesSaoUnicas() {
        List<String> chaves = new ArrayList<>();
        UsuariosSeed.PLANO.forEach(u -> chaves.add(u.chave()));
        BaiasSeed.PLANO.forEach(b -> chaves.add(b.chave()));
        CatalogoClinicoSeed.MEDICAMENTOS.forEach(m -> chaves.add(m.chave()));
        AnimaisSeed.PLANO.forEach(a -> chaves.add(a.chave()));
        AnimaisSeed.VACINAS.forEach(v -> chaves.add(v.chave()));
        AnimaisSeed.PLANO.forEach(a -> AnimaisSeed.procedimentosDo(a).forEach(p -> chaves.add(p.chave())));
        AnimaisSeed.PRESCRICOES.forEach(p -> chaves.add(p.chave()));
        AnimaisSeed.EXAMES.forEach(e -> chaves.add(e.chave()));
        OcorrenciasSeed.PLANO.forEach(o -> chaves.add(o.chave()));
        ProcessosSeed.PLANO.forEach(p -> chaves.add(p.chave()));
        RelatoriosSeed.PLANO.forEach(r -> chaves.add(r.chave()));

        assertThat(chaves).doesNotHaveDuplicates();
    }
}
