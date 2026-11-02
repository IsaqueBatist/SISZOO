package com.siszoo.animais.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.AnexoAnimalConteudo;

public interface AnexoAnimalConteudoRepository extends JpaRepository<AnexoAnimalConteudo, UUID> {
}
