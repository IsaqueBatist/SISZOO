# Transcrição – Figuras 7 a 11 (DER conceitual, brModelo)

Notação: retângulo = entidade; losango = relacionamento; círculo preenchido = identificador; círculo tracejado = atributo opcional; (min,max) junto à entidade. O documento (1.12/4.2) não explicita a convenção de leitura da cardinalidade; aqui transcrevo a posição literal ("(x,y) junto a E").

## Figura 7 – DER M1: Usuários e Acesso (image7.png, 1096×722) – legível
- Usuario: id (ident.), email, senha, nome, sobrenome, crmv (opc.), telefone (opc.), ativo, ultimo_acesso (opc.), criado_em, senha_alterada_em (opc.), desativado_em (opc.), data_modificacao.
- **Sessao**: id, token_hash, ip (opc.), user_agent (opc.), criada_em, expira_em, encerrada_em (opc.). Relacionamento "abre": (0,1) junto a Usuario, (0,n) junto a Sessao.
- PreferenciaUsuario: id, tema, densidade, notif_alertas_criticos, notif_vacina_vencendo, notif_superlotacao, notif_resultado_lab, notif_email_diario. Relacionamento "configura": (0,1) junto a PreferenciaUsuario.
- Cargo: id, nome, descricao (opc.). Relacionamento "tem" desenhado como entidade associativa **UsuarioCargo** com atributo adicionado_em; cardinalidades (0,n) e (1,1) junto a Usuario, (0,n) junto a Cargo.
- **CargoPermissao** desenhado como entidade associativa sobre relacionamento "concede" com atributos modulo, feature, leitura, escrita, exclusao; ligado a Cargo e a uma linha que parte de Usuario (0,1) – ligação ambígua (ver limitações).
- AuditoriaEvento: id, acao, entidade, payload_antes (opc.), payload_depois (opc.), ip (opc.), ocorreu_em. Relacionamento "produz": (0,n) junto a AuditoriaEvento.
- Ausentes no DER mas presentes no dicionário: nenhuma. Presente no DER e ausente no dicionário: **Sessao**.

## Figura 8 – DER M2: Gestão de Animais do Canil (image8.png, 1382×902) – texto pequeno; ver recortes fig08_z_*
(transcrição completada no arquivo fig08_13_15_recortes.md)
- Entidades identificadas: Animal; Motivo_entrada (id, codigo, nome); Baia (id, nome, capacidade, **animais_alojados**, finalidade, ativa, observacoes); Tipo_Baia (id, codigo, nome); Status_Animal (id, codigo, nome); Especie (id, codigo, nome); AnexoAnimal (id, nome, url, tamanho_bytes, mime_type, criado_em); Vacinacao (id, data_aplicacao, data_validade, dose, lote, observacoes, criado_em); Vacina (id, nome, especie_aplicavel, intervalo_meses); Usuário (id, email, senha, data_criacao, data_modificacao, nome, sobrenome, crmv, telefone, ativo, **dois_fatores_ativo**, ultimo_acesso, criado_em, senha_alterada_em, desativado_em); Procedimento (id, data, descricao, resultado, anexo_url, criado_em); Tipo_Procedimento (id, codigo, nome); **Medicacao** (id, medicamento, dose, via_administracao, data_inicio, data_fim_prevista, data_fim_real, status, criado_em); Exame (id, tipo_exame, data_solicitacao, data_resultado, anexo_url, criado_em); Laboratorio (id, codigo, nome, tipo, contato).
- Relacionamentos: Entrou Por (Animal–Motivo_entrada); Ocupa (Animal–Baia); Recebe (Animal–Vacinacao); Cadastra (Usuário–Animal); Possui (Animal–AnexoAnimal); Esta (Animal–Status_Animal); Possui (Animal–Especie); Passa (Animal–Procedimento); Toma (Animal–Medicacao); Possui (Animal–Exame); Realiza (Exame–Laboratorio); Possui (Procedimento–Tipo_Procedimento); Possui (Baia–Tipo_Baia); Possui (Vacinacao–Vacina); Aplica (Usuário–Vacinacao); Executa (Usuário–Procedimento); Prescrita (Usuário–Medicacao).
- Ausentes no DER M2 (presentes no dicionário/lógico): **Adocao**, Sintoma, AnimalSintoma, VacinaEspecie, Medicamento, CategoriaFarmacologica, Prescricao (DER usa "Medicacao"), TipoExame (DER usa atributo tipo_exame), AnexoVacinacao, AnexoProcedimento, AnexoExame (DER usa anexo_url).
- Presentes no DER e ausentes no dicionário: Status_Animal e Especie como entidades (texto 4.2 explica: viram enums), Medicacao, atributo Baia.animais_alojados, AnexoAnimal.mime_type, Laboratorio.codigo, *.codigo nos catálogos, Usuário.dois_fatores_ativo, Usuário.data_criacao.

