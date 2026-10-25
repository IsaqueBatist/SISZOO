# Transcrição – Figuras 17 a 25 (diagramas de classes, PlantUML) – todas legíveis

## Figura 17 – Classes M1: Usuários e Acesso (image17.png)
- Usuario: -UUID id; -String email; -String senhaHash; -String nome; -String sobrenome; -String crmv; -String telefone; -Boolean ativo; -LocalDateTime ultimoAcesso; -LocalDateTime criadoEm; -LocalDateTime senhaAlteradaEm; -LocalDateTime desativadoEm; -LocalDateTime dataModificacao. Métodos: +registrarAcesso():void; +trocarSenha(String novoHash):void; +precisaTrocarSenha():Boolean; +desativar():void; +reativar():void; +estaAtivo():Boolean; +possuiPermissao(Modulo m, String feature, TipoAcesso acesso):Boolean.
- Usuario * —recebe▼— 1..* Cargo, com classe de associação UsuarioCargo (-LocalDateTime adicionadoEm).
- Usuario 1 —configura▼— 0..1 PreferenciaUsuario (-UUID id; -TemaUsuario tema; -DensidadeUsuario densidade). **Sem atributos notif_*.**
- Usuario 1 —gera▶— * AuditoriaEvento (-UUID id; -AcaoAuditoria acao; -String entidade; -JsonNode payloadAntes; -JsonNode payloadDepois; -String ip; -LocalDateTime ocorreuEm; +registrar(Usuario usuario, AcaoAuditoria acao, String entidade, JsonNode antes, JsonNode depois):AuditoriaEvento (sublinhado = estático)).
- Cargo (-UUID id; -String nome; -String descricao; +concedeAcessoTotal():Boolean) 1 ◆—define▼— * CargoPermissao (-UUID id; -Modulo modulo; -String feature; -Boolean leitura; -Boolean escrita; -Boolean exclusao; +permite(TipoAcesso acesso):Boolean).
- Enumerações: Modulo {USUARIOS_ACESSO, GESTAO_ANIMAIS, OCORRENCIAS_DENUNCIAS, PROCESSOS_SANITARIOS, RELATORIOS}; TipoAcesso {LEITURA, ESCRITA, EXCLUSAO}; AcaoAuditoria {CRIACAO, ATUALIZACAO, DESATIVACAO, REATIVACAO, VISUALIZACAO, LOGIN, LOGOUT, EXPORTACAO, ENCERRAMENTO}; TemaUsuario {LIGHT, DARK}; DensidadeUsuario {COMPACTO, NORMAL, CONFORTAVEL}.
- Sem classe Sessao.

## Figura 18 – Classes M2: animal, baias e adoção (image18.png)
- TipoBaia (-UUID id; -String nome; -Boolean ativo) 1 —categoriza▼— * Baia.
- Baia: -UUID id; -String nome; -Integer capacidade; -String finalidade; -Boolean ativa; -String observacoes; +calcularOcupacao():Integer; +temVaga():Boolean; +estaSuperlotada():Boolean. **Sem animaisAlojados.**
- MotivoEntrada (-UUID id; -String nome; -Boolean ativo) 1 —justifica▼— * Animal.
- «external» Usuario (-UUID id) 1 —cadastra▼— * Animal; Usuario 1 —registra▼— * Adocao.
- Baia 1 —abriga▼— * Animal.
- Animal: -UUID id; -String numeroMicrochip; -LocalDate dataImplantacaoChip; -String numeroMedalha; -String nome; -Especie especie; -Sexo sexo; -Porte porte; -String raca; -String pelagem; -String coloracao; -LocalDate dataNascimentoAprox; -String idadeAprox; -BigDecimal pesoKg; -String fotoUrl; -Boolean esterilizado; -LocalDate dataEsterilizacao; -String procedencia; -String observacoes; -StatusAnimal statusAnimal; -LocalDate dataEntrada; -LocalDate dataSaida; -LocalDateTime criadoEm; -LocalDateTime atualizadoEm. Métodos: +registrarMicrochip(String numero, LocalDate dataImplantacao):void; +transferirBaia(Baia destino):void; +registrarSaida(StatusAnimal desfecho, LocalDate data):void; +esterilizar(LocalDate data):void; +temFichaCompleta():Boolean; +podeSerAdotado():Boolean; +estaAlojado():Boolean.
- Animal 1 —adotado em▼— * Adocao: -UUID id; -String adotanteNome; -String adotanteCpf; -String adotanteTelefone; -String adotanteEmail; -String adotanteCep; -String adotanteEndereco; -String adotanteBairro; -LocalDate dataAdocao; -LocalDate dataDevolucao; -String motivoDevolucao; -String observacoes; -LocalDateTime criadoEm; +registrarDevolucao(LocalDate data, String motivo):void; +foiDevolvida():Boolean.
- Animal 1 ◆—possui▼— * AnexoAnimal (-UUID id; -String nome; -String url; -Long tamanhoBytes; -LocalDateTime criadoEm).
- Nenhum atributo/método para laudo de eutanásia.

