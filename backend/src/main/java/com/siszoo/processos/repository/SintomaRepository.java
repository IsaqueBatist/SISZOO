package com.siszoo.processos.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.Sintoma;

public interface SintomaRepository extends JpaRepository<Sintoma, UUID> {

    List<Sintoma> findByCodigoIn(Collection<String> codigos);

    List<Sintoma> findByAtivoTrueOrderByNomeAsc();
}
