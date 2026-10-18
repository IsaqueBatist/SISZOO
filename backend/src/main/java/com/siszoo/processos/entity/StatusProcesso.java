package com.siszoo.processos.entity;

import java.util.Optional;

// Ordem de declaracao = ordem de avanco (D18, T34): so se avanca um passo por
// vez, sem volta. CONCLUIDO e terminal. COM_RESULTADO so e alcancado pelo
// registro do resultado laboratorial, nunca pelo avanco manual de status.
public enum StatusProcesso {
    ABERTO,
    AGUARDANDO_RESULTADO,
    COM_RESULTADO,
    CONCLUIDO;

    public Optional<StatusProcesso> proximo() {
        StatusProcesso[] valores = values();
        return ordinal() + 1 < valores.length ? Optional.of(valores[ordinal() + 1]) : Optional.empty();
    }

    public boolean podeTransicionarPara(StatusProcesso destino) {
        return proximo().filter(destino::equals).isPresent();
    }

    public boolean exigeResultado() {
        return this == COM_RESULTADO;
    }
}
