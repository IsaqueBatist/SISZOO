# -*- coding: utf-8 -*-
"""Achados da Etapa 2 (verificacoes A-H) e pendencias. Cada item: (verificacao, severidade, tipo, locA, locB, dizA, dizB, problema, correcao).
Paginas sao acrescentadas automaticamente pelo gerador a partir das listas pre-textuais ("conforme sumario")."""

A = []  # (verif, sev, tipo, locA, locB, dizA, dizB, problema, correcao)

def add(verif, sev, tipo, locA, locB, dizA, dizB, problema, correcao):
    A.append(dict(verif=verif, sev=sev, tipo=tipo, locA=locA, locB=locB, dizA=dizA, dizB=dizB, problema=problema, correcao=correcao))

# ===================== A. Requisitos x Casos de uso =====================
add('A', 'MÉDIA', 'FATO', 'Figura 2 / Figura 6 (diagramas de casos de uso)', 'Quadro 17 / Quadro 18 / Quadro 46 (Apêndice A)',
    'Elipses: "Encerrar Sessão"; "Editar Preferências"; "Visualizar Dashboard"',
    'Títulos: "Encerrar Sessão (Logout)"; "Editar Preferências do Usuário"; "Visualizar Dashboard em Tempo Real"',
    'O texto do Apêndice A afirma que "cada caso de uso dos diagramas por módulo tem um quadro próprio", mas três nomes não são idênticos entre diagrama e quadro, o que dificulta a rastreabilidade (os 33 demais coincidem).',
    'Uniformizar os três nomes (no PlantUML ou no título dos Quadros 17, 18 e 46).')
add('A', 'MÉDIA', 'INFERÊNCIA', 'Figura 2 e Quadro 22 ("Consultar Trilha de Auditoria")', 'Quadro 6 (RF-C02) e Quadro 15',
    'Quadro 22: "Requisitos relacionados: RF-C02, RN06, RNF10"',
    'RF-C02: "Administrador cadastra, edita, desativa e reativa usuários, atribuindo cargos..." (não menciona consulta à trilha); Quadro 15 não tem tela de auditoria',
    'O caso de uso de consulta à trilha de auditoria não é realizado por nenhum RF explícito (RF-C02 trata de gestão de usuários) e não tem tela correspondente no Quadro 15, embora o Quadro 4 cite "trilha de auditoria" como módulo do Administrador.',
    'Criar um RF (ex.: RF-C04 Consulta à trilha de auditoria) ou ampliar RF-C02, e incluir a tela correspondente no Quadro 15.')
add('A', 'MÉDIA', 'FATO', 'Figura 6', 'Quadro 47 e Quadro 48 (Ator Principal) e Quadro 15 (T03)',
    '"Consultar Alertas Vacinais" e "Monitorar Ocupação de Baias" ligados apenas por «extend» a "Visualizar Dashboard", acessado por Veterinário e Agente Sanitário; nenhuma associação direta de ator',
    'Quadro 47 e Quadro 48: "Ator Principal: Veterinário"; Quadro 15 T03 Alertas: "Perfis: Todos"',
    'Pelo diagrama, o Agente Sanitário alcança as extensões a partir do dashboard; pelos quadros, só o Veterinário; pelo Quadro 15, todos os perfis acessam a tela de alertas. Três artefatos, três respostas.',
    'Decidir quem acessa alertas vacinais e ocupação de baias (RN09 dá o módulo A só ao Veterinário) e alinhar Figura 6, Quadros 47/48 e Quadro 15.')
add('A', 'MÉDIA', 'FATO', 'Quadro 7 (RF-A02) e Cap. 3 intro (b357)', 'Quadro 28 (Restrições) e Quadro 60 (Baia.nome)',
    'RF-A02: "BAIA 1–16 internas, E1–E8 externas e CORREDOR"; Cap. 3: "corredor e baias externas E1 a E8"',
    'Quadro 28: "Baias disponíveis: BAIA 1–16 (internas), E1–E4 (externas) e CORREDOR"; Quadro 60: "BAIA 1–16, E1–E4, CORREDOR"',
    'Divergência factual sobre a quantidade de baias externas (8 × 4) entre requisito, caso de uso e dicionário de dados.',
    'Confirmar com a planilha do CCZ (Anexo A) e corrigir RF-A02/b357 ou Quadros 28 e 60.')
add('A', 'BAIXA', 'FATO', 'Quadro 38 ("Atores Secundários: Administrador")', 'Quadros 16–51 restantes e Figura 4',
    'Quadro 38 é o único quadro que preenche "Atores Secundários" (com Administrador)',
    'Nos demais 35 quadros o campo fica vazio, embora o Administrador herde todos os casos (Figuras 1–6; texto 4.1)',
    'Uso não uniforme do campo "Atores Secundários": o Administrador participa por herança em todos os casos, mas só é citado em um.',
    'Padronizar: ou preencher o Administrador em todos os quadros (por herança) ou retirá-lo do Quadro 38.')
add('A', 'BAIXA', 'FATO', 'Quadro 7 (RF-A05)', 'Quadro 15 (T06) e Quadro 26',
    'RF-A05: "Na adoção, registrar os dados do adotante e, quando houver, a devolução do animal"',
    'Quadro 26 Fluxo Alt. I descreve a devolução; Quadro 15 T06 cita RF-A05; nenhum caso de uso da Figura 3 chama-se "Registrar Devolução"',
    'A devolução é tratada apenas como fluxo alternativo de "Registrar Adoção", que por sua vez é extensão de "Registrar Saída/Desfecho"; após a devolução o animal volta ao canil, mas não há caso de uso nem fluxo de reentrada (baia, status).',
    'Explicitar a devolução (novo caso de uso ou fluxo em Registrar Adoção com reatribuição de baia e status) – DÚVIDA dos autores.')

# ===================== B. Perfis e permissoes =====================
add('B', 'MÉDIA', 'INFERÊNCIA', 'Quadro 4 (linha Veterinário)', 'Quadro 7 (RF-A02), Figura 3, Quadro 33 e Quadro 15 (T07)',
    'Veterinário – Módulos com acesso: "Gestão de animais do canil; dashboard; baias e relatórios"',
    'RF-A02: "O Administrador cadastra e edita as baias"; Figura 3: "Gerenciar Baias" ligado só ao Administrador; T07: "Administrador (edição); Veterinário (consulta)"',
    'O Quadro 4 lista "baias" como módulo do Veterinário sem distinguir consulta de gestão; o restante do documento reserva a gestão ao Administrador.',
    'Reescrever a linha do Veterinário no Quadro 4 (ex.: "consulta de baias") para evitar leitura de permissão de edição.')