## Figura 19 – Classes M2: vacinação e prescrição (image19.png)
- Vacina: -UUID id; -String codigo; -String nome; -Integer intervaloMeses; -Boolean ativo; +exigeReforco():Boolean; +aplicavelA(Especie e):Boolean. Vacina 1 ◆—direcionada a▼— 1..* VacinaEspecie (-Especie especie). Vacina 1 —utilizada em▼— * Vacinacao.
- «external» Usuario 1 —aplica▼— * Vacinacao; Usuario 1 —prescreve▶— * Prescricao.
- Animal (reduzida: -UUID id; -String nome) 1 —recebe▼— * Vacinacao; Animal 1 —recebe▼— * Prescricao.
- Vacinacao: -UUID id; -LocalDate dataAplicacao; -LocalDate dataValidade; -Integer numeroDose; -BigDecimal doseQuantidade; -UnidadeDose doseUnidade; -String lote; -String observacoes; -LocalDateTime criadoEm; +calcularPrevisaoRetorno(Integer intervaloMeses):LocalDate; +venceEm(Integer dias, LocalDate hoje):Boolean. Vacinacao 1 ◆—possui▼— * AnexoVacinacao (id, nome, url, tamanhoBytes, criadoEm).
- CategoriaFarmacologica (id, nome, ativo) 1 —classifica▼— * Medicamento (id, nome, ativo) 1 —indicado em▼— * Prescricao.
- Prescricao: -UUID id; -LocalDate dataInicio; -LocalDate dataFimPrevista; -LocalDate dataFimReal; -Integer frequenciaAplicada; -UnidadeFrequencia unidadeFrequencia; -BigDecimal doseQuantidade; -UnidadeDose doseUnidade; -ViaAdministracao viaAdministracao; -StatusPrescricao status; -LocalDateTime criadoEm; +concluir():void; +suspender():void; +cancelar():void; +estaVigente(LocalDate hoje):Boolean.

## Figura 20 – Classes M2: procedimentos, exames e sintomas (image20.png)
- TipoProcedimento (id, nome, ativo) 1 —classifica▼— * Procedimento; «external» Usuario 1 —executa▼— * Procedimento; Animal (id, nome) 1 —◀submetido a— * Procedimento; Animal * —apresenta▼— * Sintoma (-UUID id; -String codigo; -String nome; -Boolean ativo).
- Procedimento: -UUID id; -LocalDate data; -String descricao; -String resultado; -LocalDateTime criadoEm; +foiConcluido():Boolean. 1 ◆—possui▼— * AnexoProcedimento (id, nome, url, tamanhoBytes, criadoEm).
- Animal 1 —realiza▶— * Exame; TipoExame (id, nome, ativo) 1 —classifica▼— * Exame; Laboratorio (-UUID id; -String nome; -String tipo; -String contato; -Boolean ativo) 1 —processa▼— * Exame.
- Exame: -UUID id; -LocalDate dataSolicitacao; -LocalDate dataResultado; -String resultado; -LocalDateTime criadoEm; +registrarResultado(String resultado, LocalDate data):void; +aguardandoResultado():Boolean. 1 ◆—possui▼— * AnexoExame.

