package com.siszoo.animais.clinico.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.clinico.entity.TipoExame;

public interface TipoExameRepository extends JpaRepository<TipoExame, UUID> {

    Optional<TipoExame> findByCodigo(String codigo);

    List<TipoExame> findByAtivoTrueOrderByNomeAsc();
}