add('B', 'MÉDIA', 'INFERÊNCIA', 'Figuras 26, 28 e 29 (protótipos, usuária "Stéphanie Lima – Veterinária", selo VET)', 'Quadro 13 (RN09) e Quadro 15 (T07–T13)',
    'Protótipos mostram a usuária VET com menu "Ocorrências", "Processos Sanitários", botão "Abrir Processo Sanitário" (Fig. 28), "Adicionar Baia" (Fig. 29) e dados do denunciante com CPF (Fig. 28)',
    'RN09: "Veterinário: Gestão de Animais (A) e Dashboard/Relatórios (D)"; Quadro 15: T08–T13 "Agente Sanitário, Administrador"; T07 edição só Administrador',
    'As telas prototipadas exibem, para um perfil Veterinário, funções que RN09 e o Quadro 15 negam a esse perfil. Como protótipo é ilustrativo, é inferência, mas a banca pode ler como contradição de permissões.',
    'Regerar os protótipos com usuário/menu coerentes com RN09 ou registrar na Seção 4.6 que o menu exibido é o do Administrador.')
add('B', 'BAIXA', 'INFERÊNCIA', 'Quadro 13 (RN09) e Cap. 3 intro (b357)', 'Figura 17 (enum Modulo) e Quadro 55 (CargoPermissao.modulo)',
    'RN09 identifica módulos por letras: "Gestão de Animais (A)", "Processos (B)", "Dashboard/Relatórios (D)", "Ocorrências (E)"',
    'Enum Modulo: USUARIOS_ACESSO, GESTAO_ANIMAIS, OCORRENCIAS_DENUNCIAS, PROCESSOS_SANITARIOS, RELATORIOS',
    'Dois esquemas de identificação de módulo coexistem (letras de requisito × valores do enum), sem tabela de correspondência; o módulo 1 não tem letra em RN09.',
    'Acrescentar a correspondência letra ↔ enum (C=USUARIOS_ACESSO, A=GESTAO_ANIMAIS, E=OCORRENCIAS_DENUNCIAS, B=PROCESSOS_SANITARIOS, D=RELATORIOS) no texto de RN09 ou na Seção 3.')

# ===================== C. Regras de negocio =====================
add('C', 'MÉDIA', 'FATO', 'Quadro 13 (RN02), Quadros 8 e 9 (RF-E01, RF-B01), Figura 5 (nota), Quadros 35/40, Seção 5.2 (b562)', 'Figura 26 e Figura 28 (protótipos)',
    'RN02: "formato 0000/AAAA, sequencial, reiniciando em 0001 a cada ano civil"',
    'Fig. 28: "Ocorrência 089/2026" e "Processo Sanitário Vinculado 045/2026"; Fig. 26: "045/2026"',
    'Os protótipos exibem protocolos com três dígitos, contrariando o formato de quatro dígitos fixado por RN02 e repetido em dez pontos do texto.',
    'Atualizar os protótipos para 0089/2026 e 0045/2026 (ou declarar na Seção 4.6 que são ilustrativos).')
add('C', 'MÉDIA', 'FATO', 'Quadro 90 (ProcessoSanitario.protocolo "varchar(50)") e Quadro 84 / Figura 14 (Ocorrencia.protocolo varchar(50))', 'Figura 15 (ProcessoSanitario.protocolo "varchar(9) UQ NN")',
    'Dicionário: protocolo varchar(50) nas duas tabelas',
    'Lógico M4: protocolo varchar(9)',
    'Tamanho do campo diverge entre o lógico M4 e o dicionário/lógico M3 para o mesmo formato 0000/AAAA (9 caracteres).',
    'Padronizar (varchar(9) é suficiente para 0000/AAAA) nos Quadros 84 e 90 e na Figura 14.')
add('C', 'ALTA', 'INFERÊNCIA', 'Quadro 13 (RN03)', 'Quadro 38 (Fluxo Alternativo I), Figura 4 (nota) e Figura 22 (Ocorrencia.denuncianteVisivelPara)',
    'RN03: "...os dados do denunciante não são exibidos para nenhum perfil exceto Administrador; o acesso do Administrador é registrado em auditoria."',
    'Quadro 38 Fluxo Alt. I: "Acesso como Administrador: os dados do denunciante são exibidos mesmo em ocorrências sigilosas." (sem registro de auditoria); nota da Fig. 4 e método denuncianteVisivelPara() também não preveem o registro',
    'A segunda metade da RN03 (auditoria do acesso do Administrador, exigência LGPD) não tem passo correspondente no caso de uso nem operação de domínio; o enum AcaoAuditoria tem VISUALIZACAO, mas nada o aciona.',
    'Incluir no Quadro 38 o passo "registra AuditoriaEvento (VISUALIZACAO) quando o Administrador visualiza denunciante de ocorrência sigilosa" e refletir na nota da Figura 4.')
add('C', 'MÉDIA', 'DÚVIDA', 'Quadro 9 (RF-B05) e Quadro 13 (RN04)', 'Quadro 40 (Fluxo Alt. I) e Quadro 44 (Pré-Condições/Restrições)',
    'RF-B05: "Contato humano em qualquer amostra marca o processo como urgente, com alerta visual. O processo não pode ser concluído sem resultado."; RN04 só trata de urgência e fixação no topo',
    'Quadro 40: "bloqueia o encerramento sem resultado (RN04, RF-B05)"; Quadro 44: "Processos com contato humano não podem ser encerrados sem resultado (RF-B05)"',
    'Não fica claro se o bloqueio de encerramento sem resultado vale para todo processo (leitura literal de RF-B05 e RN12) ou só para processos urgentes (Quadro 44); além disso o bloqueio é atribuído a RN04, que não o enuncia.',
    'Decidir o alcance do bloqueio e registrá-lo em uma RN (ampliar RN04 ou RN12) citada de forma uniforme em RF-B05, Quadro 40 e Quadro 44.')
add('C', 'MÉDIA', 'DÚVIDA', 'Quadro 13 (RN06) e Quadro 7 (RF-A04)', 'Quadro 32 (Fluxo Principal) e Figura 20 (Exame.registrarResultado)',
    'RN06: "Histórico veterinário, processos e resultados não podem ser excluídos; a correção gera novo registro"; RF-A04: "Registros imutáveis: a correção gera novo registro com auditoria"',
    'Quadro 32: "Posteriormente, o Veterinário registra o resultado... / Atualiza o exame com o resultado informado."; Quadro 30: altera status da prescrição "mantendo o registro"',
    'Registros clínicos declarados imutáveis são atualizados em etapas (exame recebe resultado depois; prescrição muda de status). O documento não define se "imutável" significa sem UPDATE ou sem exclusão/correção, o que muda a implementação.',
    'Precisar RN06: quais campos podem ser completados depois (resultado do exame, status da prescrição) e o que exige novo registro.')