## Figura 21 – Enumerações M2 (image21.png)
Especie {CANINO, FELINO, QUIROPTERO, PRIMATA_NAO_HUMANO}; StatusAnimal {DISPONIVEL_ADOCAO, EM_TRATAMENTO, QUARENTENA, ADOTADO, RESGATADO, OBITO, EUTANASIA, TRANSFERIDO}; Sexo {MACHO, FEMEA}; Porte {P, M, G}; UnidadeFrequencia {HORAS, DIAS}; StatusPrescricao {ATIVA, CONCLUIDA, SUSPENSA, CANCELADA}; ViaAdministracao {ORAL, INTRAVENOSA, INTRAMUSCULAR, SUBCUTANEA, TOPICA}; UnidadeDose {MILIGRAMA, MICROGRAMA, GRAMA, MILILITRO, UNIDADE_INTERNACIONAL}.

## Figura 22 – Classes M3: Ocorrências e Denúncias (image22.png)
- «external» Usuario 1 —registra▼— * Ocorrencia; Usuario 1 —executa▼— * MovimentacaoOcorrencia.
- TipoOcorrencia (id, nome, ativo) 1 —classifica▼— * Ocorrencia; ProvidenciaTomada (id, nome, ativo) 0..1 —encerra▼— * Ocorrencia.
- Ocorrencia: -UUID id; -String protocolo; -StatusOcorrencia status; -LocalDate dataAbertura; -LocalTime horaAbertura; -String bairro; -String pontoReferencia; -String descricao; -Boolean urgente; -Boolean sigilosa; -String descricaoEncerramento; -LocalDateTime encerradaEm; -LocalDateTime criadoEm; -LocalDateTime atualizadoEm. Métodos: +podeSerEncerrada():Boolean; +encerrar(ProvidenciaTomada providencia, String descricao):void; +estaEncerrada():Boolean; +denuncianteVisivelPara(Boolean ehAdministrador):Boolean; +marcarUrgente():void.
- Ocorrencia 1 ◆—◀registra— * MovimentacaoOcorrencia (-UUID id; -TipoMovimentacaoOcorrencia tipoMovimentacao; -LocalDateTime data; -String descricao; -LocalDateTime criadoEm).
- Ocorrencia 1 ◆—envolve▼— 0..1 Denunciado (id, nome, cpf, telefone, endereco, observacoes).
- Ocorrencia 1 ◆—possui▼— * AnexoOcorrencia (id, nome, url, tamanhoBytes, criadoEm).
- **Ocorrencia 0..1 —origina▼— 0..1 «external» ProcessoSanitario** (-UUID id; +possuiResultado():Boolean).
- Ocorrencia 1 ◆—relatada por▶— 0..1 Denunciante (id, nome, cpf, telefone, email, cep, endereco, bairroResidencial; +temContatoValido():Boolean).
- Enumerações: StatusOcorrencia {ABERTA, EM_ATENDIMENTO, AGUARDANDO_RETORNO, ENCERRADA}; TipoMovimentacaoOcorrencia {ABERTURA, ATRIBUICAO, ATUALIZACAO, GERACAO_PROCESSO, ENCERRAMENTO}.

