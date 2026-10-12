package com.siszoo.processos.entity;

import java.util.Optional;

// Ordem de declaracao = ordem de avanco (D18): so se avanca um passo por vez.
public enum StatusProcesso {
    ABERTO,
    AGUARDANDO_RESULTADO,
    COM_RESULTADO,
    CONCLUIDO;

    public Optional<StatusProcesso> proximo() {
        StatusProcesso[] valores = values();
        return ordinal() + 1 < valores.length ? Optional.of(valores[ordinal() + 1]) : Optional.empty();
    }
}