add('C', 'ALTA', 'INFERÊNCIA', 'Quadro 13 (RN07)', 'Figura 13 (tabela Animal) – leitura parcial',
    'RN07: "Obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo de entrada e data de entrada."',
    'Fig. 13: especie "NN", esterilizado "NN", status_animal "NN"; sexo, porte, data_entrada, motivo_entrada_id e baia_id sem marca NN visível',
    'Cinco dos oito campos obrigatórios por RN07 aparecem sem NOT NULL no diagrama lógico (leitura limitada pela resolução da imagem – ver Limitações). O Quadro 67 não informa nulidade, então o lógico é o único artefato que a expressa.',
    'Marcar NN em sexo, porte, baia_id, motivo_entrada_id e data_entrada na Figura 13 (ou justificar) e, idealmente, indicar nulidade no dicionário.')
add('C', 'ALTA', 'FATO', 'Quadro 13 (RN08)', 'Figura 15 (ProcessoSanitario.laboratorio_id, ResponsavelProcesso.endereco) e Figura 10 (cardinalidades "(0,1)")',
    'RN08: "Obrigatórios: data de abertura, doença, laboratório, ao menos uma amostra e os dados mínimos do responsável (nome, endereço)."',
    'Fig. 15: "laboratorio_id uuid" (sem NN, enquanto doenca_id e responsavel_id têm NN); ResponsavelProcesso "endereco varchar(300)" (sem NN); Fig. 10: "(0,1)" junto a Laboratorio, Doenca e Responsavel_Processo',
    'Laboratório e endereço do responsável são obrigatórios pela regra, mas opcionais no modelo lógico (e, no DER, com cardinalidade mínima zero).',
    'Marcar NN em laboratorio_id e em ResponsavelProcesso.endereco (Fig. 15) e revisar as cardinalidades mínimas da Figura 10.')
add('C', 'MÉDIA', 'FATO', 'Quadro 13 (RN11)', 'Quadro 9 (RF-B06), Quadro 45 e Quadro 91 (DocumentoProcesso.status "StatusDocumento ... (RN11)")',
    'RN11 "Estado de Exportação": "RelatorioGerado com estados Pendente→Em Processamento→Concluído/Falha. Binário não armazenado no banco, apenas URL com política de expiração."',
    'RF-B06: "controle de estado em DocumentoProcesso (Pendente→Em Processamento→Concluído/Falha, RN11)"; Quadro 91 cita RN11 para DocumentoProcesso',
    'RN11 é escrita só para RelatorioGerado, mas é invocada para DocumentoProcesso, que no modelo não tem url_expira_em (RN11 exige URL com expiração).',
    'Generalizar RN11 para "arquivos gerados (RelatorioGerado e DocumentoProcesso)" e decidir se DocumentoProcesso também tem URL com expiração.')
add('C', 'MÉDIA', 'DÚVIDA', 'Quadro 7 (RF-A03) e Quadro 70 (Vacinacao.data_validade)', 'Quadro 29 (Fluxo Principal) e Figura 19 (Vacinacao.calcularPrevisaoRetorno)',
    'RF-A03: alertas "com base na data de validade de cada dose"; Quadro 70: "data_validade: Data de validade da dose; base do alerta de reforço (RF-A03)"',
    'Quadro 29: "Persiste a vacinação e calcula a previsão de retorno (data de aplicação + intervalo em meses)"; Quadro 62: intervalo_meses "base do alerta RF-A03"; Fig. 19: calcularPrevisaoRetorno(intervaloMeses)',
    'Dois mecanismos distintos são apontados como base do alerta de 7 dias (data de validade informada × data calculada pelo intervalo da vacina); o Quadro 29 não pede a data de validade como entrada e não há atributo "previsao_retorno" em Vacinacao.',
    'Definir uma única base (ex.: data_validade calculada = data_aplicacao + intervalo_meses, editável) e alinhar RF-A03, Quadros 29/62/70 e a Figura 19.')
add('C', 'ALTA', 'INFERÊNCIA', 'Quadro 7 (RF-A05)', 'Quadro 67 (Animal), Quadro 79 (Adocao), Figura 13, Figura 18',
    'RF-A05: "No destino Eutanásia, registrar o laudo do responsável técnico que a justifica (Lei nº 14.228/2021, art. 2º, § 1º)."',
    'Nenhuma tabela ou classe possui atributo de laudo/justificativa de eutanásia (Animal tem observacoes; AnexoAnimal armazena arquivos genéricos); Quadro 25 (Registrar Saída) não pede laudo',
    'Requisito de alta prioridade e exigência legal sem suporte explícito na modelagem nem no caso de uso de saída.',
    'Acrescentar atributo (ex.: Animal.laudo_eutanasia ou entidade Eutanasia com laudo, responsável técnico e data) e o passo correspondente no Quadro 25.')
add('C', 'BAIXA', 'FATO', 'Quadro 13 (RN06)', 'Quadro 21 (usuário), Quadro 22 (auditoria), Quadros 34/37 (anexos)',
    'RN06 cobre "Histórico veterinário, processos e resultados"',
    'Quadro 21: "O cadastro [de usuário] não é excluído ... (RN06)"; Quadro 22: "registros de auditoria são imutáveis (RN06)"; Quadros 34/37: "O anexo não pode ser excluído depois de gravado (RN06)"',
    'RN06 é citada para objetos que seu texto não abrange (usuários, eventos de auditoria, anexos de ocorrência).',
    'Ampliar o enunciado de RN06 ou criar RN específica para auditoria/anexos.')
add('C', 'BAIXA', 'INFERÊNCIA', 'Quadro 56 (PreferenciaUsuario.notif_email_diario)', 'Quadro 6 (RF-C03) e Quadro 10',
    'notif_email_diario: "Indica se o usuário recebe por e-mail um resumo diário com os alertas pendentes"',
    'RF-C03 fala apenas em "notificações que deseja receber"; nenhum RF prevê e-mail diário de resumo',
    'Funcionalidade (resumo diário por e-mail) modelada sem requisito funcional correspondente.',
    'Incluir o resumo diário em RF-C03/RF-D01 ou remover o atributo.')
add('C', 'BAIXA', 'INFERÊNCIA', 'Quadro 13 (RN02: "reiniciando em 0001")', 'Seção 2.3.3 (b345)',
    'RN02 não menciona o controle de concorrência',
    '2.3.3: "durante essa transação, a linha da sequência anual fica bloqueada, o que impede números repetidos em cadastros simultâneos (RN02)"',
    'O mecanismo de lock da sequência anual aparece só na seção de tecnologia; a regra não cita a entidade/sequência que o implementa, e nenhum artefato de modelagem (DER, lógico, classes) tem a sequência anual.',
    'Mencionar em RN02 a sequência por ano com bloqueio e, se for tabela/sequence, representá-la no lógico.')

