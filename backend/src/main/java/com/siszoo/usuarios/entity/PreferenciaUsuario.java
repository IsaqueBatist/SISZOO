package com.siszoo.usuarios.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "preferencia_usuario")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PreferenciaUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TemaUsuario tema = TemaUsuario.LIGHT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private DensidadeUsuario densidade = DensidadeUsuario.NORMAL;

    @Column(name = "notif_alertas_criticos", nullable = false)
    private boolean notifAlertasCriticos = true;

    @Column(name = "notif_vacina_vencendo", nullable = false)
    private boolean notifVacinaVencendo = true;

    @Column(name = "notif_superlotacao", nullable = false)
    private boolean notifSuperlotacao = true;

    @Column(name = "notif_resultado_lab", nullable = false)
    private boolean notifResultadoLab = true;

    @Column(name = "notif_email_diario", nullable = false)
    private boolean notifEmailDiario = false;
}
