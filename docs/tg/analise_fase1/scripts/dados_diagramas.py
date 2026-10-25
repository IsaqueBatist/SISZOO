# -*- coding: utf-8 -*-
"""Dados transcritos manualmente das imagens (Figuras 1-30) e de trechos do texto.
Fonte unica: docs/tg/SISZOO_versao_limpa.docx. Ver figuras/transcricoes/*.md para a transcricao integral."""

MODULOS = [
    {"numero": 1, "nome_canonico": "Autenticação e Controle de Acesso", "letra_rf": "C", "enum_modulo": "USUARIOS_ACESSO", "pacote_backend": "usuarios",
     "variacoes": [{"nome": "Autenticação e Controle de Acesso", "origem": "Fig. 1, Fig. 2, Fig. 12, Quadro 6, 3.1.1, A.1"},
                   {"nome": "Usuários e Acesso", "origem": "Fig. 7, Fig. 17, B.1, texto 4.4 ('módulo de Usuários e Acesso')"}]},
    {"numero": 2, "nome_canonico": "Gestão de Animais do Canil", "letra_rf": "A", "enum_modulo": "GESTAO_ANIMAIS", "pacote_backend": "animais",
     "variacoes": [{"nome": "Gestão de Animais do Canil", "origem": "Fig. 1, 3, 8, 13, Quadro 7, 3.1.2, A.2, B.2"},
                   {"nome": "Gestão de Animais (A)", "origem": "RN09 (Quadro 13)"}, {"nome": "Gestão de Animais", "origem": "Quadros 23–32 'Caso de Uso Geral'"}]},
    {"numero": 3, "nome_canonico": "Ocorrências e Denúncias", "letra_rf": "E", "enum_modulo": "OCORRENCIAS_DENUNCIAS", "pacote_backend": "ocorrencias",
     "variacoes": [{"nome": "Ocorrências e Denúncias", "origem": "Fig. 1, 4, 9, 14, 22, Quadro 8, 3.1.3, A.3, B.3"}, {"nome": "Ocorrências (E)", "origem": "RN09"}]},
    {"numero": 4, "nome_canonico": "Processos Sanitários", "letra_rf": "B", "enum_modulo": "PROCESSOS_SANITARIOS", "pacote_backend": "processos",
     "variacoes": [{"nome": "Processos Sanitários", "origem": "Fig. 1, 5, 10, 15, 23, Quadro 9, 3.1.4, A.4, B.4"}, {"nome": "Processos (B)", "origem": "RN09"}]},
    {"numero": 5, "nome_canonico": "Dashboard e Relatórios", "letra_rf": "D", "enum_modulo": "RELATORIOS", "pacote_backend": "relatorios",
     "variacoes": [{"nome": "Dashboard e Relatórios", "origem": "Fig. 1, Fig. 6, Quadro 10, 3.1.5, A.5"},
                   {"nome": "Relatórios", "origem": "Fig. 11, Fig. 16, Fig. 25, B.5"}, {"nome": "Dashboard/Relatórios (D)", "origem": "RN09"}]},
    {"numero": None, "nome_canonico": "comum", "origem": "5.1 (pacote backend 'comum')"},
]

MAPEAMENTO_RF_MODULO = {"origem": "Cap. 3 intro (b357) e Quadros 6–10",
                        "RF-C": "Módulo 1", "RF-A": "Módulo 2", "RF-E": "Módulo 3", "RF-B": "Módulo 4", "RF-D": "Módulo 5"}

PERFIS = {
    "quadro_4": {"origem": "Quadro 4 (p. 25 conforme sumário)", "perfis": [
        {"perfil": "Administrador", "atribuicao": "Direção", "modulos": "Todos, inclusive usuários, baias e trilha de auditoria"},
        {"perfil": "Veterinário", "atribuicao": "Veterinária do canil", "modulos": "Gestão de animais do canil; dashboard; baias e relatórios"},
        {"perfil": "Agente Sanitário", "atribuicao": "Processos de zoonoses e ocorrências", "modulos": "Processos sanitários; ocorrências; dashboard e relatórios"}]},
    "rn09": {"origem": "Quadro 13 RN09", "texto": "Administrador: acesso total. Veterinário: Gestão de Animais (A) e Dashboard/Relatórios (D). Agente Sanitário: Processos (B), Ocorrências (E) e Dashboard/Relatórios (D)."},
    "texto_2_2": {"origem": "Seção 2.2", "nota": "Perfil de recepção não incluído; cirurgiã usará perfil Veterinário; permissões em CargoPermissao por módulo e tipo de acesso (leitura, escrita, exclusão)."},
    "atores_diagramas": {"origem": "Fig. 1–6", "atores": ["Administrador", "Veterinário", "Agente Sanitário"],
                          "herancas": [{"de": "Administrador", "para": "Veterinário", "origem": "Fig. 1, 2, 3, 6"}, {"de": "Administrador", "para": "Agente Sanitário", "origem": "Fig. 1, 2, 4, 5, 6"}],
                          "texto_4_1": "O Administrador especializa os perfis Veterinário e Agente Sanitário e, por isso, pode executar todos os casos de uso desses perfis, além dos seus próprios (RN09)."},
    "cargos_quadro_20": {"origem": "Quadro 20", "cargos": ["Administrador", "Veterinário", "Agente Sanitário"]},
    "enum_Modulo_fig17": ["USUARIOS_ACESSO", "GESTAO_ANIMAIS", "OCORRENCIAS_DENUNCIAS", "PROCESSOS_SANITARIOS", "RELATORIOS"],
    "enum_TipoAcesso_fig17": ["LEITURA", "ESCRITA", "EXCLUSAO"],
}

