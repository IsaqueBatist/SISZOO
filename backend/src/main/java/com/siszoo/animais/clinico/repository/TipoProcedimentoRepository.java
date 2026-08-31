package com.siszoo.animais.clinico.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.clinico.entity.TipoProcedimento;

public interface TipoProcedimentoRepository extends JpaRepository<TipoProcedimento, UUID> {

    Optional<TipoProcedimento> findByCodigo(String codigo);
}
