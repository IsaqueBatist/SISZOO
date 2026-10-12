package com.siszoo.ocorrencias;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.hibernate.resource.jdbc.spi.StatementInspector;

// Registra todo SQL emitido pelo Hibernate, para AnexoOcorrenciaQueriesIT
// verificar quais tabelas cada endpoint consulta. So existe no contexto de
// teste que o configura (hibernate.session_factory.statement_inspector).
public class SqlCapturado implements StatementInspector {

    private static final List<String> COMANDOS = new CopyOnWriteArrayList<>();

    @Override
    public String inspect(String sql) {
        COMANDOS.add(sql);
        return sql;
    }

    public static void limpar() {
        COMANDOS.clear();
    }

    public static List<String> comandos() {
        return List.copyOf(COMANDOS);
    }
}
