package com.siszoo.animais.dto;

import java.util.UUID;

// GET /api/baias/residentes (T45): o minimo do card de residentes da Gestao de
// Baias. fotoUrl e a miniatura (avatar), como na listagem de animais.
public record ResidenteBaiaResponse(UUID baiaId, UUID id, String nome, String fotoUrl) {
}
