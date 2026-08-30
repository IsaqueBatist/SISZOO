package com.siszoo.usuarios.dto;

import com.siszoo.usuarios.entity.DensidadeUsuario;
import com.siszoo.usuarios.entity.TemaUsuario;

import jakarta.validation.constraints.NotNull;

public record PreferenciaUsuarioRequest(
        @NotNull
        TemaUsuario tema,

        @NotNull
        DensidadeUsuario densidade,

        @NotNull
        Boolean notifAlertasCriticos,

        @NotNull
        Boolean notifVacinaVencendo,

        @NotNull
        Boolean notifSuperlotacao,

        @NotNull
        Boolean notifResultadoLab,

        @NotNull
        Boolean notifEmailDiario) {
}
