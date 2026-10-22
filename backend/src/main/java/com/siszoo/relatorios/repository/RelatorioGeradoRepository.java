package com.siszoo.relatorios.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.relatorios.entity.RelatorioGerado;

// Sem metodo de update/delete: cada exportacao grava uma linha nova (nunca se
// corrige um relatorio ja gerado — "Gerar novamente" no historico cria outro
// doc_id). geradoPor e carregado via EntityGraph para o historico paginado
// nao sofrer N+1 (um SELECT extra por linha so para o nome de quem gerou).
public interface RelatorioGeradoRepository extends JpaRepository<RelatorioGerado, UUID> {

    @Override
    @EntityGraph(attributePaths = {"geradoPor"})
    Page<RelatorioGerado> findAll(Pageable pageable);
}