# ===================== D. Modelagem de dados =====================
add('D', 'CRÍTICA', 'FATO', 'Figura 7 (DER M1: entidade Sessao) e Figura 12 (lógico M1: tabela Sessao)', 'Seção 2.3.1 (b341), Apêndice B.1 (Quadros 52–57) e Figura 17',
    'Fig. 7: entidade "Sessao" (id, token_hash, ip, user_agent, criada_em, expira_em, encerrada_em), relacionamento "abre"; Fig. 12: tabela Sessao com token_hash varchar(512) UQ',
    '2.3.1: "A arquitetura é sem estado (stateless): o servidor não mantém a sessão do usuário em memória nem em banco de dados"; dicionário B.1 e diagrama de classes não têm Sessao',
    'DER e lógico persistem sessões (token_hash) enquanto o texto declara arquitetura stateless e o dicionário/classes omitem a tabela: contradição conceitual que leva a implementações opostas. Versão majoritária: texto + dicionário + classes (3 × 2).',
    'Remover Sessao das Figuras 7 e 12 (mantendo JWT stateless) ou, se houver lista de tokens revogados, descrevê-la no texto, no dicionário e nas classes.')
add('D', 'ALTA', 'FATO', 'Quadro 79 (tabela Adocao), Figura 18 (classe Adocao) e Quadro 7 (RF-A05)', 'Figura 8 (DER M2) e Figura 13 (lógico M2)',
    'Dicionário e classes definem Adocao com 15 atributos; RF-A05 exige "registrar os dados do adotante"',
    'A Figura 8 não tem entidade Adocao nem atributos de adotante; a Figura 13 não tem tabela Adocao (22 tabelas, nenhuma Adocao)',
    'Entidade presente em dois artefatos e ausente nos dois modelos de dados (conceitual e lógico) do mesmo módulo.',
    'Incluir Adocao (e o relacionamento com Animal e Usuario) nas Figuras 8 e 13.')
add('D', 'ALTA', 'FATO', 'Figura 8 (Baia.animais_alojados) e Figura 13 (Baia "animais_alojados integer NN")', 'Seção 4.4 (b464), Quadro 60, Quadro 33 e Figura 18 (Baia.calcularOcupacao())',
    'DER e lógico: atributo animais_alojados',
    '4.4: "A ocupação das baias não é armazenada: é calculada pela contagem de animais alojados."; Quadro 33: "A ocupação não é digitada: é calculada"; Quadro 60 sem o campo; classe com calcularOcupacao()',
    'DER e lógico armazenam a ocupação que texto, dicionário, caso de uso e classes declaram derivada. Versão majoritária: calculada (4 × 2).',
    'Retirar animais_alojados das Figuras 8 e 13.')
add('D', 'ALTA', 'FATO', 'Figura 8 (DER M2)', 'Figura 13, Apêndice B.2 (Quadros 58–79) e Figuras 18–20',
    'Fig. 8: entidade "Medicacao" (medicamento, dose, via_administracao, status...); Exame com atributo "tipo_exame"; Procedimento/Exame com "anexo_url"; Vacina com "especie_aplicavel"; Vacinacao com "dose"; sem Sintoma',
    'Lógico/dicionário/classes: Prescricao + Medicamento + CategoriaFarmacologica; TipoExame; AnexoVacinacao/AnexoProcedimento/AnexoExame; VacinaEspecie; Vacinacao.numero_dose/dose_quantidade/dose_unidade; Sintoma + AnimalSintoma',
    'O DER conceitual do Módulo 2 representa uma versão anterior do modelo: 11 entidades do lógico/dicionário não existem nele (Adocao, Sintoma, AnimalSintoma, VacinaEspecie, Medicamento, CategoriaFarmacologica, Prescricao, TipoExame, AnexoVacinacao, AnexoProcedimento, AnexoExame) e seus atributos equivalentes estão em outra forma. O texto 4.2 diz que o DER "serviu de base" ao lógico, mas o leitor não consegue derivar um do outro.',
    'Regenerar a Figura 8 a partir do modelo lógico atual (ou documentar na Seção 4.2 as transformações aplicadas).')
add('D', 'MÉDIA', 'FATO', 'Figura 8 (entidade "Usuário") e Figura 14 (tabela Usuario)', 'Figura 7, Figura 12, Quadro 52 e Figura 17',
    'Fig. 8: atributos "dois_fatores_ativo" e "data_criacao"; Fig. 14: "dois_fatores_ativo boolean NN"',
    'Fig. 7/12, Quadro 52 e classe Usuario não têm dois_fatores_ativo nem data_criacao; o texto nunca menciona autenticação de dois fatores',
    'A cópia de Usuario em dois diagramas de outros módulos traz atributos que a definição canônica (M1) não tem; 2FA não é requisito.',
    'Remover dois_fatores_ativo/data_criacao das Figuras 8 e 14 ou incorporá-los em M1 com requisito correspondente.')
add('D', 'MÉDIA', 'FATO', 'Figura 7, Figura 12 e Quadro 56 (PreferenciaUsuario com 5 campos notif_*)', 'Figura 17 (classe PreferenciaUsuario)',
    'DER, lógico e dicionário: notif_alertas_criticos, notif_vacina_vencendo, notif_superlotacao, notif_resultado_lab, notif_email_diario',
    'Classe PreferenciaUsuario: apenas id, tema, densidade',
    'Cinco atributos presentes em três artefatos faltam no diagrama de classes (RF-C03 e Quadro 18 incluem notificações nas preferências).',
    'Acrescentar os cinco atributos Boolean à classe PreferenciaUsuario (Figura 17).')
add('D', 'ALTA', 'FATO', 'Figura 9 ("Gera": (0,1)/(0,1)), Figura 15 (ocorrencia_id nulo), Figura 22 (Ocorrencia 0..1 — 0..1 ProcessoSanitario), Quadro 9 (RF-B01 "vínculo opcional")', 'Figura 10 ("Origina": "(1,n)" junto a Ocorrencia, "(1,1)" junto a Processo_Sanitario) e Figura 23 ("Ocorrencia 0..1 —origina— * ProcessoSanitario")',
    'Vínculo opcional nos dois sentidos, 0..1 para 0..1',
    'Fig. 10: mínimos 1 nos dois lados (vínculo obrigatório); Fig. 23: uma ocorrência origina vários processos (*)',
    'A mesma associação Ocorrência–Processo tem quatro cardinalidades diferentes nos artefatos. Versão majoritária: processo com 0..1 ocorrência (RF-B01, Fig. 9, 15, 22, 23); número de processos por ocorrência diverge (0..1 na Fig. 22 × * na Fig. 23 × n na Fig. 10).',
    'Fixar: Processo 0..1 Ocorrência; Ocorrência 0..* Processos (ou 0..1) e corrigir Figuras 10, 22 ou 23.')
