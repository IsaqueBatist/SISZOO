package com.siszoo.usuarios.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.usuarios.entity.Cargo;

public interface CargoRepository extends JpaRepository<Cargo, UUID> {

    Optional<Cargo> findByNome(String nome);
}