## Figura 9 – DER M3: Ocorrências e Denúncias (image9.png, 1383×894) – legível
- Ocorrencia: id, protocolo, data_abertura, hora_abertura (opc.), bairro (opc.), ponto_referencia (opc.), descricao, urgente, sigilosa, status_ocorrencia, descricao_encerramento (opc.), encerrada_em (opc.), criado_em, atualizado_em.
- Processo_Sanitario (id) – "Gera": (0,1) junto a Processo_Sanitario, (0,1) junto a Ocorrencia.
- Anexo_Ocorrencia (id, nome, url, tamanho_bytes (opc.), criado_em) – "Anexa": (0,n) junto a Anexo_Ocorrencia, (1,1) junto a Ocorrencia.
- Denunciante (id, nome (opc.), cpf (opc.), telefone (opc.), email (opc.), cep (opc.), endereco (opc.), bairro_residencial (opc.)) – "Aponta": (1,n) junto a Denunciante, (1,1) junto a Ocorrencia.
- Denunciado (id, nome (opc.), cpf (opc.), telefone (opc.), endereco (opc.), observacoes (opc.)) – "Registra": (1,n) junto a Denunciado, (1,1) junto a Ocorrencia.
- Usuario (id) – "Registra": (1,1) junto a Ocorrencia, (0,1) junto a Usuario.
- Tipo_Ocorrencia (id, codigo, nome, ativo) – "Possui": (0,n) junto a Ocorrencia, (0,1) junto a Tipo_Ocorrencia.
- ProvidenciaTomada (id, codigo, nome, ativo) – "Encerra": (0,1) junto a ProvidenciaTomada.
- Movimentacao_Ocorrencia (id, tipo_movimentacao, data, descricao (opc.), criado_em) – "Registra": (0,n) junto a Movimentacao, (1,1) junto a Ocorrencia.
- Diferenças vs dicionário: Tipo_Ocorrencia e ProvidenciaTomada têm "codigo" (dicionário não); nomes com underscore (Anexo_Ocorrencia, Tipo_Ocorrencia, Movimentacao_Ocorrencia, Processo_Sanitario).

## Figura 10 – DER M4: Processos Sanitários (image10.png, 1214×1084) – legível
- Processo_Sanitario: id, protocolo, urgente, status_processo, resultado_laboratorial (opc.), desfecho_animal (opc.), gal_numero (opc.), sinan_numero (opc.), data_abertura, data_envio_amostras (opc.), data_resultado (opc.), previsao_retorno (opc.), observacoes (opc.), criado_em, atualizado_em, notificado_em (opc.).
- Documento_Processo (id, nome, url, tamanho_bytes (opc.), criado_em, status) – "Possui": (0,n) junto a Documento, (1,1) junto a Processo. "Classifica" → TipoDocumento_Processo (id, nome, ativo): (0,1).
- Doenca (id, nome, cid (opc.), ativo) – "Investiga": (0,1) junto a Doenca, (1,1) junto a Processo.
- Laboratorio (id, nome, tipo (opc.), contato (opc.), ativo) – "Envia": (0,1) junto a Laboratorio, (1,1) junto a Processo.
- **Ocorrencia (id) – "Origina": (1,n) junto a Ocorrencia, (1,1) junto a Processo_Sanitario.**
- Responsavel_Processo (id, nome, cpf (opc.), telefone (opc.), email (opc.), cep (opc.), endereco (opc.), bairro_residencial (opc.), bairro_ocorrencia (opc.)) – "Contém": (1,1) junto a Processo, (0,1) junto a Responsavel.
- Usuario (id) – "Cria": (1,1) junto a Processo, (0,1) junto a Usuario.
- **AnimalAmostrado** (id, numero_campo (opc.), sexo (opc.), coloracao (opc.), pelagem (opc.), idade_aprox (opc.), peso_kg (opc.), nome_animal (opc.), status_clinico (opc.), raca (opc.), especie, material_biologico, tipo_amostra (opc.), data_coleta (opc.), observacoes (opc.), agrediu_humano, contato_humano, alt_comportamental (opc.), nivel_contato (opc.), criado_em, tipo_abrigo) – "Amostra": (0,n) junto a Processo / (0,n) junto a AnimalAmostrado.
- Animal (id) – "Referencia": (1,1) junto a AnimalAmostrado, (1,n) junto a Animal.
- Sintoma – "Apresenta": (0,n).
- Diferenças vs dicionário: nome AnimalAmostrado × AmostraAnimal; numero_campo só no DER; Documento_Processo sem criado_por.

## Figura 11 – DER M5: Relatórios (image11.png, 643×540) – legível
- RelatorioGerado: id, tipo_relatorio, periodo_inicio (opc.), periodo_fim (opc.), parametros_jsonb (opc.), gerado_em, status, arquivo_url (opc.), tamanho_bytes (opc.), url_expira_em (opc.).
- Usuario (id) – "gera": (1,1) junto a RelatorioGerado, (0,1) junto a Usuario.
