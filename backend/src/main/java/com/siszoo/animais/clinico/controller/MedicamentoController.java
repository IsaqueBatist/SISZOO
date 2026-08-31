package com.siszoo.animais.clinico.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.clinico.dto.AtualizarMedicamentoRequest;
import com.siszoo.animais.clinico.dto.CriarMedicamentoRequest;
import com.siszoo.animais.clinico.dto.MedicamentoResponse;
import com.siszoo.animais.clinico.service.MedicamentoService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/medicamentos")
public class MedicamentoController {

    private final MedicamentoService medicamentoService;

    public MedicamentoController(MedicamentoService medicamentoService) {
        this.medicamentoService = medicamentoService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<MedicamentoResponse> listar(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) UUID categoriaId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return medicamentoService.listar(ativo, categoriaId, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public MedicamentoResponse buscarPorId(@PathVariable UUID id) {
        return medicamentoService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public MedicamentoResponse criar(@Valid @RequestBody CriarMedicamentoRequest request) {
        return medicamentoService.criar(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public MedicamentoResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarMedicamentoRequest request) {
        return medicamentoService.atualizar(id, request);
    }

    /**
     * Executa soft-delete: marca o medicamento como inativo ({@code ativo=false}).
     * A linha nunca e removida fisicamente (mesmo padrao de
     * {@code BaiaController#desativar}). Diferente de Baia, esta versao nao tem
     * endpoint de reativacao — ver "Registro" no relatorio desta tarefa.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:exclusao')")
    public MedicamentoResponse desativar(@PathVariable UUID id) {
        return medicamentoService.desativar(id);
    }
}