add('D', 'MÉDIA', 'DÚVIDA', 'Figura 10 ("(0,1)" junto a Doenca, Laboratorio, Responsavel_Processo e Usuario; "Amostra" (0,n)/(0,n)); Figura 9 ("(0,1)" junto a Tipo_Ocorrencia e Usuario)', 'Figura 15 (doenca_id NN, responsavel_id NN, criado_por NN), Figura 23 (Doenca 1, ResponsavelProcesso 1, Laboratorio 1, "avalia 1..*"), RN08',
    'DER: mínimos zero nos relacionamentos com Doenca/Laboratorio/Responsavel/Usuario; Amostra com (0,n) nos dois lados',
    'Lógico: FKs NOT NULL; classes: multiplicidade 1 e 1..* amostras; RN08 exige doença, laboratório, responsável e ao menos uma amostra',
    'As cardinalidades mínimas do DER contradizem a obrigatoriedade expressa no lógico, nas classes e em RN08 – ou a convenção de leitura (min,max) usada no brModelo não é a mesma declarada no texto (Seção 1.12 só diz "(mínima, máxima)"). Só os autores podem dizer qual convenção adotaram.',
    'Declarar na Seção 1.12/4.2 a convenção de leitura das cardinalidades e revisar os mínimos das Figuras 9 e 10.')
add('D', 'MÉDIA', 'FATO', 'Figura 9 ("Registra" Ocorrencia–Denunciado: "(1,1)" junto a Ocorrencia, "(1,n)" junto a Denunciado; "Aponta" Denunciante idem)', 'Quadro 8 (RF-E01 "denunciado (opcional)"), Quadro 36, Figura 14 (denunciado_id e denunciante_id nulos), Figura 22 (envolve 0..1 Denunciado; relatada por 0..1 Denunciante)',
    'DER: mínimo 1 para denunciante e denunciado',
    'Requisito, caso de uso, lógico e classes: denunciado opcional; lógico e classes: denunciante também opcional',
    'DER torna obrigatórios o denunciado (contraria 4 artefatos) e o denunciante; para o denunciante, o Quadro 35 ("denunciante vinculado" na pós-condição) e o DER o tratam como obrigatório, enquanto lógico e classes o deixam opcional.',
    'Corrigir Denunciado para mínimo 0 na Figura 9; decidir se o denunciante é obrigatório (denúncia anônima?) e alinhar Quadro 35, Figura 14 e Figura 22.')
add('D', 'MÉDIA', 'FATO', 'Figura 10 (entidade "AnimalAmostrado", atributo "numero_campo"; "Referencia" (1,1)/(1,n) com Animal)', 'Quadro 92 (tabela AmostraAnimal), Figura 15, Figura 23, Quadro 9 (RF-B04 "AmostraAnimal"), Quadro 41',
    'DER nomeia AnimalAmostrado, tem numero_campo e referência obrigatória a Animal',
    'Demais artefatos: AmostraAnimal, sem numero_campo, animal_id opcional ("quando houver"), Animal 0..1',
    'Nome da entidade e um atributo divergem entre o DER e os outros quatro artefatos; a referência ao animal do canil é opcional em todos menos no DER. O "Nº de Campo" aparece na requisição do GAL (Figura 54), o que sugere atributo perdido na transição DER→lógico.',
    'Renomear para AmostraAnimal na Figura 10, ajustar a cardinalidade com Animal e decidir se numero_campo deve existir (Quadro 92).')
add('D', 'MÉDIA', 'FATO', 'Figuras 7–10 (DER)', 'Apêndice B e Figuras 12–25',
    'DER: "Motivo_entrada", "Tipo_Baia", "Status_Animal", "Tipo_Procedimento", "Anexo_Ocorrencia", "Tipo_Ocorrencia", "Movimentacao_Ocorrencia", "Processo_Sanitario", "Documento_Processo", "TipoDocumento_Processo", "Responsavel_Processo", "Usuário" (com acento); catálogos com atributo "codigo"; AnexoAnimal.mime_type; Laboratorio.codigo',
    'Lógico/dicionário/classes: MotivoEntrada, TipoBaia, TipoProcedimento, AnexoOcorrencia, TipoOcorrencia, MovimentacaoOcorrencia, ProcessoSanitario, DocumentoProcesso, TipoDocumentoProcesso, ResponsavelProcesso, Usuario; catálogos com "nome" e "ativo" (sem codigo, exceto Sintoma/Vacina); AnexoAnimal sem mime_type',
    'Grafia dos nomes de entidades e presença do atributo "codigo" nos catálogos não são uniformes entre o DER e os demais artefatos.',
    'Uniformizar nomes (CamelCase sem acento) e atributos de catálogo no DER.')
add('D', 'BAIXA', 'FATO', 'Apêndice B (dicionário) e Figuras 12–16', 'Figuras 17–25 (classes)',
    'Dicionário/lógico: Usuario.senha; Ocorrencia.status_ocorrencia; ProcessoSanitario.status_processo, resultado_laboratorial, desfecho_animal; RelatorioGerado.parametros_jsonb; grafia snake_case (criado_em)',
    'Classes: Usuario.senhaHash; Ocorrencia.status; ProcessoSanitario.status, resultado, desfecho; RelatorioGerado.parametros; grafia camelCase (criadoEm)',
    'Além da conversão esperada snake_case→camelCase, cinco atributos mudam de nome entre tabela e classe, o que exige mapeamento explícito.',
    'Alinhar os nomes (ex.: senha_hash/senhaHash) ou indicar no texto 4.5 que os nomes de coluna e de atributo podem diferir.')
add('D', 'MÉDIA', 'INFERÊNCIA', 'Quadro 1 (doenças: febre maculosa – capivaras e equinos; leptospirose – roedores, bovinos, suínos) e Anexo A/Fig. 62 ("BUGIO")', 'Figura 21 (enum Especie: CANINO, FELINO, QUIROPTERO, PRIMATA_NAO_HUMANO) e Quadro 92 (AmostraAnimal.especie NN)',
    'O sistema atende processos de febre maculosa, leptospirose e febre amarela, cujos animais envolvidos incluem roedores, capivaras, equinos, bovinos e suínos',
    'A espécie do animal amostrado é obrigatória e limitada a quatro valores',
    'Processos sanitários com animais fora das quatro espécies do enum não podem ser registrados (ou serão registrados com espécie errada).',
    'Acrescentar valores (ex.: ROEDOR, OUTRO) ao enum Especie ou permitir espécie textual em AmostraAnimal – DÚVIDA dos autores.')
add('D', 'BAIXA', 'INFERÊNCIA', 'Quadro 57 / Figura 12 (AuditoriaEvento: entidade varchar(100), payload_antes, payload_depois)', 'Quadro 12 (RNF10) e Quadro 22',
    'AuditoriaEvento identifica a "Entidade afetada pela ação" apenas pelo nome',
    'RNF10 exige "usuário, data, hora e valores anterior/posterior em toda alteração crítica"; Quadro 22 filtra "por usuário, entidade e período"',
    'Sem identificador do registro afetado (entidade_id), a trilha não permite localizar o histórico de um registro específico (ex.: um animal ou processo).',
    'Acrescentar entidade_id (uuid) a AuditoriaEvento – sugestão.')
