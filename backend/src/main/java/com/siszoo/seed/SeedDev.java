package com.siszoo.seed;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

// Orquestrador do seed de dados ficticios (docs/decisoes/seed-dev.md). Roda
// no ApplicationReadyEvent, depois do DataSeeder (CommandLineRunner) ter
// criado o admin bootstrap, e pode ser chamado de novo (executar) pelos testes.
// Cada fase so cria o que ainda nao tem chave em seed_controle.
public class SeedDev {

    private static final Logger log = LoggerFactory.getLogger(SeedDev.class);
    private static final List<String> CACHES_DO_DASHBOARD = List.of("dashboardKpis", "dashboardGraficos");

    private final Environment environment;
    private final SeedExecutor executor;
    private final UsuariosSeed usuarios;
    private final CatalogoClinicoSeed catalogoClinico;
    private final BaiasSeed baias;
    private final AnimaisSeed animais;
    private final OcorrenciasSeed ocorrencias;
    private final ProcessosSeed processos;
    private final RelatoriosSeed relatorios;
    private final ObjectProvider<CacheManager> cacheManager;
    private final boolean executarNaSubida;
    private volatile ResumoSeed ultimoResumo;

    SeedDev(Environment environment, SeedExecutor executor, UsuariosSeed usuarios, CatalogoClinicoSeed catalogoClinico,
            BaiasSeed baias, AnimaisSeed animais, OcorrenciasSeed ocorrencias, ProcessosSeed processos,
            RelatoriosSeed relatorios, ObjectProvider<CacheManager> cacheManager,
            @Value("${siszoo.seed.executar-na-subida:true}") boolean executarNaSubida) {
        this.environment = environment;
        this.executor = executor;
        this.usuarios = usuarios;
        this.catalogoClinico = catalogoClinico;
        this.baias = baias;
        this.animais = animais;
        this.ocorrencias = ocorrencias;
        this.processos = processos;
        this.relatorios = relatorios;
        this.cacheManager = cacheManager;
        this.executarNaSubida = executarNaSubida;
    }

    @EventListener(ApplicationReadyEvent.class)
    void aoSubir() {
        if (executarNaSubida) {
            executar();
        }
    }

    public ResumoSeed ultimoResumo() {
        return ultimoResumo;
    }

    public synchronized ResumoSeed executar() {
        SeedDevGuarda.verificar(environment);
        verificarBanco();
        executor.criarTabelaDeControle();
        executor.zerarContagem();

        UsuariosSeed.Atores atores = usuarios.executar();
        catalogoClinico.executar(atores);
        baias.executar(atores);
        animais.executar(atores);
        ocorrencias.executar(atores);
        processos.executar(atores);
        relatorios.executar(atores);

        limparCachesDoDashboard();
        ResumoSeed resumo = executor.resumo();
        ultimoResumo = resumo;
        log.info("Seed de dados ficticios concluido ({}). Usuarios: {} (senha unica documentada no README).",
                resumo, UsuariosSeed.PLANO.stream().map(UsuariosSeed.PlanoUsuario::email).toList());
        return resumo;
    }

    // Guarda de banco (SD-1), antes de qualquer escrita: num banco sem
    // seed_controle, so roda se nao houver dado de dominio — nada alem do
    // admin bootstrap. Assim o seed nunca mistura registros ficticios com
    // dados de quem ja usa o banco. E o inverso: seed_controle existe mas
    // esta vazia enquanto ha usuarios do seed (tabela limpa a mao).
    private void verificarBanco() {
        if (!executor.tabelaDeControleExiste()) {
            long registrosDeDominio = executor.contar("SELECT count(*) FROM animal")
                    + executor.contar("SELECT count(*) FROM ocorrencia")
                    + executor.contar("SELECT count(*) FROM processo_sanitario")
                    + executor.contar("SELECT count(*) FROM usuario WHERE lower(email) <> lower(?)",
                            usuarios.emailAdminBootstrap());
            if (registrosDeDominio > 0) {
                throw new IllegalStateException("Seed de dados ficticios recusado: o banco ja contem dados que nao"
                        + " vieram do seed (" + registrosDeDominio + " registro(s) de animal, ocorrencia, processo"
                        + " ou usuario alem do admin inicial). O seed so roda em banco vazio ou ja semeado por ele;"
                        + " recrie o banco de desenvolvimento.");
            }
            return;
        }
        if (executor.registrosNoControle() == 0
                && executor.contar("SELECT count(*) FROM usuario WHERE email LIKE ?",
                        "%" + UsuariosSeed.SUFIXO_EMAIL) > 0) {
            throw new IllegalStateException("Seed de dados ficticios recusado: seed_controle esta vazia, mas o banco"
                    + " tem usuarios do seed. A tabela de controle nao pode ser limpa; recrie o banco de"
                    + " desenvolvimento.");
        }
    }

    private void limparCachesDoDashboard() {
        CacheManager caches = cacheManager.getIfAvailable();
        if (caches == null) {
            return;
        }
        for (String nome : CACHES_DO_DASHBOARD) {
            Cache cache = caches.getCache(nome);
            if (cache != null) {
                cache.clear();
            }
        }
    }
}
