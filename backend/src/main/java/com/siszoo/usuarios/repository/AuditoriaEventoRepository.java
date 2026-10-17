package com.siszoo.usuarios.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.usuarios.entity.AuditoriaEvento;

public interface AuditoriaEventoRepository extends JpaRepository<AuditoriaEvento, UUID> {

    // T37: mini trilha de auditoria de uma entidade especifica (ex.: um
    // processo sanitario), para quem so tem permissao de leitura do proprio
    // modulo (nao USUARIOS_ACESSO:leitura, que e so do Administrador).
    List<AuditoriaEvento> findByEntidadeAndEntidadeIdOrderByOcorreuEmAsc(String entidade, UUID entidadeId);
}
