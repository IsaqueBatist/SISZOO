package com.siszoo.animais.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siszoo.animais.entity.Animal;

public interface AnimalRepository extends JpaRepository<Animal, UUID> {
}