# ---------------- Casos de uso nos diagramas ----------------
UC_DIAGRAMAS = {
    "Figura 1": {"origem": "Figura 1 (p. 38 conforme sumário)", "elipses": ["Módulo 1 - Autenticação e Controle de Acesso", "Módulo 2 - Gestão de Animais do Canil", "Módulo 3 - Ocorrências e Denúncias", "Módulo 4 - Processos Sanitários", "Módulo 5 - Dashboard e Relatórios"],
                 "associacoes": {"Veterinário": ["Módulo 2", "Módulo 1", "Módulo 5"], "Agente Sanitário": ["Módulo 1", "Módulo 5", "Módulo 3", "Módulo 4"], "Administrador": []}},
    "Figura 2": {"origem": "Figura 2 (p. 39)", "modulo": 1, "casos": ["Realizar Login", "Encerrar Sessão", "Editar Preferências", "Desativar/Reativar Usuário", "Consultar Trilha de Auditoria", "Gerenciar Usuários", "Atribuir Cargo e Permissões"],
                 "associacoes": {"Veterinário": ["Realizar Login", "Encerrar Sessão", "Editar Preferências"], "Agente Sanitário": ["Realizar Login", "Encerrar Sessão", "Editar Preferências"], "Administrador": ["Consultar Trilha de Auditoria", "Gerenciar Usuários"]},
                 "relacoes": [{"tipo": "extend", "de": "Desativar/Reativar Usuário", "para": "Gerenciar Usuários", "condicao": None}, {"tipo": "include", "de": "Gerenciar Usuários", "para": "Atribuir Cargo e Permissões"}], "notas": []},
    "Figura 3": {"origem": "Figura 3 (p. 40)", "modulo": 2, "casos": ["Gerenciar Baias", "Cadastrar Animal", "Editar Dados do Animal", "Transferir Animal de Baia", "Consultar Animais por Baia", "Prescrever Medicamento", "Registrar Saída/Desfecho", "Registrar Aplicação de Vacina", "Registrar Procedimento Clínico", "Registrar Exame", "Registrar Adoção", "Anexar Documento ao Animal"],
                 "associacoes": {"Administrador": ["Gerenciar Baias"], "Veterinário": ["Cadastrar Animal", "Editar Dados do Animal", "Transferir Animal de Baia", "Consultar Animais por Baia", "Prescrever Medicamento", "Registrar Saída/Desfecho", "Registrar Aplicação de Vacina", "Registrar Procedimento Clínico", "Registrar Exame"]},
                 "relacoes": [{"tipo": "extend", "de": "Registrar Adoção", "para": "Registrar Saída/Desfecho", "condicao": "[destino = ADOTADO]"}, {"tipo": "extend", "de": "Anexar Documento ao Animal", "para": "Registrar Aplicação de Vacina", "condicao": None}, {"tipo": "extend", "de": "Anexar Documento ao Animal", "para": "Registrar Procedimento Clínico", "condicao": None}, {"tipo": "extend", "de": "Anexar Documento ao Animal", "para": "Registrar Exame", "condicao": None}], "notas": []},
    "Figura 4": {"origem": "Figura 4 (p. 41)", "modulo": 3, "casos": ["Consultar e Filtrar Ocorrências", "Encerrar Ocorrência", "Informar Denunciado", "Anexar Documento à Ocorrência", "Registrar Nova Ocorrência"],
                 "associacoes": {"Agente Sanitário": ["Consultar e Filtrar Ocorrências", "Encerrar Ocorrência", "Registrar Nova Ocorrência"], "Administrador": []},
                 "relacoes": [{"tipo": "extend", "de": "Informar Denunciado", "para": "Registrar Nova Ocorrência", "condicao": "[há denunciado]"}, {"tipo": "extend", "de": "Anexar Documento à Ocorrência", "para": "Registrar Nova Ocorrência", "condicao": "[há documento]"}],
                 "notas": [{"ligada_a": "Consultar e Filtrar Ocorrências", "texto": "Ocorrência sigilosa: dados do denunciante visíveis só para o Administrador (RN03).", "rn": "RN03"}, {"ligada_a": "Encerrar Ocorrência", "texto": "Bloqueado enquanto o processo sanitário vinculado não tiver resultado (RN05).", "rn": "RN05"}]},
    "Figura 5": {"origem": "Figura 5 (p. 42)", "modulo": 4, "casos": ["Abrir Processo Sanitário", "Registrar Resultado Laboratorial", "Consultar e Filtrar Processos", "Encerrar Processo", "Gerar Documento do Processo", "Registrar Animal Amostrado"],
                 "associacoes": {"Agente Sanitário": ["Abrir Processo Sanitário", "Registrar Resultado Laboratorial", "Consultar e Filtrar Processos", "Encerrar Processo", "Gerar Documento do Processo"], "Administrador": []},
                 "relacoes": [{"tipo": "include", "de": "Abrir Processo Sanitário", "para": "Registrar Animal Amostrado"}],
                 "notas": [{"ligada_a": "Abrir Processo Sanitário", "texto": "Protocolo 0000/AAAA gerado pelo sistema (RN02). Contato humano-animal torna o processo urgente (RN04).", "rn": "RN02, RN04"}, {"ligada_a": "Registrar Resultado Laboratorial", "texto": "Positivo ou Inconclusivo: e-mail ao responsável e à Vigilância Epidemiológica (RN10).", "rn": "RN10"}]},
    "Figura 6": {"origem": "Figura 6 (p. 43)", "modulo": 5, "casos": ["Consultar Alertas Vacinais", "Monitorar Ocupação de Baias", "Visualizar Dashboard", "Solicitar Geração de Relatório", "Baixar Relatório Gerado", "Acompanhar Status do Relatório"],
                 "associacoes": {"Veterinário": ["Visualizar Dashboard", "Acompanhar Status do Relatório", "Solicitar Geração de Relatório"], "Agente Sanitário": ["Solicitar Geração de Relatório", "Visualizar Dashboard", "Acompanhar Status do Relatório"], "Administrador": []},
                 "relacoes": [{"tipo": "extend", "de": "Consultar Alertas Vacinais", "para": "Visualizar Dashboard", "condicao": None}, {"tipo": "extend", "de": "Monitorar Ocupação de Baias", "para": "Visualizar Dashboard", "condicao": None}, {"tipo": "extend", "de": "Baixar Relatório Gerado", "para": "Acompanhar Status do Relatório", "condicao": "[status = CONCLUIDO]"}], "notas": []},
}
UC_NOME_DIAGRAMA_VS_QUADRO = [
    {"diagrama": "Encerrar Sessão", "quadro": "Encerrar Sessão (Logout)", "quadro_num": 17},
    {"diagrama": "Editar Preferências", "quadro": "Editar Preferências do Usuário", "quadro_num": 18},
    {"diagrama": "Visualizar Dashboard", "quadro": "Visualizar Dashboard em Tempo Real", "quadro_num": 46},
]

