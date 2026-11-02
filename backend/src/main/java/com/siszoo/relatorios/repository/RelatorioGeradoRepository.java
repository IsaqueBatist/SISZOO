package com.siszoo.relatorios.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.relatorios.entity.RelatorioGerado;

public interface RelatorioGeradoRepository extends JpaRepository<RelatorioGerado, UUID> {

    @Override
    @EntityGraph(attributePaths = {"geradoPor"})
    Page<RelatorioGerado> findAll(Pageable pageable);
}