## Figura 23 – Classes M4: Processos Sanitários (image23.png)
- Doenca (-UUID id; -String nome; -String cid; -Boolean ativo) 1 —investigada em▼— * ProcessoSanitario.
- ResponsavelProcesso (-UUID id; -String nome; -String cpf; -String telefone; -String email; -String cep; -String endereco; -String bairroResidencial; -String bairroOcorrencia; +podeReceberNotificacao():Boolean) 1 —responde por▼— * ProcessoSanitario.
- «external» Laboratorio 1 —analisa▼— * ProcessoSanitario; **«external» Ocorrencia 0..1 —origina▼— * ProcessoSanitario**; «external» Usuario 1 —cria▼— * ProcessoSanitario; Usuario 1 —cria▼— * DocumentoProcesso.
- ProcessoSanitario: -UUID id; -String protocolo; -StatusProcesso status; -ResultadoLaboratorial resultado; -DesfechoAnimal desfecho; -Boolean urgente; -String galNumero; -String sinanNumero; -LocalDate dataAbertura; -LocalDate dataEnvioAmostras; -LocalDate previsaoRetorno; -LocalDate dataResultado; -LocalDateTime notificadoEm; -String observacoes; -LocalDateTime criadoEm; -LocalDateTime atualizadoEm. Métodos: +avancarStatus(StatusProcesso destino):void; +registrarResultado(ResultadoLaboratorial resultado, LocalDate data):void; +possuiResultado():Boolean; +marcarUrgente():void; +exigeNotificacao():Boolean.
- «external» Animal 0..1 —amostrado em▼— * AmostraAnimal; ProcessoSanitario 1 ◆—avalia▼— **1..*** AmostraAnimal; ProcessoSanitario 1 ◆—possui▼— * DocumentoProcesso; TipoDocumentoProcesso (id, nome, ativo) 1 —tipifica▼— * DocumentoProcesso.
- AmostraAnimal: -UUID id; -Especie especie; -Sexo sexo; -String nomeAnimal; -String raca; -String coloracao; -String pelagem; -String idadeAprox; -BigDecimal pesoKg; -String statusClinico; -TipoAbrigo tipoAbrigo; -MaterialBiologico materialBiologico; -TipoAmostra tipoAmostra; -LocalDate dataColeta; -Boolean contatoHumano; -NivelContato nivelContato; -Boolean agrediuHumano; -String altComportamental; -String observacoes; -LocalDateTime criadoEm; +exigeUrgencia():Boolean. AmostraAnimal * —apresenta▼— * «external» Sintoma (id).
- DocumentoProcesso: -UUID id; -String nome; -String url; -Long tamanhoBytes; -StatusDocumento status; -LocalDateTime criadoEm.

## Figura 24 – Enumerações M4 (image24.png)
StatusProcesso {ABERTO, EM_ANDAMENTO, AGUARDANDO_RESULTADO, CONCLUIDO}; ResultadoLaboratorial {NEGATIVO, POSITIVO, MATERIAL_INADEQUADO, INCONCLUSIVO, NAO_REALIZADO, AGUARDANDO}; DesfechoAnimal {OBITO_NATURAL, EUTANASIA, EM_ACOMPANHAMENTO, OUTRO}; NivelContato {DIRETO, INDIRETO, SEM_CONTATO}; MaterialBiologico {SORO, SANGUE_TOTAL, SWAB, TECIDO, LIQUOR, PELO_ESCAMA}; TipoAmostra {IN_NATURA, CONGELADO, FIXADO_FORMOL, GELO_RECICLAVEL}; TipoAbrigo {INTRADOMICILIAR, PERIDOMICILIAR, SILVESTRE, NAO_IDENTIFICADO}; StatusDocumento {PENDENTE, EM_PROCESSAMENTO, CONCLUIDO, FALHA}.

## Figura 25 – Classes M5: Relatórios (image25.png)
- «external» Usuario 1 —gera▼— * RelatorioGerado: -UUID id; -TipoRelatorio tipoRelatorio; -LocalDate periodoInicio; -LocalDate periodoFim; -JsonNode parametros; -LocalDateTime geradoEm; -StatusRelatorio status; -String arquivoUrl; -Long tamanhoBytes; -LocalDateTime urlExpiraEm; +avancarStatus(StatusRelatorio destino):void; +concluir(String arquivoUrl, Long tamanhoBytes):void; +falhar():void; +estaDisponivel(LocalDateTime agora):Boolean; +urlExpirada(LocalDateTime agora):Boolean.
- Enumerações: StatusRelatorio {PENDENTE, EM_PROCESSAMENTO, CONCLUIDO, FALHA}; TipoRelatorio {ANUAL_PROCESSOS, VACINACAO, ADOCOES, PROCEDIMENTOS, OCUPACAO_BAIAS, OCORRENCIAS_BAIRRO}.

## Classes «external» e onde são definidas
Usuario (M1, Fig. 17) ✓; ProcessoSanitario (M4, Fig. 23) ✓; Laboratorio (definida em M2, Fig. 20) ✓; Ocorrencia (M3, Fig. 22) ✓; Animal (M2, Fig. 18) ✓; Sintoma (M2, Fig. 20) ✓.
