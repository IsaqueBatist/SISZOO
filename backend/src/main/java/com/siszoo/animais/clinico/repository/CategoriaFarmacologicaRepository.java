package com.siszoo.animais.clinico.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;

public interface CategoriaFarmacologicaRepository extends JpaRepository<CategoriaFarmacologica, UUID> {
}
