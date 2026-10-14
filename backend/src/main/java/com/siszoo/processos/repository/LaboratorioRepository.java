package com.siszoo.processos.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.Laboratorio;

public interface LaboratorioRepository extends JpaRepository<Laboratorio, UUID> {

    Optional<Laboratorio> findByCodigo(String codigo);

    List<Laboratorio> findByAtivoTrueOrderByNomeAsc();
}
