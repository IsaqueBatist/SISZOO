package com.siszoo.usuarios.entity;

import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCargoId implements Serializable {

    private UUID usuarioId;

    private UUID cargoId;
}
