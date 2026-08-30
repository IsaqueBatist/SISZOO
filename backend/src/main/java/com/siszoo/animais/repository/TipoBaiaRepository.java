package com.siszoo.animais.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.TipoBaia;

public interface TipoBaiaRepository extends JpaRepository<TipoBaia, UUID> {

    Optional<TipoBaia> findByCodigo(String codigo);
}
