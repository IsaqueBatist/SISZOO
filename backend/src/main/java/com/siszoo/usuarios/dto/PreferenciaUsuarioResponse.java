package com.siszoo.usuarios.dto;

import com.siszoo.usuarios.entity.DensidadeUsuario;
import com.siszoo.usuarios.entity.TemaUsuario;

public record PreferenciaUsuarioResponse(
        TemaUsuario tema,
        DensidadeUsuario densidade,
        boolean notifAlertasCriticos,
        boolean notifVacinaVencendo,
        boolean notifSuperlotacao,
        boolean notifResultadoLab,
        boolean notifEmailDiario) {
}