add('D', 'MÉDIA', 'DÚVIDA', 'Figura 7 (CargoPermissao desenhada como entidade associativa sobre o relacionamento "concede")', 'Figura 12 e Quadro 55 (CargoPermissao com cargo_id FK apenas) e Figura 17 (Cargo ◆ CargoPermissao)',
    'No DER, "concede" liga Cargo a uma linha que parte de Usuario (0,1) – a segunda entidade do relacionamento não é identificável com segurança na imagem',
    'Lógico/dicionário/classes: CargoPermissao pertence só a Cargo (composição), sem ligação com Usuario',
    'A representação de CargoPermissao no DER (relacionamento entre duas entidades) não corresponde à entidade dependente de Cargo dos demais artefatos; a imagem não permite confirmar a segunda entidade (ver Limitações).',
    'Redesenhar CargoPermissao na Figura 7 como entidade ligada só a Cargo, ou confirmar a intenção.')

# ===================== E. Relatorios =====================
add('E', 'MÉDIA', 'FATO', 'Quadro 10 (RF-D02) e Quadro 49', 'Figura 30 (protótipo T14)',
    'RF-D02: "Gerar, em PDF e CSV, os relatórios..."',
    'Fig. 30: "Geração e exportação de relatórios consolidados · Resultados disponíveis em PDF, CSV e Excel"; Quadro 14 lista apenas OpenPDF para geração',
    'O protótipo oferece um formato (Excel) que o requisito e a lista de bibliotecas não preveem.',
    'Remover "Excel" do protótipo ou acrescentar o formato (e a biblioteca) a RF-D02 e ao Quadro 14.')
add('E', 'BAIXA', 'INFERÊNCIA', 'Quadro 13 (RN11) e Figura 25 (StatusRelatorio)', 'Figura 30 ("Geração em curso: 83%", "Ver versão parcial →")',
    'Estados: Pendente→Em Processamento→Concluído/Falha; RelatorioGerado sem percentual',
    'Protótipo exibe progresso percentual e "versão parcial" de um relatório em processamento',
    'O protótipo sugere comportamento (progresso e download parcial) sem suporte na regra nem no modelo.',
    'Simplificar o protótipo ou acrescentar progresso ao modelo (atributo e regra).')

# ===================== F. Telas =====================
add('F', 'ALTA', 'FATO', 'Quadro 15 ("Telas do SISZOO": linhas T01 a T17)', 'Apêndice E (Figuras 49–54: "Tela T18" a "Tela T23"), Lista de Figuras e Seção 5.2 (b526)',
    'Quadro 15 termina em T17 "Perfil e Ajuda"',
    'Apêndice E apresenta T18 Relatório anual de processos, T19 Vacinação, T20 Adoções, T21 Procedimentos, T22 Ocupação de baias, T23 Ocorrências por bairro; 5.2: "As telas dos relatórios específicos... encontram-se no Apêndice E"',
    'Seis telas referenciadas no texto e no apêndice não constam do quadro que "relaciona cada tela aos perfis... requisitos e regras... e à rotina que substitui".',
    'Acrescentar as linhas T18–T23 ao Quadro 15 (perfis "Todos", RF-D02/RF-B07, RN11, "Relatórios montados à mão").')
add('F', 'MÉDIA', 'FATO', 'Quadro 9 (RF-B06 "Documento PDF") e Quadro 45 (Gerar Documento do Processo)', 'Quadro 15 (coluna "Requisitos e regras")',
    'RF-B06 e o caso de uso existem (Figura 5)',
    'Nenhuma linha do Quadro 15 cita RF-B06 (T13 cita RF-B03, RF-B05, RN10, RN12)',
    'Funcionalidade com requisito e caso de uso sem tela declarada; o mesmo ocorre com Consultar Trilha de Auditoria (ver achado A) e com RF-A04/anexos só implicitamente em T06.',
    'Citar RF-B06 na linha T13 (ou criar tela) no Quadro 15.')
add('F', 'MÉDIA', 'INFERÊNCIA', 'Figura 26 (protótipo T02: baias "Gatil C", "Gatil A", "Externa 2", "Externa 1") e Figura 29 ("21 baias")', 'Quadro 7 (RF-A02), Quadro 28, Quadro 60',
    'Protótipos usam nomes de baia "Gatil A/C" e "Externa n" e total de 21 baias',
    'Requisito e dicionário: "BAIA 1–16 internas, E1–E8 (ou E1–E4) externas e CORREDOR" – nenhum "Gatil"',
    'A nomenclatura das baias nos protótipos não corresponde à especificada; com E1–E8 + corredor seriam 25 baias, com E1–E4 seriam 21 (coincidindo com a Fig. 29), o que reforça a dúvida E1–E4 × E1–E8.',
    'Alinhar nomes/quantidade de baias nos protótipos à especificação (ou vice-versa).')
add('F', 'BAIXA', 'INFERÊNCIA', 'Figura 26 (alertas "3 animais sem avaliação há >30 dias", "10 animais não castrados", "2 novos animais sem ficha completa")', 'Quadro 10 (RF-D01) e Quadro 46',
    'Protótipo lista seis tipos de alerta crítico',
    'RF-D01: "total por StatusAnimal, ocupação de baias, alertas vacinais 7 dias, processos aguardando resultado, processos urgentes e resumo mensal por doença"',
    'Três alertas do protótipo não têm requisito (avaliação periódica, castração pendente, ficha incompleta – este último tem suporte em Animal.temFichaCompleta()).',
    'Incluir os alertas em RF-D01 ou retirá-los do protótipo.')
add('F', 'BAIXA', 'FATO', 'Seção 5.2 (b590: tela T16 "ajusta o tema e a densidade da interface (RF-C03)")', 'Quadro 6 (RF-C03) e Quadro 18',
    'Texto da T16 omite as notificações',
    'RF-C03 e Quadro 18: "tema, densidade da interface e as notificações que deseja receber"',
    'Descrição da tela incompleta em relação ao requisito que ela realiza.',
    'Completar a descrição da T16.')

# ===================== G. Escopo, tecnologia e coerencia =====================
add('G', 'MÉDIA', 'FATO', 'Seção 3.4 (b393) e Quadro 11 (Ocorrências por Bairro)', 'Figura 28 (protótipo T10: "LOCALIZAÇÃO APROXIMADA" com mapa e marcador)',
    '3.4: "geolocalização e mapas georreferenciados de doenças" fora do escopo; Quadro 11: "mapa de calor tabular, sem georreferenciamento"',
    'O protótipo da T10 exibe um mapa com localização aproximada da ocorrência',
    'Item declarado fora do escopo aparece em protótipo apresentado como "alta fidelidade" para validação com os usuários.',
    'Retirar o mapa do protótipo T10 ou registrar que é ilustrativo e fora do escopo.')