# ---------------- DER conceitual (Fig. 7-11) ----------------
# atributos: nome (sufixo '*' = identificador, '?' = opcional/tracejado)
DER = {
    "Figura 7": {"origem": "Figura 7 (p. 45)", "modulo": 1, "entidades": {
        "Usuario": ["id*", "email", "senha", "nome", "sobrenome", "crmv?", "telefone?", "ativo", "ultimo_acesso?", "criado_em", "senha_alterada_em?", "desativado_em?", "data_modificacao"],
        "Sessao": ["id*", "token_hash", "ip?", "user_agent?", "criada_em", "expira_em", "encerrada_em?"],
        "PreferenciaUsuario": ["id*", "tema", "densidade", "notif_alertas_criticos", "notif_vacina_vencendo", "notif_superlotacao", "notif_resultado_lab", "notif_email_diario"],
        "Cargo": ["id*", "nome", "descricao?"],
        "UsuarioCargo (entidade associativa sobre 'tem')": ["adicionado_em"],
        "CargoPermissao (entidade associativa sobre 'concede')": ["modulo", "feature", "leitura", "escrita", "exclusao"],
        "AuditoriaEvento": ["id*", "acao", "entidade", "payload_antes?", "payload_depois?", "ip?", "ocorreu_em"]},
        "relacionamentos": [
            {"nome": "abre", "entre": ["Usuario", "Sessao"], "cardinalidades": {"junto a Usuario": "(0,1)", "junto a Sessao": "(0,n)"}},
            {"nome": "configura", "entre": ["Usuario", "PreferenciaUsuario"], "cardinalidades": {"junto a PreferenciaUsuario": "(0,1)"}},
            {"nome": "tem (UsuarioCargo)", "entre": ["Usuario", "Cargo"], "cardinalidades": {"junto a Usuario": "(0,n) e (1,1)", "junto a Cargo": "(0,n)"}},
            {"nome": "concede (CargoPermissao)", "entre": ["Cargo", "Usuario?"], "cardinalidades": {}, "observacao": "ligação ambígua na imagem"},
            {"nome": "produz", "entre": ["Usuario", "AuditoriaEvento"], "cardinalidades": {"junto a AuditoriaEvento": "(0,n)"}}]},
    "Figura 8": {"origem": "Figura 8 (p. 46)", "modulo": 2, "legibilidade": "texto pequeno; leitura por recortes", "entidades": {
        "Animal": ["id*", "numero_medalha", "data_implantacao_chip?", "numero_microchip?", "peso_kg?", "data_nascimento_aprox?", "nome?", "foto_url?", "status", "coloracao", "esterilizado", "data_esterilizacao?", "idade_aprox?", "motivo_entrada", "raca", "sexo", "porte", "observacoes?", "especie", "pelagem", "data_entrada", "data_saida?", "procedencia?", "criado_em", "atualizado_em"],
        "Motivo_entrada": ["id*", "codigo", "nome"], "Baia": ["id*", "nome", "capacidade", "animais_alojados", "finalidade?", "ativa", "observacoes?"], "Tipo_Baia": ["id*", "codigo", "nome"],
        "Status_Animal": ["id*", "codigo", "nome"], "Especie": ["id*", "codigo", "nome"], "AnexoAnimal": ["id*", "nome", "url", "tamanho_bytes?", "mime_type?", "criado_em"],
        "Vacinacao": ["id*", "data_aplicacao", "data_validade?", "dose?", "lote?", "observacoes?", "criado_em"], "Vacina": ["id*", "nome", "especie_aplicavel?", "intervalo_meses?"],
        "Usuário": ["id*", "email", "senha", "data_criacao", "data_modificacao", "nome", "sobrenome", "crmv?", "telefone?", "ativo", "dois_fatores_ativo", "ultimo_acesso?", "criado_em", "senha_alterada_em?", "desativado_em?"],
        "Procedimento": ["id*", "data", "descricao?", "resultado?", "anexo_url?", "criado_em"], "Tipo_Procedimento": ["id*", "codigo", "nome"],
        "Medicacao": ["id*", "medicamento", "dose", "via_administracao?", "data_inicio", "data_fim_prevista?", "data_fim_real?", "status", "criado_em"],
        "Exame": ["id*", "tipo_exame", "data_solicitacao", "data_resultado?", "anexo_url?", "criado_em"], "Laboratorio": ["id*", "codigo", "nome", "tipo?", "contato?"]},
        "relacionamentos": ["Entrou Por (Animal–Motivo_entrada) (0,n)/(1,1)", "Ocupa (Animal–Baia) (0,n)/(1,1)", "Recebe (Animal–Vacinacao) (1,1)/(0,n)", "Cadastra (Usuário–Animal)", "Possui (Animal–AnexoAnimal) (0,n)", "Esta (Animal–Status_Animal) (1,1)", "Possui (Animal–Especie) (0,n)", "Passa (Animal–Procedimento) (0,n)", "Toma (Animal–Medicacao) (0,n)", "Possui (Animal–Exame) (0,n)", "Realiza (Exame–Laboratorio) (1,1)", "Possui (Procedimento–Tipo_Procedimento) (1,1)", "Possui (Baia–Tipo_Baia) (1,1)", "Possui (Vacinacao–Vacina) (1,1)", "Aplica (Usuário–Vacinacao)", "Executa (Usuário–Procedimento)", "Prescrita (Usuário–Medicacao)"],
        "ausentes": ["Adocao", "Sintoma", "AnimalSintoma", "VacinaEspecie", "Medicamento", "CategoriaFarmacologica", "Prescricao", "TipoExame", "AnexoVacinacao", "AnexoProcedimento", "AnexoExame"]},
    "Figura 9": {"origem": "Figura 9 (p. 47)", "modulo": 3, "entidades": {
        "Ocorrencia": ["id*", "protocolo", "data_abertura", "hora_abertura?", "bairro?", "ponto_referencia?", "descricao", "urgente", "sigilosa", "status_ocorrencia", "descricao_encerramento?", "encerrada_em?", "criado_em", "atualizado_em"],
        "Processo_Sanitario": ["id*"], "Anexo_Ocorrencia": ["id*", "nome", "url", "tamanho_bytes?", "criado_em"],
        "Denunciante": ["id*", "nome?", "cpf?", "telefone?", "email?", "cep?", "endereco?", "bairro_residencial?"], "Denunciado": ["id*", "nome?", "cpf?", "telefone?", "endereco?", "observacoes?"],
        "Usuario": ["id*"], "Tipo_Ocorrencia": ["id*", "codigo", "nome", "ativo"], "ProvidenciaTomada": ["id*", "codigo", "nome", "ativo"], "Movimentacao_Ocorrencia": ["id*", "tipo_movimentacao", "data", "descricao?", "criado_em"]},
        "relacionamentos": [
            {"nome": "Gera", "entre": ["Ocorrencia", "Processo_Sanitario"], "cardinalidades": {"junto a Ocorrencia": "(0,1)", "junto a Processo_Sanitario": "(0,1)"}},
            {"nome": "Anexa", "entre": ["Ocorrencia", "Anexo_Ocorrencia"], "cardinalidades": {"junto a Ocorrencia": "(1,1)", "junto a Anexo_Ocorrencia": "(0,n)"}},
            {"nome": "Aponta", "entre": ["Ocorrencia", "Denunciante"], "cardinalidades": {"junto a Ocorrencia": "(1,1)", "junto a Denunciante": "(1,n)"}},
            {"nome": "Registra", "entre": ["Ocorrencia", "Denunciado"], "cardinalidades": {"junto a Ocorrencia": "(1,1)", "junto a Denunciado": "(1,n)"}},
            {"nome": "Registra", "entre": ["Ocorrencia", "Usuario"], "cardinalidades": {"junto a Ocorrencia": "(1,1)", "junto a Usuario": "(0,1)"}},
            {"nome": "Possui", "entre": ["Ocorrencia", "Tipo_Ocorrencia"], "cardinalidades": {"junto a Ocorrencia": "(0,n)", "junto a Tipo_Ocorrencia": "(0,1)"}},
            {"nome": "Encerra", "entre": ["Ocorrencia", "ProvidenciaTomada"], "cardinalidades": {"junto a ProvidenciaTomada": "(0,1)"}},
            {"nome": "Registra", "entre": ["Ocorrencia", "Movimentacao_Ocorrencia"], "cardinalidades": {"junto a Ocorrencia": "(1,1)", "junto a Movimentacao_Ocorrencia": "(0,n)"}}]},
    "Figura 10": {"origem": "Figura 10 (p. 48)", "modulo": 4, "entidades": {
        "Processo_Sanitario": ["id*", "protocolo", "urgente", "status_processo", "resultado_laboratorial?", "desfecho_animal?", "gal_numero?", "sinan_numero?", "data_abertura", "data_envio_amostras?", "data_resultado?", "previsao_retorno?", "observacoes?", "criado_em", "atualizado_em", "notificado_em?"],
        "Documento_Processo": ["id*", "nome", "url", "tamanho_bytes?", "criado_em", "status"], "TipoDocumento_Processo": ["id*", "nome", "ativo"],
        "Doenca": ["id*", "nome", "cid?", "ativo"], "Laboratorio": ["id*", "nome", "tipo?", "contato?", "ativo"], "Ocorrencia": ["id*"],
        "Responsavel_Processo": ["id*", "nome", "cpf?", "telefone?", "email?", "cep?", "endereco?", "bairro_residencial?", "bairro_ocorrencia?"], "Usuario": ["id*"],
        "AnimalAmostrado": ["id*", "numero_campo?", "sexo?", "coloracao?", "pelagem?", "idade_aprox?", "peso_kg?", "nome_animal?", "status_clinico?", "raca?", "especie", "material_biologico", "tipo_amostra?", "data_coleta?", "observacoes?", "agrediu_humano", "contato_humano", "alt_comportamental?", "nivel_contato?", "criado_em", "tipo_abrigo"],
        "Animal": ["id*"], "Sintoma": []},
        "relacionamentos": [
            {"nome": "Possui", "entre": ["Processo_Sanitario", "Documento_Processo"], "cardinalidades": {"junto a Processo": "(1,1)", "junto a Documento": "(0,n)"}},
            {"nome": "Classifica", "entre": ["Documento_Processo", "TipoDocumento_Processo"], "cardinalidades": {"junto a TipoDocumento": "(0,1)"}},
            {"nome": "Investiga", "entre": ["Processo_Sanitario", "Doenca"], "cardinalidades": {"junto a Processo": "(1,1)", "junto a Doenca": "(0,1)"}},
            {"nome": "Envia", "entre": ["Processo_Sanitario", "Laboratorio"], "cardinalidades": {"junto a Processo": "(1,1)", "junto a Laboratorio": "(0,1)"}},
            {"nome": "Origina", "entre": ["Ocorrencia", "Processo_Sanitario"], "cardinalidades": {"junto a Ocorrencia": "(1,n)", "junto a Processo_Sanitario": "(1,1)"}},
            {"nome": "Contém", "entre": ["Processo_Sanitario", "Responsavel_Processo"], "cardinalidades": {"junto a Processo": "(1,1)", "junto a Responsavel": "(0,1)"}},
            {"nome": "Cria", "entre": ["Processo_Sanitario", "Usuario"], "cardinalidades": {"junto a Processo": "(1,1)", "junto a Usuario": "(0,1)"}},
            {"nome": "Amostra", "entre": ["Processo_Sanitario", "AnimalAmostrado"], "cardinalidades": {"junto a Processo": "(0,n)", "junto a AnimalAmostrado": "(0,n)"}},
            {"nome": "Referencia", "entre": ["AnimalAmostrado", "Animal"], "cardinalidades": {"junto a AnimalAmostrado": "(1,1)", "junto a Animal": "(1,n)"}},
            {"nome": "Apresenta", "entre": ["AnimalAmostrado", "Sintoma"], "cardinalidades": {"junto a Sintoma": "(0,n)", "junto a AnimalAmostrado": "(0,n)"}}]},
    "Figura 11": {"origem": "Figura 11 (p. 49)", "modulo": 5, "entidades": {
        "RelatorioGerado": ["id*", "tipo_relatorio", "periodo_inicio?", "periodo_fim?", "parametros_jsonb?", "gerado_em", "status", "arquivo_url?", "tamanho_bytes?", "url_expira_em?"], "Usuario": ["id*"]},
        "relacionamentos": [{"nome": "gera", "entre": ["RelatorioGerado", "Usuario"], "cardinalidades": {"junto a RelatorioGerado": "(1,1)", "junto a Usuario": "(0,1)"}}]},
}

