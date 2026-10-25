# Transcrição – Figuras 12 a 16 (diagramas lógicos, dbdiagram.io)

Notação: ícone chave = PK; ícone elo = FK; ícone "@" = único (UQ); "E" = tipo enumerado; NN = NOT NULL. Ausência de NN = nulo permitido.
Legibilidade: Fig. 12, 14, 15, 16 legíveis (recortes fig12_*, fig15_z_*). **Fig. 13 (image13.png, 1385×1031) tem texto muito pequeno**: tipos e NN transcritos a partir dos recortes fig13_z_* e fig13_animal/baia/vacinacao/catalogos; marcados com (?) quando a leitura não é segura.

## Figura 12 – Lógico M1 (image12.png, 969×1584)
- Usuario: id uuid PK NN; email varchar(255) UQ NN; senha varchar(255) NN; nome varchar(100) NN; sobrenome varchar(100) NN; crmv varchar(20); telefone varchar(20); ativo boolean NN; ultimo_acesso timestamp; criado_em timestamp NN; senha_alterada_em timestamp; desativado_em timestamp; data_modificacao timestamp NN.
- **Sessao**: id uuid PK NN; usuario_id uuid FK NN; token_hash varchar(512) UQ NN; ip varchar(45); user_agent text; criada_em timestamp NN; expira_em timestamp NN; encerrada_em timestamp. (Usuario 1 — n Sessao)
- Cargo: id uuid PK NN; nome varchar(100) NN; descricao text.
- PreferenciaUsuario: id uuid PK NN; usuario_id uuid FK UQ NN; tema TemaUsuario E NN; densidade DensidadeUsuario E NN; notif_alertas_criticos boolean NN; notif_vacina_vencendo boolean NN; notif_superlotacao boolean NN; notif_resultado_lab boolean NN; notif_email_diario boolean NN.
- AuditoriaEvento: id uuid PK NN; usuario_id uuid FK (nulo permitido); acao AcaoAuditoria E NN; entidade varchar(100) NN; payload_antes jsonb; payload_depois jsonb; ip varchar(45); ocorreu_em timestamp NN.
- UsuarioCargo: usuario_id uuid PK FK NN; cargo_id uuid PK FK NN; adicionado_em timestamp NN.
- CargoPermissao: id uuid PK NN; cargo_id uuid FK NN; modulo Modulo E NN; feature varchar(100) NN; leitura boolean NN; escrita boolean NN; exclusao boolean NN.
- Diferença vs dicionário (Quadros 52–57): tabela Sessao não consta do dicionário; demais tabelas/colunas coincidem.

## Figura 13 – Lógico M2 (image13.png) – leitura parcial
- Tabelas presentes (22): MotivoEntrada, TipoBaia, Sintoma, Vacina, TipoProcedimento, CategoriaFarmacologica, Laboratorio, Usuario (id), TipoExame, Baia, VacinaEspecie, Medicamento, Animal, AnimalSintoma, AnexoAnimal, Vacinacao, Procedimento, Prescricao, Exame, AnexoVacinacao, AnexoProcedimento, AnexoExame. **Adocao ausente.**
- MotivoEntrada: id PK NN; nome varchar(100) NN; ativo boolean NN. TipoBaia: idem. Sintoma: id; codigo varchar(100); nome varchar(100) NN; ativo NN. Vacina: id; codigo varchar(100) UQ; nome NN; intervalo_meses integer; ativo NN. TipoProcedimento, CategoriaFarmacologica (nome UQ), TipoExame (nome UQ): id, nome NN, ativo NN. Laboratorio: id; nome varchar(150) NN; tipo varchar(50); contato varchar(200); ativo NN.
- Baia: id uuid PK NN; nome varchar(100) NN; capacidade integer NN; **animais_alojados integer NN**; finalidade varchar(120)(?); ativa boolean NN; observacoes text; tipo_baia_id uuid FK NN.
- VacinaEspecie: vacina_id uuid PK FK NN; especie Especie E PK NN.
- Medicamento: id; nome varchar(100) NN; categoria_id uuid FK NN; ativo NN.
- Animal: id uuid PK NN; numero_medalha varchar(50) UQ(?); data_implantacao_chip date; numero_microchip varchar(50) UQ; peso_kg decimal(5,2); data_nascimento_aprox date; nome varchar(100); foto_url varchar(500); coloracao varchar(100); esterilizado boolean NN; data_esterilizacao date; idade_aprox varchar(50); raca varchar(100); **sexo Sexo E (sem NN visível)**; **porte Porte E (sem NN visível)**; pelagem varchar(100); especie Especie E NN; observacoes text; procedencia varchar(200); **data_entrada date (sem NN visível)**; data_saida date; status_animal StatusAnimal E NN; **motivo_entrada_id uuid FK (sem NN visível)**; **baia_id uuid FK (sem NN visível)**; cadastrado_por uuid FK; criado_em timestamp NN; atualizado_em timestamp NN.
- AnimalSintoma: animal_id PK FK NN; sintoma_id PK FK NN. AnexoAnimal: id; animal_id FK NN; nome varchar(255) NN; url varchar(500) NN; tamanho_bytes bigint; criado_em NN.
- Vacinacao: id; animal_id FK NN; vacina_id FK NN; aplicado_por uuid FK; data_aplicacao date NN; data_validade date; numero_dose integer; dose_quantidade decimal(8,3); dose_unidade UnidadeDose E; lote varchar(100); observacoes text; criado_em NN.
- Procedimento: id; animal_id FK NN; tipo_procedimento_id FK NN; executado_por uuid FK; data date NN; descricao text; resultado text; criado_em NN.
- Prescricao: id; animal_id FK NN; prescrito_por uuid FK; medicamento_id FK NN; data_inicio date NN; data_fim_prevista date; data_fim_real date; frequencia_aplicada integer NN; unidade_frequencia UnidadeFrequencia E NN; dose_quantidade decimal(8,3) NN; dose_unidade UnidadeDose E NN; via_administracao ViaAdministracao E NN; status StatusPrescricao E NN; criado_em NN.
- Exame: id; animal_id FK NN; laboratorio_id FK NN; tipo_exame_id FK NN; data_solicitacao date NN; data_resultado date; resultado text; criado_em NN.
- AnexoVacinacao / AnexoProcedimento / AnexoExame: id; *_id FK NN; nome NN; url NN; tamanho_bytes; criado_em NN.
- Diferenças vs dicionário (Quadros 58–79): Baia.animais_alojados existe no lógico e não no dicionário; Adocao (Quadro 79) não existe no lógico.

