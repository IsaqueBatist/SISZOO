package com.siszoo.animais.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.siszoo.animais.dto.AnexoAnimalResponse;
import com.siszoo.animais.entity.AnexoAnimal;
import com.siszoo.animais.entity.AnexoAnimalConteudo;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnexoAnimalInvalidoException;
import com.siszoo.animais.exception.AnexoAnimalNaoEncontradoException;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.exception.LimiteAnexosAnimalAtingidoException;
import com.siszoo.animais.repository.AnexoAnimalConteudoRepository;
import com.siszoo.animais.repository.AnexoAnimalRepository;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.anexo.ConteudoAnexo;
import com.siszoo.comum.dto.ArquivoAnexo;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

// F2-007 / RF-A04 (Fase 3 do TG): documentos e fotos anexados ao animal
// (Quadro 69). Mesmas regras dos anexos de ocorrencia (OcorrenciaService):
// JPG/PNG/PDF detectados pelos bytes, ate 5 MB, ate 10 por animal, conteudo em
// tabela propria (D9) e auditoria CRIACAO. Anexo nao se altera nem se exclui
// (RN06: faz parte do historico do animal).
@Service
public class AnexoAnimalService {

    static final int MAXIMO_ANEXOS = 10;
    private static final String ENTIDADE_AUDITORIA = "anexo_animal";

    private final AnimalRepository animalRepository;
    private final AnexoAnimalRepository anexoRepository;
    private final AnexoAnimalConteudoRepository conteudoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaEventoService auditoriaEventoService;

    public AnexoAnimalService(
            AnimalRepository animalRepository,
            AnexoAnimalRepository anexoRepository,
            AnexoAnimalConteudoRepository conteudoRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaEventoService auditoriaEventoService) {
        this.animalRepository = animalRepository;
        this.anexoRepository = anexoRepository;
        this.conteudoRepository = conteudoRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @Transactional(readOnly = true)
    public List<AnexoAnimalResponse> listar(UUID animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new AnimalNaoEncontradoException();
        }
        return anexoRepository.findByAnimalIdOrderByCriadoEmAsc(animalId).stream().map(AnexoAnimalService::toResponse).toList();
    }

    @Transactional
    public AnexoAnimalResponse adicionar(UUID animalId, MultipartFile arquivo, String descricao, UUID usuarioAutenticadoId) {
        Animal animal = animalRepository.findById(animalId).orElseThrow(AnimalNaoEncontradoException::new);
        Usuario autor = usuarioRepository.findById(usuarioAutenticadoId).orElseThrow(UsuarioNaoEncontradoException::new);
        ConteudoAnexo.Validado validado = ConteudoAnexo.validar(arquivo, AnexoAnimalInvalidoException::new);
        byte[] conteudo = validado.conteudo();
        String mimeType = validado.mimeType();
        if (anexoRepository.countByAnimalId(animalId) >= MAXIMO_ANEXOS) {
            throw new LimiteAnexosAnimalAtingidoException();
        }

        AnexoAnimal anexo = new AnexoAnimal();
        anexo.setAnimal(animal);
        anexo.setNome(ConteudoAnexo.nomeDoArquivo(arquivo.getOriginalFilename()));
        anexo.setMimeType(mimeType);
        anexo.setTamanho(conteudo.length);
        anexo.setDescricao(StringUtils.hasText(descricao) ? descricao.trim() : null);
        anexo.setCriadoPor(autor);
        anexoRepository.save(anexo);

        AnexoAnimalConteudo registroConteudo = new AnexoAnimalConteudo();
        registroConteudo.setAnexo(anexo);
        registroConteudo.setConteudo(conteudo);
        conteudoRepository.save(registroConteudo);

        AnexoAnimalResponse response = toResponse(anexo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, anexo.getId(), null, response);
        return response;
    }

    @Transactional(readOnly = true)
    public ArquivoAnexo baixar(UUID animalId, UUID anexoId) {
        AnexoAnimal anexo = anexoRepository.findByIdAndAnimalId(anexoId, animalId)
                .orElseThrow(AnexoAnimalNaoEncontradoException::new);
        AnexoAnimalConteudo conteudo = conteudoRepository.findById(anexo.getId())
                .orElseThrow(AnexoAnimalNaoEncontradoException::new);
        return new ArquivoAnexo(anexo.getNome(), anexo.getMimeType(), conteudo.getConteudo());
    }

    private static AnexoAnimalResponse toResponse(AnexoAnimal anexo) {
        Usuario autor = anexo.getCriadoPor();
        return new AnexoAnimalResponse(anexo.getId(), anexo.getAnimal().getId(), anexo.getNome(), anexo.getMimeType(),
                anexo.getTamanho(), anexo.getDescricao(), autor == null ? null : autor.getId(),
                autor == null ? null : autor.nomeCompleto(), anexo.getCriadoEm());
    }
}