add('G', 'MÉDIA', 'FATO', 'Figuras 1, 2, 6, 12; Quadros 6 e 10; Seções 3.1.1, 3.1.5, A.1, A.5', 'Figuras 7, 11, 16, 17, 25; Seções B.1, B.5; Seção 4.4; Figura 17 (enum Modulo); Seção 5.1',
    'Módulo 1 "Autenticação e Controle de Acesso"; Módulo 5 "Dashboard e Relatórios"',
    'Módulo 1 "Usuários e Acesso"; Módulo 5 "Relatórios"; enum USUARIOS_ACESSO/RELATORIOS; pacotes "usuarios"/"relatorios"',
    'Os módulos 1 e 5 têm dois nomes cada ao longo do documento (casos de uso/requisitos × DER/lógico/classes/dicionário).',
    'Adotar um nome por módulo em todas as legendas e títulos (ou explicar a dupla denominação na Seção 4).')
add('G', 'BAIXA', 'INFERÊNCIA', 'Quadro 35 (Fluxo Principal: "Busca o endereço pelo CEP em serviço externo")', 'Seção 2.3 / Quadro 14 e Quadro 12 (RNF03)',
    'Caso de uso depende de serviço externo de CEP',
    'Nenhum serviço de CEP é citado nas tecnologias; RNF03 trata de internet instável',
    'Dependência externa não documentada nas tecnologias nem avaliada frente à instabilidade de rede (há fallback manual no Quadro 35, o que mitiga).',
    'Nomear o serviço (ex.: ViaCEP) na Seção 2.3.4 ou no Quadro 14.')
add('G', 'BAIXA', 'FATO', 'Introdução (b275), Seção 1.4, Quadro 3, Apêndice D (b1198): "AnimalTag"', 'Apêndice C (b1008, b1018): "AnimalTech"',
    'Corpo do texto: plataforma "AnimalTag"',
    'Transcrição da entrevista: "site da AnimalTech"',
    'Nome da plataforma de microchip grafado de duas formas; como a transcrição é literal, cabe nota explicativa.',
    'Acrescentar nota na transcrição ("AnimalTech [sic]; a plataforma é AnimalTag") ou corrigir.')
add('G', 'BAIXA', 'DÚVIDA', 'Introdução (b275: "95 cães e 15 gatos (segundo a equipe, em 9 jan. 2026)")', 'Cap. 3 (b357: "95 cães disponíveis para adoção e 18 felinos (16 disponíveis, um adotado e um falecido)")',
    '15 gatos (entrevista)', '18 felinos na planilha, 16 disponíveis',
    'Dois números para a população felina, com fontes diferentes, sem conciliação no texto.',
    'Conciliar ou explicar a diferença (data e fonte) em uma das passagens.')

# ===================== H. Estrutura e ABNT =====================
add('H', 'ALTA', 'FATO', 'Apêndice D (b1205–b1229: "Figura 49 – Planilha de registro...", "Figura 50 – Continuação...", "Figura 51 – Planilha de controle...", "Figura 52 – Capa de processo...", "Figura 53 – Ficha de notificação...", "Figura 54 – Requisição de exame no GAL")', 'Apêndice E (b1258–b1273: "Figura 49 – Tela T18...", "Figura 50 – Tela T19...", "Figura 51 – Tela T20...", "Figura 52 – Tela T21...", "Figura 53 – Tela T22...", "Figura 54 – Tela T23...")',
    'Seis fotos numeradas 49 a 54', 'Seis telas de relatório também numeradas 49 a 54',
    'Numeração de figuras duplicada (NBR 14724: numeração sequencial única). O Apêndice D continua até a Figura 59 e o Anexo A usa 60–63; as telas do Apêndice E deveriam ser 64–69 (ou vir antes do Apêndice D).',
    'Renumerar as figuras do Apêndice E (64–69) ou reposicionar o apêndice, e atualizar as referências cruzadas.')
add('H', 'ALTA', 'FATO', 'Lista de Figuras (b121–b175): 55 entradas; "Figura 48 – [DESCRIÇÃO DA FOTOGRAFIA] 128"; "Figura 49 – Tela T18... 129" a "Figura 54 – Tela T23... 129"; "Figura 55 – [PLANILHA E TRECHO APRESENTADO] 130"', 'Legendas do corpo: 69 legendas, 63 números (1–63); Figuras 48–63 com títulos diferentes dos da lista; Figuras 56–63 ausentes da lista',
    'Lista de Figuras é texto estático (não há campo TOC nela; o único campo TOC do documento é o do Sumário) com placeholders e títulos antigos',
    'Corpo tem 63 figuras numeradas, com títulos definitivos nos Apêndices D/E e Anexo A',
    'A Lista de Figuras não é um campo não atualizado: é uma lista digitada/colada manualmente que ficou desatualizada após a inclusão das fotos (48–59) e planilhas (60–63). Oito figuras não constam da lista e oito entradas têm título divergente.',
    'Substituir a lista por campo de índice de ilustrações (Word: Referências → Inserir índice de ilustrações, rótulo "Figura") e atualizá-lo após renumerar o Apêndice E.')
add('H', 'MÉDIA', 'FATO', 'Sumário (b118)', '—',
    'Texto do campo TOC: "No table of contents entries found."',
    'Os títulos usam os estilos 2, 3 e 4 (Heading 1–3) e o campo TOC está configurado para "Heading 1,1,Heading 2,2,Heading 3,3"',
    'O Sumário está vazio: o campo TOC existe mas não foi atualizado (ou os estilos de título não correspondem aos nomes configurados no campo). Causa aparente: campo não atualizado.',
    'Atualizar o campo (F9) e conferir se os estilos de título são os previstos no campo TOC.')
add('H', 'BAIXA', 'FATO', 'Quadros 6, 7, 8, 9, 10, 12 e 13 (Cap. 3) e Quadros 16–94 (Apêndices A e B)', 'Texto do Cap. 3 e introduções dos Apêndices A e B',
    'Os quadros aparecem logo após os títulos de seção, sem frase que os cite ("O Quadro 6 apresenta...")',
    'Quadros 1–5, 11, 14 e 15 são citados antes de aparecer',
    'NBR 14724 e o padrão institucional exigem que ilustrações e quadros sejam citados no texto antes de sua apresentação; 86 dos 94 quadros não são citados pelo número.',
    'Inserir uma frase de chamada antes de cada quadro (nos apêndices, pode ser uma frase listando os quadros de cada seção).')
add('H', 'BAIXA', 'FATO', 'Figuras 7–17, 22, 23, 25 (Cap. 4), Figuras 26–30 (Seção 4.6), Figuras 48–63 (Apêndices D/E e Anexo A)', 'Seções 4.2, 4.3, 4.5, 4.6, Apêndices D/E, Anexo A',
    'Legendas presentes, mas o texto não cita essas figuras pelo número (as Figuras 1–6, 18, 21, 24 e 31–47 são citadas)',
    '—',
    'Vinte e seis legendas de figura (incluindo as duplicadas) não são chamadas no texto; nas seções 4.2/4.3/4.5 os parágrafos descrevem a notação mas não referenciam "Figura N".',
    'Acrescentar chamadas ("A Figura 7 apresenta o DER do Módulo 1...").')