# ---------------- Diagrama logico (Fig. 12-16) ----------------
# colunas: "nome tipo [PK] [FK] [UQ] [NN]" ; '(?)' = leitura incerta
LOGICO = {
    "Figura 12": {"origem": "Figura 12 (p. 51)", "modulo": 1, "tabelas": {
        "Usuario": ["id uuid PK NN", "email varchar(255) UQ NN", "senha varchar(255) NN", "nome varchar(100) NN", "sobrenome varchar(100) NN", "crmv varchar(20)", "telefone varchar(20)", "ativo boolean NN", "ultimo_acesso timestamp", "criado_em timestamp NN", "senha_alterada_em timestamp", "desativado_em timestamp", "data_modificacao timestamp NN"],
        "Sessao": ["id uuid PK NN", "usuario_id uuid FK NN", "token_hash varchar(512) UQ NN", "ip varchar(45)", "user_agent text", "criada_em timestamp NN", "expira_em timestamp NN", "encerrada_em timestamp"],
        "Cargo": ["id uuid PK NN", "nome varchar(100) NN", "descricao text"],
        "PreferenciaUsuario": ["id uuid PK NN", "usuario_id uuid FK UQ NN", "tema TemaUsuario E NN", "densidade DensidadeUsuario E NN", "notif_alertas_criticos boolean NN", "notif_vacina_vencendo boolean NN", "notif_superlotacao boolean NN", "notif_resultado_lab boolean NN", "notif_email_diario boolean NN"],
        "AuditoriaEvento": ["id uuid PK NN", "usuario_id uuid FK", "acao AcaoAuditoria E NN", "entidade varchar(100) NN", "payload_antes jsonb", "payload_depois jsonb", "ip varchar(45)", "ocorreu_em timestamp NN"],
        "UsuarioCargo": ["usuario_id uuid PK FK NN", "cargo_id uuid PK FK NN", "adicionado_em timestamp NN"],
        "CargoPermissao": ["id uuid PK NN", "cargo_id uuid FK NN", "modulo Modulo E NN", "feature varchar(100) NN", "leitura boolean NN", "escrita boolean NN", "exclusao boolean NN"]}},
    "Figura 13": {"origem": "Figura 13 (p. 52)", "modulo": 2, "legibilidade": "parcial (texto muito pequeno)", "tabelas": {
        "MotivoEntrada": ["id uuid PK NN", "nome varchar(100) NN", "ativo boolean NN"], "TipoBaia": ["id uuid PK NN", "nome varchar(100) NN", "ativo boolean NN"],
        "Sintoma": ["id uuid PK NN", "codigo varchar(100)", "nome varchar(100) NN", "ativo boolean NN"], "Vacina": ["id uuid PK NN", "codigo varchar(100) UQ", "nome varchar(100) NN", "intervalo_meses integer", "ativo boolean NN"],
        "TipoProcedimento": ["id uuid PK NN", "nome varchar(100) NN", "ativo boolean NN"], "CategoriaFarmacologica": ["id uuid PK NN", "nome varchar(100) UQ NN", "ativo boolean NN"],
        "Laboratorio": ["id uuid PK NN", "nome varchar(150) NN", "tipo varchar(50)", "contato varchar(200)", "ativo boolean NN"], "Usuario": ["id uuid PK NN"], "TipoExame": ["id uuid PK NN", "nome varchar(100) UQ NN", "ativo boolean NN"],
        "Baia": ["id uuid PK NN", "nome varchar(100) NN", "capacidade integer NN", "animais_alojados integer NN", "finalidade varchar(120)(?)", "ativa boolean NN", "observacoes text", "tipo_baia_id uuid FK NN"],
        "VacinaEspecie": ["vacina_id uuid PK FK NN", "especie Especie E PK NN"], "Medicamento": ["id uuid PK NN", "nome varchar(100) NN", "categoria_id uuid FK NN", "ativo boolean NN"],
        "Animal": ["id uuid PK NN", "numero_medalha varchar(50) UQ(?)", "data_implantacao_chip date", "numero_microchip varchar(50) UQ", "peso_kg decimal(5,2)", "data_nascimento_aprox date", "nome varchar(100)", "foto_url varchar(500)", "coloracao varchar(100)", "esterilizado boolean NN", "data_esterilizacao date", "idade_aprox varchar(50)", "raca varchar(100)", "sexo Sexo E (sem NN visível)", "porte Porte E (sem NN visível)", "pelagem varchar(100)", "especie Especie E NN", "observacoes text", "procedencia varchar(200)", "data_entrada date (sem NN visível)", "data_saida date", "status_animal StatusAnimal E NN", "motivo_entrada_id uuid FK (sem NN visível)", "baia_id uuid FK (sem NN visível)", "cadastrado_por uuid FK", "criado_em timestamp NN", "atualizado_em timestamp NN"],
        "AnimalSintoma": ["animal_id uuid PK FK NN", "sintoma_id uuid PK FK NN"], "AnexoAnimal": ["id uuid PK NN", "animal_id uuid FK NN", "nome varchar(255) NN", "url varchar(500) NN", "tamanho_bytes bigint", "criado_em timestamp NN"],
        "Vacinacao": ["id uuid PK NN", "animal_id uuid FK NN", "vacina_id uuid FK NN", "aplicado_por uuid FK", "data_aplicacao date NN", "data_validade date", "numero_dose integer", "dose_quantidade decimal(8,3)", "dose_unidade UnidadeDose E", "lote varchar(100)", "observacoes text", "criado_em timestamp NN"],
        "Procedimento": ["id uuid PK NN", "animal_id uuid FK NN", "tipo_procedimento_id uuid FK NN", "executado_por uuid FK", "data date NN", "descricao text", "resultado text", "criado_em timestamp NN"],
        "Prescricao": ["id uuid PK NN", "animal_id uuid FK NN", "prescrito_por uuid FK", "medicamento_id uuid FK NN", "data_inicio date NN", "data_fim_prevista date", "data_fim_real date", "frequencia_aplicada integer NN", "unidade_frequencia UnidadeFrequencia E NN", "dose_quantidade decimal(8,3) NN", "dose_unidade UnidadeDose E NN", "via_administracao ViaAdministracao E NN", "status StatusPrescricao E NN", "criado_em timestamp NN"],
        "Exame": ["id uuid PK NN", "animal_id uuid FK NN", "laboratorio_id uuid FK NN", "tipo_exame_id uuid FK NN", "data_solicitacao date NN", "data_resultado date", "resultado text", "criado_em timestamp NN"],
        "AnexoVacinacao": ["id uuid PK NN", "vacinacao_id uuid FK NN", "nome varchar(255) NN", "url varchar(500) NN", "tamanho_bytes bigint", "criado_em timestamp NN"],
        "AnexoProcedimento": ["id uuid PK NN", "procedimento_id uuid FK NN", "nome varchar(255) NN", "url varchar(500) NN", "tamanho_bytes bigint", "criado_em timestamp NN"],
        "AnexoExame": ["id uuid PK NN", "exame_id uuid FK NN", "nome varchar(255) NN", "url varchar(500) NN", "tamanho_bytes bigint", "criado_em timestamp NN"]},
        "ausentes": ["Adocao"]},
    "Figura 14": {"origem": "Figura 14 (p. 53)", "modulo": 3, "tabelas": {
        "TipoOcorrencia": ["id uuid PK NN", "nome varchar(100) NN", "ativo boolean NN"], "ProvidenciaTomada": ["id uuid PK NN", "nome varchar(100) NN", "ativo boolean NN"],
        "Denunciante": ["id uuid PK NN", "nome varchar(200) NN", "cpf varchar(14)", "telefone varchar(20)", "email varchar(255)", "cep varchar(10)", "endereco varchar(300)", "bairro_residencial varchar(100)"],
        "Denunciado": ["id uuid PK NN", "nome varchar(200) NN", "cpf varchar(14)", "telefone varchar(20)", "endereco varchar(300)", "observacoes text"],
        "Usuario": ["id uuid PK NN", "email varchar(255) UQ NN", "senha varchar(255) NN", "nome varchar(100) NN", "sobrenome varchar(100) NN", "crmv varchar(20)", "telefone varchar(20)", "ativo boolean NN", "dois_fatores_ativo boolean NN", "ultimo_acesso timestamp", "criado_em timestamp NN", "senha_alterada_em timestamp", "desativado_em timestamp", "data_modificacao timestamp NN"],
        "Ocorrencia": ["id uuid PK NN", "protocolo varchar(50) UQ NN", "registrado_por uuid FK NN", "tipo_ocorrencia_id uuid FK NN", "status_ocorrencia StatusOcorrencia E NN", "providencia_tomada_id uuid FK", "denunciante_id uuid FK", "denunciado_id uuid FK", "data_abertura date NN", "hora_abertura time", "bairro varchar(100)", "ponto_referencia varchar(200)", "descricao text NN", "urgente boolean NN", "sigilosa boolean NN", "descricao_encerramento text", "encerrada_em timestamp", "criado_em timestamp NN", "atualizado_em timestamp NN"],
        "AnexoOcorrencia": ["id uuid PK NN", "ocorrencia_id uuid FK NN", "nome varchar(255) NN", "url varchar(500) NN", "tamanho_bytes bigint", "criado_em timestamp NN"],
        "MovimentacaoOcorrencia": ["id uuid PK NN", "ocorrencia_id uuid FK NN", "usuario_id uuid FK", "tipo_movimentacao TipoMovimentacaoOcorrencia E NN", "data timestamp NN", "descricao text", "criado_em timestamp NN"]}},
    "Figura 15": {"origem": "Figura 15 (p. 54)", "modulo": 4, "tabelas": {
        "ProcessoSanitario": ["id uuid PK NN", "protocolo varchar(9) UQ NN", "criado_por uuid FK NN", "doenca_id uuid FK NN", "status_processo StatusProcesso E NN", "laboratorio_id uuid FK", "resultado_laboratorial ResultadoLaboratorial E", "desfecho_animal DesfechoAnimal E", "responsavel_id uuid FK NN", "ocorrencia_id uuid FK", "urgente boolean NN", "gal_numero varchar(50)", "sinan_numero varchar(50)", "data_abertura date NN", "data_envio_amostras date", "data_resultado date", "previsao_retorno date", "observacoes text", "criado_em timestamp NN", "atualizado_em timestamp NN", "notificado_em timestamp"],
        "DocumentoProcesso": ["id uuid PK NN", "processo_id uuid FK NN", "criado_por uuid FK", "nome varchar(255) NN", "url varchar(500) NN", "tipo_id uuid FK NN", "status StatusDocumento E", "tamanho_bytes bigint", "criado_em timestamp NN"],
        "AmostraSintoma": ["amostra_id uuid PK FK NN", "sintoma_id uuid PK FK NN"],
        "AmostraAnimal": ["id uuid PK NN", "processo_id uuid FK NN", "animal_id uuid FK", "especie Especie E NN", "sexo Sexo E", "coloracao varchar(100)", "pelagem varchar(100)", "idade_aprox varchar(50)", "peso_kg decimal(5,2)", "nome_animal varchar(100)", "status_clinico varchar(100)", "raca varchar(100)", "tipo_abrigo TipoAbrigo E NN", "material_biologico MaterialBiologico E", "tipo_amostra TipoAmostra E", "data_coleta date", "observacoes text", "agrediu_humano boolean", "contato_humano boolean NN", "alt_comportamental varchar(200)", "nivel_contato NivelContato E", "criado_em timestamp NN"],
        "ResponsavelProcesso": ["id uuid PK NN", "nome varchar(200) NN", "cpf varchar(14) UQ", "telefone varchar(20)", "email varchar(255)", "cep varchar(10)", "endereco varchar(300)", "bairro_residencial varchar(100)", "bairro_ocorrencia varchar(100)"],
        "Doenca": ["id uuid PK NN", "nome varchar(150) NN", "cid varchar(20)", "ativo boolean NN"], "TipoDocumentoProcesso": ["id uuid PK NN", "nome varchar(100) UQ NN", "ativo boolean NN"],
        "Usuario": ["id uuid PK NN"], "Laboratorio": ["id uuid PK NN"], "Ocorrencia": ["id uuid PK NN"], "Animal": ["id uuid PK NN"], "Sintoma": ["id uuid PK NN"]}},
    "Figura 16": {"origem": "Figura 16 (p. 55)", "modulo": 5, "tabelas": {
        "RelatorioGerado": ["id uuid PK NN", "gerado_por uuid FK NN", "tipo_relatorio TipoRelatorio E NN", "periodo_inicio date", "periodo_fim date", "parametros_jsonb jsonb", "gerado_em timestamp NN", "status StatusRelatorio E NN", "arquivo_url varchar(500)", "url_expira_em timestamp", "tamanho_bytes bigint"], "Usuario": ["id uuid PK NN"]}},
}

