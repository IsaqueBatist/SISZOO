package com.siszoo.processos.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.processos.entity.AnimalAmostrado;

public interface AnimalAmostradoRepository extends JpaRepository<AnimalAmostrado, UUID> {

    // Uma consulta para as amostras com especie, animal e sintomas.
    @EntityGraph(attributePaths = {"especie", "animal", "sintomas"})
    List<AnimalAmostrado> findByProcessoIdOrderByCriadoEmAscIdAsc(UUID processoId);
}
