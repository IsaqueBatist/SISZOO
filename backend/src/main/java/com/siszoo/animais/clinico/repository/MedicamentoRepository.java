package com.siszoo.animais.clinico.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.clinico.entity.Medicamento;

public interface MedicamentoRepository extends JpaRepository<Medicamento, UUID> {
}
