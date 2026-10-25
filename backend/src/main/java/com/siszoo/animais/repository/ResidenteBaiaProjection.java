package com.siszoo.animais.repository;

import java.util.UUID;

public interface ResidenteBaiaProjection {

    UUID getBaiaId();

    UUID getId();

    String getNome();

    String getFotoMiniatura();
}