# ---------------- Diagrama de classes (Fig. 17-25) ----------------
CLASSES = {
    "Figura 17": {"origem": "Figura 17 (p. 58)", "modulo": 1, "classes": {
        "Usuario": {"atributos": ["UUID id", "String email", "String senhaHash", "String nome", "String sobrenome", "String crmv", "String telefone", "Boolean ativo", "LocalDateTime ultimoAcesso", "LocalDateTime criadoEm", "LocalDateTime senhaAlteradaEm", "LocalDateTime desativadoEm", "LocalDateTime dataModificacao"],
                    "metodos": ["registrarAcesso():void", "trocarSenha(String novoHash):void", "precisaTrocarSenha():Boolean", "desativar():void", "reativar():void", "estaAtivo():Boolean", "possuiPermissao(Modulo m, String feature, TipoAcesso acesso):Boolean"]},
        "UsuarioCargo (classe de associação)": {"atributos": ["LocalDateTime adicionadoEm"], "metodos": []},
        "Cargo": {"atributos": ["UUID id", "String nome", "String descricao"], "metodos": ["concedeAcessoTotal():Boolean"]},
        "CargoPermissao": {"atributos": ["UUID id", "Modulo modulo", "String feature", "Boolean leitura", "Boolean escrita", "Boolean exclusao"], "metodos": ["permite(TipoAcesso acesso):Boolean"]},
        "PreferenciaUsuario": {"atributos": ["UUID id", "TemaUsuario tema", "DensidadeUsuario densidade"], "metodos": []},
        "AuditoriaEvento": {"atributos": ["UUID id", "AcaoAuditoria acao", "String entidade", "JsonNode payloadAntes", "JsonNode payloadDepois", "String ip", "LocalDateTime ocorreuEm"], "metodos": ["registrar(Usuario usuario, AcaoAuditoria acao, String entidade, JsonNode antes, JsonNode depois):AuditoriaEvento {static}"]}},
        "associacoes": ["Usuario * —recebe— 1..* Cargo (classe de associação UsuarioCargo)", "Usuario 1 —configura— 0..1 PreferenciaUsuario", "Usuario 1 —gera— * AuditoriaEvento", "Cargo 1 ◆—define— * CargoPermissao"],
        "enums": {"Modulo": ["USUARIOS_ACESSO", "GESTAO_ANIMAIS", "OCORRENCIAS_DENUNCIAS", "PROCESSOS_SANITARIOS", "RELATORIOS"], "TipoAcesso": ["LEITURA", "ESCRITA", "EXCLUSAO"], "AcaoAuditoria": ["CRIACAO", "ATUALIZACAO", "DESATIVACAO", "REATIVACAO", "VISUALIZACAO", "LOGIN", "LOGOUT", "EXPORTACAO", "ENCERRAMENTO"], "TemaUsuario": ["LIGHT", "DARK"], "DensidadeUsuario": ["COMPACTO", "NORMAL", "CONFORTAVEL"]}},
    "Figura 18": {"origem": "Figura 18 (p. 59)", "modulo": 2, "classes": {
        "TipoBaia": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Baia": {"atributos": ["UUID id", "String nome", "Integer capacidade", "String finalidade", "Boolean ativa", "String observacoes"], "metodos": ["calcularOcupacao():Integer", "temVaga():Boolean", "estaSuperlotada():Boolean"]},
        "MotivoEntrada": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Usuario «external»": {"atributos": ["UUID id"], "metodos": []},
        "Animal": {"atributos": ["UUID id", "String numeroMicrochip", "LocalDate dataImplantacaoChip", "String numeroMedalha", "String nome", "Especie especie", "Sexo sexo", "Porte porte", "String raca", "String pelagem", "String coloracao", "LocalDate dataNascimentoAprox", "String idadeAprox", "BigDecimal pesoKg", "String fotoUrl", "Boolean esterilizado", "LocalDate dataEsterilizacao", "String procedencia", "String observacoes", "StatusAnimal statusAnimal", "LocalDate dataEntrada", "LocalDate dataSaida", "LocalDateTime criadoEm", "LocalDateTime atualizadoEm"],
                   "metodos": ["registrarMicrochip(String numero, LocalDate dataImplantacao):void", "transferirBaia(Baia destino):void", "registrarSaida(StatusAnimal desfecho, LocalDate data):void", "esterilizar(LocalDate data):void", "temFichaCompleta():Boolean", "podeSerAdotado():Boolean", "estaAlojado():Boolean"]},
        "Adocao": {"atributos": ["UUID id", "String adotanteNome", "String adotanteCpf", "String adotanteTelefone", "String adotanteEmail", "String adotanteCep", "String adotanteEndereco", "String adotanteBairro", "LocalDate dataAdocao", "LocalDate dataDevolucao", "String motivoDevolucao", "String observacoes", "LocalDateTime criadoEm"], "metodos": ["registrarDevolucao(LocalDate data, String motivo):void", "foiDevolvida():Boolean"]},
        "AnexoAnimal": {"atributos": ["UUID id", "String nome", "String url", "Long tamanhoBytes", "LocalDateTime criadoEm"], "metodos": []}},
        "associacoes": ["TipoBaia 1 —categoriza— * Baia", "MotivoEntrada 1 —justifica— * Animal", "Usuario 1 —cadastra— * Animal", "Usuario 1 —registra— * Adocao", "Baia 1 —abriga— * Animal", "Animal 1 —adotado em— * Adocao", "Animal 1 ◆—possui— * AnexoAnimal"]},
    "Figura 19": {"origem": "Figura 19 (p. 60)", "modulo": 2, "classes": {
        "Vacina": {"atributos": ["UUID id", "String codigo", "String nome", "Integer intervaloMeses", "Boolean ativo"], "metodos": ["exigeReforco():Boolean", "aplicavelA(Especie e):Boolean"]},
        "VacinaEspecie": {"atributos": ["Especie especie"], "metodos": []},
        "Vacinacao": {"atributos": ["UUID id", "LocalDate dataAplicacao", "LocalDate dataValidade", "Integer numeroDose", "BigDecimal doseQuantidade", "UnidadeDose doseUnidade", "String lote", "String observacoes", "LocalDateTime criadoEm"], "metodos": ["calcularPrevisaoRetorno(Integer intervaloMeses):LocalDate", "venceEm(Integer dias, LocalDate hoje):Boolean"]},
        "AnexoVacinacao": {"atributos": ["UUID id", "String nome", "String url", "Long tamanhoBytes", "LocalDateTime criadoEm"], "metodos": []},
        "CategoriaFarmacologica": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Medicamento": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Prescricao": {"atributos": ["UUID id", "LocalDate dataInicio", "LocalDate dataFimPrevista", "LocalDate dataFimReal", "Integer frequenciaAplicada", "UnidadeFrequencia unidadeFrequencia", "BigDecimal doseQuantidade", "UnidadeDose doseUnidade", "ViaAdministracao viaAdministracao", "StatusPrescricao status", "LocalDateTime criadoEm"], "metodos": ["concluir():void", "suspender():void", "cancelar():void", "estaVigente(LocalDate hoje):Boolean"]},
        "Animal (reduzida)": {"atributos": ["UUID id", "String nome"], "metodos": []}, "Usuario «external»": {"atributos": ["UUID id"], "metodos": []}},
        "associacoes": ["Vacina 1 ◆—direcionada a— 1..* VacinaEspecie", "Vacina 1 —utilizada em— * Vacinacao", "Usuario 1 —aplica— * Vacinacao", "Usuario 1 —prescreve— * Prescricao", "Animal 1 —recebe— * Vacinacao", "Animal 1 —recebe— * Prescricao", "Vacinacao 1 ◆—possui— * AnexoVacinacao", "CategoriaFarmacologica 1 —classifica— * Medicamento", "Medicamento 1 —indicado em— * Prescricao"]},
    "Figura 20": {"origem": "Figura 20 (p. 61)", "modulo": 2, "classes": {
        "TipoProcedimento": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Procedimento": {"atributos": ["UUID id", "LocalDate data", "String descricao", "String resultado", "LocalDateTime criadoEm"], "metodos": ["foiConcluido():Boolean"]},
        "AnexoProcedimento": {"atributos": ["UUID id", "String nome", "String url", "Long tamanhoBytes", "LocalDateTime criadoEm"], "metodos": []},
        "Sintoma": {"atributos": ["UUID id", "String codigo", "String nome", "Boolean ativo"], "metodos": []},
        "TipoExame": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Laboratorio": {"atributos": ["UUID id", "String nome", "String tipo", "String contato", "Boolean ativo"], "metodos": []},
        "Exame": {"atributos": ["UUID id", "LocalDate dataSolicitacao", "LocalDate dataResultado", "String resultado", "LocalDateTime criadoEm"], "metodos": ["registrarResultado(String resultado, LocalDate data):void", "aguardandoResultado():Boolean"]},
        "AnexoExame": {"atributos": ["UUID id", "String nome", "String url", "Long tamanhoBytes", "LocalDateTime criadoEm"], "metodos": []},
        "Animal (reduzida)": {"atributos": ["UUID id", "String nome"], "metodos": []}, "Usuario «external»": {"atributos": ["UUID id"], "metodos": []}},
        "associacoes": ["TipoProcedimento 1 —classifica— * Procedimento", "Usuario 1 —executa— * Procedimento", "Animal 1 —submetido a— * Procedimento", "Animal * —apresenta— * Sintoma", "Procedimento 1 ◆—possui— * AnexoProcedimento", "Animal 1 —realiza— * Exame", "TipoExame 1 —classifica— * Exame", "Laboratorio 1 —processa— * Exame", "Exame 1 ◆—possui— * AnexoExame"]},
    "Figura 21": {"origem": "Figura 21 (p. 62)", "modulo": 2, "enums": {"Especie": ["CANINO", "FELINO", "QUIROPTERO", "PRIMATA_NAO_HUMANO"], "StatusAnimal": ["DISPONIVEL_ADOCAO", "EM_TRATAMENTO", "QUARENTENA", "ADOTADO", "RESGATADO", "OBITO", "EUTANASIA", "TRANSFERIDO"], "Sexo": ["MACHO", "FEMEA"], "Porte": ["P", "M", "G"], "UnidadeFrequencia": ["HORAS", "DIAS"], "StatusPrescricao": ["ATIVA", "CONCLUIDA", "SUSPENSA", "CANCELADA"], "ViaAdministracao": ["ORAL", "INTRAVENOSA", "INTRAMUSCULAR", "SUBCUTANEA", "TOPICA"], "UnidadeDose": ["MILIGRAMA", "MICROGRAMA", "GRAMA", "MILILITRO", "UNIDADE_INTERNACIONAL"]}},
    "Figura 22": {"origem": "Figura 22 (p. 63)", "modulo": 3, "classes": {
        "Ocorrencia": {"atributos": ["UUID id", "String protocolo", "StatusOcorrencia status", "LocalDate dataAbertura", "LocalTime horaAbertura", "String bairro", "String pontoReferencia", "String descricao", "Boolean urgente", "Boolean sigilosa", "String descricaoEncerramento", "LocalDateTime encerradaEm", "LocalDateTime criadoEm", "LocalDateTime atualizadoEm"],
                       "metodos": ["podeSerEncerrada():Boolean", "encerrar(ProvidenciaTomada providencia, String descricao):void", "estaEncerrada():Boolean", "denuncianteVisivelPara(Boolean ehAdministrador):Boolean", "marcarUrgente():void"]},
        "TipoOcorrencia": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []}, "ProvidenciaTomada": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "MovimentacaoOcorrencia": {"atributos": ["UUID id", "TipoMovimentacaoOcorrencia tipoMovimentacao", "LocalDateTime data", "String descricao", "LocalDateTime criadoEm"], "metodos": []},
        "Denunciado": {"atributos": ["UUID id", "String nome", "String cpf", "String telefone", "String endereco", "String observacoes"], "metodos": []},
        "Denunciante": {"atributos": ["UUID id", "String nome", "String cpf", "String telefone", "String email", "String cep", "String endereco", "String bairroResidencial"], "metodos": ["temContatoValido():Boolean"]},
        "AnexoOcorrencia": {"atributos": ["UUID id", "String nome", "String url", "Long tamanhoBytes", "LocalDateTime criadoEm"], "metodos": []},
        "ProcessoSanitario «external»": {"atributos": ["UUID id"], "metodos": ["possuiResultado():Boolean"]}, "Usuario «external»": {"atributos": ["UUID id"], "metodos": []}},
        "associacoes": ["Usuario 1 —registra— * Ocorrencia", "Usuario 1 —executa— * MovimentacaoOcorrencia", "TipoOcorrencia 1 —classifica— * Ocorrencia", "ProvidenciaTomada 0..1 —encerra— * Ocorrencia", "Ocorrencia 1 ◆—registra— * MovimentacaoOcorrencia", "Ocorrencia 1 ◆—envolve— 0..1 Denunciado", "Ocorrencia 1 ◆—possui— * AnexoOcorrencia", "Ocorrencia 0..1 —origina— 0..1 ProcessoSanitario", "Ocorrencia 1 ◆—relatada por— 0..1 Denunciante"],
        "enums": {"StatusOcorrencia": ["ABERTA", "EM_ATENDIMENTO", "AGUARDANDO_RETORNO", "ENCERRADA"], "TipoMovimentacaoOcorrencia": ["ABERTURA", "ATRIBUICAO", "ATUALIZACAO", "GERACAO_PROCESSO", "ENCERRAMENTO"]}},
    "Figura 23": {"origem": "Figura 23 (p. 64)", "modulo": 4, "classes": {
        "ProcessoSanitario": {"atributos": ["UUID id", "String protocolo", "StatusProcesso status", "ResultadoLaboratorial resultado", "DesfechoAnimal desfecho", "Boolean urgente", "String galNumero", "String sinanNumero", "LocalDate dataAbertura", "LocalDate dataEnvioAmostras", "LocalDate previsaoRetorno", "LocalDate dataResultado", "LocalDateTime notificadoEm", "String observacoes", "LocalDateTime criadoEm", "LocalDateTime atualizadoEm"],
                              "metodos": ["avancarStatus(StatusProcesso destino):void", "registrarResultado(ResultadoLaboratorial resultado, LocalDate data):void", "possuiResultado():Boolean", "marcarUrgente():void", "exigeNotificacao():Boolean"]},
        "Doenca": {"atributos": ["UUID id", "String nome", "String cid", "Boolean ativo"], "metodos": []},
        "ResponsavelProcesso": {"atributos": ["UUID id", "String nome", "String cpf", "String telefone", "String email", "String cep", "String endereco", "String bairroResidencial", "String bairroOcorrencia"], "metodos": ["podeReceberNotificacao():Boolean"]},
        "AmostraAnimal": {"atributos": ["UUID id", "Especie especie", "Sexo sexo", "String nomeAnimal", "String raca", "String coloracao", "String pelagem", "String idadeAprox", "BigDecimal pesoKg", "String statusClinico", "TipoAbrigo tipoAbrigo", "MaterialBiologico materialBiologico", "TipoAmostra tipoAmostra", "LocalDate dataColeta", "Boolean contatoHumano", "NivelContato nivelContato", "Boolean agrediuHumano", "String altComportamental", "String observacoes", "LocalDateTime criadoEm"], "metodos": ["exigeUrgencia():Boolean"]},
        "DocumentoProcesso": {"atributos": ["UUID id", "String nome", "String url", "Long tamanhoBytes", "StatusDocumento status", "LocalDateTime criadoEm"], "metodos": []},
        "TipoDocumentoProcesso": {"atributos": ["UUID id", "String nome", "Boolean ativo"], "metodos": []},
        "Laboratorio «external»": {"atributos": ["UUID id"], "metodos": []}, "Ocorrencia «external»": {"atributos": ["UUID id"], "metodos": []}, "Usuario «external»": {"atributos": ["UUID id"], "metodos": []}, "Animal «external»": {"atributos": ["UUID id"], "metodos": []}, "Sintoma «external»": {"atributos": ["UUID id"], "metodos": []}},
        "associacoes": ["Doenca 1 —investigada em— * ProcessoSanitario", "ResponsavelProcesso 1 —responde por— * ProcessoSanitario", "Laboratorio 1 —analisa— * ProcessoSanitario", "Ocorrencia 0..1 —origina— * ProcessoSanitario", "Usuario 1 —cria— * ProcessoSanitario", "Usuario 1 —cria— * DocumentoProcesso", "Animal 0..1 —amostrado em— * AmostraAnimal", "ProcessoSanitario 1 ◆—avalia— 1..* AmostraAnimal", "ProcessoSanitario 1 ◆—possui— * DocumentoProcesso", "TipoDocumentoProcesso 1 —tipifica— * DocumentoProcesso", "AmostraAnimal * —apresenta— * Sintoma"]},
    "Figura 24": {"origem": "Figura 24 (p. 65)", "modulo": 4, "enums": {"StatusProcesso": ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_RESULTADO", "CONCLUIDO"], "ResultadoLaboratorial": ["NEGATIVO", "POSITIVO", "MATERIAL_INADEQUADO", "INCONCLUSIVO", "NAO_REALIZADO", "AGUARDANDO"], "DesfechoAnimal": ["OBITO_NATURAL", "EUTANASIA", "EM_ACOMPANHAMENTO", "OUTRO"], "NivelContato": ["DIRETO", "INDIRETO", "SEM_CONTATO"], "MaterialBiologico": ["SORO", "SANGUE_TOTAL", "SWAB", "TECIDO", "LIQUOR", "PELO_ESCAMA"], "TipoAmostra": ["IN_NATURA", "CONGELADO", "FIXADO_FORMOL", "GELO_RECICLAVEL"], "TipoAbrigo": ["INTRADOMICILIAR", "PERIDOMICILIAR", "SILVESTRE", "NAO_IDENTIFICADO"], "StatusDocumento": ["PENDENTE", "EM_PROCESSAMENTO", "CONCLUIDO", "FALHA"]}},
    "Figura 25": {"origem": "Figura 25 (p. 66)", "modulo": 5, "classes": {
        "RelatorioGerado": {"atributos": ["UUID id", "TipoRelatorio tipoRelatorio", "LocalDate periodoInicio", "LocalDate periodoFim", "JsonNode parametros", "LocalDateTime geradoEm", "StatusRelatorio status", "String arquivoUrl", "Long tamanhoBytes", "LocalDateTime urlExpiraEm"], "metodos": ["avancarStatus(StatusRelatorio destino):void", "concluir(String arquivoUrl, Long tamanhoBytes):void", "falhar():void", "estaDisponivel(LocalDateTime agora):Boolean", "urlExpirada(LocalDateTime agora):Boolean"]},
        "Usuario «external»": {"atributos": ["UUID id"], "metodos": []}},
        "associacoes": ["Usuario 1 —gera— * RelatorioGerado"],
        "enums": {"StatusRelatorio": ["PENDENTE", "EM_PROCESSAMENTO", "CONCLUIDO", "FALHA"], "TipoRelatorio": ["ANUAL_PROCESSOS", "VACINACAO", "ADOCOES", "PROCEDIMENTOS", "OCUPACAO_BAIAS", "OCORRENCIAS_BAIRRO"]}},
}

ENUMS_NO_TEXTO = {
    "ResultadoLaboratorial": {"origem": "RF-B03 (Quadro 9); Quadro 42", "valores": ["Negativo", "Positivo", "Material Inadequado", "Inconclusivo", "Não Realizado", "Aguardando"]},
    "StatusAnimal (destinos de saída)": {"origem": "RF-A05 (Quadro 7); Quadro 25", "valores": ["Adotado", "Resgatado", "Óbito", "Eutanásia", "Transferido"]},
    "StatusProcesso": {"origem": "RN12 (Quadro 13)", "valores": ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_RESULTADO", "CONCLUIDO"]},
    "StatusRelatorio / StatusDocumento": {"origem": "RN11; RF-B06; RF-D02; Quadros 45, 49, 50", "valores": ["Pendente", "Em Processamento", "Concluído", "Falha"]},
    "Especie": {"origem": "Quadro 67, Quadro 92 (descrição)", "valores": ["canino", "felino", "quiróptero", "primata não humano"]},
    "TipoAbrigo": {"origem": "Quadro 92", "valores": ["intradomiciliar", "peridomiciliar", "silvestre", "não identificado"]},
    "TemaUsuario": {"origem": "Quadro 56", "valores": ["claro", "escuro"]}, "Porte": {"origem": "Quadro 67", "valores": ["P", "M", "G"]}, "UnidadeFrequencia": {"origem": "Quadro 75", "valores": ["horas", "dias"]},
    "TipoRelatorio": {"origem": "Quadro 94; Quadro 11; Quadro 49", "valores": ["ocorrências por bairro", "ocupação de baias", "procedimentos", "adoções", "anual de processos", "vacinação"]},
    "AcaoAuditoria (no Apêndice A)": {"origem": "Quadros 16, 17, 19, 21", "valores": ["LOGIN", "LOGOUT", "CRIACAO", "ATUALIZACAO", "DESATIVACAO", "REATIVACAO"]},
    "TipoMovimentacaoOcorrencia (no Apêndice A)": {"origem": "Quadros 35, 39", "valores": ["ABERTURA", "ENCERRAMENTO"]},
    "StatusOcorrencia (no Apêndice A)": {"origem": "Quadro 39", "valores": ["aberta", "em atendimento", "encerrada"]},
    "Modulo (letras RN09)": {"origem": "RN09", "valores": ["A = Gestão de Animais", "B = Processos", "D = Dashboard/Relatórios", "E = Ocorrências"]},
}

RELATORIOS = {"origem": "Quadro 11 (p. 31 conforme sumário)", "itens": [
    {"relatorio": "Ocorrências por Bairro", "conteudo": "Concentração de ocorrências por bairro, apresentada em mapa de calor tabular, sem georreferenciamento; tipos de denúncia mais frequentes; tempo médio de atendimento.", "requisito": "RF-D02", "enum": "OCORRENCIAS_BAIRRO", "tela": "T23 (Fig. 54, Ap. E)", "prototipo_fig30": "Ocorrências por Bairro"},
    {"relatorio": "Ocupação de Baias", "conteudo": "Histórico mensal de ocupação por baia, transferências internas e taxa média de superlotação.", "requisito": "RF-D02", "enum": "OCUPACAO_BAIAS", "tela": "T22 (Fig. 53, Ap. E)", "prototipo_fig30": "Ocupação de Baias"},
    {"relatorio": "Procedimentos", "conteudo": "Castrações, cirurgias e atendimentos clínicos consolidados, com produtividade por veterinário.", "requisito": "RF-D02", "enum": "PROCEDIMENTOS", "tela": "T21 (Fig. 52, Ap. E)", "prototipo_fig30": "Relatório de Procedimentos"},
    {"relatorio": "Adoções", "conteudo": "Adoções realizadas, tempo médio de permanência, perfil dos adotantes e taxa de devolução.", "requisito": "RF-D02, RF-A05", "enum": "ADOCOES", "tela": "T20 (Fig. 51, Ap. E)", "prototipo_fig30": "Relatório de Adoções"},
    {"relatorio": "Anual de Processos", "conteudo": "Distribuição das investigações sanitárias por doença, espécie e bairro, com taxa de positividade e tempo médio de resolução.", "requisito": "RF-D02, RF-B07", "enum": "ANUAL_PROCESSOS", "tela": "T18 (Fig. 49, Ap. E)", "prototipo_fig30": "Relatório Anual de Processos"},
    {"relatorio": "Vacinação", "conteudo": "Animais vacinados, vacinas vencidas e próximas a vencer, por espécie, baia e veterinário responsável.", "requisito": "RF-D02", "enum": "VACINACAO", "tela": "T19 (Fig. 50, Ap. E)", "prototipo_fig30": "Relatório de Vacinação"}],
    "formatos": {"RF-D02": "PDF e CSV", "Fig. 30 (protótipo)": "PDF, CSV e Excel"}}

TELAS_FIGURAS = {  # codigo -> figuras/protótipos
    "T01": {"figura_cap5": "Fig. 31 (placeholder)"}, "T02": {"figura_cap5": "Fig. 32 (placeholder)", "prototipo": "Fig. 26"}, "T03": {"figura_cap5": "Fig. 33 (placeholder)"},
    "T04": {"figura_cap5": "Fig. 34 (placeholder)"}, "T05": {"figura_cap5": "Fig. 35 (placeholder)"}, "T06": {"figura_cap5": "Fig. 36 (placeholder)", "prototipo": "Fig. 27"},
    "T07": {"figura_cap5": "Fig. 37 (placeholder)", "prototipo": "Fig. 29"}, "T08": {"figura_cap5": "Fig. 38 (placeholder)"}, "T09": {"figura_cap5": "Fig. 39 (placeholder)"},
    "T10": {"figura_cap5": "Fig. 40 (placeholder)", "prototipo": "Fig. 28"}, "T11": {"figura_cap5": "Fig. 41 (placeholder)"}, "T12": {"figura_cap5": "Fig. 42 (placeholder)"},
    "T13": {"figura_cap5": "Fig. 43 (placeholder)"}, "T14": {"figura_cap5": "Fig. 44 (placeholder)", "prototipo": "Fig. 30"}, "T15": {"figura_cap5": "Fig. 45 (placeholder)"},
    "T16": {"figura_cap5": "Fig. 46 (placeholder)"}, "T17": {"figura_cap5": "Fig. 47 (placeholder)"},
    "T18": {"figura_apE": "Fig. 49 (Ap. E, placeholder; número duplicado)", "nome": "Relatório anual de processos", "quadro15": False},
    "T19": {"figura_apE": "Fig. 50 (Ap. E, placeholder; número duplicado)", "nome": "Relatório de vacinação", "quadro15": False},
    "T20": {"figura_apE": "Fig. 51 (Ap. E, placeholder; número duplicado)", "nome": "Relatório de adoções", "quadro15": False},
    "T21": {"figura_apE": "Fig. 52 (Ap. E, placeholder; número duplicado)", "nome": "Relatório de procedimentos", "quadro15": False},
    "T22": {"figura_apE": "Fig. 53 (Ap. E, placeholder; número duplicado)", "nome": "Relatório de ocupação de baias", "quadro15": False},
    "T23": {"figura_apE": "Fig. 54 (Ap. E, placeholder; número duplicado)", "nome": "Relatório de ocorrências por bairro", "quadro15": False},
}

TECNOLOGIAS = {"origem": "Seção 2.3 (p. 25–27), Seção 5.1 e Quadro 14 (p. 78 conforme sumário)", "itens": [
    {"nome": "Java", "versao": "21", "origem": "2.3.1"}, {"nome": "Spring Boot", "versao": "3", "origem": "2.3.1"}, {"nome": "Apache Maven", "versao": None, "origem": "2.3.1"},
    {"nome": "Spring Security", "versao": None, "origem": "2.3.1; Quadro 14"}, {"nome": "JWT (RFC 7519) / jjwt", "versao": None, "origem": "2.3.1; Quadro 14"},
    {"nome": "React", "versao": "18", "origem": "2.3.2"}, {"nome": "TypeScript", "versao": None, "origem": "2.3.2"}, {"nome": "Vite", "versao": None, "origem": "2.3.2"},
    {"nome": "PostgreSQL", "versao": "16", "origem": "2.3.3; 4.3; 4 (intro)"}, {"nome": "Spring Data JPA / Hibernate (Jakarta Persistence)", "versao": None, "origem": "2.3.3; Quadro 14"}, {"nome": "Flyway", "versao": None, "origem": "2.3.3; Quadro 14"},
    {"nome": "UUID v4 (chaves primárias)", "versao": None, "origem": "4 (intro); 4.3; 4.4"}, {"nome": "bcrypt", "versao": None, "origem": "RNF06; Quadro 16; Quadro 52"}, {"nome": "HTTPS", "versao": None, "origem": "RNF06"},
    {"nome": "Git/GitHub/GitHub Actions", "versao": None, "origem": "2.3.4"}, {"nome": "Docker/Docker Compose", "versao": None, "origem": "2.3.4"}, {"nome": "pgAdmin", "versao": None, "origem": "2.3.4"}, {"nome": "Insomnia", "versao": None, "origem": "2.3.4"},
    {"nome": "PlantUML", "versao": None, "origem": "2.3.4; 1.11; 4.1; 4.5"}, {"nome": "brModelo", "versao": None, "origem": "2.3.4; 1.12; 4.2"}, {"nome": "dbdiagram.io", "versao": None, "origem": "2.3.4; 4.3"}, {"nome": "HTML/CSS (protótipos)", "versao": None, "origem": "2.3.4; 1.13; 4.6"},
    {"nome": "Bean Validation (Spring Validation)", "versao": None, "origem": "Quadro 14"}, {"nome": "Spring Boot Mail e Thymeleaf", "versao": None, "origem": "Quadro 14"}, {"nome": "OpenPDF", "versao": None, "origem": "Quadro 14"}, {"nome": "Lombok", "versao": None, "origem": "Quadro 14"},
    {"nome": "React Router", "versao": None, "origem": "Quadro 14"}, {"nome": "TanStack Query e Axios", "versao": None, "origem": "Quadro 14"}, {"nome": "Zod", "versao": None, "origem": "Quadro 14"}, {"nome": "idb (IndexedDB)", "versao": None, "origem": "Quadro 14"}, {"nome": "Recharts", "versao": None, "origem": "Quadro 14"},
    {"nome": "JUnit 5, Testcontainers e Rest Assured", "versao": None, "origem": "Quadro 14"}, {"nome": "GreenMail", "versao": None, "origem": "Quadro 14"}, {"nome": "Vitest, Testing Library e MSW", "versao": None, "origem": "Quadro 14"}, {"nome": "Playwright", "versao": None, "origem": "Quadro 14"},
    {"nome": "Serviço externo de consulta de CEP (não nomeado)", "versao": None, "origem": "Quadro 35 (fluxo principal)"}],
    "organizacao_codigo": {"origem": "5.1", "backend_pacotes": ["usuarios", "animais", "ocorrencias", "processos", "relatorios", "comum"], "backend_camadas": ["controladores", "serviços", "repositórios", "entidades"], "frontend": "pastas por funcionalidade"},
    "decisoes_modelagem": {"origem": "4 (intro), 4.3, 4.4", "itens": ["PK UUID v4", "timestamps em UTC, convertidos para America/Sao_Paulo na apresentação", "ocupação de baia calculada, não armazenada", "AmostraAnimal é cópia do momento da coleta"]}}

FORA_DO_ESCOPO = {"origem": "Seção 3.4", "itens": [
    "tomada de decisões por inteligência artificial", "cadastro de consultas clínicas veterinárias (coberto pelo SISSAÚDE)", "agendamento de castração online",
    "geolocalização e mapas georreferenciados de doenças", "pedidos de vacina antirrábica (cobertos pelo VivoPet)", "aplicativo móvel (acesso exclusivo via web responsiva)",
    "processamento automatizado de ocorrências", "portal público de adoção, inclusive a publicação dos animais disponíveis para adoção"],
    "limitacoes_3_5_2": ["escopo restrito ao CCZ de Itu", "sem integração em tempo real com SINAN e GAL (apenas registro dos números)"],
    "riscos_3_5_1": ["resistência à mudança", "dependência de internet e energia; instabilidade de rede tratada por RNF03"],
    "trabalhos_futuros": {"origem": "Considerações finais", "itens": ["capacitação e implantação", "integração com SINAN, GAL e AnimalTag", "integração com Cadastro Nacional de Animais Domésticos", "aplicativo móvel", "módulo público de adoção"]}}

PROTOTIPOS = {"origem": "Seção 4.6 (Fig. 26–30)", "itens": [
    {"figura": 26, "tela": "T02", "nome": "Dashboard operacional", "rf": "RF-D01", "observacoes": ["menu: Dashboard, Animais, Ocorrências, Processos Sanitários, Relatórios, Gestão de Baias, Configurações", "usuária 'Stéphanie Lima – Veterinária' (VET)", "baias nomeadas 'Gatil A/C', 'Externa 1/2'", "processo '045/2026' (3 dígitos)", "alertas: vacinas 7 dias, sem avaliação >30 dias, superlotação, medicação ativa, ficha incompleta, não castrados"]},
    {"figura": 27, "tela": "T06", "nome": "Ficha do animal", "rf": "RF-A01, RF-A03, RF-A04", "observacoes": ["microchip de 15 dígitos", "próxima vacina", "medicação ativa", "linha do tempo: vacinas, exames, cirurgias, medicamentos", "botão Registrar evento"]},
    {"figura": 28, "tela": "T10", "nome": "Detalhe da ocorrência", "rf": "RF-E01, RF-E03, RN03", "observacoes": ["protocolo '089/2026' (3 dígitos)", "mapa 'Localização aproximada'", "encerramento bloqueado até resultado do processo (RN05)", "denunciante com CPF visível a usuária VET", "botão Abrir Processo Sanitário"]},
    {"figura": 29, "tela": "T07", "nome": "Gestão de baias", "rf": "RF-A02", "observacoes": ["16 baias internas, 21 baias no total", "status normal/atenção/superlotada", "botão 'Adicionar Baia' para usuária VET"]},
    {"figura": 30, "tela": "T14", "nome": "Central de relatórios", "rf": "RF-B07, RF-D02, RN11", "observacoes": ["seis relatórios do Quadro 11", "'Resultados disponíveis em PDF, CSV e Excel'", "status Concluído; 'Geração em curso 83%'; 'Ver versão parcial'", "histórico de gerações"]}]}