## Figura 14 – Lógico M3 (image14.png, 1388×1228) – legível
- TipoOcorrencia: id PK NN; nome varchar(100) NN; ativo boolean NN. ProvidenciaTomada: idem.
- Denunciante: id PK NN; nome varchar(200) NN; cpf varchar(14); telefone varchar(20); email varchar(255); cep varchar(10); endereco varchar(300); bairro_residencial varchar(100).
- Denunciado: id PK NN; nome varchar(200) NN; cpf varchar(14); telefone varchar(20); endereco varchar(300); observacoes text.
- Usuario (cópia completa): id; email UQ NN; senha NN; nome NN; sobrenome NN; crmv; telefone; ativo NN; **dois_fatores_ativo boolean NN**; ultimo_acesso; criado_em NN; senha_alterada_em; desativado_em; data_modificacao NN.
- Ocorrencia: id PK NN; protocolo varchar(50) UQ NN; registrado_por uuid FK NN; tipo_ocorrencia_id uuid FK NN; status_ocorrencia StatusOcorrencia E NN; providencia_tomada_id uuid FK; denunciante_id uuid FK (nulo permitido); denunciado_id uuid FK; data_abertura date NN; hora_abertura time; bairro varchar(100); ponto_referencia varchar(200); descricao text NN; urgente boolean NN; sigilosa boolean NN; descricao_encerramento text; encerrada_em timestamp; criado_em NN; atualizado_em NN.
- AnexoOcorrencia: id; ocorrencia_id FK NN; nome varchar(255) NN; url varchar(500) NN; tamanho_bytes bigint; criado_em NN.
- MovimentacaoOcorrencia: id; ocorrencia_id FK NN; usuario_id uuid FK; tipo_movimentacao TipoMovimentacaoOcorrencia E NN; data timestamp NN; descricao text; criado_em NN.
- Diferenças vs dicionário (Quadros 80–86): coincidem; Usuario.dois_fatores_ativo só aparece aqui (e no DER M2).

## Figura 15 – Lógico M4 (image15.png, 1380×867) – legível nos recortes fig15_z_*
- ProcessoSanitario: id PK NN; **protocolo varchar(9) UQ NN**; criado_por uuid FK NN; doenca_id uuid FK NN; status_processo StatusProcesso E NN; **laboratorio_id uuid FK (nulo permitido)**; resultado_laboratorial ResultadoLaboratorial E; desfecho_animal DesfechoAnimal E; responsavel_id uuid FK NN; ocorrencia_id uuid FK (nulo permitido); urgente boolean NN; gal_numero varchar(50); sinan_numero varchar(50); data_abertura date NN; data_envio_amostras date; data_resultado date; previsao_retorno date; observacoes text; criado_em NN; atualizado_em NN; notificado_em timestamp.
- DocumentoProcesso: id; processo_id FK NN; criado_por uuid FK; nome varchar(255) NN; url varchar(500) NN; tipo_id uuid FK NN; status StatusDocumento E; tamanho_bytes bigint; criado_em NN.
- AmostraSintoma: amostra_id PK FK NN; sintoma_id PK FK NN.
- AmostraAnimal: id; processo_id FK NN; animal_id uuid FK; especie Especie E NN; sexo Sexo E; coloracao varchar(100); pelagem varchar(100); idade_aprox varchar(50); peso_kg decimal(5,2); nome_animal varchar(100); status_clinico varchar(100); raca varchar(100); tipo_abrigo TipoAbrigo E NN; material_biologico MaterialBiologico E; tipo_amostra TipoAmostra E; data_coleta date; observacoes text; agrediu_humano boolean; contato_humano boolean NN; alt_comportamental varchar(200); nivel_contato NivelContato E; criado_em NN.
- ResponsavelProcesso: id; nome varchar(200) NN; cpf varchar(14) UQ; telefone; email varchar(255); cep; **endereco varchar(300) (nulo permitido)**; bairro_residencial; bairro_ocorrencia.
- Doenca: id; nome varchar(150) NN; cid varchar(20); ativo NN. TipoDocumentoProcesso: id; nome varchar(100) UQ NN; ativo NN. Usuario, Laboratorio, Ocorrencia, Animal, Sintoma: só id.
- Diferenças vs dicionário (Quadros 87–93): protocolo varchar(9) × varchar(50) (Quadro 90); demais coincidem.

## Figura 16 – Lógico M5 (image16.png, 678×504) – legível
- RelatorioGerado: id PK NN; gerado_por uuid FK NN; tipo_relatorio TipoRelatorio E NN; periodo_inicio date; periodo_fim date; parametros_jsonb jsonb; gerado_em timestamp NN; status StatusRelatorio E NN; arquivo_url varchar(500); url_expira_em timestamp; tamanho_bytes bigint. Usuario: id.
- Coincide com Quadro 94.
