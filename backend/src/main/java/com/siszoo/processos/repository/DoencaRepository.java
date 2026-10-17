package com.siszoo.processos.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.Doenca;

public interface DoencaRepository extends JpaRepository<Doenca, UUID> {

    Optional<Doenca> findByCodigo(String codigo);

    List<Doenca> findByAtivoTrueOrderByNomeAsc();
}
