package com.siszoo.usuarios.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.usuarios.entity.CargoPermissao;

public interface CargoPermissaoRepository extends JpaRepository<CargoPermissao, UUID> {
}
