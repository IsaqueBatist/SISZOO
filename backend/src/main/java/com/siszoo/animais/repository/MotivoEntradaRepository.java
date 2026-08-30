package com.siszoo.animais.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.MotivoEntrada;

public interface MotivoEntradaRepository extends JpaRepository<MotivoEntrada, UUID> {

    Optional<MotivoEntrada> findByCodigo(String codigo);
}