add('H', 'BAIXA', 'FATO', 'Referências (b682 "RECHARTS. Recharts. [S. l.], 2026"; b684 "RIBEIRO, Rodrigo Luiz. Prefeitura lança site do CCZ...")', 'Corpo do texto (Quadro 14 cita "Recharts" sem (RECHARTS, 2026); Seção 1.9 e Quadro 2 citam "Site do CCZ de São José dos Campos (2022)" sem (RIBEIRO, 2022))',
    'Duas referências na lista', 'Nenhuma citação correspondente no texto',
    'NBR 6023/10520: toda referência listada deve ser citada. As demais 46 referências foram localizadas em citações.',
    'Citar (RECHARTS, 2026) no texto da Seção 5.1 e (RIBEIRO, 2022) na Seção 1.9/Quadro 2.')
add('H', 'BAIXA', 'FATO', 'Seção 1.9 (b307)', 'Quadro 2 e referência RIBEIRO (2022)',
    'Parágrafo inicia: "“Eu Adoto no CCZ”, que exibe os animais disponíveis para adoção (SÃO PAULO, 2017)."',
    'Quadro 2 lista antes o "Site do CCZ de São José dos Campos (2022)"',
    'A primeira frase da Seção 1.9 está truncada: falta o início que apresentaria o site de São José dos Campos (e a citação a RIBEIRO, 2022).',
    'Restaurar o trecho inicial do parágrafo.')
add('H', 'BAIXA', 'DÚVIDA', 'Fontes das Figuras 60–63: "Fonte: Centro de Controle de Zoonoses de Itu (2026)."; Fontes dos Quadros 3, 6–9, 12, 13: "com base em entrevista com a equipe do CCZ de Itu (2026)"', 'Lista de referências',
    'Fonte no formato autor-data', 'Não há entrada "CENTRO DE CONTROLE DE ZOONOSES DE ITU. 2026" nas referências',
    'Planilhas cedidas e entrevista são documentos não publicados; a NBR 10520 admite citá-los como "informação verbal/documento não publicado" em nota, mas o formato autor-data usado sugere referência inexistente.',
    'Decidir entre nota de rodapé ("documento não publicado, cedido pelo CCZ") ou entrada nas referências.')
add('H', 'BAIXA', 'FATO', 'Figuras 60–63 (b1281, b1286, b1291, b1296)', 'Demais 65 legendas',
    'Legendas com hífen: "Figura 60 - Trecho da planilha..."', 'Legendas com travessão: "Figura 59 – Gráficos..."',
    'Separador da legenda não uniforme (hífen × travessão).', 'Trocar por travessão.')
add('H', 'BAIXA', 'FATO', 'Apêndice D (b1208)', 'b1209',
    'Fim do parágrafo: "...mantidos manualmente.Figura 50 – Planilha de animais do canil com marcação por cores"', 'Legenda real seguinte: "Figura 50 – Continuação da planilha de animais do canil"',
    'Fragmento de legenda antiga colado no parágrafo descritivo (sem espaço após o ponto), que ainda faz a Figura 50 parecer "citada".',
    'Apagar o fragmento.')
add('H', 'BAIXA', 'FATO', 'Apêndice D: Fontes em b1211, b1216, b1221, b1226, b1231, b1235, b1239, b1248, b1254', 'Demais fontes do documento',
    '"Fonte: Acervo dos autores (2026)" sem ponto final', '"Fonte: Elaborado pelos autores (2026)." com ponto',
    'Nove indicações de fonte sem ponto final; Figura 56 tem espaço duplo após o travessão ("Figura 56 –  Requisição").', 'Padronizar.')
add('H', 'BAIXA', 'FATO', 'Lista de Abreviaturas e Siglas (b89–b115)', 'Quadros 12, 13, 52–94 e Seção 4.3',
    'Lista tem "RF – Requisito Funcional" mas não tem RN, RNF, PK, FK, UQ, NN, UML? (tem), E2E', 'Siglas RN, RNF, PK, FK, UQ e NN são usadas extensivamente',
    'Siglas usadas no texto não constam da lista de abreviaturas (NBR 14724, elemento opcional, mas incompleto quando presente).', 'Acrescentar RN, RNF, PK, FK, UQ, NN (e E2E).')

# ===================== PENDENCIAS (fora da contagem) =====================
PEND = [
    dict(tipo='PENDÊNCIA', loc='Seção 5.2, Figuras 31–47 (b532–b596)', texto='17 parágrafos "[INSERIR CAPTURA DA TELA T01 – LOGIN]" ... "[INSERIR CAPTURA DA TELA T17 – PERFIL E AJUDA]"', impacto='Nenhuma tela implementada é mostrada no capítulo "Sistema desenvolvido"; as Figuras 31–47 não têm imagem.'),
    dict(tipo='PENDÊNCIA', loc='Apêndice E, Figuras 49–54 (b1259–b1274)', texto='6 parágrafos "[INSERIR CAPTURA DA TELA T18 – ...]" a "[... T23 – ...]"', impacto='Telas de relatório sem imagem.'),
    dict(tipo='PENDÊNCIA', loc='Considerações finais (b601, b603, b604)', texto='"[DESCREVER O QUE FOI IMPLEMENTADO E O QUE FICOU PENDENTE NA ENTREGA.]", "[DESCREVER OS TESTES REALIZADOS E SEUS RESULTADOS, SE HOUVER.]", "[APRENDIZADOS E DIFICULDADES, NAS PALAVRAS DOS AUTORES.]", "[ACRESCENTAR REQUISITOS NÃO IMPLEMENTADOS, SE HOUVER.]"', impacto='Quatro trechos a redigir; o objetivo específico "e) realizar testes funcionais" fica sem evidência no texto.'),
    dict(tipo='PENDÊNCIA', loc='Lista de Figuras (b168, b175)', texto='"Figura 48 – [DESCRIÇÃO DA FOTOGRAFIA]" e "Figura 55 – [PLANILHA E TRECHO APRESENTADO]"', impacto='Placeholders na lista pré-textual (ver achado H sobre a lista).'),
    dict(tipo='PENDÊNCIA', loc='Quadro 5 / Seção 2.4 (b355)', texto='"a Sprint S6 (Resultado e e-mail) em andamento. As demais sprints seguem planejadas"', impacto='Texto declara desenvolvimento em curso (S7 dashboard, S8 testes E2E, S9 entrega); coerente com as capturas ausentes, mas o Cap. 5 se intitula "Sistema desenvolvido".'),
]
