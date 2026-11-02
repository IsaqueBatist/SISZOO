package com.siszoo.ocorrencias;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.hibernate.resource.jdbc.spi.StatementInspector;

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
