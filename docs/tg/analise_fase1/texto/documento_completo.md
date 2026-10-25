<!-- b0 -->CENTRO ESTADUAL DE EDUCAÇÃO TECNOLÓGICA PAULA SOUZA
<!-- b1 -->FACULDADE DE TECNOLOGIA DE ITU
<!-- b2 -->“DOM AMAURY CASTANHO”
<!-- b7 -->BEATRIZ SILVA DE CAMARGO
<!-- b8 -->ISAQUE BATISTA BARBOSA
<!-- b15 -->SISZOO - SISTEMA DE GERENCIAMENTO DO CENTRO DE ZOONOSES DA CIDADE DE ITU
<!-- b31 -->ITU
<!-- b32 -->2026
<!-- b33 -->BEATRIZ SILVA DE CAMARGO
<!-- b34 -->ISAQUE BATISTA BARBOSA
<!-- b40 -->SISZOO – SISTEMA DE GERENCIAMENTO DO CENTRO DE ZOONOSES DA CIDADE DE ITU
<!-- b44 -->Trabalho de Graduação apresentado à Banca Examinadora da Faculdade de Tecnologia de Itu “Dom Amaury Castanho”, como exigência parcial para conclusão do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas, sob orientação do Prof. Me. Francisco Bianchi.
<!-- b53 -->ITU
<!-- b54 -->2026
<!-- b56 -->DEDICATÓRIA
<!-- b58 -->Dedicamos este trabalho ao nosso futuro promissor, sendo este o primeiro passo para uma vida de sucesso e que aguarda grandes realizações.
<!-- b60 -->AGRADECIMENTOS
<!-- b62 -->Às nossas famílias, pelo apoio incondicional, pela compreensão nos momentos de ausência e pelo incentivo constante que nos permitiu focar nos estudos e no desenvolvimento deste projeto.
<!-- b63 -->Ao nosso orientador, Prof. Me. Francisco Bianchi, pela paciência, pelas correções pontuais e por conduzir este trabalho com sabedoria, ajudando-nos a transformar uma ideia em um projeto acadêmico.
<!-- b64 -->À Faculdade de Tecnologia de Itu (FATEC) e ao Centro Paula Souza, pela excelência no ensino e pela infraestrutura disponibilizada ao longo da graduação.
<!-- b65 -->Aos profissionais do Centro de Controle de Zoonoses de Itu, em especial à equipe de gestão, que gentilmente nos atendeu e expôs as dificuldades operacionais do dia a dia.
<!-- b66 -->Por fim, agradecemos um ao outro, Isaque e Beatriz, pela parceria e pelo esforço conjunto para superar os desafios técnicos e acadêmicos que surgiram durante o desenvolvimento desta solução.
<!-- b68 -->EPÍGRAFE
<!-- b71 -->“A saúde é direito de todos e dever do Estado, garantido mediante políticas sociais e econômicas que visem à redução do risco de doença e de outros agravos e ao acesso universal e igualitário às ações e serviços para sua promoção, proteção e recuperação. ”
<!-- b72 -->(Constituição da República Federativa do Brasil de 1988, art. 196)
<!-- b74 --># RESUMO
<!-- b76 -->O Centro de Controle de Zoonoses (CCZ) de Itu, unidade municipal responsável por ações de vigilância, prevenção e controle de zoonoses, registra os animais do canil e os processos sanitários em fichas manuscritas, planilhas eletrônicas e cadernos físicos não integrados, o que dificulta a localização das informações e favorece inconsistências. Este trabalho teve como objetivo desenvolver o SISZOO, sistema web de uso interno para a gestão dos animais do canil, das ocorrências e dos processos sanitários do CCZ de Itu. Trata-se de pesquisa aplicada, de abordagem qualitativa, desenvolvida como estudo de caso. Os requisitos foram levantados por meio de entrevista com a equipe do CCZ, observação das rotinas e análise das planilhas de controle. O desenvolvimento seguiu o framework Scrum, com backend em Java e Spring Boot, frontend em React com TypeScript e banco de dados PostgreSQL. A modelagem compreendeu diagramas de casos de uso, entidade-relacionamento, lógicos e de classes, dicionário de dados e protótipos das interfaces. O sistema reúne o cadastro de animais identificados por microchip, o controle de ocupação das baias, o histórico veterinário com registros imutáveis, os alertas de reforço vacinal com sete dias de antecedência, o registro de ocorrências com sigilo do denunciante, os processos sanitários com protocolo sequencial anual, a sinalização de urgência nos casos com contato humano-animal, a notificação por e-mail de resultados positivos ou inconclusivos, o controle de acesso por perfil com trilha de auditoria e um painel de indicadores com relatórios. Conclui-se que o SISZOO permite substituir os controles fragmentados do CCZ de Itu por uma base de dados única; a capacitação da equipe e a implantação do sistema são propostas como trabalhos futuros.
<!-- b77 -->Palavras-chave: zoonoses; saúde; sistema.
<!-- b80 --># ABSTRACT
<!-- b82 -->The Zoonoses Control Center (Centro de Controle de Zoonoses, CCZ) of Itu, Brazil, a municipal unit responsible for zoonosis surveillance, prevention and control, records its kennel animals and zoonosis investigation cases on handwritten forms, spreadsheets and paper notebooks that are not integrated, which makes information hard to retrieve and prone to inconsistencies. This work aimed to develop SISZOO, an internal web system for managing the kennel animals, complaints and zoonosis investigation cases of the CCZ of Itu. It is an applied, qualitative research study conducted as a case study. Requirements were gathered through an interview with the CCZ staff, observation of daily routines and analysis of the control spreadsheets. Development followed the Scrum framework, with a Java and Spring Boot back end, a React and TypeScript front end and a PostgreSQL database. The modeling comprised use case, entity-relationship, logical and class diagrams, a data dictionary and interface prototypes. The system brings together microchip-based animal registration, kennel occupancy control, immutable veterinary records, vaccine booster alerts seven days in advance, complaint registration with whistleblower confidentiality, zoonosis investigation cases with yearly sequential protocol numbers, urgency flags for cases involving human-animal contact, e-mail notification of positive or inconclusive results, role-based access control with an audit trail, and an indicator dashboard with reports. It is concluded that SISZOO makes it possible to replace the fragmented controls of the CCZ of Itu with a single database; staff training and the deployment of the system are proposed as future work.
<!-- b83 -->Keywords: zoonosis; health; system.
<!-- b87 --># LISTA DE ABREVIATURAS E SIGLAS
<!-- b89 -->API – Application Programming Interface
<!-- b90 -->CCZ – Centro de Controle de Zoonoses
<!-- b91 -->CID – Classificação Internacional de Doenças
<!-- b92 -->CSV – Comma-Separated Values
<!-- b93 -->DATASUS – Departamento de Informação e Informática do Sistema Único de Saúde
<!-- b94 -->DER – Diagrama Entidade-Relacionamento
<!-- b95 -->GAL – Gerenciador de Ambiente Laboratorial
<!-- b96 -->GEPAR – Grupo Especial de Proteção Ambiental e Rural
<!-- b97 -->HTML – HyperText Markup Language
<!-- b98 -->HTTP – Hypertext Transfer Protocol
<!-- b99 -->HTTPS – Hypertext Transfer Protocol Secure
<!-- b100 -->JPA – Jakarta Persistence API
<!-- b101 -->JWT – JSON Web Token
<!-- b102 -->LGPD – Lei Geral de Proteção de Dados Pessoais
<!-- b103 -->OHHLEP – One Health High-Level Expert Panel
<!-- b104 -->PDF – Portable Document Format
<!-- b105 -->PNPR – Programa Nacional de Profilaxia da Raiva
<!-- b106 -->REST – Representational State Transfer
<!-- b107 -->RF – Requisito Funcional
<!-- b108 -->RFC – Request for Comments
<!-- b109 -->RFID – Radio Frequency Identification
<!-- b110 -->SINAN – Sistema de Informação de Agravos de Notificação
<!-- b111 -->TIC – Tecnologia da Informação e Comunicação
<!-- b112 -->UML – Unified Modeling Language
<!-- b113 -->UTC – Tempo Universal Coordenado
<!-- b114 -->UUID – Universally Unique Identifier
<!-- b115 -->UVZ – Unidade de Vigilância de Zoonoses
<!-- b117 --># SUMÁRIO
<!-- b118 -->No table of contents entries found.
<!-- b120 --># LISTA DE FIGURAS
<!-- b121 -->	Figura 1 – Diagrama de casos de uso geral do SISZOO	38
<!-- b122 -->	Figura 2 – Diagrama de casos de uso – Módulo 1: Autenticação e Controle de Acesso	39
<!-- b123 -->	Figura 3 – Diagrama de casos de uso – Módulo 2: Gestão de Animais do Canil	40
<!-- b124 -->	Figura 4 – Diagrama de casos de uso – Módulo 3: Ocorrências e Denúncias	41
<!-- b125 -->	Figura 5 – Diagrama de casos de uso – Módulo 4: Processos Sanitários	42
<!-- b126 -->	Figura 6 – Diagrama de casos de uso – Módulo 5: Dashboard e Relatórios	43
<!-- b127 -->	Figura 7 – DER conceitual – Módulo 1: Usuários e Acesso	45
<!-- b128 -->	Figura 8 – DER conceitual – Módulo 2: Gestão de Animais do Canil	46
<!-- b129 -->	Figura 9 – DER conceitual – Módulo 3: Ocorrências e Denúncias	47
<!-- b130 -->	Figura 10 – DER conceitual – Módulo 4: Processos Sanitários	48
<!-- b131 -->	Figura 11 – DER conceitual – Módulo 5: Relatórios	49
<!-- b132 -->	Figura 12 – Diagrama lógico – Módulo 1: Autenticação e Controle de Acesso	51
<!-- b133 -->	Figura 13 – Diagrama lógico – Módulo 2: Gestão de Animais do Canil	52
<!-- b134 -->	Figura 14 – Diagrama lógico – Módulo 3: Ocorrências e Denúncias	53
<!-- b135 -->	Figura 15 – Diagrama lógico – Módulo 4: Processos Sanitários	54
<!-- b136 -->	Figura 16 – Diagrama lógico – Módulo 5: Relatórios	55
<!-- b137 -->	Figura 17 – Diagrama de classes – Módulo 1: Usuários e Acesso	58
<!-- b138 -->	Figura 18 – Diagrama de classes – Módulo 2: animal, baias e adoção	59
<!-- b139 -->	Figura 19 – Diagrama de classes – Módulo 2: vacinação e prescrição	60
<!-- b140 -->	Figura 20 – Diagrama de classes – Módulo 2: procedimentos, exames e sintomas	61
<!-- b141 -->	Figura 21 – Diagrama de classes – Módulo 2: enumerações	62
<!-- b142 -->	Figura 22 – Diagrama de classes – Módulo 3: Ocorrências e Denúncias	63
<!-- b143 -->	Figura 23 – Diagrama de classes – Módulo 4: Processos Sanitários	64
<!-- b144 -->	Figura 24 – Diagrama de classes – Módulo 4: enumerações	65
<!-- b145 -->	Figura 25 – Diagrama de classes – Módulo 5: Relatórios	66
<!-- b146 -->	Figura 26 – Protótipo da tela T02: Dashboard operacional	69
<!-- b147 -->	Figura 27 – Protótipo da tela T06: Ficha do animal	71
<!-- b148 -->	Figura 28 – Protótipo da tela T10: Detalhe da ocorrência	73
<!-- b149 -->	Figura 29 – Protótipo da tela T07: Gestão de baias	75
<!-- b150 -->	Figura 30 – Protótipo da tela T14: Central de relatórios	77
<!-- b151 -->	Figura 31 – Tela T01: Login	80
<!-- b152 -->	Figura 32 – Tela T02: Dashboard operacional	80
<!-- b153 -->	Figura 33 – Tela T03: Alertas	80
<!-- b154 -->	Figura 34 – Tela T04: Animais do canil	80
<!-- b155 -->	Figura 35 – Tela T05: Cadastro de animal	81
<!-- b156 -->	Figura 36 – Tela T06: Ficha do animal	81
<!-- b157 -->	Figura 37 – Tela T07: Gestão de baias	81
<!-- b158 -->	Figura 38 – Tela T08: Ocorrências	81
<!-- b159 -->	Figura 39 – Tela T09: Registro de ocorrência	81
<!-- b160 -->	Figura 40 – Tela T10: Detalhe da ocorrência	81
<!-- b161 -->	Figura 41 – Tela T11: Processos sanitários	82
<!-- b162 -->	Figura 42 – Tela T12: Abertura de processo	82
<!-- b163 -->	Figura 43 – Tela T13: Detalhe do processo	82
<!-- b164 -->	Figura 44 – Tela T14: Central de relatórios	82
<!-- b165 -->	Figura 45 – Tela T15: Usuários	82
<!-- b166 -->	Figura 46 – Tela T16: Configurações	82
<!-- b167 -->	Figura 47 – Tela T17: Perfil e Ajuda	83
<!-- b168 -->	Figura 48 – [DESCRIÇÃO DA FOTOGRAFIA]	128
<!-- b169 -->	Figura 49 – Tela T18: Relatório anual de processos	129
<!-- b170 -->	Figura 50 – Tela T19: Relatório de vacinação	129
<!-- b171 -->	Figura 51 – Tela T20: Relatório de adoções	129
<!-- b172 -->	Figura 52 – Tela T21: Relatório de procedimentos	129
<!-- b173 -->	Figura 53 – Tela T22: Relatório de ocupação de baias	129
<!-- b174 -->	Figura 54 – Tela T23: Relatório de ocorrências por bairro	129
<!-- b175 -->	Figura 55 – [PLANILHA E TRECHO APRESENTADO]	130
<!-- b177 --># LISTA DE QUADROS
<!-- b178 -->	Quadro 1 – Características das zoonoses atendidas pelo CCZ de Itu	18
<!-- b179 -->	Quadro 2 – Comparativo entre sistemas similares e o SISZOO	22
<!-- b180 -->	Quadro 3 – Sistemas em uso no CCZ de Itu	22
<!-- b181 -->	Quadro 4 – Perfis de acesso do SISZOO	25
<!-- b182 -->	Quadro 5 – Planejamento das sprints do projeto SISZOO	28
<!-- b183 -->	Quadro 6 – Requisitos funcionais do Módulo 1: Autenticação e Controle de Acesso	29
<!-- b184 -->	Quadro 7 – Requisitos funcionais do Módulo 2: Gestão de Animais do Canil	29
<!-- b185 -->	Quadro 8 – Requisitos funcionais do Módulo 3: Ocorrências e Denúncias	30
<!-- b186 -->	Quadro 9 – Requisitos funcionais do Módulo 4: Processos Sanitários	30
<!-- b187 -->	Quadro 10 – Requisitos funcionais do Módulo 5: Dashboard e Relatórios	31
<!-- b188 -->	Quadro 11 – Relatórios previstos no SISZOO	31
<!-- b189 -->	Quadro 12 – Requisitos não funcionais do SISZOO	32
<!-- b190 -->	Quadro 13 – Regras de negócio do SISZOO	32
<!-- b191 -->	Quadro 14 – Bibliotecas utilizadas no SISZOO	78
<!-- b192 -->	Quadro 15 – Telas do SISZOO	79
<!-- b193 -->	Quadro 16 – Caso de uso de baixo nível Realizar Login	90
<!-- b194 -->	Quadro 17 – Caso de uso de baixo nível Encerrar Sessão (Logout)	91
<!-- b195 -->	Quadro 18 – Caso de uso de baixo nível Editar Preferências do Usuário	91
<!-- b196 -->	Quadro 19 – Caso de uso de baixo nível Gerenciar Usuários	92
<!-- b197 -->	Quadro 20 – Caso de uso de baixo nível Atribuir Cargo e Permissões	92
<!-- b198 -->	Quadro 21 – Caso de uso de baixo nível Desativar/Reativar Usuário	93
<!-- b199 -->	Quadro 22 – Caso de uso de baixo nível Consultar Trilha de Auditoria	94
<!-- b200 -->	Quadro 23 – Caso de uso de baixo nível Cadastrar Animal	94
<!-- b201 -->	Quadro 24 – Caso de uso de baixo nível Editar Dados do Animal	95
<!-- b202 -->	Quadro 25 – Caso de uso de baixo nível Registrar Saída/Desfecho	96
<!-- b203 -->	Quadro 26 – Caso de uso de baixo nível Registrar Adoção	96
<!-- b204 -->	Quadro 27 – Caso de uso de baixo nível Transferir Animal de Baia	97
<!-- b205 -->	Quadro 28 – Caso de uso de baixo nível Consultar Animais por Baia	98
<!-- b206 -->	Quadro 29 – Caso de uso de baixo nível Registrar Aplicação de Vacina	98
<!-- b207 -->	Quadro 30 – Caso de uso de baixo nível Prescrever Medicamento	99
<!-- b208 -->	Quadro 31 – Caso de uso de baixo nível Registrar Procedimento Clínico	99
<!-- b209 -->	Quadro 32 – Caso de uso de baixo nível Registrar Exame	100
<!-- b210 -->	Quadro 33 – Caso de uso de baixo nível Gerenciar Baias	100
<!-- b211 -->	Quadro 34 – Caso de uso de baixo nível Anexar Documento ao Animal	101
<!-- b212 -->	Quadro 35 – Caso de uso de baixo nível Registrar Nova Ocorrência	102
<!-- b213 -->	Quadro 36 – Caso de uso de baixo nível Informar Denunciado	103
<!-- b214 -->	Quadro 37 – Caso de uso de baixo nível Anexar Documento à Ocorrência	103
<!-- b215 -->	Quadro 38 – Caso de uso de baixo nível Consultar e Filtrar Ocorrências	104
<!-- b216 -->	Quadro 39 – Caso de uso de baixo nível Encerrar Ocorrência	104
<!-- b217 -->	Quadro 40 – Caso de uso de baixo nível Abrir Processo Sanitário	105
<!-- b218 -->	Quadro 41 – Caso de uso de baixo nível Registrar Animal Amostrado	106
<!-- b219 -->	Quadro 42 – Caso de uso de baixo nível Registrar Resultado Laboratorial	107
<!-- b220 -->	Quadro 43 – Caso de uso de baixo nível Consultar e Filtrar Processos	107
<!-- b221 -->	Quadro 44 – Caso de uso de baixo nível Encerrar Processo	108
<!-- b222 -->	Quadro 45 – Caso de uso de baixo nível Gerar Documento do Processo	108
<!-- b223 -->	Quadro 46 – Caso de uso de baixo nível Visualizar Dashboard em Tempo Real	109
<!-- b224 -->	Quadro 47 – Caso de uso de baixo nível Consultar Alertas Vacinais	110
<!-- b225 -->	Quadro 48 – Caso de uso de baixo nível Monitorar Ocupação de Baias	110
<!-- b226 -->	Quadro 49 – Caso de uso de baixo nível Solicitar Geração de Relatório	111
<!-- b227 -->	Quadro 50 – Caso de uso de baixo nível Acompanhar Status do Relatório	111
<!-- b228 -->	Quadro 51 – Caso de uso de baixo nível Baixar Relatório Gerado	112
<!-- b229 -->	Quadro 52 – Dicionário de dados – tabela Usuario	113
<!-- b230 -->	Quadro 53 – Dicionário de dados – tabela Cargo	113
<!-- b231 -->	Quadro 54 – Dicionário de dados – tabela UsuarioCargo	113
<!-- b232 -->	Quadro 55 – Dicionário de dados – tabela CargoPermissao	113
<!-- b233 -->	Quadro 56 – Dicionário de dados – tabela PreferenciaUsuario	114
<!-- b234 -->	Quadro 57 – Dicionário de dados – tabela AuditoriaEvento	114
<!-- b235 -->	Quadro 58 – Dicionário de dados – tabela MotivoEntrada	114
<!-- b236 -->	Quadro 59 – Dicionário de dados – tabela TipoBaia	114
<!-- b237 -->	Quadro 60 – Dicionário de dados – tabela Baia	115
<!-- b238 -->	Quadro 61 – Dicionário de dados – tabela Sintoma	115
<!-- b239 -->	Quadro 62 – Dicionário de dados – tabela Vacina	115
<!-- b240 -->	Quadro 63 – Dicionário de dados – tabela VacinaEspecie	115
<!-- b241 -->	Quadro 64 – Dicionário de dados – tabela TipoProcedimento	115
<!-- b242 -->	Quadro 65 – Dicionário de dados – tabela CategoriaFarmacologica	116
<!-- b243 -->	Quadro 66 – Dicionário de dados – tabela Laboratorio	116
<!-- b244 -->	Quadro 67 – Dicionário de dados – tabela Animal	116
<!-- b245 -->	Quadro 68 – Dicionário de dados – tabela AnimalSintoma	117
<!-- b246 -->	Quadro 69 – Dicionário de dados – tabela AnexoAnimal	117
<!-- b247 -->	Quadro 70 – Dicionário de dados – tabela Vacinacao	117
<!-- b248 -->	Quadro 71 – Dicionário de dados – tabela AnexoVacinacao	118
<!-- b249 -->	Quadro 72 – Dicionário de dados – tabela Procedimento	118
<!-- b250 -->	Quadro 73 – Dicionário de dados – tabela AnexoProcedimento	118
<!-- b251 -->	Quadro 74 – Dicionário de dados – tabela Medicamento	119
<!-- b252 -->	Quadro 75 – Dicionário de dados – tabela Prescricao	119
<!-- b253 -->	Quadro 76 – Dicionário de dados – tabela TipoExame	119
<!-- b254 -->	Quadro 77 – Dicionário de dados – tabela Exame	119
<!-- b255 -->	Quadro 78 – Dicionário de dados – tabela AnexoExame	120
<!-- b256 -->	Quadro 79 – Dicionário de dados – tabela Adocao	120
<!-- b257 -->	Quadro 80 – Dicionário de dados – tabela TipoOcorrencia	121
<!-- b258 -->	Quadro 81 – Dicionário de dados – tabela ProvidenciaTomada	121
<!-- b259 -->	Quadro 82 – Dicionário de dados – tabela Denunciante	121
<!-- b260 -->	Quadro 83 – Dicionário de dados – tabela Denunciado	121
<!-- b261 -->	Quadro 84 – Dicionário de dados – tabela Ocorrencia	121
<!-- b262 -->	Quadro 85 – Dicionário de dados – tabela AnexoOcorrencia	122
<!-- b263 -->	Quadro 86 – Dicionário de dados – tabela MovimentacaoOcorrencia	122
<!-- b264 -->	Quadro 87 – Dicionário de dados – tabela Doenca	123
<!-- b265 -->	Quadro 88 – Dicionário de dados – tabela TipoDocumentoProcesso	123
<!-- b266 -->	Quadro 89 – Dicionário de dados – tabela ResponsavelProcesso	123
<!-- b267 -->	Quadro 90 – Dicionário de dados – tabela ProcessoSanitario	123
<!-- b268 -->	Quadro 91 – Dicionário de dados – tabela DocumentoProcesso	124
<!-- b269 -->	Quadro 92 – Dicionário de dados – tabela AmostraAnimal	125
<!-- b270 -->	Quadro 93 – Dicionário de dados – tabela AmostraSintoma	125
<!-- b271 -->	Quadro 94 – Dicionário de dados – tabela RelatorioGerado	126
<!-- b273 -->#  INTRODUÇÃO
<!-- b274 -->A modernização dos serviços públicos por meio de Tecnologias da Informação e Comunicação (TIC) é um passo importante para aumentar a eficiência e a transparência da gestão governamental. A Lei nº 14.129, de 29 de março de 2021, estabelece princípios e instrumentos para o Governo Digital, como a desburocratização e a transformação digital, aplicáveis aos municípios que adotarem seus comandos por ato normativo próprio (BRASIL, 2021a). Nos Centros de Controle de Zoonoses (CCZ), unidades municipais responsáveis por ações de vigilância, prevenção e controle de zoonoses (BRASIL, 2014), o registro adequado das informações sobre animais e investigações é condição para a efetividade dessas ações.
<!-- b275 -->O CCZ do município de Itu, cidade de 168.240 habitantes segundo o Censo 2022 (IBGE, [2026]), situada na Região Metropolitana de Sorocaba, opera em duas unidades – São Francisco de Assis e Vila Martins – e mantinha sob custódia, no período deste estudo, 95 cães e 15 gatos (segundo a equipe, em 9 jan. 2026) destinados à adoção, além de conduzir processos sanitários relacionados à raiva, à esporotricose, à leishmaniose, à leptospirose, à febre maculosa e à febre amarela. Conforme levantamento realizado com a equipe técnica do CCZ em janeiro de 2026, cada animal possui uma ficha manuscrita individual, uma planilha eletrônica para controle por baias e um cadastro na plataforma AnimalTag – três fontes de informação não integradas, alimentadas manualmente e sujeitas a inconsistências.
<!-- b276 -->A situação é semelhante no fluxo de ocorrências e processos sanitários. O agente responsável registra as ocorrências em um caderno físico, uma vez que o processo original é encaminhado ao fiscal sanitário e não permanece no setor. A numeração de protocolo é sequencial e anual, sem mecanismo digital de busca, filtragem ou acompanhamento de resultados laboratoriais. Os materiais biológicos são enviados ao Instituto Pasteur de São Paulo, ao Instituto Adolfo Lutz (inclusive a unidade de Sorocaba) e ao laboratório indicado como “CCZ-SP” na planilha de controle, e os resultados são anotados em planilha separada. Essa planilha mostra o risco de inconsistência: o processo 0173/2025 aparece com resultado “NEGATIVO” na aba “Planilha1” e “POSITIVO” na aba “PLANILHA 2”.
<!-- b277 -->Diante desse cenário, este trabalho busca responder à seguinte questão: de que maneira um sistema web de gestão integrada pode superar as limitações decorrentes do controle manual de animais e processos sanitários no CCZ de Itu, proporcionando rastreabilidade individual dos animais, registro dos procedimentos veterinários e digitalização do fluxo de ocorrências? Parte-se da hipótese de que um sistema web centralizado, construído a partir dos fluxos de trabalho reais levantados com a equipe, é capaz de substituir os controles fragmentados por uma base de dados relacional integrada.
<!-- b278 -->O objetivo geral deste trabalho é desenvolver o SISZOO, sistema web de uso interno para a gestão dos animais do canil e dos processos sanitários do CCZ de Itu. Para isso, foram definidos os seguintes objetivos específicos: a) analisar e mapear o fluxo de trabalho manual vigente; b) levantar os requisitos funcionais e não funcionais; c) modelar o sistema e prototipar suas interfaces; d) desenvolver as funcionalidades centrais e; e) realizar testes funcionais.
<!-- b279 -->A relevância do trabalho está em reunir, em uma única base, informações hoje dispersas que sustentam decisões de saúde pública, como a localização de um animal sob investigação e o acompanhamento do resultado laboratorial de um processo com contato humano. O escopo restringe-se à operação interna do CCZ de Itu: não inclui portal público para cidadãos, aplicativo móvel nem integração automática com os sistemas estaduais e federais de vigilância.
<!-- b280 -->Além desta introdução, o trabalho está organizado em cinco capítulos e nas considerações finais. O Capítulo 1 apresenta a fundamentação teórica: as zoonoses e a vigilância em saúde, os Centros de Controle de Zoonoses, a notificação compulsória, o CCZ de Itu, a Saúde Única, o Governo Digital, a identificação animal por microchip, a proteção de dados, os sistemas similares e os conceitos de requisitos, modelagem e prototipação utilizados. O Capítulo 2 descreve a metodologia, com a classificação da pesquisa, os perfis de usuário, as tecnologias empregadas e a gestão do projeto com Scrum. O Capítulo 3 apresenta os requisitos funcionais e não funcionais, as regras de negócio, a delimitação do escopo, os riscos e as limitações. O Capítulo 4 reúne a modelagem do sistema, com os diagramas de casos de uso, entidade-relacionamento, lógicos e de classes, o dicionário de dados e os protótipos das interfaces. O Capítulo 5 apresenta o sistema desenvolvido, com a organização do código, as bibliotecas utilizadas e as telas implementadas. Por fim, as considerações finais retomam os objetivos, as limitações e os trabalhos futuros, entre eles a capacitação da equipe e a implantação do sistema.

<!-- b281 --># 1 FUNDAMENTAÇÃO TEÓRICA
<!-- b282 -->## 1.1 ZOONOSES E VIGILÂNCIA EM SAÚDE
<!-- b283 -->Zoonoses são doenças ou infecções transmissíveis entre animais e seres humanos. No Brasil, as ações de vigilância, prevenção e controle dessas doenças são executadas pelas Unidades de Vigilância de Zoonoses (UVZ) e pela área de vigilância de zoonoses dos municípios, de acordo com normas técnicas do Ministério da Saúde (BRASIL, 2016). No CCZ de Itu, os processos sanitários envolvem raiva, esporotricose, leishmaniose visceral, leptospirose, febre maculosa e febre amarela, doenças cadastradas no sistema, cujas características são apresentadas no Quadro 1.
<!-- b284 -->Quadro 1 – Características das zoonoses atendidas pelo CCZ de Itu

| Doença | Agente etiológico | Animais envolvidos | Transmissão ao ser humano | Notificação compulsória (casos humanos) |
|---|---|---|---|---|
| Raiva | Vírus do gênero Lyssavirus (família Rhabdoviridae) | Mamíferos; no ciclo urbano, cães e gatos; no silvestre, morcegos, primatas não humanos, canídeos silvestres e outros mamíferos silvestres; no rural, herbívoros domésticos | Saliva do animal infectado, por mordedura, arranhadura ou lambedura de mucosa ou pele lesionada | Raiva humana: imediata. Acidente por animal potencialmente transmissor da raiva: imediata (município) |
| Esporotricose | Fungos do gênero Sporothrix | Principalmente gatos domésticos | Arranhadura, mordedura ou contato com secreção de lesões de gatos infectados; também inoculação de material vegetal ou solo contaminado | Semanal (incluída em 2025); a notificação animal não é compulsória em âmbito nacional |
| Leishmaniose visceral | Protozoário Leishmania infantum | Cão doméstico, principal reservatório urbano | Picada da fêmea de flebotomíneo infectada (principalmente Lutzomyia longipalpis, mosquito-palha); não há transmissão direta do cão ao ser humano | Semanal |
| Leptospirose | Bactérias do gênero Leptospira | Roedores sinantrópicos, principais reservatórios; também cães, bovinos e suínos | Contato da pele ou de mucosas com água, lama ou solo contaminados pela urina de animais infectados | Imediata (município) |
| Febre maculosa | Bactérias do gênero Rickettsia | Carrapatos do gênero Amblyomma (vetores); capivaras e equinos como hospedeiros | Picada de carrapato infectado | Imediata |
| Febre amarela | Vírus da febre amarela (família Flaviviridae) | Primatas não humanos, hospedeiros do ciclo silvestre e sentinelas da circulação viral; mosquitos Haemagogus e Sabethes (vetores) | Picada de mosquito infectado | Imediata |

<!-- b286 -->Fonte: Elaborado pelos autores com base em Brasil (2016; 2023; 2025b; 2026c; 2026d) e São Paulo (2026).
<!-- b288 -->## 1.2 CENTROS DE CONTROLE DE ZOONOSES
<!-- b289 -->A relação entre seres humanos e animais é registrada desde os primórdios da civilização e, ao longo dos anos, essa convivência contribuiu para o surgimento de diversas doenças transmitidas de animais para humanos. No Brasil, nas décadas de 1970 e 1980, a raiva representava um grave problema de saúde pública, resultando em elevado número de óbitos. Com o objetivo de controlar e erradicar essa doença, foi criado o Programa Nacional de Profilaxia da Raiva (PNPR). Como desdobramento desse programa, instituiu-se o Centro de Controle de Zoonoses (CCZ), com a finalidade de atuar no controle das zoonoses, isso é, enfermidades originadas em animais capazes de representar risco à saúde humana (BARROSO; LIMA, 2012; ALMEIDA; CALDAS, 2022).
<!-- b290 -->Atualmente, a atuação desses serviços é orientada pela Portaria GM/MS nº 1.138, de 23 de maio de 2014, que define as ações e os serviços de saúde voltados para vigilância, prevenção e controle de zoonoses e de acidentes causados por animais peçonhentos e venenosos, de relevância para a saúde pública (BRASIL, 2014). A portaria considera de relevância para a saúde pública o animal que atua como vetor, hospedeiro, reservatório ou amplificador de zoonoses, o animal suscetível em situação de risco, o animal peçonhento ou venenoso e o animal causador de agravos que represente risco de transmissão de doenças ao ser humano (BRASIL, 2014, art. 2º). Entre as ações listadas no art. 3º estão a vacinação animal contra zoonoses, a coleta e o transporte de amostras biológicas de animais, o diagnóstico laboratorial de zoonoses, o recolhimento e o transporte de animais, a manutenção e os cuidados básicos dos animais recolhidos e sua destinação adequada. O mesmo artigo inclui, no inciso IX, a eutanásia de animais de relevância para a saúde pública, quando indicada.
<!-- b291 -->O Ministério da Saúde denomina os estabelecimentos que executam essas ações Unidades de Vigilância de Zoonoses (UVZ), categoria que abrange os Centros de Controle de Zoonoses municipais, e orienta que os procedimentos realizados sejam “documentados, organizados e arquivados, por meio eletrônico ou impresso” (BRASIL, 2016, p. 30). A Lei nº 14.228, de 20 de outubro de 2021, veda a eliminação da vida de cães e de gatos pelos órgãos de controle de zoonoses, canis públicos e estabelecimentos oficiais congêneres, com exceção da eutanásia nos casos de males, doenças graves ou enfermidades infectocontagiosas incuráveis que coloquem em risco a saúde humana e a de outros animais (BRASIL, 2021b, art. 2º). A eutanásia deve ser justificada por laudo do responsável técnico do órgão, precedido, quando for o caso, de exame laboratorial (art. 2º, § 1º). Ressalvada a doença infectocontagiosa incurável que caracterize risco à saúde pública, o animal pode ser disponibilizado para resgate por entidade de proteção dos animais (art. 2º, § 2º), e essas entidades têm acesso irrestrito à documentação que comprove a legalidade da eutanásia (art. 3º). Essas exigências recaem sobre o órgão, e não sobre o sistema; no SISZOO, relacionam-se ao registro do destino do animal (RF-A05). Segundo a equipe do CCZ de Itu, as denúncias de maus-tratos são de atribuição do Grupo Especial de Proteção Ambiental e Rural (GEPAR).
<!-- b292 -->## 1.3 NOTIFICAÇÃO COMPULSÓRIA E SISTEMAS DE INFORMAÇÃO
<!-- b293 -->A notificação compulsória é a comunicação obrigatória à autoridade de saúde, realizada por profissionais de saúde ou responsáveis por estabelecimentos de saúde, sobre a ocorrência de suspeita ou confirmação de doença, agravo ou evento de saúde pública, podendo ser imediata ou semanal (BRASIL, [2026b]). As doenças sujeitas a essa comunicação constam da Lista Nacional de Notificação Compulsória, no Anexo 1 do Anexo V da Portaria de Consolidação GM/MS nº 4/2017, alterada pela Portaria GM/MS nº 10.175/2026 (BRASIL, 2026a) e, por último, pela Portaria GM/MS nº 11.211/2026, que republicou a lista no seu Anexo I (BRASIL, 2026c). Em março de 2025, a Portaria GM/MS nº 6.734 incluiu a esporotricose humana nessa lista (BRASIL, 2025a). A notificação é registrada no Sistema de Informação de Agravos de Notificação (SINAN), que permite acompanhar a ocorrência dos agravos na população e apoiar o planejamento em saúde (BRASIL, [2026b]). Os exames das amostras enviadas aos laboratórios de saúde pública são requisitados e acompanhados no Gerenciador de Ambiente Laboratorial (GAL), desenvolvido pelo DATASUS e pela Secretaria de Vigilância em Saúde, com módulos de biologia médica humana, animal e ambiental (GOIÁS, 2020).
<!-- b294 -->No Estado de São Paulo, a esporotricose é transmitida majoritariamente por felinos domésticos em área urbana, e a notificação dos casos animais não é compulsória em âmbito nacional (SÃO PAULO, 2026), embora o seja em alguns estados e municípios (BRASIL, 2025b). No SISZOO, o número da notificação no SINAN e o da requisição no GAL são registrados no processo sanitário para rastreabilidade, sem integração automática com esses sistemas, e o resultado positivo ou inconclusivo é comunicado por e-mail ao responsável e à Vigilância Epidemiológica do município (RN10); esse aviso é uma decisão de projeto e não substitui a notificação compulsória no SINAN.
<!-- b295 -->## 1.4 O CENTRO DE CONTROLE DE ZOONOSES DE ITU
<!-- b296 -->Itu é um município paulista da Região Metropolitana de Sorocaba, com área de 640,719 km² e população de 168.240 habitantes no Censo 2022 (IBGE, [2026]). O CCZ opera em duas unidades, São Francisco de Assis e Vila Martins. Embora o atendimento clínico conte com sistema informatizado, a gestão dos animais alojados é feita em fichas físicas, em planilhas eletrônicas e na plataforma AnimalTag, sem integração entre si; nas palavras da veterinária do canil, “tudo isso hoje tá no papel”.
<!-- b297 -->Os registros fotográficos da visita constam no Apêndice D, e as planilhas de controle utilizadas pelo CCZ, no Anexo A.
<!-- b298 -->## 1.5 SAÚDE ÚNICA (ONE HEALTH) E A ATUAÇÃO DO CCZ
<!-- b299 -->A Saúde Única (One Health) é definida como uma abordagem integrada e unificadora que busca equilibrar e otimizar, de forma sustentável, a saúde de pessoas, animais e ecossistemas (ONE HEALTH HIGH-LEVEL EXPERT PANEL et al., 2022). No Brasil, a abordagem é discutida como estratégia para entender, prevenir e controlar doenças infecciosas e parasitárias (ELLWANGER; CHIES, 2022). O CCZ aplica esse conceito ao atuar na interface humano–animal–ambiente.
<!-- b300 -->## 1.6 GOVERNO DIGITAL
<!-- b301 -->A Lei nº 14.129/2021 dispõe sobre princípios, regras e instrumentos para o Governo Digital. Seu art. 2º aplica a lei à administração pública federal e, no caso dos demais entes federados, condiciona sua aplicação à adoção de seus comandos por atos normativos próprios (BRASIL, 2021a). Independentemente dessa adesão, Balbe (2010) aponta que o uso planejado de TIC na gestão pública é vetor de modernização e de melhoria da qualidade dos serviços.
<!-- b302 -->## 1.7 IDENTIFICAÇÃO ANIMAL POR MICROCHIP E RFID
<!-- b303 -->A identificação eletrônica de animais utiliza microchips de radiofrequência implantados sob a pele, cujo código de 15 dígitos e protocolo de leitura são padronizados pelas normas ISO 11784 e ISO 11785. A Lei nº 15.046, de 17 de dezembro de 2024, autorizou a criação do Cadastro Nacional de Animais Domésticos e prevê o uso de chip que identifique o animal como cadastrado (BRASIL, 2024). No SISZOO, o número do microchip é o identificador único do animal (RN01). O animal que chega ao CCZ sem microchip é cadastrado e recebe o chip na própria unidade, quando então o número e a data de implantação são registrados.
<!-- b304 -->## 1.8 LGPD E PROTEÇÃO DE DADOS EM SISTEMAS DE SAÚDE PÚBLICA
<!-- b305 -->A LGPD define dado pessoal como informação relacionada a pessoa natural identificada ou identificável e considera sensível, entre outros, o dado referente à saúde quando vinculado a uma pessoa natural (BRASIL, 2018, art. 5º, I e II). No SISZOO, são dados pessoais as informações de denunciantes, denunciados, responsáveis por animais investigados e adotantes; o registro de contato ou agressão a pessoa, quando associado a um responsável identificado, pode revelar informação de saúde. Os dados clínicos dos animais, por si, não são dados pessoais. O tratamento pelo poder público deve atender à finalidade pública (art. 23) e ao princípio da necessidade (art. 6º, III), o que orienta o caráter opcional de campos como CPF e o sigilo do denunciante (RN03).
<!-- b306 -->## 1.9 SISTEMAS SIMILARES
<!-- b307 -->“Eu Adoto no CCZ”, que exibe os animais disponíveis para adoção (SÃO PAULO, 2017). Em Campo Grande, a Coordenadoria de Controle de Zoonoses oferece o agendamento online da castração de gatos (CAMPO GRANDE, 2025). O Quadro 2 compara essas soluções com o SISZOO quanto à finalidade, ao público atendido – externo, quando voltado ao cidadão, ou interno, quando voltado à operação do órgão – e à principal limitação frente à gestão interna do canil. 
<!-- b308 -->Quadro 2 – Comparativo entre sistemas similares e o SISZOO

| Sistema | Finalidade principal | Público | Limitação frente ao SISZOO |
|---|---|---|---|
| Site do CCZ de São José dos Campos (2022) | Divulgação institucional e serviços ao cidadão. | Externo | Não realiza gestão interna dos animais alojados no canil. |
| “Eu Adoto no CCZ” - São Paulo (desde 2008) | Plataforma de adoção de animais. | Externo | Focada na adoção pública, não no controle operacional interno. |
| Sistema de agendamento - Campo Grande (2025) | Agendamento online de castração de felinos. | Externo | Restrito a um serviço específico; não integra a gestão do canil. |
| SISZOO (este trabalho) | Gestão interna integrada de animais e processos sanitários. | Interno | Ocupa a lacuna: rastreabilidade por microchip e integração dos processos. |

<!-- b310 -->Fonte: Elaborado pelos autores (2026).
<!-- b311 -->As iniciativas identificadas concentram-se no atendimento ao público externo e não contemplam a gestão dos animais alojados nem os processos sanitários. O próprio CCZ de Itu já utiliza sistemas informatizados em parte de suas rotinas, apresentados no Quadro 3. Segundo a equipe, nenhum deles registra a baia do animal, emite alertas de reforço vacinal, apresenta indicadores ou controla ocorrências e processos sanitários. O SISZOO não substitui esses sistemas: ocupa as funções que eles não cobrem, tendo como diferenciais a rastreabilidade do animal pelo microchip e a centralização, em uma única base, do histórico veterinário e dos processos sanitários.
<!-- b312 -->Quadro 3 – Sistemas em uso no CCZ de Itu

| Sistema | Uso no CCZ de Itu | Limitação relatada | Relação com o SISZOO |
|---|---|---|---|
| AnimalTag | Cadastro dos animais, microchip e vacinas aplicadas | Sem baia, sem alerta automático de reforço, sem indicadores, sem ocorrências | O SISZOO cobre essas lacunas; integração fica como trabalho futuro |
| SISSAÚDE | Consultas clínicas veterinárias | Não trata da gestão do canil nem dos processos | Fora do escopo do SISZOO (Seção 3.4) |
| VivoPet | Pedidos de vacina antirrábica | Não trata da gestão do canil nem dos processos | Fora do escopo do SISZOO (Seção 3.4) |

<!-- b314 -->Fonte: Elaborado pelos autores com base em entrevista com a equipe do CCZ de Itu (2026).
<!-- b315 -->## 1.10 ELICITAÇÃO DE REQUISITOS
<!-- b316 -->Os requisitos de software definem as funcionalidades e restrições do sistema com base nas necessidades dos stakeholders (SOMMERVILLE, 2011). Para mitigar falhas, a elicitação emprega técnicas formais de extração. A entrevista permite extrair requisitos explícitos, gargalos operacionais e regras de negócio. A observação direta (etnografia) permite ao analista identificar fluxos implícitos não verbalizados.
<!-- b317 -->## 1.11 DIAGRAMAS UML
<!-- b318 -->A modelagem tem como objetivo representar o sistema de forma gráfica e abstrata, utilizando a Linguagem de Modelagem Unificada (UML). Os diagramas são utilizados durante o processo de engenharia de requisitos para esclarecer o que o sistema faz para os stakeholders e desenvolvedores. Neste trabalho, os diagramas UML foram elaborados com a ferramenta PlantUML, que gera os diagramas a partir de descrição textual (PLANTUML, 2026).
<!-- b319 -->### 1.11.1 Diagramas de Caso de Uso
<!-- b320 -->Os diagramas de caso de uso apoiam a elicitação de requisitos ao mostrar de forma simples as interações do sistema e seus atores externos. Os atores são representados como figuras-palito, e cada caso de uso é representado por uma elipse que define um conjunto de comportamentos que o sistema executa para entregar valor.
<!-- b321 -->### 1.11.2 Diagramas de Classes
<!-- b322 -->Os diagramas de classe representam as classes do sistema e seus relacionamentos em modelos orientados a objetos. Uma classe é denotada por um retângulo subdividido em três seções: nome, atributos e operações.
<!-- b323 -->## 1.12 DIAGRAMAS ENTIDADE-RELACIONAMENTO (DER)
<!-- b324 -->O Diagrama Entidade-Relacionamento (DER) é uma técnica de modelagem conceitual de banco de dados, proposta por Chen (1976), que representa as entidades do sistema, seus atributos e os relacionamentos entre elas, com as respectivas cardinalidades. Neste trabalho, os DERs foram elaborados na ferramenta brModelo, que adota a notação apresentada por Heuser (2009): retângulos para entidades, losangos para relacionamentos, atributos representados por círculos ligados à entidade, preenchidos para identificadores e tracejados para atributos opcionais, e cardinalidades no formato (mínima, máxima). Os DERs conceituais serviram de base para os diagramas lógicos apresentados no Capítulo 4.
<!-- b325 -->## 1.13 PROTOTIPAÇÃO
<!-- b326 -->Um protótipo é uma versão preliminar de um sistema, utilizado fundamentalmente nas fases de elicitação e validação de requisitos. O objetivo e o tipo do protótipo devem ser definidos previamente para mitigar falsas expectativas dos stakeholders quanto ao estágio de maturidade do desenvolvimento (SOMMERVILLE, 2011). Neste trabalho, os protótipos foram construídos como páginas navegáveis em HTML e CSS, apresentadas na Seção 4.6.
<!-- b328 --># 2 METODOLOGIA
<!-- b329 -->## 2.1 ABORDAGEM METODOLÓGICA
<!-- b330 -->Quanto à natureza, trata-se de pesquisa aplicada, voltada à solução de um problema concreto do CCZ de Itu; quanto à abordagem, é qualitativa, pois os dados foram obtidos por entrevista, observação e documentos e analisados sem tratamento estatístico; quanto ao procedimento, caracteriza-se como estudo de caso, por examinar em profundidade um único órgão em seu contexto real (PRODANOV; FREITAS, 2013). Os requisitos foram levantados por meio de entrevista aberta realizada em 9 de janeiro de 2026 com a diretora, a veterinária do canil, a recepcionista e o agente sanitário, cuja transcrição consta no Apêndice C; de observação direta das rotinas do CCZ, registrada no Apêndice D; e de análise documental das planilhas de controle de animais e de processos sanitários (Anexo A) e dos formulários físicos (SOMMERVILLE, 2011). A partir desses requisitos, o sistema foi modelado e desenvolvido segundo o framework Scrum (SCHWABER; SUTHERLAND, 2020), adaptado a uma equipe de dois integrantes, conforme a Seção 2.4.
<!-- b331 -->## 2.2 PERFIS DE USUÁRIO
<!-- b332 -->O Quadro 4 apresenta os perfis de acesso do SISZOO e os módulos a que cada um tem acesso, conforme a regra de negócio RN09. A recepcionista participou da entrevista, mas o perfil de recepção não foi incluído no sistema, porque a recepção não executa as rotinas atendidas pelo SISZOO e utiliza sistema próprio para a gestão de consultas e cirurgias; a cirurgiã do CCZ, caso venha a utilizar o sistema, usará o perfil Veterinário. As permissões são registradas na entidade CargoPermissao, por módulo e por tipo de acesso (leitura, escrita e exclusão).
<!-- b333 -->Quadro 4 – Perfis de acesso do SISZOO

| Perfil | Atribuição no CCZ | Módulos com Acesso (RN09) |
|---|---|---|
| Administrador | Direção | Todos, inclusive usuários, baias e trilha de auditoria |
| Veterinário | Veterinária do canil | Gestão de animais do canil; dashboard; baias e relatórios |
| Agente Sanitário | Processos de zoonoses e ocorrências | Processos sanitários; ocorrências; dashboard e relatórios |

<!-- b335 -->Fonte: Elaborado pelos autores (2026).
<!-- b337 -->## 2.3 TECNOLOGIAS UTILIZADAS
<!-- b338 -->### 2.3.1 Backend – Java com Spring Boot
<!-- b339 -->O backend foi desenvolvido em Java 21, versão com suporte de longo prazo da plataforma Java SE (ORACLE, 2023), com o framework Spring Boot 3, que reduz a configuração necessária para criar aplicações Spring por meio de dependências pré-configuradas e de servidor web embutido (SPRING, 2026a). As dependências e a compilação do projeto são gerenciadas pelo Apache Maven (APACHE SOFTWARE FOUNDATION, 2026).
<!-- b340 -->O backend expõe uma API no estilo arquitetural REST (Representational State Transfer), definido por Fielding (2000): cada funcionalidade é acessada por um endereço (endpoint) e por um método HTTP padronizado, como cadastrar um animal ou consultar um processo, o que permite que o frontend se comunique com o servidor independentemente da tecnologia de cada lado. A autenticação e a autorização por perfil (RN09) são feitas com o Spring Security (SPRING, 2026b).
<!-- b341 -->A autenticação utiliza JSON Web Token (JWT), padrão definido na RFC 7519 para transportar, de forma assinada, as informações que identificam o usuário (JONES; BRADLEY; SAKIMURA, 2015). A arquitetura é sem estado (stateless): o servidor não mantém a sessão do usuário em memória nem em banco de dados. A cada requisição, o token enviado pelo navegador é validado pela assinatura e pelo prazo de validade; no logout, o token é descartado pelo navegador. Os acessos ao sistema são registrados na trilha de auditoria (RNF10).
<!-- b342 -->### 2.3.2 Frontend – React com TypeScript
<!-- b343 -->O frontend foi desenvolvido com React 18, biblioteca JavaScript para construção de interfaces a partir de componentes reutilizáveis (REACT, 2026), e com TypeScript, linguagem que acrescenta tipagem estática ao JavaScript e permite detectar erros ainda em tempo de desenvolvimento (MICROSOFT, 2026). O projeto é criado e compilado com o Vite, ferramenta que oferece servidor de desenvolvimento e gera, para produção, arquivos estáticos otimizados (VITE, 2026). A redução do tamanho dos arquivos enviados ao navegador contribui para o requisito de leveza (RNF02), cujo atendimento depende também do carregamento das telas sob demanda e da paginação das listas. As bibliotecas de navegação, comunicação com a API, validação de formulários e gráficos são apresentadas na Seção 5.1.
<!-- b344 -->### 2.3.3 Banco de Dados – PostgreSQL
<!-- b345 -->O banco de dados é o PostgreSQL 16, sistema gerenciador de banco de dados relacional de código aberto (POSTGRESQL GLOBAL DEVELOPMENT GROUP, 2023). Suas transações seguem as propriedades ACID - atomicidade, consistência, isolamento e durabilidade, o que garante, por exemplo, que a geração do número de protocolo e a gravação do processo ocorram juntas ou não ocorram; durante essa transação, a linha da sequência anual fica bloqueada, o que impede números repetidos em cadastros simultâneos (RN02). No backend, o acesso ao banco é feito pelo Spring Data JPA, que utiliza o Hibernate como implementação da especificação Jakarta Persistence para mapear as classes Java às tabelas (SPRING, 2026c). O esquema do banco é criado e versionado por migrações Flyway, derivadas dos diagramas lógicos da Seção 4.3.
<!-- b346 -->### 2.3.4 Ferramentas de Apoio ao Desenvolvimento
<!-- b347 -->Git e GitHub: controle de versão e hospedagem do repositório, com integração contínua pelo GitHub Actions, que executa os testes automatizados a cada alteração enviada (CHACON; STRAUB, 2014; GITHUB, 2026). Docker e Docker Compose: execução do banco de dados, do backend e do frontend em contêineres, com o mesmo ambiente para os dois desenvolvedores (DOCKER, 2026). pgAdmin: administração do PostgreSQL. Insomnia: teste manual dos endpoints REST (KONG, 2026). PlantUML: elaboração dos diagramas de casos de uso e de classes a partir de descrição textual (PLANTUML, 2026). brModelo: elaboração dos diagramas entidade-relacionamento conceituais (CÂNDIDO, [2026]). dbdiagram.io: elaboração dos diagramas lógicos (HOLISTICS, 2026). HTML/CSS: elaboração dos protótipos das interfaces.
<!-- b348 -->## 2.4 GESTÃO E PLANEJAMENTO DO PROJETO
<!-- b349 -->O desenvolvimento do SISZOO foi organizado segundo o framework Scrum, adaptado ao contexto de uma equipe reduzida, composta pelos dois autores deste trabalho. O ciclo de desenvolvimento foi estruturado em dez sprints de duração fixa de uma semana cada, totalizando dez semanas de execução planejada, com início em agosto de 2026. A cadência semanal foi escolhida por oferecer ciclos curtos de entrega e retorno rápido sobre o incremento produzido, o que é adequado a um projeto acadêmico com prazo delimitado.
<!-- b350 -->O Product Backlog foi construído a partir dos requisitos funcionais levantados no Capítulo 3 e decomposto em issues no repositório de controle de versão do projeto, hospedado no GitHub. A priorização do backlog seguiu o critério de dependência técnica e valor operacional: as funcionalidades de base (infraestrutura, modelo de dados e autenticação) foram alocadas nas primeiras sprints, por serem pré-requisito para os módulos subsequentes, enquanto os módulos de maior valor operacional para o CCZ (gestão de animais, ocorrências e processos sanitários) foram distribuídos na sequência. As sprints finais foram reservadas para funcionalidades transversais (dashboard), atributos de qualidade (resiliência e testes ponta a ponta) e preparação da entrega.
<!-- b351 -->O Quadro 5 sintetiza o planejamento das sprints e suas principais entregas.
<!-- b352 -->Quadro 5 – Planejamento das sprints do projeto SISZOO

| Sprint | Tema | Prazo | Issues | Principais entregas |
|---|---|---|---|---|
| S0 | Fundação | 23/08/2026 | 13 | Configuração do ambiente, estrutura do projeto e modelo de dados inicial. |
| S1 | Autenticação | 30/08/2026 | 7 | Autenticação via JWT, perfis de acesso e controle de permissões. |
| S2 | Animais e baias | 06/09/2026 | 6 | Cadastro de animais por microchip e gestão de baias do canil. |
| S3 | Histórico e alertas | 13/09/2026 | 5 | Histórico veterinário e alertas automáticos de reforço vacinal. |
| S4 | Ocorrências | 20/09/2026 | 4 | Registro e acompanhamento de ocorrências e denúncias. |
| S5 | Processos e protocolo | 27/09/2026 | 5 | Processos sanitários e geração sequencial de protocolo por ano. |
| S6 | Resultado e e-mail | 04/10/2026 | 4 | Registro de resultados laboratoriais e notificação por e-mail. |
| S7 | Dashboard | 11/10/2026 | 4 | Dashboard operacional com indicadores visuais. |
| S8 | Resiliência e E2E | 18/10/2026 | 4 | Robustez a falhas de rede e testes ponta a ponta (end-to-end). |
| S9 | Apresentação | 25/10/2026 | 2 | Ajustes finais e preparação da entrega. |

<!-- b354 -->Fonte: Elaborado pelos autores com base no planejamento de sprints do projeto (2026).
<!-- b355 -->No período de elaboração deste texto, a Sprint S0 (Fundação), Sprint S1 (Autenticação), Sprint S2 (Animais e baias), Sprint S3 (Histórico e alertas), Sprint S4 (Ocorrências), Sprint S5 (Processos e protocolo) encontravam-se concluídas, com a totalidade de suas issues finalizada, e a Sprint S6 (Resultado e e-mail) em andamento. As demais sprints seguem planejadas conforme o cronograma apresentado, sujeitas a ajustes decorrentes das retrospectivas semanais.
<!-- b356 --># 3 LEVANTAMENTO DE REQUISITOS
<!-- b357 -->O levantamento de requisitos do SISZOO foi conduzido por meio de três fontes de evidência primárias, trianguladas para garantir completude e rastreabilidade: (a) entrevista aberta realizada em 9 de janeiro de 2026 com a diretora, a veterinária do canil, a recepcionista e o agente sanitário; (b) análise da planilha ANIMAIS_DO_CANIL.xlsx, que contém os registros de 95 cães disponíveis para adoção e 18 felinos (16 disponíveis, um adotado e um falecido), na aba de lista por situação, e a distribuição dos cães em 16 baias internas, corredor e baias externas E1 a E8, na aba de controle por baias datada de 4 nov. 2025; e (c) análise da planilha CONTROLE-PROCESSOS_ZOONOSES.xlsx, que registra os processos sanitários de 2025 organizados por doença.
<!-- b358 -->Os requisitos estão organizados nos cinco módulos do sistema. Os identificadores dos requisitos funcionais usam letras definidas no início do levantamento, que correspondem aos módulos da seguinte forma: RF-C, Módulo 1 – Autenticação e Controle de Acesso; RF-A, Módulo 2 – Gestão de Animais do Canil; RF-E, Módulo 3 – Ocorrências e Denúncias; RF-B, Módulo 4 – Processos Sanitários; e RF-D, Módulo 5 – Dashboard e Relatórios.
<!-- b359 -->## 3.1 REQUISITOS FUNCIONAIS
<!-- b360 -->### 3.1.1 Módulo 1 – Autenticação e Controle de Acesso
<!-- b361 -->Quadro 6 – Requisitos funcionais do Módulo 1: Autenticação e Controle de Acesso

| ID | Nome | Descrição | Prior. |
|---|---|---|---|
| RF-C01 | Autenticação | Login com e-mail institucional e senha, com troca de senha obrigatória no primeiro acesso. Autenticação por token JWT com prazo de validade; no logout, o token é descartado (RNF06). | Alta |
| RF-C02 | Gestão de Usuários | Administrador cadastra, edita, desativa e reativa usuários, atribuindo cargos com permissões por módulo (leitura, escrita e exclusão). Toda ação crítica gera AuditoriaEvento (RN06, RNF10). | Alta |
| RF-C03 | Preferências do Usuário | O usuário ajusta o tema, densidade da interface e as notificações que deseja receber; as preferências são individuais e não afetam outros usuários. | Baixa |

<!-- b363 -->Fonte: Elaborado pelos autores com base na entrevista (2026).
<!-- b364 -->### 3.1.2 Módulo 2 – Gestão de Animais do Canil
<!-- b365 -->Quadro 7 – Requisitos funcionais do Módulo 2: Gestão de Animais do Canil

| ID | Nome | Descrição | Prior. |
|---|---|---|---|
| RF-A01 | Cadastro de Animal | Registrar um animal com número do microchip (identificador único, RN01) e data de implantação do chip, número da medalha, espécie, nome, raça, sexo, porte, pelagem, coloração, data de nascimento aproximada, baia, foto, esterilizado, data de esterilização, observações, motivo de entrada, procedência, peso, status e data de entrada. O animal pode ser cadastrado sem microchip, que é registrado quando implantado. | Alta |
| RF-A02 | Consulta por Baia | Visualizar e filtrar a listagem de animais por baia (BAIA 1–16 internas, E1–E8 externas e CORREDOR). A tela exibe a ocupação atual, calculada pela contagem de animais alojados, e a capacidade. O Administrador cadastra e edita as baias (tipo e capacidade). | Alta |
| RF-A03 | Alerta Vacinal | Gerar alertas automáticos na tela inicial listando os animais com reforço vacinal nos próximos 7 dias e as vacinas vencidas, com base na data de validade de cada dose. | Alta |
| RF-A04 | Histórico Veterinário | Registrar e exibir o histórico completo de vacinações, prescrições, procedimentos, exames e anexos. Registros imutáveis: a correção gera novo registro com auditoria (RN06, RNF10). | Alta |
| RF-A05 | Entrada, Saída e Adoção | Registrar a procedência ao entrar e o destino e a data de saída ao sair (Adotado, Resgatado, Óbito, Eutanásia ou Transferido). No destino Eutanásia, registrar o laudo do responsável técnico que a justifica (Lei nº 14.228/2021, art. 2º, § 1º). Na adoção, registrar os dados do adotante e, quando houver, a devolução do animal. Histórico imutável (RN06). | Alta |

<!-- b367 -->Fonte: Elaborado pelos autores com base na entrevista e na planilha ANIMAIS_DO_CANIL.xlsx (2026).
<!-- b368 -->### 3.1.3 Módulo 3 – Ocorrências e Denúncias
<!-- b369 -->Quadro 8 – Requisitos funcionais do Módulo 3: Ocorrências e Denúncias

| ID | Nome | Descrição | Prior. |
|---|---|---|---|
| RF-E01 | Registro de Ocorrência | Registrar ocorrência com protocolo (0000/AAAA, RN02), tipo, bairro, descrição, urgente, sigilosa (RN03), denunciante, denunciado (opcional) e movimentações. | Alta |
| RF-E02 | Consulta e Filtragem | Consultar por protocolo, período, tipo, denunciante, bairro e status. Denunciante oculto em ocorrências sigilosas para não-Administradores (RN03). | Alta |
| RF-E03 | Encerramento | Encerrar com providência tomada, descrição (obrigatória quando a providência for “Outro”) e data. Somente Agente Sanitário ou Administrador. Não pode ser encerrada enquanto houver processo sanitário vinculado sem resultado (RN05). Registro imutável após encerramento (RN06). | Alta |

<!-- b371 -->Fonte: Elaborado pelos autores com base na entrevista (2026).
<!-- b372 -->### 3.1.4 Módulo 4 – Processos Sanitários
<!-- b373 -->Quadro 9 – Requisitos funcionais do Módulo 4: Processos Sanitários

| ID | Nome | Descrição | Prior. |
|---|---|---|---|
| RF-B01 | Registro de Processo | Criar processo sanitário com protocolo (0000/AAAA, RN02), número do GAL, número do SINAN, urgente, data de abertura, status (RN12), doença, laboratório, resultado laboratorial, desfecho do animal, responsável e vínculo opcional a uma ocorrência, definido na abertura e imutável. | Alta |
| RF-B02 | Consulta e Filtragem | Consultar processos por protocolo, período, doença, responsável, bairro e status. Processos urgentes fixados no topo (RN04). | Alta |
| RF-B03 | Resultado Laboratorial | Registrar resultado (Negativo/Positivo/Material Inadequado/Inconclusivo/Não Realizado/Aguardando) e desfecho. Resultado Positivo ou Inconclusivo notifica por e-mail o responsável e a Vigilância Epidemiológica (RN10). | Alta |
| RF-B04 | Amostra Animal | Registrar os dados do animal amostrado (AmostraAnimal), vinculado a um animal do canil ou com dados próprios: espécie, sexo, coloração, pelagem, peso, raça, tipo de abrigo, material biológico, contato humano (RN04), nível de contato, agrediu humano e sintomas. | Alta |
| RF-B05 | Alerta de Urgência | Contato humano em qualquer amostra marca o processo como urgente, com alerta visual. O processo não pode ser concluído sem resultado. | Alta |
| RF-B06 | Documento PDF | Gerar PDF do processo com controle de estado em DocumentoProcesso (Pendente→Em Processamento→Concluído/Falha, RN11). | Baixa |
| RF-B07 | Relatório Anual | Relatório anual consolidado com distribuição por doença, espécie e bairro, gerado pela central de relatórios (RF-D02). | Média |

<!-- b375 -->Fonte: Elaborado pelos autores com base na entrevista, na planilha CONTROLE-PROCESSOS_ZOONOSES.xlsx e nos formulários físicos (2026).
<!-- b376 -->### 3.1.5 Módulo 5 – Dashboard e Relatórios
<!-- b377 -->Quadro 10 – Requisitos funcionais do Módulo 5: Dashboard e Relatórios

| ID | Nome | Descrição | Prior. |
|---|---|---|---|
| RF-D01 | Dashboard | Exibir em tempo real: total por StatusAnimal, ocupação de baias, alertas vacinais 7 dias (RF-A03), processos aguardando resultado, processos urgentes e resumo mensal por doença. | Alta |
| RF-D02 | Relatórios | Gerar, em PDF e CSV, os relatórios de ocorrências por bairro, ocupação de baias, procedimentos, adoções, anual de processos e vacinação, por meio de RelatorioGerado com ciclo Pendente→Em Processamento→Concluído/Falha (RN11). O arquivo é armazenado fora do banco e acessado por URL com expiração. | Média |

<!-- b379 -->Fonte: Elaborado pelos autores com base na entrevista (2026).
<!-- b380 -->Os relatórios previstos no RF-D02 são descritos no Quadro 11.
<!-- b381 -->Quadro 11 – Relatórios previstos no SISZOO

| Relatório | Conteúdo | Requisito |
|---|---|---|
| Ocorrências por Bairro | Concentração de ocorrências por bairro, apresentada em mapa de calor tabular, sem georreferenciamento; tipos de denúncia mais frequentes; tempo médio de atendimento. | RF-D02 |
| Ocupação de Baias | Histórico mensal de ocupação por baia, transferências internas e taxa média de superlotação. | RF-D02 |
| Procedimentos | Castrações, cirurgias e atendimentos clínicos consolidados, com produtividade por veterinário. | RF-D02 |
| Adoções | Adoções realizadas, tempo médio de permanência, perfil dos adotantes e taxa de devolução. | RF-D02, RF-A05 |
| Anual de Processos | Distribuição das investigações sanitárias por doença, espécie e bairro, com taxa de positividade e tempo médio de resolução. | RF-D02, RF-B07 |
| Vacinação | Animais vacinados, vacinas vencidas e próximas a vencer, por espécie, baia e veterinário responsável. | RF-D02 |

<!-- b383 -->Fonte: Elaborado pelos autores (2026).
<!-- b384 -->## 3.2 REQUISITOS NÃO FUNCIONAIS
<!-- b385 -->Quadro 12 – Requisitos não funcionais do SISZOO

| ID | Categoria | Nome | Descrição |
|---|---|---|---|
| RNF01 | Desempenho | Tempo de Resposta | Responder em até 3 segundos. Interface responsiva em listas com 200+ registros. |
| RNF02 | Desempenho | Leveza | Carregamento progressivo. Funcionar em computadores com ~2 GB de RAM. |
| RNF03 | Disponibilidade | Internet Instável | Exibir mensagem de erro na queda de rede e preservar dados de formulários não submetidos. |
| RNF04 | Disponibilidade | Backup Diário | Disponível no horário do CCZ, com backup diário do banco. |
| RNF05 | Usabilidade | Simplicidade | Interface intuitiva, rótulos descritivos, máximo 3 cliques nas operações frequentes. |
| RNF06 | Segurança | LGPD e Auth | Senhas com bcrypt. HTTPS. Dados sigilosos restritos por perfil. LGPD (Lei nº 13.709/2018). |
| RNF07 | Compatibilidade | Navegadores | Funcionar em Chrome, Edge e Firefox sem plugins adicionais. |
| RNF08 | Manutenibilidade | Qualidade | Código SOLID e Clean Code, cobertura mínima de testes nos casos de uso críticos. |
| RNF09 | Escalabilidade | Crescimento | Suportar crescimento de registros sem refatoração estrutural. |
| RNF10 | Auditoria | Rastreabilidade | Registrar usuário, data, hora e valores anterior/posterior em toda alteração crítica via AuditoriaEvento. |

<!-- b387 -->Fonte: Elaborado pelos autores com base na entrevista e na análise de infraestrutura do CCZ de Itu (2026).
<!-- b388 -->## 3.3 REGRAS DE NEGÓCIO
<!-- b389 -->Quadro 13 – Regras de negócio do SISZOO

| ID | Regra | Descrição |
|---|---|---|
| RN01 | Microchip Único | O número do microchip identifica o animal de forma única; o sistema rejeita número já cadastrado. O animal que chega sem microchip é cadastrado e recebe o chip no CCZ; o número e a data de implantação são registrados nesse momento. |
| RN02 | Protocolo por Ano | O protocolo (processo sanitário e ocorrência) é gerado automaticamente no formato 0000/AAAA, sequencial, reiniciando em 0001 a cada ano civil. |
| RN03 | Sigilo do Denunciante | Em ocorrências sigilosas, os dados do denunciante não são exibidos para nenhum perfil exceto Administrador; o acesso do Administrador é registrado em auditoria. |
| RN04 | Contato Humano-Animal | Processos com AmostraAnimal cujo contato humano seja verdadeiro são marcados como urgentes e fixados no topo das listagens. |
| RN05 | Encerramento de Ocorrência | Ocorrência com processo sanitário vinculado só pode ser encerrada depois de registrado o resultado desse processo. |
| RN06 | Imutabilidade | Histórico veterinário, processos e resultados não podem ser excluídos; a correção gera novo registro, com registro em AuditoriaEvento. |
| RN07 | Campos Obrigatórios – Animal | Obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo de entrada e data de entrada. O microchip é obrigatório para a ficha ser considerada completa, não para o cadastro de entrada. |
| RN08 | Campos Obrigatórios – Processo | Obrigatórios: data de abertura, doença, laboratório, ao menos uma amostra e os dados mínimos do responsável (nome, endereço). |
| RN09 | Controle de Acesso | Administrador: acesso total. Veterinário: Gestão de Animais (A) e Dashboard/Relatórios (D). Agente Sanitário: Processos (B), Ocorrências (E) e Dashboard/Relatórios (D). |
| RN10 | Notificação de Resultado | Ao registrar resultado Positivo ou Inconclusivo, o sistema envia e-mail ao responsável (quando houver e-mail cadastrado) e à Vigilância Epidemiológica do município. O envio é registrado e não se repete. |
| RN11 | Estado de Exportação | RelatorioGerado com estados Pendente→Em Processamento→Concluído/Falha. Binário não armazenado no banco, apenas URL com política de expiração. |
| RN12 | Ciclo do Processo | Transições: ABERTO→EM_ANDAMENTO→AGUARDANDO_RESULTADO→CONCLUIDO. Resultado não pode ser preenchido com status=ABERTO. |

<!-- b391 -->Fonte: Elaborado pelos autores com base na entrevista, nas planilhas e nos formulários físicos (2026).
<!-- b392 -->## 3.4 FUNCIONALIDADES FORA DO ESCOPO
<!-- b393 -->As seguintes funcionalidades foram explicitamente excluídas do escopo: tomada de decisões por inteligência artificial; cadastro de consultas clínicas veterinárias (coberto pelo SISSAÚDE); agendamento de castração online (requer apresentação presencial de comprovante de renda e de residência, segundo a equipe do CCZ); geolocalização e mapas georreferenciados de doenças; pedidos de vacina antirrábica (cobertos pelo VivoPet); aplicativo móvel (acesso exclusivo via web responsiva); processamento automatizado de ocorrências; e portal público de adoção, inclusive a publicação dos animais disponíveis para adoção (o SISZOO é sistema interno).
<!-- b394 -->## 3.5 RISCOS E LIMITAÇÕES
<!-- b395 -->Além da delimitação de escopo apresentada na seção anterior, reconhecem-se riscos e limitações associados ao desenvolvimento e à futura adoção do SISZOO, cuja explicitação é relevante para a avaliação realista da proposta.
<!-- b396 -->### 3.5.1 Riscos
<!-- b397 -->O principal risco é a resistência à mudança por parte dos funcionários habituados aos controles em papel e planilhas. Esse risco pode ser reduzido pela participação dos usuários-chave ao longo do desenvolvimento e pela capacitação da equipe por perfil de acesso, proposta como trabalho futuro. Do ponto de vista de infraestrutura, há dependência de conexão de internet e de energia elétrica para o funcionamento do sistema; como o levantamento identificou instabilidade de rede nas unidades do CCZ, esse é um risco tratado, ainda que parcialmente, pelos requisitos não funcionais de resiliência a falhas de conexão, de modo a reduzir a perda de dados em quedas de rede.
<!-- b398 -->### 3.5.2 Limitações
<!-- b399 -->O escopo do trabalho está restrito ao Centro de Controle de Zoonoses do município de Itu, o que limita a generalização direta dos resultados a outras unidades sem adaptação. O sistema também não contempla, nesta etapa, integração em tempo real com sistemas estaduais e federais de vigilância, como o SINAN (Sistema de Informação de Agravos de Notificação) e o GAL (Gerenciador de Ambiente Laboratorial); tais integrações são tratadas apenas em nível de modelagem, ficando a implementação completa como trabalho futuro.
<!-- b402 --># 4 MODELAGEM DO SISTEMA
<!-- b403 -->Este capítulo apresenta a modelagem do SISZOO em quatro perspectivas complementares, organizadas por módulo funcional. Inicia-se pelos diagramas de caso de uso, que descrevem em alto nível as interações dos usuários com o sistema; em seguida, os Diagramas Entidade-Relacionamento (DER) conceituais expressam as entidades e seus relacionamentos; a partir destes, os diagramas lógicos relacionais detalham a estrutura física das tabelas, por exemplo, a entidade conceitual Animal, com seus atributos e relacionamentos, dá origem à tabela Animal no modelo lógico, na qual o microchip é definido como chave única (RN01) e as associações com Baia, Vacinacao, Procedimento, Prescricao e Exame são materializadas por chaves estrangeiras; o dicionário de dados, apresentado no Apêndice B, documenta cada campo dessa e das demais tabelas individualmente; e, por fim, os diagramas de classe representam o domínio orientado a objetos.
<!-- b404 -->Todos os modelos foram validados contra os requisitos funcionais (Capítulo 3), as regras de negócio (Seção 3.3) e os documentos de campo coletados na visita ao CCZ de Itu em 9 de janeiro de 2026. O banco de dados de destino é o PostgreSQL 16. As chaves primárias das tabelas são geradas via UUID v4 (Universally Unique Identifier, versão 4), identificadores de 128 bits gerados de forma aleatória, que garantem unicidade sem depender de um contador sequencial e reduzem o risco de colisão e de exposição de informações sobre o volume de registros, ao contrário de chaves numéricas incrementais. Os campos de data e hora (timestamps) são armazenados em UTC (Tempo Universal Coordenado), um padrão de referência global de tempo; esse armazenamento uniforme evita ambiguidades decorrentes de fuso horário e de horário de verão, e os valores são convertidos para o fuso America/Sao_Paulo apenas na camada de apresentação, ou seja, no momento em que são exibidos ao usuário.
<!-- b408 -->## 4.1 DIAGRAMAS DE CASOS DE USO
<!-- b409 -->Os diagramas de casos de uso foram elaborados com a ferramenta PlantUML e apresentam, em alto nível, os objetivos de cada perfil de usuário. A Figura 1 mostra a visão geral do sistema, em que cada elipse representa um módulo; as Figuras 2 a 6 detalham os casos de uso de cada módulo. O Administrador especializa os perfis Veterinário e Agente Sanitário e, por isso, pode executar todos os casos de uso desses perfis, além dos seus próprios (RN09). Passos internos do sistema, como a geração do protocolo e o envio de e-mail, são tratados nos fluxos de cada caso, e não como casos de uso. A especificação de cada caso de uso, em baixo nível, encontra-se no Apêndice A, em que cada caso de uso dos diagramas por módulo tem um quadro próprio.
<!-- b411 -->Figura 1 – Diagrama de casos de uso geral do SISZOO
<!-- b412 TABELA SEM LEGENDA -->
|  |

<!-- b413 -->Fonte: Elaborado pelos autores (2026).
<!-- b414 -->Figura 2 – Diagrama de casos de uso – Módulo 1: Autenticação e Controle de Acesso
<!-- b415 TABELA SEM LEGENDA -->
|  |

<!-- b416 -->Fonte: Elaborado pelos autores (2026).
<!-- b417 -->Figura 3 – Diagrama de casos de uso – Módulo 2: Gestão de Animais do Canil
<!-- b418 TABELA SEM LEGENDA -->
|  |

<!-- b419 -->Fonte: Elaborado pelos autores (2026).
<!-- b420 -->Figura 4 – Diagrama de casos de uso – Módulo 3: Ocorrências e Denúncias
<!-- b421 TABELA SEM LEGENDA -->
|  |

<!-- b422 -->Fonte: Elaborado pelos autores (2026).
<!-- b423 -->Figura 5 – Diagrama de casos de uso – Módulo 4: Processos Sanitários
<!-- b424 TABELA SEM LEGENDA -->
|  |

<!-- b425 -->Fonte: Elaborado pelos autores (2026).
<!-- b426 -->Figura 6 – Diagrama de casos de uso – Módulo 5: Dashboard e Relatórios
<!-- b427 TABELA SEM LEGENDA -->
|  |

<!-- b428 -->Fonte: Elaborado pelos autores (2026).
<!-- b429 -->## 4.2 DIAGRAMAS ENTIDADE-RELACIONAMENTO (DER)
<!-- b430 -->Os Diagramas Entidade-Relacionamento seguem a notação adotada por Heuser (2009) e pela ferramenta brModelo: retângulos para entidades, losangos para relacionamentos, atributos representados por círculos ligados à entidade (preenchidos para identificadores) e cardinalidades no formato (mínima, máxima). Entidades de domínio fixo, como espécie e situação do animal, foram representadas como entidades no modelo conceitual e implementadas como tipos enumerados no modelo lógico. Os dados do animal registrados em AmostraAnimal são cópia do momento da coleta, mantida para preservar o histórico do processo sanitário mesmo que o cadastro do animal seja alterado. Estes DERs serviram de base para os diagramas lógicos relacionais apresentados na seção seguinte.
<!-- b431 -->Figura 7 – DER conceitual – Módulo 1: Usuários e Acesso
<!-- b432 TABELA SEM LEGENDA -->
|  |

<!-- b433 -->Fonte: Elaborado pelos autores (2026).
<!-- b434 -->Figura 8 – DER conceitual – Módulo 2: Gestão de Animais do Canil
<!-- b435 TABELA SEM LEGENDA -->
|  |

<!-- b436 -->Fonte: Elaborado pelos autores (2026).
<!-- b437 -->Figura 9 – DER conceitual – Módulo 3: Ocorrências e Denúncias
<!-- b438 TABELA SEM LEGENDA -->
|  |

<!-- b439 -->Fonte: Elaborado pelos autores (2026).
<!-- b440 -->Figura 10 – DER conceitual – Módulo 4: Processos Sanitários
<!-- b441 TABELA SEM LEGENDA -->
|  |

<!-- b442 -->Fonte: Elaborado pelos autores (2026).
<!-- b443 -->Figura 11 – DER conceitual – Módulo 5: Relatórios
<!-- b444 TABELA SEM LEGENDA -->
|  |

<!-- b445 -->Fonte: Elaborado pelos autores (2026).
<!-- b446 -->## 4.3 DIAGRAMAS LÓGICOS
<!-- b447 -->Os diagramas lógicos relacionais foram elaborados com a ferramenta dbdiagram.io a partir dos DERs conceituais e validados contra os requisitos funcionais (Capítulo 3) e as regras de negócio (Seção 3.3). A notação emprega retângulos para tabelas; colunas com tipo de dado e indicação de nulidade (NN = NOT NULL); chave primária (PK) identificada pelo ícone de chave; e chave estrangeira (FK) pelo ícone de elo. O banco de dados de destino é o PostgreSQL 16, com chaves primárias geradas via UUID v4 e timestamps armazenados em UTC.
<!-- b448 -->Figura 12 – Diagrama lógico – Módulo 1: Autenticação e Controle de Acesso
<!-- b449 TABELA SEM LEGENDA -->
|  |

<!-- b450 -->Fonte: Elaborado pelos autores (2026).
<!-- b451 -->Figura 13 – Diagrama lógico – Módulo 2: Gestão de Animais do Canil
<!-- b452 TABELA SEM LEGENDA -->
|  |

<!-- b453 -->Fonte: Elaborado pelos autores (2026).
<!-- b454 -->Figura 14 – Diagrama lógico – Módulo 3: Ocorrências e Denúncias
<!-- b455 TABELA SEM LEGENDA -->
|  |

<!-- b456 -->Fonte: Elaborado pelos autores (2026).
<!-- b457 -->Figura 15 – Diagrama lógico – Módulo 4: Processos Sanitários
<!-- b458 TABELA SEM LEGENDA -->
|  |

<!-- b459 -->Fonte: Elaborado pelos autores (2026).
<!-- b460 -->Figura 16 – Diagrama lógico – Módulo 5: Relatórios
<!-- b461 TABELA SEM LEGENDA -->
|  |

<!-- b462 -->Fonte: Elaborado pelos autores (2026).
<!-- b463 -->## 4.4 DICIONÁRIO DE DADOS
<!-- b464 -->O dicionário de dados detalha cada tabela do modelo lógico, com o nome do campo, o tipo de dado, a indicação de chave (PK = chave primária, FK = chave estrangeira, UQ = valor único) e uma descrição concisa da finalidade do campo. As chaves primárias são do tipo UUID e as datas e horas são armazenadas em UTC. A ocupação das baias não é armazenada: é calculada pela contagem de animais alojados. O dicionário completo, organizado por módulo, encontra-se no Apêndice B; os parágrafos a seguir explicam duas decisões do Módulo 1.
<!-- b465 -->Neste módulo, o cargo de cada funcionário, como administrador, veterinário ou agente sanitário, não é armazenado diretamente na tabela Usuario, mas modelado por meio das tabelas Cargo e UsuarioCargo. A tabela Cargo mantém os cargos existentes no CCZ, enquanto a tabela associativa UsuarioCargo relaciona cada usuário ao seu respectivo cargo. Essa estrutura permite que um mesmo usuário possa, se necessário, estar vinculado a mais de um cargo, e que as permissões de acesso sejam concedidas de forma segmentada por cargo, por meio da entidade CargoPermissao (RN09).
<!-- b466 -->Ainda no módulo de Usuários e Acesso, a tabela AuditoriaEvento implementa a trilha de auditoria do sistema, mecanismo que atende às regras de negócio de imutabilidade dos registros críticos (RN06) e ao requisito não funcional de rastreabilidade (RNF10). Sempre que um registro sensível, como um histórico veterinário ou um processo sanitário, é criado ou alterado, o sistema grava automaticamente um evento de auditoria contendo o usuário responsável, a ação realizada, a data e a hora do evento e a entidade afetada, preservando os valores anterior e posterior à alteração. Dessa forma, os registros críticos não são sobrescritos nem apagados: qualquer modificação gera um novo evento, o que garante o histórico completo das operações. O acesso à trilha de auditoria é restrito ao perfil Administrador, que pode consultá-la aplicando filtros por usuário, entidade e período, em conformidade com os princípios de responsabilização e prestação de contas previstos pela LGPD.
<!-- b467 -->## 4.5 DIAGRAMAS DE CLASSE
<!-- b468 -->Os diagramas de classe de projeto representam as entidades de domínio com seus atributos tipados e operações de domínio (rich domain model). Operações de infraestrutura, autenticação, notificação, geração assíncrona de arquivos, foram intencionalmente omitidas das entidades por pertencerem à camada de serviços, em conformidade com o RNF08 (SOLID e Clean Code). Os diagramas foram elaborados com a ferramenta PlantUML. O estereótipo «external» indica classe definida em outro módulo e representada apenas para mostrar a associação. O diagrama do Módulo 2 foi dividido em quatro figuras (Figura 18 a Figura 21) para preservar a legibilidade; nas figuras de vacinação e de procedimentos, a classe Animal aparece reduzida para indicar a associação. As enumerações do Módulo 4 também foram separadas (Figura 24).
<!-- b469 -->Figura 17 – Diagrama de classes – Módulo 1: Usuários e Acesso
<!-- b470 TABELA SEM LEGENDA -->
|  |

<!-- b471 -->Fonte: Elaborado pelos autores (2026).
<!-- b472 -->Figura 18 – Diagrama de classes – Módulo 2: animal, baias e adoção
<!-- b473 TABELA SEM LEGENDA -->
|  |

<!-- b474 -->Fonte: Elaborado pelos autores (2026).
<!-- b475 -->Figura 19 – Diagrama de classes – Módulo 2: vacinação e prescrição
<!-- b476 TABELA SEM LEGENDA -->
|  |

<!-- b477 -->Fonte: Elaborado pelos autores (2026).
<!-- b478 -->Figura 20 – Diagrama de classes – Módulo 2: procedimentos, exames e sintomas
<!-- b479 TABELA SEM LEGENDA -->
|  |

<!-- b480 -->Fonte: Elaborado pelos autores (2026).
<!-- b481 -->Figura 21 – Diagrama de classes – Módulo 2: enumerações
<!-- b482 TABELA SEM LEGENDA -->
|  |

<!-- b483 -->Fonte: Elaborado pelos autores (2026).
<!-- b484 -->Figura 22 – Diagrama de classes – Módulo 3: Ocorrências e Denúncias
<!-- b485 TABELA SEM LEGENDA -->
|  |

<!-- b486 -->Fonte: Elaborado pelos autores (2026).
<!-- b487 -->Figura 23 – Diagrama de classes – Módulo 4: Processos Sanitários
<!-- b488 TABELA SEM LEGENDA -->
|  |

<!-- b489 -->Fonte: Elaborado pelos autores (2026).
<!-- b490 -->Figura 24 – Diagrama de classes – Módulo 4: enumerações
<!-- b491 TABELA SEM LEGENDA -->
|  |

<!-- b492 -->Fonte: Elaborado pelos autores (2026).
<!-- b493 -->Figura 25 – Diagrama de classes – Módulo 5: Relatórios
<!-- b494 TABELA SEM LEGENDA -->
|  |

<!-- b495 -->Fonte: Elaborado pelos autores (2026).
<!-- b496 -->## 4.6 PROTOTIPAÇÃO DAS INTERFACES
<!-- b497 -->Esta seção apresenta o protótipo de alta fidelidade das principais interfaces do SISZOO, elaborado em HTML e CSS antes da implementação, para validação dos requisitos com os usuários-chave do CCZ de Itu. As telas materializam visualmente os fluxos modelados e seguem os requisitos não funcionais de usabilidade e simplicidade (RNF05). As telas do sistema implementado são apresentadas na Seção 5.2.
<!-- b498 -->O Dashboard Operacional consolida, em tempo real, os principais indicadores do CCZ: total de animais, percentual de vacinados, adoções e ocorrências do mês, além de alertas críticos (vacinas a vencer, baias superlotadas, medicações ativas) e gráficos de ocupação por baia, resultados laboratoriais e casos suspeitos (RF-D01).
<!-- b499 -->Figura 26 – Protótipo da tela T02: Dashboard operacional
<!-- b500 TABELA SEM LEGENDA -->
|  |

<!-- b501 -->Fonte: Elaborado pelos autores (2026).
<!-- b502 -->A Ficha do Animal centraliza a identificação, as condições de saúde e o histórico veterinário completo do animal, com a previsão da próxima vacina, a medicação ativa e a linha do tempo de eventos (vacinas, exames, cirurgias e medicamentos), atendendo aos requisitos RF-A01, RF-A03 e RF-A04.
<!-- b503 -->Figura 27 – Protótipo da tela T06: Ficha do animal
<!-- b504 TABELA SEM LEGENDA -->
|  |

<!-- b505 -->Fonte: Elaborado pelos autores (2026).
<!-- b506 -->O Detalhe da Ocorrência apresenta os dados da denúncia, o denunciante, a localização e o processo sanitário vinculado, com o painel de encerramento condicionado ao resultado laboratorial, refletindo os requisitos RF-E01, RF-E03 e a regra de sigilo do denunciante (RN03).
<!-- b507 -->Figura 28 – Protótipo da tela T10: Detalhe da ocorrência
<!-- b508 TABELA SEM LEGENDA -->
|  |

<!-- b509 -->Fonte: Elaborado pelos autores (2026).
<!-- b510 -->A Gestão de Baias exibe a ocupação de cada baia com indicação visual de status (normal, atenção e superlotada), a capacidade total e a taxa de ocupação geral, atendendo ao requisito RF-A02.
<!-- b511 -->Figura 29 – Protótipo da tela T07: Gestão de baias
<!-- b512 TABELA SEM LEGENDA -->
|  |

<!-- b513 -->Fonte: Elaborado pelos autores (2026).
<!-- b514 -->A tela de Relatórios permite a geração e exportação dos relatórios consolidados (processos, vacinação, adoções, procedimentos, ocupação de baias e ocorrências por bairro), com acompanhamento do status de geração assíncrona, atendendo aos requisitos RF-B07, RF-D02 e à regra RN11.
<!-- b515 -->Figura 30 – Protótipo da tela T14: Central de relatórios
<!-- b516 TABELA SEM LEGENDA -->
|  |

<!-- b517 -->Fonte: Elaborado pelos autores (2026).
<!-- b518 --># 5 SISTEMA DESENVOLVIDO
<!-- b519 -->Este capítulo apresenta o sistema desenvolvido: a organização do código, as bibliotecas utilizadas e as telas implementadas.
<!-- b520 -->## 5.1 ORGANIZAÇÃO DO CÓDIGO E BIBLIOTECAS
<!-- b521 -->O backend está organizado em pacotes por módulo – usuarios, animais, ocorrencias, processos, relatorios e comum –, cada um com controladores, serviços, repositórios e entidades; o frontend está organizado em pastas por funcionalidade. Além dos frameworks descritos na Seção 2.3, o SISZOO utiliza as bibliotecas do Quadro 14, escolhidas por implementarem diretamente os requisitos e as regras de negócio indicados na última coluna. 
<!-- b522 -->Quadro 14 – Bibliotecas utilizadas no SISZOO

| Biblioteca | Camada | Uso no SISZOO | Requisito ou regra |
|---|---|---|---|
| Spring Security | Backend | Autenticação e autorização por perfil | RF-C01, RN09 |
| jjwt | Backend | Emissão e validação do token JWT | RF-C01 |
| Bean Validation (Spring Validation) | Backend | Validação de campos obrigatórios e formatos | RN07, RN08 |
| Spring Data JPA e Hibernate | Backend | Mapeamento das entidades para as tabelas | RNF09 |
| Flyway | Backend | Criação e versionamento do esquema do banco | RNF09 |
| Spring Boot Mail e Thymeleaf | Backend | E-mail de resultado laboratorial com modelo HTML | RN10 |
| OpenPDF | Backend | Geração dos relatórios em PDF | RF-D02 |
| Lombok | Backend | Redução de código repetitivo nas classes | RNF08 |
| React Router | Frontend | Navegação e bloqueio de telas sem autenticação | RF-C01, RN09 |
| TanStack Query e Axios | Frontend | Comunicação com a API, cache das consultas e envio do token | RNF01 |
| Zod | Frontend | Validação dos formulários no navegador | RN07, RN08 |
| idb | Frontend | Rascunho local de formulários no IndexedDB | RNF03 |
| Recharts | Frontend | Gráficos do painel de indicadores | RF-D01 |
| JUnit 5, Testcontainers e Rest Assured | Testes | Testes de integração da API com PostgreSQL em contêiner | RNF08 |
| GreenMail | Testes | Servidor de e-mail simulado nos testes | RN10 |
| Vitest, Testing Library e MSW | Testes | Testes de componentes com API simulada | RNF08 |
| Playwright | Testes | Testes ponta a ponta no navegador | RNF08 |

<!-- b524 -->Fonte: Elaborado pelos autores (2026).
<!-- b525 -->## 5.2 TELAS DO SISTEMA
<!-- b526 -->Esta seção apresenta as telas do SISZOO implementado, capturadas com dados fictícios. O Quadro 15 relaciona cada tela aos perfis que a acessam, aos requisitos e regras que atende e à rotina do CCZ que substitui. As telas dos relatórios específicos, de leiaute semelhante entre si, encontram-se no Apêndice E.
<!-- b527 -->Quadro 15 – Telas do SISZOO

| Cód. | Tela | Perfis | Requisitos e regras | Substitui no CCZ |
|---|---|---|---|---|
| T01 | Login | Todos | RF-C01 | — |
| T02 | Dashboard operacional | Todos | RF-D01, RF-A03 | Contagens manuais e gráficos montados à mão |
| T03 | Alertas | Todos | RF-A03 | Controle de memória do reforço vacinal |
| T04 | Animais do canil | Veterinário, Administrador | RF-A02 | Planilha de controle por baias |
| T05 | Cadastro de animal | Veterinário, Administrador | RF-A01, RN01, RN07 | Ficha manuscrita e cadastro no AnimalTag |
| T06 | Ficha do animal | Veterinário, Administrador | RF-A01, RF-A03, RF-A04, RF-A05 | Ficha manuscrita |
| T07 | Gestão de baias | Administrador (edição); Veterinário (consulta) | RF-A02 | Planilha de controle por baias |
| T08 | Ocorrências | Agente Sanitário, Administrador | RF-E02, RN03 | Caderno de ocorrências |
| T09 | Registro de ocorrência | Agente Sanitário, Administrador | RF-E01, RN02 | Caderno de ocorrências |
| T10 | Detalhe da ocorrência | Agente Sanitário, Administrador | RF-E03, RN05 | Caderno de ocorrências |
| T11 | Processos sanitários | Agente Sanitário, Administrador | RF-B02, RN04 | Planilha de processos |
| T12 | Abertura de processo | Agente Sanitário, Administrador | RF-B01, RF-B04, RN08 | Formulário físico e planilha |
| T13 | Detalhe do processo | Agente Sanitário, Administrador | RF-B03, RF-B05, RN10, RN12 | Planilha de resultados |
| T14 | Central de relatórios | Todos | RF-D02, RN11 | Relatórios montados à mão |
| T15 | Usuários | Administrador | RF-C02, RN09 | — |
| T16 | Configurações | Todos | RF-C03 | — |
| T17 | Perfil e Ajuda | Todos | RF-C01 | — |

<!-- b529 -->Fonte: Elaborado pelos autores (2026).
<!-- b530 -->A Figura 31 apresenta a tela T01, de login, comum a todos os perfis. O acesso é feito com e-mail institucional e senha, e o sistema exige a troca de senha no primeiro acesso (RF-C01). A tela corresponde ao caso de uso Realizar Login.
<!-- b531 -->Figura 31 – Tela T01: Login
<!-- b532 -->[INSERIR CAPTURA DA TELA T01 – LOGIN]
<!-- b533 -->Fonte: Elaborado pelos autores (2026).
<!-- b534 -->A Figura 32 apresenta a tela T02, o dashboard operacional, primeira tela após o login. Ela reúne os indicadores e os alertas críticos do CCZ (RF-D01, RF-A03) e corresponde ao caso de uso Visualizar Dashboard em Tempo Real. Substitui as contagens e os gráficos montados manualmente pela direção.
<!-- b535 -->Figura 32 – Tela T02: Dashboard operacional
<!-- b536 -->[INSERIR CAPTURA DA TELA T02 – DASHBOARD OPERACIONAL]
<!-- b537 -->Fonte: Elaborado pelos autores (2026).
<!-- b538 -->A Figura 33 apresenta a tela T03, de alertas, com o detalhe dos animais com reforço vacinal nos próximos 7 dias e das vacinas vencidas (RF-A03). Corresponde ao caso de uso Consultar Alertas Vacinais.
<!-- b539 -->Figura 33 – Tela T03: Alertas
<!-- b540 -->[INSERIR CAPTURA DA TELA T03 – ALERTAS]
<!-- b541 -->Fonte: Elaborado pelos autores (2026).
<!-- b542 -->A Figura 34 apresenta a tela T04, de listagem dos animais do canil, com filtros por baia, espécie e status (RF-A02). Corresponde ao caso de uso Consultar Animais por Baia e substitui a planilha de controle por baias.
<!-- b543 -->Figura 34 – Tela T04: Animais do canil
<!-- b544 -->[INSERIR CAPTURA DA TELA T04 – ANIMAIS DO CANIL]
<!-- b545 -->Fonte: Elaborado pelos autores (2026).
<!-- b546 -->A Figura 35 apresenta a tela T05, de cadastro de animal. O sistema verifica se o número do microchip já está cadastrado (RN01) e exige os campos obrigatórios da RN07; o animal que chega sem microchip pode ser cadastrado e recebe o número quando o chip for implantado. A tela corresponde ao caso de uso Cadastrar Animal e substitui a ficha manuscrita e o cadastro paralelo na plataforma AnimalTag.
<!-- b547 -->Figura 35 – Tela T05: Cadastro de animal
<!-- b548 -->[INSERIR CAPTURA DA TELA T05 – CADASTRO DE ANIMAL]
<!-- b549 -->Fonte: Elaborado pelos autores (2026).
<!-- b550 -->A Figura 36 apresenta a tela T06, ficha do animal, com identificação, histórico veterinário, alertas de vacina e registro de saída e adoção (RF-A01, RF-A03, RF-A04, RF-A05). Os registros clínicos não podem ser editados nem excluídos (RN06).
<!-- b551 -->Figura 36 – Tela T06: Ficha do animal
<!-- b552 -->[INSERIR CAPTURA DA TELA T06 – FICHA DO ANIMAL]
<!-- b553 -->Fonte: Elaborado pelos autores (2026).
<!-- b554 -->A Figura 37 apresenta a tela T07, de gestão de baias, com a ocupação calculada de cada baia, a capacidade e a indicação de superlotação (RF-A02). Corresponde aos casos de uso Gerenciar Baias e Monitorar Ocupação de Baias.
<!-- b555 -->Figura 37 – Tela T07: Gestão de baias
<!-- b556 -->[INSERIR CAPTURA DA TELA T07 – GESTÃO DE BAIAS]
<!-- b557 -->Fonte: Elaborado pelos autores (2026).
<!-- b558 -->A Figura 38 apresenta a tela T08, de listagem de ocorrências, com filtros por tipo e status. Em ocorrências sigilosas, os dados do denunciante ficam ocultos para quem não é Administrador (RN03). Substitui o caderno físico de ocorrências.
<!-- b559 -->Figura 38 – Tela T08: Ocorrências
<!-- b560 -->[INSERIR CAPTURA DA TELA T08 – OCORRÊNCIAS]
<!-- b561 -->Fonte: Elaborado pelos autores (2026).
<!-- b562 -->A Figura 39 apresenta a tela T09, de registro de ocorrência, com protocolo gerado automaticamente no formato 0000/AAAA (RN02), marcação de sigilo e denunciado opcional (RF-E01). Corresponde ao caso de uso Registrar Nova Ocorrência.
<!-- b563 -->Figura 39 – Tela T09: Registro de ocorrência
<!-- b564 -->[INSERIR CAPTURA DA TELA T09 – REGISTRO DE OCORRÊNCIA]
<!-- b565 -->Fonte: Elaborado pelos autores (2026).
<!-- b566 -->A Figura 40 apresenta a tela T10, de detalhe da ocorrência, com movimentações e encerramento. O encerramento fica bloqueado enquanto o processo sanitário vinculado não tiver resultado (RN05).
<!-- b567 -->Figura 40 – Tela T10: Detalhe da ocorrência
<!-- b568 -->[INSERIR CAPTURA DA TELA T10 – DETALHE DA OCORRÊNCIA]
<!-- b569 -->Fonte: Elaborado pelos autores (2026).
<!-- b570 -->A Figura 41 apresenta a tela T11, de listagem dos processos sanitários, com os processos urgentes fixados no topo (RN04) e filtros por doença e status (RF-B02). Substitui a planilha de controle de processos.
<!-- b571 -->Figura 41 – Tela T11: Processos sanitários
<!-- b572 -->[INSERIR CAPTURA DA TELA T11 – PROCESSOS SANITÁRIOS]
<!-- b573 -->Fonte: Elaborado pelos autores (2026).
<!-- b574 -->A Figura 42 apresenta a tela T12, de abertura de processo sanitário, organizada em etapas: dados do processo e vínculo com a ocorrência, responsável, amostras e revisão (RF-B01, RF-B04). Corresponde aos casos de uso Abrir Processo Sanitário e Registrar Animal Amostrado.
<!-- b575 -->Figura 42 – Tela T12: Abertura de processo
<!-- b576 -->[INSERIR CAPTURA DA TELA T12 – ABERTURA DE PROCESSO]
<!-- b577 -->Fonte: Elaborado pelos autores (2026).
<!-- b578 -->A Figura 43 apresenta a tela T13, de detalhe do processo, onde o agente registra o resultado laboratorial e o desfecho. Resultado Positivo ou Inconclusivo gera notificação por e-mail ao responsável e à Vigilância Epidemiológica (RN10).
<!-- b579 -->Figura 43 – Tela T13: Detalhe do processo
<!-- b580 -->[INSERIR CAPTURA DA TELA T13 – DETALHE DO PROCESSO]
<!-- b581 -->Fonte: Elaborado pelos autores (2026).
<!-- b582 -->A Figura 44 apresenta a tela T14, central de relatórios, onde o usuário escolhe o tipo e o período, solicita a geração e acompanha o status (RF-D02, RN11).
<!-- b583 -->Figura 44 – Tela T14: Central de relatórios
<!-- b584 -->[INSERIR CAPTURA DA TELA T14 – CENTRAL DE RELATÓRIOS]
<!-- b585 -->Fonte: Elaborado pelos autores (2026).
<!-- b586 -->A Figura 45 apresenta a tela T15, de gestão de usuários, em que o Administrador cadastra, desativa e reativa usuários e atribui cargos (RF-C02).
<!-- b587 -->Figura 45 – Tela T15: Usuários
<!-- b588 -->[INSERIR CAPTURA DA TELA T15 – USUÁRIOS]
<!-- b589 -->Fonte: Elaborado pelos autores (2026).
<!-- b590 -->A Figura 46 apresenta a tela T16, de configurações, em que o usuário ajusta o tema e a densidade da interface (RF-C03).
<!-- b591 -->Figura 46 – Tela T16: Configurações
<!-- b592 -->[INSERIR CAPTURA DA TELA T16 – CONFIGURAÇÕES]
<!-- b593 -->Fonte: Elaborado pelos autores (2026).
<!-- b594 -->A Figura 47 apresenta a tela T17, de perfil do usuário e ajuda, com os dados da conta e orientações de uso do sistema.
<!-- b595 -->Figura 47 – Tela T17: Perfil e Ajuda
<!-- b596 -->[INSERIR CAPTURA DA TELA T17 – PERFIL E AJUDA]
<!-- b597 -->Fonte: Elaborado pelos autores (2026).
<!-- b599 --># CONSIDERAÇÕES FINAIS
<!-- b600 -->Este trabalho teve como objetivo desenvolver o SISZOO, sistema web de uso interno para a gestão dos animais do canil, das ocorrências e dos processos sanitários do Centro de Controle de Zoonoses de Itu, em resposta à fragmentação dos registros em fichas manuscritas, planilhas e cadernos físicos identificada junto à equipe do CCZ.
<!-- b601 -->Os objetivos de mapear o fluxo de trabalho vigente, levantar os requisitos e modelar o sistema foram atingidos: foram especificados 20 requisitos funcionais, 10 requisitos não funcionais e 12 regras de negócio, detalhados em diagramas de casos de uso, com 36 especificações de baixo nível, diagramas entidade-relacionamento, lógicos e de classes, dicionário de dados e protótipos das interfaces. [DESCREVER O QUE FOI IMPLEMENTADO E O QUE FICOU PENDENTE NA ENTREGA.] [DESCREVER OS TESTES REALIZADOS E SEUS RESULTADOS, SE HOUVER.]
<!-- b602 -->Quanto à questão de pesquisa, o SISZOO reúne em uma única base de dados o cadastro dos animais por microchip, o controle das baias, o histórico veterinário, as ocorrências e os processos sanitários, antes distribuídos em fontes não integradas. A hipótese de que um sistema web centralizado pode substituir os controles fragmentados confirma-se no plano do sistema construído; sua confirmação na rotina do CCZ depende da implantação e da avaliação com a equipe, que não foram realizadas neste trabalho.
<!-- b603 -->O desenvolvimento permitiu aplicar conhecimentos de engenharia de requisitos, modelagem orientada a objetos, banco de dados relacional, segurança de aplicações web e desenvolvimento full stack. [APRENDIZADOS E DIFICULDADES, NAS PALAVRAS DOS AUTORES.]
<!-- b604 -->Entre as limitações, destacam-se a restrição do escopo ao CCZ de Itu e a ausência de integração com os sistemas de vigilância SINAN e GAL, cujos números são apenas registrados. [ACRESCENTAR REQUISITOS NÃO IMPLEMENTADOS, SE HOUVER.]
<!-- b605 -->O sistema foi desenvolvido com possibilidade de implantação no CCZ de Itu. Para isso, são necessários servidor ou hospedagem com acesso por HTTPS, rotina de backup diário (RNF04), migração dos dados das planilhas atuais, capacitação da equipe e anuência da Secretaria responsável. A capacitação responde ao principal risco de adoção identificado na Seção 3.5, a resistência à mudança, e pode ser organizada por perfil de acesso, com tarefas reais de cada rotina e com a tela de Ajuda do sistema como material de apoio.
<!-- b606 -->Como trabalhos futuros, propõem-se a capacitação da equipe e a implantação do sistema, acompanhadas de avaliação de uso com os funcionários; a integração com o SINAN, o GAL e a plataforma AnimalTag; a integração com o Cadastro Nacional de Animais Domésticos, autorizado pela Lei nº 15.046/2024; o desenvolvimento de aplicativo móvel para os agentes em campo; e um módulo público de adoção.
<!-- b608 --># REFERÊNCIAS
<!-- b609 -->ALMEIDA, Bruna Machado de; CALDAS, Aline Cirilo. Responsabilidade do Centro de Controle de Zoonoses no ordenamento jurídico brasileiro: uma breve análise da legislação de Ji-Paraná. Revista Nativa Americana de Ciências, Tecnologia & Inovação, v. 3, n. 2, p. 64–74, 2022.
<!-- b611 -->APACHE SOFTWARE FOUNDATION. Apache Maven project. [S. l.], 2026. Disponível em: https://maven.apache.org/. Acesso em: 11 out. 2026.
<!-- b613 -->BALBE, Ronald da Silva. Uso de tecnologias de informação e comunicação na gestão pública: exemplos no governo federal. Revista do Serviço Público, Brasília, v. 61, n. 2, p. 189–209, abr./jun. 2010.
<!-- b615 -->BARROSO, José Eduardo Machado; LIMA, Elaine Euzébio de. O Centro de Controle de Zoonoses e sua importância para a saúde pública do município de Catalão, GO. In: CONFERÊNCIA INTERNACIONAL DE ESTRATÉGIA EM GESTÃO, EDUCAÇÃO E SISTEMAS DE INFORMAÇÃO, 1., 2012, Goiânia. Anais [...]. Goiânia: UEG, 2012. p. 846–859.
<!-- b617 -->BRASIL. Ministério da Saúde. Portaria nº 1.138, de 23 de maio de 2014. Define as ações e os serviços de saúde voltados para vigilância, prevenção e controle de zoonoses e de acidentes causados por animais peçonhentos e venenosos, de relevância para a saúde pública. Brasília, DF: Ministério da Saúde, 2014. Disponível em: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2014/prt1138_23_05_2014.html. Acesso em: 11 out. 2026.
<!-- b619 -->BRASIL. Ministério da Saúde. Secretaria de Vigilância em Saúde. Manual de vigilância, prevenção e controle de zoonoses: normas técnicas e operacionais. Brasília, DF: Ministério da Saúde, 2016. Disponível em: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/zoonose/manual-zoonoses-normas-2v-7julho16-site.pdf. Acesso em: 11 out. 2026.
<!-- b621 -->BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Dispõe sobre a proteção de dados pessoais (LGPD). Brasília, DF: Presidência da República, 2018. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm. Acesso em: 29 mar. 2026.
<!-- b623 -->BRASIL. Lei nº 14.129, de 29 de março de 2021. Dispõe sobre princípios, regras e instrumentos para o Governo Digital. Brasília, DF: Presidência da República, 2021a. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14129.htm. Acesso em: 17 nov. 2025.
<!-- b625 -->BRASIL. Lei nº 14.228, de 20 de outubro de 2021. Dispõe sobre a proibição da eliminação de cães e gatos pelos órgãos de controle de zoonoses, canis públicos e estabelecimentos oficiais congêneres; e dá outras providências. Brasília, DF: Presidência da República, 2021b. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14228.htm. Acesso em: 11 out. 2026.
<!-- b627 -->BRASIL. Ministério da Saúde. Secretaria de Vigilância em Saúde e Ambiente. Guia de vigilância em saúde. 6. ed. Brasília, DF: Ministério da Saúde, 2023. 3 v.
<!-- b629 -->BRASIL. Lei nº 15.046, de 17 de dezembro de 2024. Autoriza a criação do Cadastro Nacional de Animais Domésticos. Brasília, DF: Presidência da República, 2024. Disponível em: https://planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l15046.htm. Acesso em: 11 out. 2026.
<!-- b631 -->BRASIL. Ministério da Saúde. Portaria GM/MS nº 6.734, de 18 de março de 2025. Altera o Anexo 1 do Anexo V da Portaria de Consolidação GM/MS nº 4, de 28 de setembro de 2017, para incluir a esporotricose humana na Lista Nacional de Notificação Compulsória. Brasília, DF: Ministério da Saúde, 2025a. Disponível em: https://app.wiki.saude.es.gov.br/vigilancia/sistemas/portaria_gm_ms_n%C2%BA_6.734_de_18_de_mar%C3%A7o_de_2025_-_esporotricose_humana_na_lista_nacional.pdf. Acesso em: 11 out. 2026.
<!-- b632 -->BRASIL. Ministério da Saúde. Secretaria de Vigilância em Saúde e Ambiente. Departamento de HIV/Aids, Tuberculose, Hepatites Virais e Infecções Sexualmente Transmissíveis. Nota Técnica nº 20/2025-CGTM/DATHI/SVSA/MS: atualizações para a vigilância e notificação da esporotricose humana no âmbito nacional. Brasília, DF: Ministério da Saúde, 2025b.
<!-- b634 -->BRASIL. Ministério da Saúde. Portaria GM/MS nº 10.175, de 23 de janeiro de 2026. Altera o Anexo 1 do Anexo V à Portaria de Consolidação GM/MS nº 4, de 2017, para incluir anomalias congênitas na Lista Nacional de Notificação Compulsória. Brasília, DF: Ministério da Saúde, 2026a. Disponível em: https://www.conass.org.br/conass-informa-n-15-2026-publicada-portaria-gm-n-10-175-que-altera-o-anexo-1-do-anexo-v-a-portaria-de-consolidacao-gm-ms-no-4-de-2017-para-incluir-anomalias-congenitas-na-lista-naci/. Acesso em: 11 out. 2026.
<!-- b636 -->BRASIL. Ministério da Saúde. Notificação compulsória. Brasília, DF: Ministério da Saúde, [2026b]. Disponível em: https://www.gov.br/saude/pt-br/composicao/svsa/notificacao-compulsoria. Acesso em: 11 out. 2026.
<!-- b637 -->BRASIL. Ministério da Saúde. Portaria GM/MS nº 11.211, de 13 de maio de 2026. Altera o Anexo 1 do Anexo V à Portaria de Consolidação GM/MS nº 4, de 28 de setembro de 2017, para incluir a caxumba e a febre do oropouche, remover a covid-19 e alterar nomenclaturas e periodicidade de notificação de diversas doenças na Lista Nacional de Notificação Compulsória [...]. Diário Oficial da União: seção 1, Brasília, DF, n. 89, p. 1120, 14 maio 2026c. Disponível em: https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-11.211-de-13-de-maio-de-2026-705371404. Acesso em: 20 jul. 2026.
<!-- b638 -->BRASIL. Ministério da Saúde. Secretaria de Vigilância em Saúde e Ambiente. Departamento de Doenças Transmissíveis. Manual de vigilância e controle da leishmaniose visceral. 2. ed. Brasília, DF: Ministério da Saúde, 2026d. 137 p.
<!-- b640 -->CAMPO GRANDE (Município). Coordenadoria de Controle de Zoonoses. Castração de gatos, agendamento online. Carta de Serviços ao Usuário, Campo Grande, 2025.
<!-- b642 -->CÂNDIDO, Carlos Henrique. brModelo. [S. l.], [2026]. Disponível em: https://github.com/chcandido/brModelo. Acesso em: 11 out. 2026.
<!-- b644 -->CHACON, Scott; STRAUB, Ben. Pro Git. 2. ed. [S. l.]: Apress, 2014. Disponível em: https://git-scm.com/book/en/v2. Acesso em: 29 mar. 2026.
<!-- b646 -->CHEN, Peter Pin-Shan. The entity-relationship model: toward a unified view of data. ACM Transactions on Database Systems, v. 1, n. 1, p. 9-36, mar. 1976.
<!-- b648 -->DOCKER. Docker docs. [S. l.], 2026. Disponível em: https://docs.docker.com/. Acesso em: 11 out. 2026.
<!-- b650 -->ELLWANGER, Joel Henrique; CHIES, José Artur Bogo. Saúde Única (One Health): uma abordagem para entender, prevenir e controlar as doenças infecciosas e parasitárias. Revista Bio Diverso, Porto Alegre, v. 2, p. 42–66, 2022.
<!-- b652 -->FIELDING, Roy Thomas. Architectural styles and the design of network-based software architectures. 2000. Tese (Doutorado em Information and Computer Science) – University of California, Irvine, 2000. Disponível em: https://ics.uci.edu/~fielding/pubs/dissertation/top.htm. Acesso em: 11 out. 2026.
<!-- b654 -->GITHUB. Sobre o GitHub e o Git. GitHub Docs, 2026. Disponível em: https://docs.github.com/pt/get-started/start-your-journey/about-github-and-git. Acesso em: 29 mar. 2026.
<!-- b656 -->GOIÁS (Estado). Secretaria de Estado da Saúde. GAL – Sistema Gerenciador de Ambiente Laboratorial. Goiânia: SES-GO, 2020. Disponível em: https://goias.gov.br/saude/?p=17292. Acesso em: 11 out. 2026.
<!-- b658 -->HEUSER, Carlos Alberto. Projeto de banco de dados. 6. ed. Porto Alegre: Bookman, 2009.
<!-- b660 -->HOLISTICS. dbdiagram.io. [S. l.], 2026. Disponível em: https://dbdiagram.io/. Acesso em: 11 out. 2026.
<!-- b662 -->IBGE. Itu. In: IBGE. Cidades@. Rio de Janeiro: IBGE, [2026]. Disponível em: https://www.ibge.gov.br/cidades-e-estados/sp/itu.html. Acesso em: 11 out. 2026.
<!-- b664 -->JONES, M.; BRADLEY, J.; SAKIMURA, N. JSON Web Token (JWT): RFC 7519. [S. l.]: IETF, 2015. Disponível em: https://www.rfc-editor.org/rfc/rfc7519. Acesso em: 11 out. 2026.
<!-- b666 -->KONG. Insomnia. GitHub, 2026. Disponível em: https://github.com/Kong/insomnia. Acesso em: 29 mar. 2026.
<!-- b668 -->MICROSOFT. TypeScript documentation. [S. l.], 2026. Disponível em: https://www.typescriptlang.org/docs/. Acesso em: 11 out. 2026.
<!-- b670 -->ONE HEALTH HIGH-LEVEL EXPERT PANEL (OHHLEP) et al. One Health: a new definition for a sustainable and healthy future. PLoS Pathogens, v. 18, n. 6, e1010537, 2022. DOI: https://doi.org/10.1371/journal.ppat.1010537.
<!-- b672 -->ORACLE. JDK 21 documentation. [S. l.], 2023. Disponível em: https://docs.oracle.com/en/java/javase/21/. Acesso em: 11 out. 2026.
<!-- b674 -->PLANTUML. PlantUML. [S. l.], 2026. Disponível em: https://plantuml.com/. Acesso em: 11 out. 2026.
<!-- b676 -->POSTGRESQL GLOBAL DEVELOPMENT GROUP. PostgreSQL 16 documentation. [S. l.], 2023. Disponível em: https://www.postgresql.org/docs/16/. Acesso em: 11 out. 2026.
<!-- b678 -->PRODANOV, Cleber Cristiano; FREITAS, Ernani Cesar de. Metodologia do trabalho científico: métodos e técnicas da pesquisa e do trabalho acadêmico. 2. ed. Novo Hamburgo: Feevale, 2013.
<!-- b680 -->REACT. React documentation. [S. l.], 2026. Disponível em: https://react.dev/. Acesso em: 11 out. 2026.
<!-- b682 -->RECHARTS. Recharts. [S. l.], 2026. Disponível em: https://recharts.org/. Acesso em: 11 out. 2026.
<!-- b684 -->RIBEIRO, Rodrigo Luiz. Prefeitura lança site do CCZ com adoção online de cães e gatos. Prefeitura de São José dos Campos, São José dos Campos, 19 ago. 2022. Disponível em: https://www.sjc.sp.gov.br/noticias/2022/agosto/19/prefeitura-lanca-site-do-ccz-com-adocao-online-de-caes-e-gatos/. Acesso em: 11 out. 2026.
<!-- b686 -->SÃO PAULO (Estado). Secretaria de Estado da Saúde. Centro de Vigilância Epidemiológica “Prof. Alexandre Vranjac”. [Boletim de esporotricose]. São Paulo: CVE, fev. 2026. Disponível em: https://www.saude.sp.gov.br/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-de-transmissao-por-vetores-e-zoonoses/boletim/esporotricose/boletim_esporotricose_fev2026.pdf. Acesso em: 11 out. 2026.
<!-- b688 -->SÃO PAULO (Município). Secretaria Municipal da Saúde. Site do CCZ mostra animais disponíveis para adoção. Prefeitura de São Paulo, 27 ago. 2017.
<!-- b690 -->SCHWABER, Ken; SUTHERLAND, Jeff. The Scrum guide. [S. l.], 2020. Disponível em: https://scrumguides.org/. Acesso em: 11 out. 2026.
<!-- b692 -->SOMMERVILLE, Ian. Engenharia de software. 9. ed. São Paulo: Pearson Prentice Hall, 2011.
<!-- b694 -->SPRING. Spring Boot reference documentation. [S. l.], 2026a. Disponível em: https://docs.spring.io/spring-boot/. Acesso em: 11 out. 2026.
<!-- b696 -->SPRING. Spring Security reference. [S. l.], 2026b. Disponível em: https://docs.spring.io/spring-security/reference/. Acesso em: 11 out. 2026.
<!-- b698 -->SPRING. Spring Data JPA reference. [S. l.], 2026c. Disponível em: https://docs.spring.io/spring-data/jpa/reference/. Acesso em: 11 out. 2026.
<!-- b700 -->VITE. Vite documentation. [S. l.], 2026. Disponível em: https://vite.dev/. Acesso em: 11 out. 2026.
<!-- b702 --># APÊNDICE A – CASOS DE USO DE BAIXO NÍVEL
<!-- b703 -->Este apêndice detalha os casos de uso de baixo nível do SISZOO, organizados por módulo funcional. Cada caso de uso descreve, em formato tabular, o objetivo, os atores envolvidos, as pré e pós-condições, o fluxo principal de interação entre ator e sistema, as restrições e validações aplicáveis e os fluxos alternativos previstos. Os casos de uso derivam dos diagramas de caso de uso de alto nível apresentados no Capítulo 4 e refletem as regras de negócio da Seção 3.3. Cada quadro indica os requisitos relacionados, e cada caso de uso presente nos diagramas por módulo tem um quadro próprio.
<!-- b704 -->## A.1 MÓDULO 1 – AUTENTICAÇÃO E CONTROLE DE ACESSO
<!-- b705 -->Quadro 16 – Caso de uso de baixo nível Realizar Login

| Realizar Login |  |
|---|---|
| Caso de Uso Geral | Autenticação |
| Ator Principal | Veterinário, Agente Sanitário ou Administrador |
| Atores Secundários |  |
| Resumo | O usuário autentica-se no sistema com e-mail e senha para acessar as funcionalidades de acordo com seu perfil. |
| Pré-Condições | O usuário deve estar cadastrado e ativo, com um cargo atribuído pelo Administrador. |
| Pós-Condições | Token JWT válido emitido; usuário redirecionado ao painel inicial conforme suas permissões. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário acessa a página de login e informa e-mail e senha. |  |
| O usuário confirma o envio das credenciais. |  |
|  | Valida o formato do e-mail e a presença da senha. |
|  | Verifica se o usuário existe e está ativo e compara o hash da senha (bcrypt). |
|  | Gera o token JWT e registra o evento de auditoria de LOGIN. |
|  | Redireciona o usuário ao painel inicial conforme seu cargo (RN09). |
| Restrições/Validações | O usuário precisa estar cadastrado e ativo (RNF06). Senhas trafegam apenas via HTTPS. |
| Fluxo Alternativo I | Senha inválida: o sistema informa credenciais inválidas e mantém a tela de login, sem revelar qual campo falhou. |
| Fluxo Alternativo II | Usuário inexistente ou inativo: o sistema informa credenciais inválidas e retorna à tela de login. |
| Fluxo Alternativo III | Primeiro acesso: o sistema exige a troca da senha antes de liberar o painel inicial. |
| Requisitos relacionados | RF-C01, RNF06, RNF10 |

<!-- b707 -->Fonte: Elaborado pelos autores (2026).
<!-- b708 -->Quadro 17 – Caso de uso de baixo nível Encerrar Sessão (Logout)

| Encerrar Sessão (Logout) |  |
|---|---|
| Caso de Uso Geral | Autenticação |
| Ator Principal | Veterinário, Agente Sanitário ou Administrador |
| Atores Secundários |  |
| Resumo | O usuário encerra o uso do sistema, descartando o token JWT em uso. |
| Pré-Condições | O usuário deve estar autenticado com token válido. |
| Pós-Condições | Token descartado; usuário redirecionado à tela de login. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário aciona a opção de sair do sistema. |  |
|  | Descarta o token JWT armazenado no navegador. |
|  | Registra o evento de auditoria de LOGOUT e redireciona à tela de login. |
| Restrições/Validações | O token deixa de ser usado no logout e perde a validade na expiração (RNF06). |
| Fluxo Alternativo I | Token já expirado: o sistema apenas redireciona à tela de login, sem ação adicional. |
| Requisitos relacionados | RF-C01, RNF10 |

<!-- b710 -->Fonte: Elaborado pelos autores (2026).
<!-- b711 -->Quadro 18 – Caso de uso de baixo nível Editar Preferências do Usuário

| Editar Preferências do Usuário |  |
|---|---|
| Caso de Uso Geral | Gestão de Preferências |
| Ator Principal | Veterinário, Agente Sanitário ou Administrador |
| Atores Secundários |  |
| Resumo | O usuário ajusta o tema, a densidade da interface e as notificações que deseja receber. |
| Pré-Condições | O usuário deve estar autenticado. |
| Pós-Condições | Preferências persistidas e aplicadas à interface do usuário. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário acessa a tela de preferências. |  |
|  | Carrega as preferências atuais do usuário. |
| O usuário altera o tema,  a densidade e/ou as notificações que deseja receber e confirma. |  |
|  | Valida e persiste as preferências e aplica imediatamente à interface. |
| Restrições/Validações | As preferências são individuais e não afetam outros usuários. |
| Fluxo Alternativo I | Nenhuma alteração realizada: o sistema mantém as preferências vigentes. |
| Requisitos relacionados | RF-C03 |

<!-- b713 -->Fonte: Elaborado pelos autores (2026).
<!-- b714 -->Quadro 19 – Caso de uso de baixo nível Gerenciar Usuários

| Gerenciar Usuários |  |
|---|---|
| Caso de Uso Geral | Controle de Acesso |
| Ator Principal | Administrador |
| Atores Secundários |  |
| Resumo | O Administrador cadastra, edita e atribui cargos e permissões aos usuários do sistema. |
| Pré-Condições | O ator deve estar autenticado com cargo de Administrador. |
| Pós-Condições | Usuário criado ou atualizado, com cargo e permissões definidos; evento registrado em auditoria. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Administrador acessa a gestão de usuários e seleciona criar ou editar um usuário. |  |
| O Administrador informa os dados do usuário (nome, e-mail, telefone, CRMV quando aplicável). |  |
| O Administrador atribui um ou mais cargos ao usuário (Atribuir Cargo e Permissões). |  |
| O Administrador confirma a operação. |  |
|  | Valida os dados, verifica a unicidade do e-mail e persiste o usuário e seus vínculos de cargo. |
|  | Registra o evento de auditoria (CRIACAO ou ATUALIZACAO) com os valores anterior e posterior. |
| Restrições/Validações | Apenas o Administrador possui acesso total (RN09). E-mail deve ser único. Toda ação crítica gera AuditoriaEvento (RN06, RNF10). |
| Fluxo Alternativo I | E-mail já cadastrado: o sistema informa a duplicidade e não conclui o cadastro. |
| Fluxo Alternativo II | Desativar/Reativar usuário: ver o caso de uso Desativar/Reativar Usuário. |
| Requisitos relacionados | RF-C02, RN09, RNF10 |

<!-- b716 -->Fonte: Elaborado pelos autores (2026).
<!-- b717 -->Quadro 20 – Caso de uso de baixo nível Atribuir Cargo e Permissões

| Atribuir Cargo e Permissões |  |
|---|---|
| Caso de Uso Geral | Gerenciar Usuários (inclusão) |
| Ator Principal | Administrador |
| Atores Secundários |  |
| Resumo | O Administrador vincula ao usuário um ou mais cargos; as permissões de acesso decorrem dos cargos atribuídos. |
| Pré-Condições | O Administrador está cadastrando ou editando um usuário. |
| Pós-Condições | Vínculos entre usuário e cargo gravados com a data de inclusão; evento registrado na auditoria. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
|  | Exibe os cargos disponíveis (Administrador, Veterinário e Agente Sanitário) e as permissões de cada um por módulo. |
| O Administrador seleciona o cargo ou os cargos do usuário. |  |
|  | Grava os vínculos (UsuarioCargo) e registra o evento ATUALIZACAO com os valores anterior e posterior. |
| Restrições/Validações | Todo usuário tem ao menos um cargo. As permissões por módulo (leitura, escrita e exclusão) são definidas no cargo (CargoPermissao), não no usuário. |
| Fluxo Alternativo I | Remoção do último cargo: o sistema recusa e informa que o usuário precisa de ao menos um cargo. |
| Requisitos relacionados | RF-C02, RN09, RNF10 |

<!-- b719 -->Fonte: Elaborado pelos autores (2026).
<!-- b720 -->Quadro 21 – Caso de uso de baixo nível Desativar/Reativar Usuário

| Desativar/Reativar Usuário |  |
|---|---|
| Caso de Uso Geral | Gerenciar Usuários (extensão) |
| Ator Principal | Administrador |
| Atores Secundários |  |
| Resumo | O Administrador impede ou restabelece o acesso de um usuário ao sistema, sem excluir seu cadastro. |
| Pré-Condições | O Administrador está autenticado e o usuário-alvo está cadastrado. |
| Pós-Condições | Situação do usuário atualizada (ativo ou inativo) e evento registrado na auditoria. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Administrador seleciona um usuário na gestão de usuários. |  |
|  | Exibe os dados e a situação atual do usuário. |
| O Administrador aciona “Desativar” (ou “Reativar”) e confirma. |  |
|  | Atualiza a situação e a data de desativação (ou a limpa, na reativação). |
|  | Registra o evento DESATIVACAO ou REATIVACAO na trilha de auditoria. |
| Restrições/Validações | Somente o Administrador executa (RN09). O cadastro não é excluído, para preservar o histórico e a autoria dos registros (RN06). |
| Fluxo Alternativo I | O Administrador cancela a confirmação: a situação permanece inalterada. |
| Fluxo Alternativo II | Usuário desativado tenta entrar: o sistema informa credenciais inválidas (caso de uso Realizar Login). |
| Requisitos relacionados | RF-C02, RN06, RN09, RNF10 |

<!-- b722 -->Fonte: Elaborado pelos autores (2026).
<!-- b723 -->Quadro 22 – Caso de uso de baixo nível Consultar Trilha de Auditoria

| Consultar Trilha de Auditoria |  |
|---|---|
| Caso de Uso Geral | Controle de Acesso |
| Ator Principal | Administrador |
| Atores Secundários |  |
| Resumo | O Administrador consulta o histórico de ações críticas registradas no sistema. |
| Pré-Condições | O ator deve estar autenticado com cargo de Administrador. |
| Pós-Condições | Eventos de auditoria exibidos conforme os filtros aplicados. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Administrador acessa a trilha de auditoria e define filtros (usuário, entidade, período). |  |
|  | Consulta os eventos de auditoria que satisfazem os filtros. |
|  | Exibe a lista com usuário, ação, entidade, data/hora e os valores anterior e posterior. |
| Restrições/Validações | Os registros de auditoria são imutáveis (RN06) e acessíveis apenas ao Administrador. |
| Fluxo Alternativo I | Nenhum evento encontrado: o sistema informa que não há registros para os filtros aplicados. |
| Requisitos relacionados | RF-C02, RN06, RNF10 |

<!-- b725 -->Fonte: Elaborado pelos autores (2026).
<!-- b726 -->## A.2 MÓDULO 2 – GESTÃO DE ANIMAIS DO CANIL
<!-- b727 -->Quadro 23 – Caso de uso de baixo nível Cadastrar Animal

| Cadastrar Animal |  |
|---|---|
| Caso de Uso Geral | Gestão de Animais |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário registra um novo animal no canil com seus dados de identificação, características e localização. |
| Pré-Condições | O ator deve estar autenticado com permissão de escrita no módulo de animais. |
| Pós-Condições | Animal cadastrado e vinculado a uma baia; ocupação da baia atualizada. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário aciona a opção de cadastrar animal. |  |
| O Veterinário informa o número do microchip (quando o animal já o possuir), espécie, sexo, porte, baia e demais dados (nome, raça, pelagem, coloração, peso, foto, motivo de entrada). |  |
| O Veterinário confirma o cadastro. |  |
|  | Valida os campos obrigatórios (RN07) e verifica a unicidade do microchip, quando informado (RN01). |
|  | Verifica a disponibilidade de vaga na baia selecionada. |
|  | Persiste o animal, atualiza a ocupação da baia e registra o evento de auditoria. |
| Restrições/Validações | Microchip único quando informado (RN01). Campos obrigatórios: espécie, sexo, porte, baia, esterilizado, status, motivo e data de entrada (RN07). |
| Fluxo Alternativo I | Microchip já cadastrado: o sistema rejeita o cadastro e informa a duplicidade. |
| Fluxo Alternativo II | Baia sem vaga: o sistema alerta sobre a superlotação e solicita outra baia. |
| Requisitos relacionados | RF-A01, RN01, RN07 |

<!-- b729 -->Fonte: Elaborado pelos autores (2026).
<!-- b730 -->Quadro 24 – Caso de uso de baixo nível Editar Dados do Animal

| Editar Dados do Animal |  |
|---|---|
| Caso de Uso Geral | Gestão de Animais |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário atualiza informações cadastrais de um animal já registrado. |
| Pré-Condições | O animal deve estar cadastrado e o ator autenticado com permissão de escrita. |
| Pós-Condições | Dados do animal atualizados; alteração registrada em auditoria. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário localiza o animal e abre seu cadastro para edição. |  |
| O Veterinário altera os campos desejados e confirma. |  |
|  | Valida os dados, mantendo a unicidade do microchip, e persiste as alterações. |
|  | Registra o evento de auditoria com os valores anterior e posterior (RN06). |
| Restrições/Validações | A alteração do microchip não pode gerar duplicidade (RN01). Histórico preservado por auditoria (RN06). |
| Fluxo Alternativo I | Tentativa de microchip duplicado: o sistema rejeita a alteração e informa a duplicidade. |
| Requisitos relacionados | RF-A01, RN06, RNF10 |

<!-- b732 -->Fonte: Elaborado pelos autores (2026).
<!-- b733 -->Quadro 25 – Caso de uso de baixo nível Registrar Saída/Desfecho

| Registrar Saída/Desfecho |  |
|---|---|
| Caso de Uso Geral | Gestão de Animais |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário registra a saída do animal do canil, informando o destino. |
| Pré-Condições | O animal deve estar alojado e o ator autenticado com permissão de escrita. |
| Pós-Condições | Animal com status de saída registrado; vaga liberada na baia. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário acessa o cadastro do animal e seleciona registrar saída. |  |
| O Veterinário informa o destino (Adotado, Resgatado, Óbito, Eutanásia ou Transferido) e a data. |  |
| O Veterinário confirma o registro. |  |
|  | Atualiza o status do animal, libera a vaga na baia e registra o evento de auditoria. |
| Restrições/Validações | Valores de saída restritos a Adotado, Resgatado, Óbito, Eutanásia e Transferido. Histórico imutável (RN06). |
| Fluxo Alternativo I | Destino não informado: o sistema impede a conclusão até que o destino seja selecionado. |
| Fluxo Alternativo II | Destino Adotado: o sistema solicita os dados do adotante (caso de uso Registrar Adoção). |
| Requisitos relacionados | RF-A05, RN06 |

<!-- b735 -->Fonte: Elaborado pelos autores (2026).
<!-- b736 -->Quadro 26 – Caso de uso de baixo nível Registrar Adoção

| Registrar Adoção |  |
|---|---|
| Caso de Uso Geral | Registrar Saída/Desfecho (extensão, quando o destino é Adotado) |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário registra os dados do adotante e da adoção do animal. |
| Pré-Condições | O Veterinário está registrando a saída de um animal com destino Adotado. |
| Pós-Condições | Adoção registrada e vinculada ao animal; animal com status Adotado e data de saída; evento registrado na auditoria. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário informa nome, CPF, telefone, e-mail, CEP, endereço e bairro do adotante e a data da adoção. |  |
|  | Valida os campos obrigatórios do adotante. |
| O Veterinário confirma o registro. |  |
|  | Grava a adoção, atualiza o status do animal para Adotado com a data de saída e registra o evento de auditoria. |
| Restrições/Validações | Os dados do adotante são dados pessoais e só são acessados pelos perfis autorizados (LGPD, RNF06). |
| Fluxo Alternativo I | Devolução: o Veterinário registra a data e o motivo da devolução; o animal volta a ficar disponível para adoção e a adoção anterior permanece no histórico. |
| Requisitos relacionados | RF-A05, RN06, RNF06 |

<!-- b738 -->Fonte: Elaborado pelos autores (2026).
<!-- b739 -->Quadro 27 – Caso de uso de baixo nível Transferir Animal de Baia

| Transferir Animal de Baia |  |
|---|---|
| Caso de Uso Geral | Gestão de Animais |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário move um animal de uma baia para outra. |
| Pré-Condições | O animal deve estar alojado e a baia de destino deve existir. |
| Pós-Condições | Animal vinculado à nova baia; ocupação das baias de origem e destino atualizadas. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário seleciona o animal e a opção de transferir baia. |  |
| O Veterinário escolhe a baia de destino e confirma. |  |
|  | Verifica vaga na baia de destino, atualiza o vínculo e a ocupação de ambas as baias. |
| Restrições/Validações | A baia de destino deve possuir vaga disponível. |
| Fluxo Alternativo I | Baia de destino lotada: o sistema alerta e solicita outra baia. |
| Requisitos relacionados | RF-A02 |

<!-- b741 -->Fonte: Elaborado pelos autores (2026).
<!-- b742 -->Quadro 28 – Caso de uso de baixo nível Consultar Animais por Baia

| Consultar Animais por Baia |  |
|---|---|
| Caso de Uso Geral | Gestão de Animais |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário visualiza e filtra os animais alojados, organizados por baia. |
| Pré-Condições | O ator deve estar autenticado com permissão de leitura no módulo. |
| Pós-Condições | Listagem de animais exibida conforme os filtros, com ocupação por baia. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário acessa a consulta por baia e define filtros (baia, espécie, status). |  |
|  | Consulta os animais conforme os filtros e calcula a ocupação atual versus a capacidade. |
|  | Exibe a listagem com indicação visual de status e a ocupação de cada baia (RF-A02). |
| Restrições/Validações | Baias disponíveis: BAIA 1–16 (internas), E1–E4 (externas) e CORREDOR. |
| Fluxo Alternativo I | Nenhum animal para o filtro: o sistema informa que não há resultados. |
| Requisitos relacionados | RF-A02 |

<!-- b744 -->Fonte: Elaborado pelos autores (2026).
<!-- b745 -->Quadro 29 – Caso de uso de baixo nível Registrar Aplicação de Vacina

| Registrar Aplicação de Vacina |  |
|---|---|
| Caso de Uso Geral | Histórico Veterinário |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário registra a aplicação de uma vacina em um animal e o sistema calcula a previsão de reforço. |
| Pré-Condições | O animal deve estar cadastrado e a vacina disponível. |
| Pós-Condições | Vacinação registrada; previsão de retorno calculada para o alerta vacinal. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário acessa o histórico do animal e seleciona registrar vacina. |  |
| O Veterinário informa a vacina, a data de aplicação, a dose, o lote e o número da dose. |  |
| O Veterinário confirma o registro. |  |
|  | Persiste a vacinação e calcula a previsão de retorno (data de aplicação + intervalo em meses). |
|  | Inclui o animal na lista de alertas vacinais quando o reforço estiver dentro de 7 dias (RF-A03). |
| Restrições/Validações | Registros do histórico são imutáveis (RN06, RNF10). A previsão de reforço baseia-se no intervalo da vacina. |
| Fluxo Alternativo I | Anexar comprovante: o Veterinário pode anexar um documento à vacinação registrada. |
| Requisitos relacionados | RF-A03, RF-A04, RN06 |

<!-- b747 -->Fonte: Elaborado pelos autores (2026).
<!-- b748 -->Quadro 30 – Caso de uso de baixo nível Prescrever Medicamento

| Prescrever Medicamento |  |
|---|---|
| Caso de Uso Geral | Histórico Veterinário |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário prescreve um medicamento a um animal, definindo dose, via e frequência. |
| Pré-Condições | O animal deve estar cadastrado e o medicamento disponível. |
| Pós-Condições | Prescrição registrada com status ativo no histórico do animal. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário acessa o histórico do animal e seleciona prescrever medicamento. |  |
| O Veterinário informa o medicamento, a dose, a via de administração, a frequência e as datas de início e fim previstas. |  |
| O Veterinário confirma a prescrição. |  |
|  | Persiste a prescrição com status ativo e registra o evento de auditoria. |
| Restrições/Validações | Registros do histórico são imutáveis (RN06). |
| Fluxo Alternativo I | Concluir, suspender ou cancelar: o Veterinário altera o status de uma prescrição ativa, mantendo o registro. |
| Requisitos relacionados | RF-A04, RN06 |

<!-- b750 -->Fonte: Elaborado pelos autores (2026).
<!-- b751 -->Quadro 31 – Caso de uso de baixo nível Registrar Procedimento Clínico

| Registrar Procedimento Clínico |  |
|---|---|
| Caso de Uso Geral | Histórico Veterinário |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário registra um procedimento realizado no animal. |
| Pré-Condições | O animal deve estar cadastrado. |
| Pós-Condições | Procedimento registrado no histórico do animal. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário acessa o histórico do animal e seleciona registrar procedimento. |  |
| O Veterinário informa o tipo de procedimento, a data, a descrição e o resultado. |  |
| O Veterinário confirma o registro. |  |
|  | Persiste o procedimento e registra o evento de auditoria. |
| Restrições/Validações | Registros do histórico são imutáveis (RN06). |
| Fluxo Alternativo I | Anexar documento: o Veterinário pode anexar arquivos ao procedimento registrado. |
| Requisitos relacionados | RF-A04, RN06 |

<!-- b753 -->Fonte: Elaborado pelos autores (2026).
<!-- b754 -->Quadro 32 – Caso de uso de baixo nível Registrar Exame

| Registrar Exame |  |
|---|---|
| Caso de Uso Geral | Histórico Veterinário |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário solicita e registra o resultado de um exame laboratorial do animal. |
| Pré-Condições | O animal deve estar cadastrado e o laboratório disponível. |
| Pós-Condições | Exame registrado com solicitação e, posteriormente, resultado no histórico do animal. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário acessa o histórico do animal e seleciona registrar exame. |  |
| O Veterinário informa o tipo de exame, o laboratório e a data de solicitação. |  |
| O Veterinário confirma a solicitação. |  |
|  | Persiste o exame com a solicitação e registra o evento de auditoria. |
| Posteriormente, o Veterinário registra o resultado e a data de resultado. |  |
|  | Atualiza o exame com o resultado informado. |
| Restrições/Validações | Registros do histórico são imutáveis (RN06). |
| Fluxo Alternativo I | Anexar laudo: o Veterinário pode anexar o laudo ao exame registrado. |
| Requisitos relacionados | RF-A04, RN06 |

<!-- b756 -->Fonte: Elaborado pelos autores (2026).
<!-- b757 -->Quadro 33 – Caso de uso de baixo nível Gerenciar Baias

| Gerenciar Baias |  |
|---|---|
| Caso de Uso Geral | Gestão de Animais do Canil |
| Ator Principal | Administrador |
| Atores Secundários |  |
| Resumo | O Administrador cadastra e edita as baias do canil, com tipo, capacidade e finalidade. |
| Pré-Condições | O Administrador está autenticado. |
| Pós-Condições | Baia criada ou atualizada; evento registrado na auditoria. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Administrador acessa a gestão de baias. |  |
|  | Lista as baias com tipo, capacidade, ocupação atual e indicação de superlotação. |
| O Administrador seleciona criar ou editar e informa nome, tipo, capacidade, finalidade e situação (ativa ou inativa). |  |
|  | Valida os dados, grava a baia e registra o evento de auditoria. |
| Restrições/Validações | Capacidade maior que zero. A ocupação não é digitada: é calculada pela contagem de animais alojados (RF-A02). |
| Fluxo Alternativo I | Capacidade informada menor que a ocupação atual: o sistema grava e exibe aviso de superlotação. |
| Requisitos relacionados | RF-A02, RN09, RNF10 |

<!-- b759 -->Fonte: Elaborado pelos autores (2026).
<!-- b760 -->Quadro 34 – Caso de uso de baixo nível Anexar Documento ao Animal

| Anexar Documento ao Animal |  |
|---|---|
| Caso de Uso Geral | Registrar Aplicação de Vacina, Registrar Procedimento Clínico e Registrar Exame (extensão) |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário anexa um arquivo (laudo, receita, imagem) ao registro clínico do animal. |
| Pré-Condições | O Veterinário está registrando uma vacinação, um procedimento ou um exame. |
| Pós-Condições | Arquivo armazenado e vinculado ao registro, com nome, endereço e tamanho. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário aciona “Anexar documento” e seleciona o arquivo. |  |
|  | Valida o tipo e o tamanho do arquivo. |
|  | Armazena o arquivo e o vincula ao registro clínico em andamento. |
| Restrições/Validações | O anexo não pode ser excluído depois de gravado (RN06). |
| Fluxo Alternativo I | Arquivo inválido ou acima do limite: o sistema informa o motivo e não anexa. |
| Requisitos relacionados | RF-A04, RN06 |

<!-- b762 -->Fonte: Elaborado pelos autores (2026).
<!-- b763 -->## A.3 MÓDULO 3 – OCORRÊNCIAS E DENÚNCIAS
<!-- b764 -->Quadro 35 – Caso de uso de baixo nível Registrar Nova Ocorrência

| Registrar Nova Ocorrência |  |
|---|---|
| Caso de Uso Geral | Gestão de Ocorrências |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário registra uma nova ocorrência ou denúncia, com geração automática de protocolo. |
| Pré-Condições | O ator deve estar autenticado com permissão de escrita no módulo de ocorrências. |
| Pós-Condições | Ocorrência persistida com protocolo anual, denunciante vinculado e movimentação inicial registrada. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário aciona a opção de criar ocorrência. |  |
|  | Gera o protocolo no formato 0000/AAAA e preenche a data de abertura com a data corrente (RN02). |
| O Agente Sanitário informa os dados do denunciante (nome, telefone, e-mail, CEP). |  |
|  | Busca o endereço pelo CEP em serviço externo e preenche os campos de endereço. |
| O Agente Sanitário informa o tipo, o bairro, a descrição e, se necessário, marca a ocorrência como sigilosa. |  |
| O Agente Sanitário confirma o registro. |  |
|  | Valida os dados, persiste a ocorrência com o denunciante e cria a movimentação inicial de ABERTURA. |
| Restrições/Validações | Protocolo sequencial e anual 0000/AAAA (RN02). Em ocorrências sigilosas, o denunciante fica oculto para não-Administradores (RN03). |
| Fluxo Alternativo I | Informar denunciado: ver o caso de uso Informar Denunciado. |
| Fluxo Alternativo II | CEP não localizado: o sistema informa a falha e o Agente Sanitário preenche o endereço manualmente. |
| Fluxo Alternativo III | Anexar documento: ver o caso de uso Anexar Documento à Ocorrência. |
| Requisitos relacionados | RF-E01, RN02, RN03 |

<!-- b766 -->Fonte: Elaborado pelos autores (2026).
<!-- b767 -->Quadro 36 – Caso de uso de baixo nível Informar Denunciado

| Informar Denunciado |  |
|---|---|
| Caso de Uso Geral | Registrar Nova Ocorrência (extensão, quando há denunciado) |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário registra os dados da pessoa apontada na denúncia. |
| Pré-Condições | O Agente Sanitário está registrando uma ocorrência e o denunciante identificou um denunciado. |
| Pós-Condições | Denunciado vinculado à ocorrência. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário marca a opção “Há denunciado”. |  |
|  | Exibe os campos do denunciado. |
| O Agente Sanitário informa nome, CPF, telefone, endereço e observações, conforme disponíveis. |  |
|  | Grava o denunciado junto com a ocorrência. |
| Restrições/Validações | Todos os campos são opcionais; o CPF só é registrado quando necessário (LGPD, princípio da necessidade). |
| Fluxo Alternativo I | O Agente Sanitário desmarca a opção antes de salvar: nenhum denunciado é gravado. |
| Requisitos relacionados | RF-E01, RNF06 |

<!-- b769 -->Fonte: Elaborado pelos autores (2026).
<!-- b770 -->Quadro 37 – Caso de uso de baixo nível Anexar Documento à Ocorrência

| Anexar Documento à Ocorrência |  |
|---|---|
| Caso de Uso Geral | Registrar Nova Ocorrência (extensão, quando há documento) |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário anexa fotos ou documentos que acompanham a denúncia. |
| Pré-Condições | O Agente Sanitário está registrando uma ocorrência. |
| Pós-Condições | Arquivo armazenado e vinculado à ocorrência. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário aciona “Anexar documento” e seleciona o arquivo. |  |
|  | Valida o tipo e o tamanho do arquivo. |
|  | Armazena o arquivo e o vincula à ocorrência. |
| Restrições/Validações | O anexo não pode ser excluído depois de gravado (RN06). |
| Fluxo Alternativo I | Arquivo inválido ou acima do limite: o sistema informa o motivo e não anexa. |
| Requisitos relacionados | RF-E01, RN06 |

<!-- b772 -->Fonte: Elaborado pelos autores (2026).
<!-- b773 -->Quadro 38 – Caso de uso de baixo nível Consultar e Filtrar Ocorrências

| Consultar e Filtrar Ocorrências |  |
|---|---|
| Caso de Uso Geral | Gestão de Ocorrências |
| Ator Principal | Agente Sanitário |
| Atores Secundários | Administrador |
| Resumo | O Agente Sanitário consulta ocorrências aplicando filtros; dados sigilosos do denunciante são restritos. |
| Pré-Condições | O ator deve estar autenticado com permissão de leitura no módulo. |
| Pós-Condições | Ocorrências exibidas conforme os filtros, respeitando o sigilo do denunciante. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário acessa a consulta de ocorrências e define filtros (protocolo, período, tipo, bairro, status). |  |
|  | Consulta as ocorrências conforme os filtros. |
|  | Exibe a listagem; em ocorrências sigilosas, oculta os dados do denunciante para perfis que não sejam Administrador (RN03). |
| Restrições/Validações | Os dados do denunciante em ocorrências sigilosas só são exibidos ao Administrador (RN03). |
| Fluxo Alternativo I | Acesso como Administrador: os dados do denunciante são exibidos mesmo em ocorrências sigilosas. |
| Fluxo Alternativo II | Nenhuma ocorrência encontrada: o sistema informa que não há resultados. |
| Requisitos relacionados | RF-E02, RN03 |

<!-- b775 -->Fonte: Elaborado pelos autores (2026).
<!-- b776 -->Quadro 39 – Caso de uso de baixo nível Encerrar Ocorrência

| Encerrar Ocorrência |  |
|---|---|
| Caso de Uso Geral | Gestão de Ocorrências |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário encerra uma ocorrência, registrando a providência tomada. |
| Pré-Condições | A ocorrência deve estar aberta ou em atendimento e o ator ter permissão para encerrá-la. |
| Pós-Condições | Ocorrência encerrada com descrição e providência; registro torna-se imutável. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário abre a ocorrência e seleciona encerrar. |  |
| O Agente Sanitário informa a descrição de encerramento e a providência tomada. |  |
| O Agente Sanitário confirma o encerramento. |  |
|  | Atualiza o status para encerrada, registra a data de encerramento e a movimentação de ENCERRAMENTO. |
| Restrições/Validações | Somente Agente Sanitário ou Administrador podem encerrar. Após o encerramento, o registro é imutável (RN06). Ocorrência com processo sanitário vinculado só pode ser encerrada após o registro do resultado desse processo (RN05). |
| Fluxo Alternativo I | Providência não informada: o sistema impede o encerramento até que a providência seja selecionada. |
| Fluxo Alternativo II | Processo vinculado sem resultado: o sistema impede o encerramento e informa o protocolo do processo pendente (RN05). |
| Requisitos relacionados | RF-E03, RN05, RN06 |

<!-- b778 -->Fonte: Elaborado pelos autores (2026).
<!-- b779 -->## A.4 MÓDULO 4 – PROCESSOS SANITÁRIOS
<!-- b780 -->Quadro 40 – Caso de uso de baixo nível Abrir Processo Sanitário

| Abrir Processo Sanitário |  |
|---|---|
| Caso de Uso Geral | Gestão de Processos |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário abre um processo sanitário para investigação de zoonose, com geração de protocolo e registro do animal amostrado. |
| Pré-Condições | O ator deve estar autenticado com permissão de escrita no módulo de processos. |
| Pós-Condições | Processo persistido com protocolo anual, responsável e animal amostrado vinculados. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário aciona a opção de abrir processo sanitário. |  |
|  | Gera o protocolo no formato 0000/AAAA e preenche a data de abertura (RN02). |
| O Agente Sanitário informa a doença, o laboratório, o responsável e os números GAL (Gerenciador de Ambiente Laboratorial) e SINAN (Sistema de Informação de Agravos de Notificação), quando houver, e, opcionalmente, a ocorrência de origem, que não poderá ser alterada depois. |  |
| O Agente Sanitário registra os dados do animal amostrado (Registrar Animal Amostrado). |  |
| O Agente Sanitário confirma a abertura. |  |
|  | Valida os campos obrigatórios (RN08), persiste o processo com status ABERTO e o animal amostrado. |
|  | Caso o contato humano seja verdadeiro, marca o processo como urgente e o fixa no topo das listagens (RN04, RF-B05). |
| Restrições/Validações | Protocolo sequencial e anual (RN02). Obrigatórios: data de abertura, doença, laboratório e dados mínimos do responsável (RN08). |
| Fluxo Alternativo I | Contato humano-animal: o sistema torna o processo urgente e bloqueia o encerramento sem resultado (RN04, RF-B05). |
| Requisitos relacionados | RF-B01, RN02, RN04, RN08 |

<!-- b782 -->Fonte: Elaborado pelos autores (2026).
<!-- b783 -->Quadro 41 – Caso de uso de baixo nível Registrar Animal Amostrado

| Registrar Animal Amostrado |  |
|---|---|
| Caso de Uso Geral | Gestão de Processos |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário registra os dados do animal investigado e da amostra coletada dentro de um processo. |
| Pré-Condições | Deve existir um processo sanitário em aberto. |
| Pós-Condições | Animal amostrado vinculado ao processo, com material biológico e indicadores de contato registrados. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário informa as características do animal (espécie, sexo, raça, coloração, pelagem, peso, estado clínico, tipo de abrigo e sintomas). |  |
| O Agente Sanitário informa o material biológico, o tipo de amostra e a data de coleta. |  |
| O Agente Sanitário informa o contato com humano, o nível de contato e se houve agressão. |  |
| O Agente Sanitário confirma o registro. |  |
|  | Persiste o animal amostrado vinculado ao processo. |
|  | Avalia o indicador de contato humano e, se verdadeiro, sinaliza a urgência do processo (RN04). |
| Restrições/Validações | O indicador de contato humano verdadeiro aciona a urgência do processo (RN04, RF-B05). |
| Fluxo Alternativo I | Animal interno: quando o investigado for um animal do canil, o registro pode referenciar o cadastro existente. |
| Requisitos relacionados | RF-B04, RN04 |

<!-- b785 -->Fonte: Elaborado pelos autores (2026).
<!-- b786 -->Quadro 42 – Caso de uso de baixo nível Registrar Resultado Laboratorial

| Registrar Resultado Laboratorial |  |
|---|---|
| Caso de Uso Geral | Gestão de Processos |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário registra o resultado da análise laboratorial e o desfecho do processo. |
| Pré-Condições | O processo deve estar em andamento ou aguardando resultado (não pode estar com status ABERTO). |
| Pós-Condições | Resultado e desfecho registrados; em caso positivo ou inconclusivo, o responsável e a Vigilância Epidemiológica são notificados por e-mail. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário abre o processo e seleciona registrar resultado. |  |
| O Agente Sanitário informa o resultado (Negativo, Positivo, Material Inadequado, Inconclusivo, Não Realizado ou Aguardando) e a data. |  |
| O Agente Sanitário confirma o registro. |  |
|  | Valida que o status permite o resultado (RN12) e persiste o resultado e o desfecho. |
|  | Caso o resultado seja Positivo ou Inconclusivo, envia e-mail ao responsável, quando houver e-mail cadastrado, e à Vigilância Epidemiológica, e registra o envio (RN10). |
| Restrições/Validações | O resultado não pode ser preenchido com status ABERTO (RN12). Resultado Positivo ou Inconclusivo dispara notificação (RN10). |
| Fluxo Alternativo I | Sem e-mail do responsável: o sistema registra o resultado, e notifica apenas a Vigilância Epidemiológica. |
| Requisitos relacionados | RF-B03, RN10, RN12 |

<!-- b788 -->Fonte: Elaborado pelos autores (2026).
<!-- b789 -->Quadro 43 – Caso de uso de baixo nível Consultar e Filtrar Processos

| Consultar e Filtrar Processos |  |
|---|---|
| Caso de Uso Geral | Gestão de Processos |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário consulta processos sanitários aplicando filtros, com os urgentes fixados no topo. |
| Pré-Condições | O ator deve estar autenticado com permissão de leitura no módulo. |
| Pós-Condições | Processos exibidos conforme os filtros, com urgentes priorizados. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário acessa a consulta e define filtros (protocolo, período, doença, responsável, bairro, status). |  |
|  | Consulta os processos conforme os filtros. |
|  | Exibe a listagem com os processos urgentes fixados no topo (RN04). |
| Restrições/Validações | Processos urgentes são fixados no topo das listagens (RN04). |
| Fluxo Alternativo I | Nenhum processo encontrado: o sistema informa que não há resultados. |
| Requisitos relacionados | RF-B02, RN04 |

<!-- b791 -->Fonte: Elaborado pelos autores (2026).
<!-- b792 -->Quadro 44 – Caso de uso de baixo nível Encerrar Processo

| Encerrar Processo |  |
|---|---|
| Caso de Uso Geral | Gestão de Processos |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário encerra um processo sanitário após a conclusão da investigação. |
| Pré-Condições | O processo deve possuir resultado registrado quando houver contato humano (RF-B05). |
| Pós-Condições | Processo concluído; registro torna-se imutável. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário abre o processo e seleciona encerrar. |  |
|  | Verifica se o processo possui resultado quando o contato humano for verdadeiro (RF-B05). |
| O Agente Sanitário confirma o encerramento. |  |
|  | Atualiza o status para CONCLUIDO e registra o evento de auditoria. |
| Restrições/Validações | Processos com contato humano não podem ser encerrados sem resultado (RF-B05). Registro imutável (RN06). |
| Fluxo Alternativo I | Resultado ausente em processo urgente: o sistema bloqueia o encerramento e solicita o registro do resultado. |
| Requisitos relacionados | RF-B05, RN06, RN12 |

<!-- b794 -->Fonte: Elaborado pelos autores (2026).
<!-- b795 -->Quadro 45 – Caso de uso de baixo nível Gerar Documento do Processo

| Gerar Documento do Processo |  |
|---|---|
| Caso de Uso Geral | Gestão de Processos |
| Ator Principal | Agente Sanitário |
| Atores Secundários |  |
| Resumo | O Agente Sanitário gera o documento em PDF de um processo sanitário. |
| Pré-Condições | O processo deve estar cadastrado. |
| Pós-Condições | Documento gerado e disponibilizado para download. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Agente Sanitário abre o processo e solicita a geração do documento. |  |
|  | Cria o documento com estado Pendente e processa a geração de forma assíncrona (RN11). |
|  | Ao concluir, disponibiliza o documento por URL para download. |
| Restrições/Validações | A geração segue os estados Pendente → Em Processamento → Concluído/Falha (RN11). |
| Fluxo Alternativo I | Falha na geração: o sistema marca o documento como Falha e permite nova tentativa. |
| Requisitos relacionados | RF-B06, RN11 |

<!-- b797 -->Fonte: Elaborado pelos autores (2026).
<!-- b798 -->## A.5 MÓDULO 5 – DASHBOARD E RELATÓRIOS
<!-- b799 -->Quadro 46 – Caso de uso de baixo nível Visualizar Dashboard em Tempo Real

| Visualizar Dashboard em Tempo Real |  |
|---|---|
| Caso de Uso Geral | Dashboard |
| Ator Principal | Veterinário ou Agente Sanitário |
| Atores Secundários |  |
| Resumo | O usuário visualiza indicadores operacionais consolidados em tempo real. |
| Pré-Condições | O ator deve estar autenticado com permissão de acesso ao dashboard. |
| Pós-Condições | Indicadores exibidos com dados atualizados do banco. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário acessa o dashboard. |  |
|  | Consulta em tempo real os totais por status de animal, a ocupação das baias e os alertas vacinais de 7 dias. |
|  | Consulta os processos aguardando resultado, os processos urgentes e o resumo mensal por doença. |
|  | Exibe os indicadores e gráficos consolidados (RF-D01). |
| Restrições/Validações | O dashboard é alimentado por consultas em tempo real e não gera entidade persistida. |
| Fluxo Alternativo I | Consultar alertas vacinais: o usuário detalha os animais com reforço previsto para os próximos 7 dias (RF-A03), conforme o caso de uso Consultar Alertas Vacinais. |
| Fluxo Alternativo II | Monitorar ocupação de baias: o usuário detalha a ocupação atual versus a capacidade de cada baia, conforme o caso de uso Monitorar Ocupação de Baias. |
| Requisitos relacionados | RF-D01 |

<!-- b801 -->Fonte: Elaborado pelos autores (2026).
<!-- b802 -->Quadro 47 – Caso de uso de baixo nível Consultar Alertas Vacinais

| Consultar Alertas Vacinais |  |
|---|---|
| Caso de Uso Geral | Visualizar Dashboard em Tempo Real (extensão) |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário consulta os animais com reforço vacinal próximo ou vencido. |
| Pré-Condições | O Veterinário está no painel inicial. |
| Pós-Condições | Lista de alertas exibida; nenhum dado é alterado. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário aciona o alerta de vacinas no painel. |  |
|  | Lista as vacinações com validade nos próximos 7 dias e as já vencidas, com animal, vacina, dias restantes e severidade. |
| O Veterinário seleciona um animal da lista. |  |
|  | Abre a ficha do animal na aba de vacinas. |
| Restrições/Validações | Janela de 7 dias (RF-A03); vacinas vencidas aparecem com severidade maior. |
| Fluxo Alternativo I | Nenhuma vacina a vencer: o sistema informa que não há alertas. |
| Requisitos relacionados | RF-A03, RF-D01 |

<!-- b804 -->Fonte: Elaborado pelos autores (2026).
<!-- b805 -->Quadro 48 – Caso de uso de baixo nível Monitorar Ocupação de Baias

| Monitorar Ocupação de Baias |  |
|---|---|
| Caso de Uso Geral | Visualizar Dashboard em Tempo Real (extensão) |
| Ator Principal | Veterinário |
| Atores Secundários |  |
| Resumo | O Veterinário acompanha a ocupação de cada baia em relação à capacidade. |
| Pré-Condições | O Veterinário está no painel inicial. |
| Pós-Condições | Ocupação exibida; nenhum dado é alterado. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O Veterinário aciona o indicador de ocupação no painel. |  |
|  | Exibe, por baia, a ocupação calculada, a capacidade e a situação (normal, próxima do limite ou superlotada). |
| O Veterinário seleciona uma baia. |  |
|  | Lista os animais alojados nela. |
| Restrições/Validações | A ocupação conta apenas animais alojados (exclui adotados, transferidos e óbitos). |
| Fluxo Alternativo I | Baia sem animais: o sistema exibe ocupação zero. |
| Requisitos relacionados | RF-A02, RF-D01 |

<!-- b807 -->Fonte: Elaborado pelos autores (2026).
<!-- b808 -->Quadro 49 – Caso de uso de baixo nível Solicitar Geração de Relatório

| Solicitar Geração de Relatório |  |
|---|---|
| Caso de Uso Geral | Relatórios |
| Ator Principal | Veterinário ou Agente Sanitário |
| Atores Secundários |  |
| Resumo | O usuário solicita a geração de um relatório, processado de forma assíncrona. |
| Pré-Condições | O ator deve estar autenticado com permissão para gerar relatórios. |
| Pós-Condições | Solicitação registrada com status Pendente e processada em segundo plano. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário seleciona o tipo de relatório (ocorrências por bairro, ocupação de baias, procedimentos, adoções, anual de processos ou vacinação) e informa o período e os parâmetros. |  |
| O usuário confirma a solicitação. |  |
|  | Cria o registro do relatório com status Pendente e inicia o processamento assíncrono (RN11). |
|  | Ao concluir, atualiza o status para Concluído e disponibiliza o arquivo por URL com expiração. |
| Restrições/Validações | A geração segue os estados Pendente → Em Processamento → Concluído/Falha (RN11). O binário não é armazenado no banco. |
| Fluxo Alternativo I | Falha no processamento: o sistema marca o relatório como Falha e permite nova solicitação. |
| Requisitos relacionados | RF-D02, RF-B07, RN11 |

<!-- b810 -->Fonte: Elaborado pelos autores (2026).
<!-- b811 -->Quadro 50 – Caso de uso de baixo nível Acompanhar Status do Relatório

| Acompanhar Status do Relatório |  |
|---|---|
| Caso de Uso Geral | Relatórios |
| Ator Principal | Veterinário ou Agente Sanitário |
| Atores Secundários |  |
| Resumo | O usuário acompanha o andamento da geração de um relatório solicitado. |
| Pré-Condições | Deve existir ao menos um relatório solicitado pelo usuário. |
| Pós-Condições | Status atual do relatório exibido ao usuário. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário acessa a lista de relatórios solicitados. |  |
|  | Exibe cada relatório com seu status atual (Pendente, Em Processamento, Concluído ou Falha). |
| Restrições/Validações | O status reflete o ciclo de vida assíncrono do relatório (RN11). |
| Fluxo Alternativo I | Relatório concluído: o sistema habilita a opção de download (Baixar Relatório Gerado). |
| Requisitos relacionados | RF-D02, RN11 |

<!-- b813 -->Fonte: Elaborado pelos autores (2026).
<!-- b814 -->Quadro 51 – Caso de uso de baixo nível Baixar Relatório Gerado

| Baixar Relatório Gerado |  |
|---|---|
| Caso de Uso Geral | Relatórios |
| Ator Principal | Veterinário ou Agente Sanitário |
| Atores Secundários |  |
| Resumo | O usuário baixa o arquivo de um relatório concluído. |
| Pré-Condições | O relatório deve estar com status Concluído e a URL não expirada. |
| Pós-Condições | Arquivo do relatório transferido ao usuário. |
| Fluxo Principal |  |
| Ações do Ator | Ações do Sistema |
| O usuário seleciona um relatório concluído e aciona o download. |  |
|  | Verifica se o relatório está concluído e se a URL não expirou. |
|  | Disponibiliza o arquivo para download. |
| Restrições/Validações | O download só é permitido com status Concluído e dentro da validade da URL (RN11). |
| Fluxo Alternativo I | URL expirada: o sistema informa a expiração e orienta a solicitar uma nova geração. |
| Requisitos relacionados | RF-D02, RN11 |

<!-- b816 -->Fonte: Elaborado pelos autores (2026).
<!-- b818 --># APÊNDICE B – DICIONÁRIO DE DADOS
<!-- b819 -->Este apêndice apresenta o dicionário de dados do SISZOO, organizado por módulo, na mesma ordem dos diagramas lógicos da Seção 4.3. As convenções adotadas estão descritas na Seção 4.4.
<!-- b820 -->## B.1 MÓDULO 1 – USUÁRIOS E ACESSO
<!-- b821 -->Quadro 52 – Dicionário de dados – tabela Usuario

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do usuário. |
| email | varchar(255) | UQ | E-mail de login, único no sistema. |
| senha | varchar(255) |  | Hash da senha (bcrypt). |
| nome | varchar(100) |  | Primeiro nome do usuário. |
| sobrenome | varchar(100) |  | Sobrenome do usuário. |
| crmv | varchar(20) |  | Registro profissional do veterinário, quando aplicável. |
| telefone | varchar(20) |  | Telefone de contato. |
| ativo | boolean |  | Indica se a conta está ativa. |
| ultimo_acesso | timestamp |  | Data e hora do último acesso. |
| criado_em | timestamp |  | Data e hora de criação do registro. |
| senha_alterada_em | timestamp |  | Data e hora da última alteração de senha. |
| desativado_em | timestamp |  | Data e hora da desativação da conta. |
| data_modificacao | timestamp |  | Data e hora da última modificação do registro. |

<!-- b823 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b824 -->Quadro 53 – Dicionário de dados – tabela Cargo

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do cargo. |
| nome | varchar(100) |  | Nome do cargo (ex.: Administrador, Veterinário). |
| descricao | text |  | Descrição das atribuições do cargo. |

<!-- b826 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b827 -->Quadro 54 – Dicionário de dados – tabela UsuarioCargo

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| usuario_id | uuid | PK,FK | Usuário vinculado (Usuario). |
| cargo_id | uuid | PK,FK | Cargo atribuído (Cargo). |
| adicionado_em | timestamp |  | Data e hora da atribuição do cargo. |

<!-- b829 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b830 -->Quadro 55 – Dicionário de dados – tabela CargoPermissao

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da permissão. |
| cargo_id | uuid | FK | Cargo ao qual a permissão pertence (Cargo). |
| modulo | Modulo |  | Módulo funcional alvo da permissão. |
| feature | varchar(100) |  | Funcionalidade específica controlada. |
| leitura | boolean |  | Permite consultar a funcionalidade. |
| escrita | boolean |  | Permite criar ou editar registros. |
| exclusao | boolean |  | Permite excluir/desativar registros. |

<!-- b832 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b833 -->Quadro 56 – Dicionário de dados – tabela PreferenciaUsuario

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único das preferências. |
| usuario_id | uuid | FK,UQ | Usuário dono das preferências (Usuario). |
| tema | TemaUsuario |  | Tema visual da interface (claro/escuro). |
| densidade | DensidadeUsuario |  | Densidade de exibição da interface. |
| notif_alertas_criticos | boolean |  | Indica se o usuário recebe, no sistema, alertas de situações que exigem ação imediata, como processo sanitário com contato humano-animal sinalizado como urgente (RF-D01). |
| notif_vacina_vencendo | boolean |  | Indica se o usuário recebe, no sistema, avisos de reforço vacinal a vencer nos próximos 7 dias (RF-A03). |
| notif_superlotacao | boolean |  | Indica se o usuário recebe, no sistema, avisos de baias com ocupação igual ou superior à capacidade (RF-A02). |
| notif_resultado_lab | boolean |  | Indica se o usuário recebe, no sistema, aviso quando um resultado laboratorial é registrado em processo sanitário. É independente da notificação por e-mail ao responsável e à Vigilância Epidemiológica (RN10), que é obrigatória. |
| notif_email_diario | boolean |  | Indica se o usuário recebe por e-mail um resumo diário com os alertas pendentes: vacinas a vencer, baias superlotadas e processos urgentes. |

<!-- b835 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b836 -->Quadro 57 – Dicionário de dados – tabela AuditoriaEvento

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do evento de auditoria. |
| usuario_id | uuid | FK | Usuário que executou a ação (Usuario). |
| acao | AcaoAuditoria |  | Tipo de ação registrada (criação, login etc.). |
| entidade | varchar(100) |  | Entidade afetada pela ação. |
| payload_antes | jsonb |  | Estado do registro antes da alteração. |
| payload_depois | jsonb |  | Estado do registro após a alteração. |
| ip | varchar(45) |  | Endereço IP de origem da ação. |
| ocorreu_em | timestamp |  | Data e hora da ocorrência do evento. |

<!-- b838 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b839 -->## B.2 MÓDULO 2 – GESTÃO DE ANIMAIS DO CANIL
<!-- b840 -->Quadro 58 – Dicionário de dados – tabela MotivoEntrada

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do motivo de entrada. |
| nome | varchar(100) |  | Descrição do motivo (resgate, denúncia etc.). |
| ativo | boolean |  | Indica se o motivo está disponível para uso. |

<!-- b842 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b843 -->Quadro 59 – Dicionário de dados – tabela TipoBaia

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do tipo de baia. |
| nome | varchar(100) |  | Nome do tipo (interna, externa, corredor). |
| ativo | boolean |  | Indica se o tipo está disponível para uso. |

<!-- b845 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b846 -->Quadro 60 – Dicionário de dados – tabela Baia

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da baia. |
| nome | varchar(100) |  | Identificação da baia (BAIA 1–16, E1–E4, CORREDOR). |
| capacidade | integer |  | Número máximo de animais comportados. |
| finalidade | varchar(100) |  | Finalidade de uso da baia. |
| ativa | boolean |  | Indica se a baia está em uso. |
| observacoes | text |  | Observações gerais sobre a baia. |
| tipo_baia_id | uuid | FK | Tipo da baia (TipoBaia). |

<!-- b848 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b849 -->Quadro 61 – Dicionário de dados – tabela Sintoma

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do sintoma. |
| codigo | varchar(100) |  | Código padronizado do sintoma. |
| nome | varchar(100) |  | Nome do sintoma clínico. |
| ativo | boolean |  | Indica se o sintoma está disponível para uso. |

<!-- b851 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b852 -->Quadro 62 – Dicionário de dados – tabela Vacina

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da vacina. |
| codigo | varchar(100) | UQ | Código identificador da vacina. |
| nome | varchar(100) |  | Nome comercial ou técnico da vacina. |
| intervalo_meses | integer |  | Intervalo em meses para o reforço (base do alerta RF-A03). |
| ativo | boolean |  | Indica se a vacina está disponível para uso. |

<!-- b854 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b855 -->Quadro 63 – Dicionário de dados – tabela VacinaEspecie

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| vacina_id | uuid | PK,FK | Vacina associada (Vacina). |
| especie | Especie | PK | Espécie à qual a vacina se aplica. |

<!-- b857 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b858 -->Quadro 64 – Dicionário de dados – tabela TipoProcedimento

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do tipo de procedimento. |
| nome | varchar(100) |  | Nome do tipo de procedimento. |
| ativo | boolean |  | Indica se o tipo está disponível para uso. |

<!-- b860 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b861 -->Quadro 65 – Dicionário de dados – tabela CategoriaFarmacologica

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da categoria. |
| nome | varchar(100) | UQ | Nome da categoria farmacológica. |
| ativo | boolean |  | Indica se a categoria está disponível para uso. |

<!-- b863 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b864 -->Quadro 66 – Dicionário de dados – tabela Laboratorio

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do laboratório. |
| nome | varchar(150) |  | Nome do laboratório de destino das amostras. |
| tipo | varchar(50) |  | Tipo/natureza do laboratório. |
| contato | varchar(200) |  | Dados de contato do laboratório. |
| ativo | boolean |  | Indica se o laboratório está disponível para uso. |

<!-- b866 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b867 -->Quadro 67 – Dicionário de dados – tabela Animal

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do animal. |
| numero_medalha | varchar(50) | UQ | Número da medalha de identificação. |
| data_implantacao_chip | date |  | Data de implantação do microchip. |
| numero_microchip | varchar(50) | UQ | Identificador único do animal quando informado; registrado na implantação do chip (RN01). |
| peso_kg | decimal(5,2) |  | Peso do animal em quilogramas. |
| data_nascimento_aprox | date |  | Data de nascimento aproximada. |
| nome | varchar(100) |  | Nome do animal. |
| foto_url | varchar(500) |  | URL da foto do animal. |
| coloracao | varchar(100) |  | Coloração da pelagem. |
| pelagem | varchar(100) |  | Tipo de pelagem do animal. |
| esterilizado | boolean |  | Indica se o animal foi esterilizado. |
| data_esterilizacao | date |  | Data da esterilização. |
| idade_aprox | varchar(50) |  | Idade aproximada registrada. |
| raca | varchar(100) |  | Raça do animal. |
| sexo | Sexo |  | Sexo do animal. |
| porte | Porte |  | Porte do animal (P/M/G). |
| especie | Especie |  | Espécie do animal (canino, felino, quiróptero ou primata não humano). |
| observacoes | text |  | Observações e condições especiais. |
| procedencia | varchar(200) |  | Procedência/origem do animal. |
| data_entrada | date |  | Data de entrada no canil. |
| data_saida | date |  | Data de saída do canil, registrada com o destino (RF-A05). |
| status_animal | StatusAnimal |  | Situação atual do animal. |
| motivo_entrada_id | uuid | FK | Motivo da entrada (MotivoEntrada). |
| baia_id | uuid | FK | Baia onde está alojado (Baia). |
| cadastrado_por | uuid | FK | Usuário que cadastrou (Usuario). |
| criado_em | timestamp |  | Data e hora de criação do registro. |
| atualizado_em | timestamp |  | Data e hora da última atualização. |

<!-- b869 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b870 -->Quadro 68 – Dicionário de dados – tabela AnimalSintoma

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| animal_id | uuid | PK,FK | Animal associado (Animal). |
| sintoma_id | uuid | PK,FK | Sintoma apresentado (Sintoma). |

<!-- b872 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b873 -->Quadro 69 – Dicionário de dados – tabela AnexoAnimal

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do anexo. |
| animal_id | uuid | FK | Animal ao qual o anexo pertence (Animal). |
| nome | varchar(255) |  | Nome do arquivo anexado. |
| url | varchar(500) |  | URL de armazenamento do arquivo. |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |
| criado_em | timestamp |  | Data e hora do upload. |

<!-- b875 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b876 -->Quadro 70 – Dicionário de dados – tabela Vacinacao

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da aplicação de vacina. |
| animal_id | uuid | FK | Animal vacinado (Animal). |
| vacina_id | uuid | FK | Vacina aplicada (Vacina). |
| aplicado_por | uuid | FK | Usuário que aplicou (Usuario). |
| data_aplicacao | date |  | Data da aplicação. |
| data_validade | date |  | Data de validade da dose; base do alerta de reforço (RF-A03). |
| numero_dose | integer |  | Número da dose aplicada. |
| dose_quantidade | decimal(8,3) |  | Quantidade da dose. |
| dose_unidade | UnidadeDose |  | Unidade de medida da dose. |
| lote | varchar(100) |  | Lote da vacina aplicada. |
| observacoes | text |  | Observações da aplicação. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b878 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b879 -->Quadro 71 – Dicionário de dados – tabela AnexoVacinacao

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do anexo. |
| vacinacao_id | uuid | FK | Vacinação associada (Vacinacao). |
| nome | varchar(255) |  | Nome do arquivo anexado. |
| url | varchar(500) |  | URL de armazenamento do arquivo. |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |
| criado_em | timestamp |  | Data e hora do upload. |

<!-- b881 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b882 -->Quadro 72 – Dicionário de dados – tabela Procedimento

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do procedimento. |
| animal_id | uuid | FK | Animal submetido ao procedimento (Animal). |
| tipo_procedimento_id | uuid | FK | Tipo do procedimento (TipoProcedimento). |
| executado_por | uuid | FK | Usuário que executou (Usuario). |
| data | date |  | Data de realização. |
| descricao | text |  | Descrição do procedimento. |
| resultado | text |  | Resultado obtido. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b884 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b885 -->Quadro 73 – Dicionário de dados – tabela AnexoProcedimento

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do anexo. |
| procedimento_id | uuid | FK | Procedimento associado (Procedimento). |
| nome | varchar(255) |  | Nome do arquivo anexado. |
| url | varchar(500) |  | URL de armazenamento do arquivo. |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |
| criado_em | timestamp |  | Data e hora do upload. |

<!-- b887 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b888 -->Quadro 74 – Dicionário de dados – tabela Medicamento

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do medicamento. |
| nome | varchar(100) |  | Nome do medicamento. |
| categoria_id | uuid | FK | Categoria farmacológica (CategoriaFarmacologica). |
| ativo | boolean |  | Indica se o medicamento está disponível para uso. |

<!-- b890 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b891 -->Quadro 75 – Dicionário de dados – tabela Prescricao

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da prescrição. |
| animal_id | uuid | FK | Animal medicado (Animal). |
| prescrito_por | uuid | FK | Usuário que prescreveu (Usuario). |
| medicamento_id | uuid | FK | Medicamento prescrito (Medicamento). |
| data_inicio | date |  | Data de início do tratamento. |
| data_fim_prevista | date |  | Data prevista de término. |
| data_fim_real | date |  | Data real de término. |
| frequencia_aplicada | integer |  | Frequência de aplicação. |
| unidade_frequencia | UnidadeFrequencia |  | Unidade da frequência (horas/dias). |
| dose_quantidade | decimal(8,3) |  | Quantidade da dose. |
| dose_unidade | UnidadeDose |  | Unidade de medida da dose. |
| via_administracao | ViaAdministracao |  | Via de administração do medicamento. |
| status | StatusPrescricao |  | Situação atual do tratamento. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b893 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b894 -->Quadro 76 – Dicionário de dados – tabela TipoExame

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do tipo de exame. |
| nome | varchar(100) | UQ | Nome do tipo de exame. |
| ativo | boolean |  | Indica se o tipo está disponível para uso. |

<!-- b896 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b897 -->Quadro 77 – Dicionário de dados – tabela Exame

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do exame. |
| animal_id | uuid | FK | Animal examinado (Animal). |
| laboratorio_id | uuid | FK | Laboratório responsável (Laboratorio). |
| tipo_exame_id | uuid | FK | Tipo do exame (TipoExame). |
| data_solicitacao | date |  | Data de solicitação do exame. |
| data_resultado | date |  | Data de recebimento do resultado. |
| resultado | text |  | Resultado do exame. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b899 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b900 -->Quadro 78 – Dicionário de dados – tabela AnexoExame

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do anexo. |
| exame_id | uuid | FK | Exame associado (Exame). |
| nome | varchar(255) |  | Nome do arquivo anexado. |
| url | varchar(500) |  | URL de armazenamento do arquivo. |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |
| criado_em | timestamp |  | Data e hora do upload. |

<!-- b902 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b903 -->Quadro 79 – Dicionário de dados – tabela Adocao

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da adoção. |
| animal_id | uuid | FK | Animal adotado (Animal). |
| registrado_por | uuid | FK | Usuário que registrou a adoção (Usuario). |
| adotante_nome | varchar(150) |  | Nome do adotante. |
| adotante_cpf | varchar(14) |  | CPF do adotante. |
| adotante_telefone | varchar(20) |  | Telefone do adotante. |
| adotante_email | varchar(150) |  | E-mail do adotante, quando houver. |
| adotante_cep | varchar(10) |  | CEP do adotante. |
| adotante_endereco | varchar(255) |  | Endereço do adotante. |
| adotante_bairro | varchar(80) |  | Bairro do adotante. |
| data_adocao | date |  | Data da adoção. |
| data_devolucao | date |  | Data da devolução, quando houver. |
| motivo_devolucao | text |  | Motivo da devolução, quando houver. |
| observacoes | text |  | Observações da adoção. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b905 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b906 -->## B.3 MÓDULO 3 – OCORRÊNCIAS E DENÚNCIAS
<!-- b907 -->Quadro 80 – Dicionário de dados – tabela TipoOcorrencia

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do tipo de ocorrência. |
| nome | varchar(100) |  | Nome do tipo de ocorrência. |
| ativo | boolean |  | Indica se o tipo está disponível para uso. |

<!-- b909 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b910 -->Quadro 81 – Dicionário de dados – tabela ProvidenciaTomada

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da providência. |
| nome | varchar(100) |  | Descrição da providência tomada. |
| ativo | boolean |  | Indica se a providência está disponível para uso. |

<!-- b912 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b913 -->Quadro 82 – Dicionário de dados – tabela Denunciante

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do denunciante. |
| nome | varchar(200) |  | Nome do denunciante. |
| cpf | varchar(14) |  | CPF do denunciante. |
| telefone | varchar(20) |  | Telefone de contato. |
| email | varchar(255) |  | E-mail de contato. |
| cep | varchar(10) |  | CEP do endereço residencial. |
| endereco | varchar(300) |  | Endereço residencial. |
| bairro_residencial | varchar(100) |  | Bairro de residência. |

<!-- b915 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b916 -->Quadro 83 – Dicionário de dados – tabela Denunciado

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do denunciado. |
| nome | varchar(200) |  | Nome do denunciado. |
| cpf | varchar(14) |  | CPF do denunciado. |
| telefone | varchar(20) |  | Telefone de contato. |
| endereco | varchar(300) |  | Endereço do denunciado. |
| observacoes | text |  | Observações sobre o denunciado. |

<!-- b918 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b919 -->Quadro 84 – Dicionário de dados – tabela Ocorrencia

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da ocorrência. |
| protocolo | varchar(50) | UQ | Protocolo sequencial anual 0000/AAAA (RN02). |
| registrado_por | uuid | FK | Usuário que registrou (Usuario). |
| tipo_ocorrencia_id | uuid | FK | Tipo da ocorrência (TipoOcorrencia). |
| status_ocorrencia | StatusOcorrencia |  | Situação atual da ocorrência. |
| providencia_tomada_id | uuid | FK | Providência no encerramento (ProvidenciaTomada). |
| denunciante_id | uuid | FK | Denunciante vinculado (Denunciante). |
| denunciado_id | uuid | FK | Denunciado vinculado, quando houver (Denunciado). |
| data_abertura | date |  | Data de abertura da ocorrência. |
| hora_abertura | time |  | Hora de abertura. |
| bairro | varchar(100) |  | Bairro da ocorrência. |
| ponto_referencia | varchar(200) |  | Ponto de referência do local. |
| descricao | text |  | Descrição da ocorrência. |
| urgente | boolean |  | Indica prioridade de atendimento. |
| sigilosa | boolean |  | Oculta dados do denunciante para não-Administradores (RN03). |
| descricao_encerramento | text |  | Descrição registrada no encerramento. |
| encerrada_em | timestamp |  | Data e hora de encerramento. |
| criado_em | timestamp |  | Data e hora de criação do registro. |
| atualizado_em | timestamp |  | Data e hora da última atualização. |

<!-- b921 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b922 -->Quadro 85 – Dicionário de dados – tabela AnexoOcorrencia

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do anexo. |
| ocorrencia_id | uuid | FK | Ocorrência associada (Ocorrencia). |
| nome | varchar(255) |  | Nome do arquivo anexado. |
| url | varchar(500) |  | URL de armazenamento do arquivo. |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |
| criado_em | timestamp |  | Data e hora do upload. |

<!-- b924 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b925 -->Quadro 86 – Dicionário de dados – tabela MovimentacaoOcorrencia

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da movimentação. |
| ocorrencia_id | uuid | FK | Ocorrência associada (Ocorrencia). |
| usuario_id | uuid | FK | Usuário que executou a movimentação (Usuario). |
| tipo_movimentacao | TipoMovimentacaoOcorrencia |  | Tipo da movimentação registrada. |
| data | timestamp |  | Data e hora da movimentação. |
| descricao | text |  | Descrição da movimentação. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b927 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b928 -->## B.4 MÓDULO 4 – PROCESSOS SANITÁRIOS
<!-- b929 -->Quadro 87 – Dicionário de dados – tabela Doenca

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da doença. |
| nome | varchar(150) |  | Nome da doença/zoonose. |
| cid | varchar(20) |  | Código CID associado à doença. |
| ativo | boolean |  | Indica se a doença está disponível para uso. |

<!-- b931 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b932 -->Quadro 88 – Dicionário de dados – tabela TipoDocumentoProcesso

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do tipo de documento. |
| nome | varchar(100) | UQ | Nome do tipo de documento. |
| ativo | boolean |  | Indica se o tipo está disponível para uso. |

<!-- b934 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b935 -->Quadro 89 – Dicionário de dados – tabela ResponsavelProcesso

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do responsável. |
| nome | varchar(200) |  | Nome do munícipe responsável pelo animal. |
| cpf | varchar(14) | UQ | CPF do responsável. |
| telefone | varchar(20) |  | Telefone de contato. |
| email | varchar(255) |  | E-mail para notificação de resultado (RN10). |
| cep | varchar(10) |  | CEP do endereço residencial. |
| endereco | varchar(300) |  | Endereço residencial. |
| bairro_residencial | varchar(100) |  | Bairro de residência. |
| bairro_ocorrencia | varchar(100) |  | Bairro onde ocorreu a investigação. |

<!-- b937 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b938 -->Quadro 90 – Dicionário de dados – tabela ProcessoSanitario

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do processo sanitário. |
| protocolo | varchar(50) | UQ | Protocolo sequencial anual 0000/AAAA (RN02). |
| criado_por | uuid | FK | Usuário que criou o processo (Usuario). |
| doenca_id | uuid | FK | Doença investigada (Doenca). |
| status_processo | StatusProcesso |  | Situação no ciclo de vida (RN12). |
| laboratorio_id | uuid | FK | Laboratório de análise (Laboratorio). |
| resultado_laboratorial | ResultadoLaboratorial |  | Resultado da análise laboratorial. |
| desfecho_animal | DesfechoAnimal |  | Desfecho do animal investigado. |
| responsavel_id | uuid | FK | Responsável pelo animal (ResponsavelProcesso). |
| ocorrencia_id | uuid | FK | Ocorrência de origem, quando houver (Ocorrencia). |
| urgente | boolean |  | Indica urgência epidemiológica (RN04). |
| gal_numero | varchar(50) |  | Número de protocolo no sistema estadual GAL. |
| sinan_numero | varchar(50) |  | Número de notificação no SINAN. |
| data_abertura | date |  | Data de abertura do processo. |
| data_envio_amostras | date |  | Data de envio das amostras ao laboratório. |
| data_resultado | date |  | Data de recebimento do resultado. |
| notificado_em | timestamp |  | Data e hora do envio da notificação de resultado (RN10). |
| previsao_retorno | date |  | Previsão de retorno do resultado. |
| observacoes | text |  | Observações gerais do processo. |
| criado_em | timestamp |  | Data e hora de criação do registro. |
| atualizado_em | timestamp |  | Data e hora da última atualização. |

<!-- b940 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b941 -->Quadro 91 – Dicionário de dados – tabela DocumentoProcesso

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do documento. |
| processo_id | uuid | FK | Processo associado (ProcessoSanitario). |
| criado_por | uuid | FK | Usuário que gerou o documento (Usuario). |
| nome | varchar(255) |  | Nome do arquivo. |
| url | varchar(500) |  | URL de armazenamento do arquivo. |
| tipo_id | uuid | FK | Tipo do documento (TipoDocumentoProcesso). |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |
| status | StatusDocumento |  | Situação da geração do documento (RN11). |
| criado_em | timestamp |  | Data e hora de geração. |

<!-- b943 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b944 -->Quadro 92 – Dicionário de dados – tabela AmostraAnimal

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único da amostra. |
| processo_id | uuid | FK | Processo ao qual a amostra pertence (ProcessoSanitario). |
| animal_id | uuid | FK | Animal interno referenciado, quando houver (Animal). |
| especie | Especie |  | Espécie do animal amostrado (canino, felino, quiróptero ou primata não humano). |
| sexo | Sexo |  | Sexo do animal amostrado. |
| coloracao | varchar(100) |  | Coloração da pelagem. |
| pelagem | varchar(100) |  | Tipo de pelagem. |
| idade_aprox | varchar(50) |  | Idade aproximada. |
| peso_kg | decimal(5,2) |  | Peso em quilogramas. |
| nome_animal | varchar(100) |  | Nome do animal amostrado. |
| status_clinico | varchar(100) |  | Estado clínico observado. |
| raca | varchar(100) |  | Raça do animal. |
| tipo_abrigo | TipoAbrigo |  | Tipo de abrigo do animal (intradomiciliar, peridomiciliar, silvestre ou não identificado). |
| material_biologico | MaterialBiologico |  | Tipo de material biológico coletado. |
| tipo_amostra | TipoAmostra |  | Forma de conservação da amostra. |
| data_coleta | date |  | Data da coleta. |
| observacoes | text |  | Observações da amostra. |
| agrediu_humano | boolean |  | Indica se o animal agrediu humano. |
| contato_humano | boolean |  | Indica contato com humano; aciona urgência (RN04/RF-B05). |
| alt_comportamental | varchar(200) |  | Alterações comportamentais observadas. |
| nivel_contato | NivelContato |  | Nível de contato com humano. |
| criado_em | timestamp |  | Data e hora de registro. |

<!-- b946 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b947 -->Quadro 93 – Dicionário de dados – tabela AmostraSintoma

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| amostra_id | uuid | PK, FK | Amostra (AmostraAnimal). |
| sintoma_id | uuid | PK, FK | Sintoma observado na coleta (Sintoma). |

<!-- b949 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b950 -->## B.5 MÓDULO 5 – RELATÓRIOS
<!-- b951 -->Quadro 94 – Dicionário de dados – tabela RelatorioGerado

| Campo | Tipo | Chave | Descrição |
|---|---|---|---|
| id | uuid | PK | Identificador único do relatório. |
| gerado_por | uuid | FK | Usuário solicitante (Usuario). |
| tipo_relatorio | TipoRelatorio |  | Tipo de relatório: ocorrências por bairro, ocupação de baias, procedimentos, adoções, anual de processos ou vacinação. |
| periodo_inicio | date |  | Início do período de referência. |
| periodo_fim | date |  | Fim do período de referência. |
| parametros_jsonb | jsonb |  | Parâmetros de geração em formato JSON. |
| gerado_em | timestamp |  | Data e hora da solicitação. |
| status | StatusRelatorio |  | Situação do processamento (RN11). |
| arquivo_url | varchar(500) |  | URL do arquivo gerado, com expiração. |
| url_expira_em | timestamp |  | Momento em que a URL do arquivo deixa de valer (RN11). |
| tamanho_bytes | bigint |  | Tamanho do arquivo em bytes. |

<!-- b953 -->Fonte: Elaborado pelos autores com base no diagrama lógico (2026).
<!-- b955 --># APÊNDICE C – TRANSCRIÇÃO DA ENTREVISTA COM A EQUIPE DO CCZ DE ITU
<!-- b956 -->Este apêndice apresenta a transcrição da entrevista aberta realizada em 9 de janeiro de 2026 com a diretora, a veterinária do canil, a recepcionista e o agente sanitário do CCZ de Itu. Os nomes dos participantes foram substituídos por suas funções.
<!-- b957 -->TRANSCRIÇÃO DE ENTREVISTA
<!-- b958 -->Local: Centro de Controle de Zoonoses de Itu (CCZ)
<!-- b959 -->Data: 9 de janeiro de 2026
<!-- b960 -->Entrevistadores: Isaque e Beatriz (FATEC - Análise e Desenvolvimento de Sistemas) Entrevistados: Veterinárias, Secretaria e Responsável pelas denúncias
<!-- b961 -->______________________________________________________________________
<!-- b962 -->PARTE 1: SISTEMAS DE GERENCIAMENTO E PROCESSOS	
<!-- b963 -->Isaque: Então a senhora queria fazer o registro de todos os processos da zoonoses que vocês fazem?
<!-- b964 -->Veterinária I: Isso, isso. Seria para facilitar para nós. Hoje a gente usa planilhas de Excel. Então para nós um programa que a gente alimentasse, ficasse formatado num formato mais fácil, né? Porque a gente, como bons veterinários, somos zero conhecimento em tecnologia. Então a gente apanha um pouco disso. A gente acaba usando planilhas de Excel, o que é mais difícil de manipular, né? Então um programa facilitaria para nós. Tanto para essa parte de processos, quanto para os animais que a gente tem internos. Então, por exemplo, precisamos medicar, um programa onde a gente tivesse acesso à documentação desses animais de uma forma mais fácil.
<!-- b965 -->Beatriz: Tipo, ele foi vacinado?
<!-- b966 -->Veterinária I: Exato.
<!-- b967 -->Beatriz: De onde o morcego é? Esse tipo de coisa?
<!-- b968 -->Veterinária I: É que são duas vertentes separadas. Uma é a parte de processos, como seriam os morcegos, dos animais de munícipes que têm suspeita de doenças transmissíveis para os humanos e a outra parte são esses animais internos do canil. Que aí esses são os que a gente tem aqui que estão para doação. Então esses eles passam por um veterinário rotineiramente, seja para vacinação, para consultas, porque estão precisando de alguma medicação. Então esses são assistidos pela veterinária do canil. E aí a gente acaba fazendo boa parte da alimentação do sistema manualmente. 
<!-- b969 -->A gente tem fichas em papel. Então, e aí a gente vai alimentando manualmente as fichas, se eles estão vacinados, se eles adoeceram por algum motivo, o que eles tiveram, como a gente medicou. Então a gente acaba fazendo isso manualmente.Beatriz: A última vez que a gente veio aqui, é, eu acho que é gerente, não sei o nome dela, a gente estava com problema, muito problema na adoção.
<!-- b970 -->Veterinária I: Isso, é difícil.
<!-- b971 -->Beatriz: Falta de divulgação e tal.
<!-- b972 -->Veterinária I: Exato. A gente tem bastante, porque assim, é o que acontece: hoje a gente tem casos aqui de um perfil um pouco mais difícil de adotar, são mais adultos, em sua maioria é de grande porte. Então a adoção é mais difícil e gatos são todos adultos, que também é uma adoção mais difícil. Então... e rotineiramente os munícipes tentam trazer animais para abandonar aqui. É muito difícil, a partir da educação, realmente das pessoas entenderem que a gente não é um depósito de animais. A gente é focado em doenças transmissíveis, não... como o nosso próprio nome já diz. Mas acaba virando um balcão entre nós e o bem-estar animal, o acúmulo dos animais e aí deu um embalo aí só.
<!-- b973 -->Isaque: Então, tipo, seria, por exemplo, a senhora iria querer, tipo, ah, tem um animal na ala 3, por exemplo. Ele precisa tomar uma vacina hoje porque precisa uma vacina, e cadastra no sistema essa vacina.
<!-- b974 -->Veterinária I: Exato.
<!-- b975 -->Isaque: Daí quando a pessoa for adotar também aparecem esses detalhes.
<!-- b976 -->Veterinária I: Exato. Teria acesso a esses detalhes dos animais. Os animais aqui são separados por baia, todos eles são identificados por um microchip. Seria como se fosse um RG próprio.
<!-- b977 -->Isaque: Ah, sim. A última entrevista também ela citou esse microchip, vocês têm dificuldade para lê-los?
<!-- b978 -->Veterinária I: Para leitura? Isso. Não. A gente tem um equipamento que faz a leitura. A gente passa ali na nuquinha deles e a gente faz a leitura.
<!-- b979 -->Beatriz: Mas vocês conseguem pegar as informações dos animais?
<!-- b980 -->Veterinária I: Consegue, mas agora a gente tem um sistema, vamos dizer assim, são coisas em paralelo. Existe um site desse próprio microchip onde a gente cataloga os animais, tá? Então a gente consegue identificá-los tanto pelo site quanto pelas fichas manuais.
<!-- b981 -->Isaque: O leitor aparece o número deles e vocês pegam esses números e colocam no site.
<!-- b982 -->Veterinária I: Exato. E aí a gente tem acesso tanto pelo site quanto pelas fichas manuais dos animais, né? A gente tem controle de quem é quem.
<!-- b983 -->Isaque: E todos os animais são chipados?
<!-- b984 -->Veterinária I: Todos.
<!-- b985 -->Isaque: Tipo, se chega um novo, vocês também chipam ele?
<!-- b986 -->Veterinária I: Sim, sim. Chipa, a gente castra, a gente vacina e começa um novo papel daquele animal, pra gente também ter o controle de onde ele veio. Então a gente faz o controle de onde ele veio e se ele sair daqui, para onde ele foi.
<!-- b987 -->Beatriz: E quais informações vocês queriam ter dos animais?
<!-- b988 -->Veterinária I: Eu vou pedir um segundo que aí eu vou chamar a veterinária do canil para conversar com vocês.
<!-- b989 -->[Pausa de 4 minutos e 35 segundos]
<!-- b990 -->PARTE 2: SISTEMA DE GESTÃO DOS ANIMAIS DO CANIL
<!-- b991 -->Veterinária II: Oi, bem? É, eu souVeterinária II, sou uma das veterinárias aqui. Vocês são?
<!-- b992 -->Beatriz: A gente é da FATEC, a gente está planejando fazer um...
<!-- b993 -->Veterinária II: É, eu sei mais ou menos, a Veterinária I me contou. Qual o seu nome?
<!-- b994 -->Beatriz: Eu sou a Beatriz e ele é o Isaque.
<!-- b995 -->Veterinária II: Vocês estão fazendo o curso de TI, do quê?
<!-- b996 -->Beatriz: Isso. De análise e desenvolvimento de sistemas.
<!-- b997 -->Veterinária II: Só um minutinho, aí então eu mostro aqui. É, então. Ela me pediu para acompanhar vocês, explicar mais ou menos do que a gente, né, como vocês poderiam nos ajudar.
<!-- b998 -->Isaque: Isso, porque ela falou que queria colocar no sistema as vacinas que vocês dão e tal. A gente quer saber que informações vocês colocam, se tem como ver a ficha que vocês fazem manualmente também.
<!-- b999 -->Beatriz: A gente queria ver a planilha do Excel que ela falou que tem.
<!-- b1000 -->Veterinária II: Essa planilha fui eu mesma que fiz, né? Eu tenho familiaridade com o Excel, não acho nada difícil, mas vocês vão montar um programa.
<!-- b1001 -->Beatriz: Isso. É isso para ser melhor visual, vai ser mais fácil para vocês, é, ela queria um dashboard, gráficos, esse tipo de coisa.
<!-- b1002 -->Veterinária II: É, então são duas coisas. Primeiro, tem um deles, um dos arquivos é para a gente controlar processos, né? Então a gente chama isso aqui de um processo administrativo. Então, por exemplo, aqui, como é o centro de controle de zoonoses, a gente faz levantamento, acompanhamento, né? De doenças que são transmitidas dos animais. Então, principalmente raiva, esporotricose, leishmaniose, principalmente. Então a gente colhe material e envia para análise, então cada material tem um processo e aí a gente alimenta esse arquivo com os resultados quando eles vêm, né? 
<!-- b1003 -->E depois, de preferência, a gente faz, monta gráfico para ter uma visualização, né, do que tá sendo feito, distribuição das doenças, casos positivos ou negativos, esse tipo de coisa. Outra coisa são os animais do canil.
<!-- b1004 -->Beatriz: Adoção.
<!-- b1005 -->Veterinária II: É, aqui nós temos 95 cães disponíveis para adoção e 15 gatos. Gato tem pouquinho, mas cães a gente tem bastante. E cada animal é microchipado e tem cada animal tem uma ficha deles, né? Então, tudo isso hoje tá no papel. Cada animal tem uma ficha, né? Um processo físico, né? Mas eu também alimentei no Excel. Então, por exemplo, cada animal é microchipado e tem sua ficha. Então, a gente coloca aqui a foto dele, os dados, se é macho, se é fêmea, idade, se foi vacinado, castrado, tudo isso aqui. Tem o acompanhamento, né?
<!-- b1006 -->Beatriz: A gente pode tirar foto de um exemplo?
<!-- b1007 -->Veterinária II: Pode, fica à vontade.
<!-- b1008 -->Veterinária II: E aí, no caso, a gente tem um site que é o site do microchip. Então, esses animais, além do processo físico, eu tenho eles aqui cadastrados no site da AnimalTech, que é quem fabrica o...
<!-- b1009 -->Isaque: Os microchips. Eles que fornecem, vocês chipam os animais também.
<!-- b1010 -->Veterinária II: Isso.
<!-- b1011 -->Beatriz: Esses papelzinhos são as amostras?
<!-- b1012 -->Veterinária II: Não, é assim: o chip, ele vem dentro de uma agulha, dentro desse envelopinho. Então o microchip, ele é inserido na pele do animal. Aí tem um leitor de microchip, a gente passa esse... tipo código, leitor de código de barra mesmo, né, e vai aparecer esse número aqui. Entendeu? Então junto com o chip vem essas etiquetinhas para a gente, para o tutor ou para o responsável colar onde precisar colar. Então, por exemplo, quando o animal é adotado, eu pego uma dessas fitinhas e coloco no termo de adoção, coloco na carteirinha de vacinação, esse tipo de coisa, entendeu?
<!-- b1013 -->Beatriz: Para identificar.
<!-- b1014 -->Veterinária II: Para identificar. Ó, então aqui, eu [inaudível]. Eu preciso atualizar porque esse ano eu ainda não sentei para fazer isso, mas, por exemplo, aqui, lista de proprietários. Aqui, no centro de controle de zoonoses, estão cadastrados todos esses animais aqui. Tá vendo lá, lista de animais, tá vendo?
<!-- b1015 -->Isaque: São todos os animais que têm aqui.
<!-- b1016 -->Veterinária II: É. Eu preciso atualizar essa lista aqui, mas é isso.
<!-- b1017 -->Beatriz: É, esse é o sistema que vocês têm, né?
<!-- b1018 -->Veterinária II: Esse é o que eu tenho aqui. Então, além do papel físico, eu tenho alimentado aqui dentro do programa do próprio AnimalTech. Mas seria interessante a gente ter um programa nosso, né? E aí, por exemplo, deixa eu pegar aqui o código. Então tem aqui os dados do animal, né? Ele é um macho, a data provável de nascimento, a raça, a cor, o peso, o porte, tá vendo? Tem tudo, tudo, tudo. Condições de saúde, se ele é epilético, se ele tem problema cardíaco, se é diabético, se é agressivo, se é castrado, tá vendo? Aqui no caso, disponível para adoção, porque todos os nossos animais estão disponíveis para adoção, né? E aqui descrição, se precisar descrever alguma coisa, aqui o número do microchip, onde foi implantado, a data de implantação e número da medalha. Porque assim, além do número do chip, que esse fica dentro da pele dele, junto vem uma medalhinha, essa medalhinha é para o tutor colocar na coleira do animal porque caso ele fuja, o que acontece? Ou alguém rouba, alguma coisa assim. Vier para cá ou qualquer clínica veterinária, caso tenha leitor de chip, a gente identifica e vai direto no site e vai mostrar os dados do proprietário. Entendeu? O número da medalha é diferente do número do chip. Entendeu? A hora que você escaneia isso daqui, aparece direto os dados do animal.
<!-- b1019 -->Beatriz: Não é igual o outro que tem que aparecer só o número e tem que ir no site.
<!-- b1020 -->Veterinária II: Não, aqui você escaneia vai direto no site, direciona direto, sabe? Aí aqui, por que que aqui é legal? Porque aí, aqui, no caso, o proprietário é o CCZ mesmo, né? Mas aí vacina. Quando foi aplicada a vacina, qual vacina, quando tem que fazer o reforço, entendeu? Medicamento. Se ele precisar de, sei lá, ficou doente por algum motivo, aí eu coloco aqui qual é a doença, qual o medicamento que ele tomou. Entendeu? É um sistema legal esse daqui. Quer ver, por exemplo, outro animal? Olha aqui... O Bob. Vamos ver se tem aqui, o Bob...
<!-- b1021 -->Isaque: Pode acontecer de alguém adotar e devolver depois?
<!-- b1022 -->Veterinária II: Por exemplo, o Fred, ele foi adotado. Então aí a gente coloca como localizado, tá vendo? Mas eu ainda não fiz a transferência para o outro proprietário. Mas ele foi adotado. Aí então aqui ele tomou a antirrábica dia 20 de maio, tomou a V10 dia 20 de maio, ele teve uma determinada doença, então qual foi a medicação que eu dei, por quanto tempo, a dose, o vermífugo, tá vendo? Ele fez exame de sangue. Eu acho que eu até coloquei aqui. Aqui, eu anexei o exame de sangue dele. Tá vendo? Esse daqui tem uma ficha mais completa, esse cachorro aqui. Tá vendo? Mas se vocês conseguirem desenvolver um específico para a gente, seria legal também.
<!-- b1023 -->Beatriz: Mas vocês têm algum problema com esse atual?
<!-- b1024 -->Isaque: Você não sente falta de alguma coisa?
<!-- b1025 -->Veterinária II: Ah, ele oferece assim, né, tudo que eu preciso alimentar aqui eu consigo alimentar. Mas sei lá, se vocês quiserem também só fazer só também para treinar, né?
<!-- b1026 -->Isaque: Tipo quando a senhora precisa dar reforço, ele dá algum aviso ou a senhora tem que meio que saber isso?
<!-- b1027 -->Veterinária II: Ah, não. Isso não. Seria uma boa.
<!-- b1028 -->Isaque: Tipo, tem uma parte, ah, reforça, tipo, 7 dias de antecedência ou 14? Qual seria a melhor assim?
<!-- b1029 -->Veterinária II: Uhum. Uhum. É, 7 dias seria uma boa para alertar, né? Seria bom. Aí, não sei como que seria esse alerta. Através de e-mail.
<!-- b1030 -->Isaque: É, tipo, a página inicial aparecia reforços que estão por vir, uma coisa assim.
<!-- b1031 -->Veterinária II: É, uma boa. Uma boa ideia.
<!-- b1032 -->Beatriz: E a planilha de Excel?
<!-- b1033 -->Veterinária II: Tá, aí a outra... Então, além do sistema eu tenho uma planilha de Excel também com esses animais, porque daí eu tenho por baia, né? Aqui eu tenho por baia. Quem tá em cada baia. Porque todo mês a gente tem que fazer recontagem, né? Aí eu coloco, né, também o número do chip, em qual baia que tá, tudo mais. Então aqui, esse aqui fui eu que criei, né? Porque eu gosto de saber qual animal tá em qual baia, né? Eu gosto de fazer esse controle por baia também, lá naquele programa não tem essa informação.
<!-- b1034 -->Isaque: Então filtrar por baia seria interessante também?
<!-- b1035 -->Veterinária II: Seria interessante também. Sim, eu gosto de saber onde qual animal tá em qual baia. Gosto de ter esse controle. É, então são planilhas complementares, né?
<!-- b1036 -->Veterinária II: E a outra dos processos...
<!-- b1037 -->Beatriz: Você poderia mandar uma cópia para a gente?
<!-- b1038 -->Veterinária II: Mando sim. Só acho que aqui era para estar aqui...
<!-- b1039 -->Veterinária II: Mas aqui eu organizei por doença, tá vendo? Coriza, febre amarela, leishmaniose, leptospirose e raiva, né? Aí, quais são os dados? O número do processo, então, cada processo tem um número, né? A data em que ele foi aberto, no caso, qual é a doença e o nome do responsável, né? Então, no caso de raiva, tem dois tipos de material. Tem o morcego, né? Porque aqui em Itu tem muito morcego na área urbana e quando as pessoas, né, sei lá, têm um morcego no quintal caído, eles ligam pra gente, a gente vai lá, recolhe o morcego e envia para análise, né? Para saber se esse morcego é vetor da raiva, né? Na maioria das vezes, nunca é. Porque são animais que não são hematófagos, né? Eles não sugam sangue. Eles comem fruta, comem inseto, então não atacam nem o cão, nem o gato, nem o ser humano, né? Mas mesmo assim, apesar disso, pode ter o vírus, entendeu? Então a gente tem que fazer esse rastreamento para, né? Porque a raiva, né? É uma doença extremamente perigosa. Aí  a gente pega esse morcego e manda para análise, manda para o Instituto Pasteur lá em São Paulo. Outro tipo de material é o cérebro de um cão ou de um gato que veio a óbito, né? Com suspeita de raiva. É muito raro também acontecer, graças a Deus. Mas a gente tem que sempre fazer o controle, né? Dessa doença. Então são dois tipos de material. Ó, aqui no caso, canino quer dizer que é o cérebro do cachorro que foi. E quiróptero é o morcego, o quiróptero é o morcego. Tá bom? E aqui a gente tinha o sangue também. Então aqui, o nome do responsável, então no caso essa Renata era a dona desse cachorro aqui, entendeu? Aí a idade, o sexo e o bairro. O bairro é importante a gente saber também, porque a gente tem que fazer um mapa, né? Da cidade. E daí o resultado, a data do resultado.
<!-- b1040 -->Beatriz: Isso é o que não tem no sistema, esse controle de material.
<!-- b1041 -->Veterinária II: É, isso aqui foi eu que criei essa planilha aqui.
<!-- b1042 -->Isaque: Aí, esse bairro a senhora pega do registro do responsável ou ele vem aqui?
<!-- b1043 -->Veterinária II: É, porque, por exemplo, isso aqui é leishmaniose. Então, é o animal que passou por atendimento e o veterinário suspeitou que de acordo com a lesão, né, pode ser que esse animal tenha a leishmaniose, que também é uma zoonose, né? Então, aqui eu tenho os dados do proprietário. O nome do cachorro, o nome do proprietário, o endereço, tudo isso, entendeu?
<!-- b1044 -->Beatriz: E isso não tá no sistema, tá?
<!-- b1045 -->Veterinária II: Isso não. Isso não. Não, que daí eu que alimento, entendeu?
<!-- b1046 -->Beatriz: Ah, isso aqui é das planilhas.
<!-- b1047 -->Veterinária II: É, isso.
<!-- b1048 -->Beatriz: Ah, entendi. Então você coloca aqui e depois você passa para cá.
<!-- b1049 -->Veterinária II: Isso.
<!-- b1050 -->Beatriz: Ah, sim.
<!-- b1051 -->Isaque: Só que o doutor preenche, tipo, a pessoa vem aqui, tipo, ele pega no sistema o endereço do responsável.
<!-- b1052 -->Veterinária II: Ah, não, porque todo munícipe que passa por aqui, primeiro passa na recepção e aí a gente pega os dados do munícipe, né? A gente pega os dados do munícipe e do animal, seja cão ou gato.
<!-- b1053 -->Isaque: Ah, entendi.
<!-- b1054 -->Veterinária II: Então isso aqui é feito na recepção. Entendeu? Aí no caso da leishmaniose aqui foi colhido o sangue, né? E vai para a análise lá para o Instituto Adolfo Lutz em Sorocaba. Entendeu? E aí eu gosto de fazer também os gráficos.
<!-- b1055 -->PARTE 3: SISTEMA SISSAÚDE E PROCEDIMENTOS VETERINÁRIOS
<!-- b1056 -->Isaque: Aquele sistema que a senhora mostrou para a gente é o do microchip. Aqueles são os dados guardados no microchip.
<!-- b1057 -->Veterinária II: É, na verdade de toda forma a gente tem que alimentar, né? Única coisa assim que vem com o chip é o número. Só isso. O resto tudo a gente tem que alimentar.
<!-- b1058 -->Isaque: Vocês vão adicionar o cachorro lá, vocês colocam o microchip, daí já preenchem os dados e a ficha deles.
<!-- b1059 -->Veterinária II: É, eu tenho feito as duas coisas, né? Tanto na ficha papel como no sistema, aqui. Aí, por exemplo, aqui o que eu fiz? Caso de zoonoses analisado. Então, aqui eu tenho 16 casos de raiva, cinco de esporotricose, seis de leishmaniose e um de leptospirose, tá vendo?
<!-- b1060 -->Beatriz: Ah, no papel, você coloca no sistema e no papel? No papel é necessário você fazer no papel também?
<!-- b1061 -->Veterinária II: Não.
<!-- b1062 -->Beatriz: Não? Mas você faz?
<!-- b1063 -->Veterinária II: É, eu gosto, né, de fazer no papel, porque por exemplo, se alguém precisar contar o número de cães, tá no papel ali, não precisa entrar no computador.
<!-- b1064 -->Beatriz: Ah, lá no sistema não tem quantos animais têm?
<!-- b1065 -->Veterinária II: Tem, mas quase ninguém acessa, só eu mesmo que acesso. Mas por exemplo o pessoal da secretaria, a Secretária, né, todo mês ela tem que fazer a contagem de animal, para ela é mais fácil pegar a caixa e contar.
<!-- b1066 -->Beatriz: Então não está acostumada, né?
<!-- b1067 -->Veterinária II: Não, ela sabe usar bem o sistema. Acho que para ela vai facilitar também, né? Quando a gente tiver esse sistema, né? Digitalizado, né? Em andamento.
<!-- b1068 -->Beatriz: Aquele sistema não imprime a ficha já? Já tem todos os dados lá. Não imprime a ficha?
<!-- b1069 -->Veterinária II: É, imprime.
<!-- b1070 -->Beatriz: Imprime também? Mas a senhora gosta de fazer no papel, você mesma?
<!-- b1071 -->Veterinária II: É, porque ali eu coloco a foto, coloco..
<!-- b1072 -->Beatriz: Ah, no sistema não tem.
<!-- b1073 -->Veterinária II: Tem como, tem como adicionar uma foto do cachorro.
<!-- b1074 -->Beatriz: Tem?
<!-- b1075 -->Veterinária II: Também tem. É que assim, quando a gente microchipou os animais, final de 2024, e aí fomos, tiramos foto de animal por animal, e tal. E quem fotografou os animais não tá mais aqui, então eu vou ter que pegar e fotografar novamente todos os cães para colocar no sistema. Entendeu?
<!-- b1076 -->Beatriz: Mas por que você teria que tirar a foto?
<!-- b1077 -->Veterinária II: Para alimentar no sistema, porque não tem mais a foto digitalizada, quem tirou a foto não trabalha mais aqui, apagou a foto.
<!-- b1078 -->Beatriz: Ah, só tem na ficha.
<!-- b1079 -->Veterinária II: Isso, impressa.
<!-- b1080 -->Isaque: Teria a senhora mostrar para a gente como que é ler o microchip e colocar no sistema.
<!-- b1081 -->Beatriz: Fazer um exemplo para a gente, pegar um cachorrinho.
<!-- b1082 -->Veterinária II: Sim, claro.
<!-- b1083 -->[Deslocamento até o canil para demonstração prática]
<!-- b1084 -->Veterinária II: É que eles são super agitados. Por exemplo, ó, eu passei o leitor aqui, que é a região onde é colocado o microchip e ele leu.
<!-- b1085 -->Beatriz: Aí aparece o número, aí a senhora vai lá e coloca lá.
<!-- b1086 -->Veterinária II: É. Então, por exemplo, a gente põe nesse cão aqui.
<!-- b1087 -->[Corte na gravação]
<!-- b1088 -->Veterinária II: Cão e gato sempre na mesma região onde a gente coloca o microchip, que é entre as duas escápulas. Então, por exemplo, esse chip é o chip dele, certo?
<!-- b1089 -->Isaque: Esse chip chegou para vocês.
<!-- b1090 -->Veterinária II: Isso. Daí vou te mostrar o exemplo. Então aqui tem as etiquetinhas, a medalha e o chip vem dentro dessa agulha aqui. Então eu tenho um aplicador. Com o auxílio do aplicador, eu introduzo esse chip embaixo da pele do animal e ali vai ficar o resto da vida. Não é a agulha, o chip tá dentro da agulha, então é como se fosse uma injeção, né?
<!-- b1091 -->Beatriz: Bem pequenininho.
<!-- b1092 -->Veterinária II: Bem pequenininho, é um grãozinho de arroz assim. E esse fica embaixo da pele do animal por toda a vida dele. Aí, o que eu vou fazer agora? Eu pego uma ficha para ele, vou abrir uma ficha para ele. Então, aqui eu já pego, né, uma dessas adesivas e já coloco aqui, ó, o número de identificação. Certo? Tá bom? Se um dia ele for adotado, isso daqui vai com o tutor dele. Aí eu anoto também o número da medalha, BF66601. Aí, para cada animal que a gente recolhe, tem um processo também, né? Então eu tenho que pegar ali na frente da recepção o motivo porque ele veio para cá, provavelmente foi abandonado, a raça, cão sem raça definida é SRD, sem raça definida. O porte dele, ele é grande. Ele tem a pelagem preta. Ele é macho. Idade aproximada ao chegar, ele é jovem. Então eu calculo aproximadamente, né, 2 anos. Aí ele foi, observação. O que acontece? Ele foi recolhido, ele foi recolhido no CCZ durante o plantão final de ano. Ele tinha miíase que é bicheira no ouvido. No ouvido. Aí o que aconteceu? Foi feita, vocês viram que ele está com colar, né?
<!-- b1093 -->Isaque: Aham.
<!-- b1094 -->Veterinária II: É, por quê? Porque teve que retirar uma orelha dele, a orelha dele estava podre. É, chama-se otectomia, devido ao estado, né? Então, aí o animal foi castrado, orquiectomia, em 8 de janeiro de 2026. Ele foi microchipado. Então, foi castrado ontem, a data do procedimento foi dia 8 de janeiro de 2026. Quem castrou ele foi a Stéphanie. E aí quando ele for vacinado eu coloco aqui a data e o tipo de vacina. Tá, daí a gente tira uma foto, coloca aqui. E aqui, eu vou adicionar um animal. O centro de controle de zoonoses, certo? Por enquanto ele não tem nome, vou calcular mais ou menos a data que ele nasceu por alto, né? Ele tem... ele é jovem, vou pôr 2 anos. Espécie, ele é canino. Ele é sem raça definida. Ele é preto e branco, né? Aproximadamente ele tem uns 20 kg, pelagem longa, ele não é epilético, não é cardíaco, não é diabético, não é agressivo, não está disponível para acasalamento, castração, ele foi castrado e ele está disponível para adoção. Daí aqui eu coloco o microchip: 963003001647520, foi na linha entre as escápulas, a data de implantação foi ontem, o número da medalha DF666016. Isso aqui eu não tenho. Vou gravar. Aí se, por exemplo, eu quero adicionar alguma coisa na ficha dele, né? Eu venho pelo microchip: 963003001647520. Então, o que aconteceu? Eu quero adicionar a castração, cirurgia. O que foi castrado ontem, orquiectomia, orquiectomia é o nome formal, né, para castração de macho. Peso aproximado, ele tem mais ou menos 20 kg. Não aferi a temperatura, mas...Veterinária II sou eu, inflamação não, não precisa de retorno, próximo.
<!-- b1095 -->Beatriz: Você não tem cadastro no sistema? Você como Maria?
<!-- b1096 -->Veterinária II: Não, a gente usa o cadastro do CCZ.
<!-- b1097 -->Beatriz: Ah tá, entendi.
<!-- b1098 -->Veterinária II: É. Aí aqui é... o que que eu vou colocar? Animal submetido a cirurgia de castração por orquiectomia. Procedimento cirúrgico e anestésico sem intercorrências, ou seja, correu tudo bem durante a cirurgia dele. Aí próximo. Não precisa adicionar nada. É, aqui ele foi medicado, né? É uma dose só, então não preciso, mas por exemplo, se for um tratamento prolongado, de 8 a 18, daí eu colocaria aqui. Mas no caso foi uma dose única, o que ele tomou? Ele tomou antibiótico, o nome do medicamento. Dose, ele tomou 1 ml para cada 10 kg. Aqui o veterinário posso deixar o CCZ mesmo. Gravar e novo, que eu vou colocar mais um medicamento aqui. Aqui ele tomou o meloxicam, 1 ml para cada 10 kg também. Ele tomou tramadol. Entendeu? É isso.
<!-- b1099 -->Isaque: Aí para a castração e para a remoção da orelha foram abertos outros dois processos.
<!-- b1100 -->Veterinária II: É, então, quem fez as duas cirurgias foi a outra veterinária, né? Eu não sei se ela... ela não alimenta, quem alimenta tudo isso aqui sou eu. Então eu tenho que ver se ela anotou em algum lugar, porque além desse sistema, o que acontece? Todo mundo aqui usa esse daqui. Então, por exemplo, chega animal para ser atendido ou para fazer cirurgia. É esse sistema aqui.
<!-- b1101 -->Beatriz: Esse é da recepção?
<!-- b1102 -->Veterinária II: É, esse é o da recepção e que ela usa também para controle de medicamento. Isso aqui foi desenvolvido esse programa para o CCZ. Então, por exemplo, agora tem esse animal aqui que tá na castração e esses três que estão sendo atendidos aqui. Entendeu? Então, por exemplo, eu entro aqui. Supondo que eu vou atender esse animal. Então, eu vou colocar aqui o procedimento que eu fiz. Daí e depois eu vou aqui e adiciono as medicações que eu usei, entendeu? Então esse sistema aqui já tá fechado, a gente não pode mexer nesse sistema aqui. E é o sistema que os veterinários usam para adicionar, né, o que fez, o que o animal tem. Então, por exemplo, esse daqui, quem atendeu foi o Dr. Rômulo, né? O nome do animal é Luke e tal. O que ele veio fazer? Veio retirar ponto, então não tem nada demais, só veio retirar ponto. Ó, retirou ponto. Retirou o ponto. Não colocou nada de importante porque tirar ponto é um procedimento simples, né? Essa gorda aqui, vamos ver o que aconteceu, o Rômulo que atendeu. Aí o que ele fez? Ele fez fluidoterapia subcutânea, ele fez medicação, tal nananana, tá vendo? A queixa do proprietário. Mas esse sistema aqui a gente... Então, por exemplo, a Stéphanie é a cirurgiã. Então ela operou essa cachorra aqui. E o que ela coloca? Cirurgia de castração eletiva, ovariossalpingohisterectomia. No caso, é uma fêmea, né? Então, o macho é orquiectomia, fêmea é ovariossalpingohisterectomia. E daí ela adiciona aqui quais são os medicamentos que ela precisou usar, anestesia, antibiótico, tudo isso, né? Aqui é outra, mesma coisa. Aí no caso esse John aqui, ele veio para tomar vacina. Vacina de raiva. É isso. Esse sistema aqui já tá, né? Funciona bem, a gente já tá bem familiarizado com ele.Isaque: Então quando alguém chega na recepção aí marca uma castração, aparece aí, daí o doutor disponível seleciona para poder fazer a operação.
<!-- b1103 -->Veterinária II: É, geralmente as cirurgias, a maioria delas são feitas pela Doutora Stéphanie, né? Que é a cirurgiã. É, mas se, por exemplo, se fui eu, daí eu vou lá e faço, né?
<!-- b1104 -->PARTE 4: SISTEMA DE DENÚNCIAS E PROCESSOS
<!-- b1105 -->Beatriz: E as denúncias? Como funcionam?
<!-- b1106 -->Veterinária II: Denúncias são feitas presencialmente e geralmente é aquele rapaz ali que acolhe as denúncias, que faz a... E aí ele abre um processo para cada tipo de denúncia.
<!-- b1107 -->Beatriz: Tem um sistema também.
<!-- b1108 -->Veterinária II: Não, aí é tudo físico, papel.
<!-- b1109 -->Beatriz: Papel?
<!-- b1110 -->Veterinária II: Papel, mas seria bom também a gente fazer...
<!-- b1111 -->Beatriz: A gente pode ver os papéis que ele faz?
<!-- b1112 -->Veterinária II: Pode. Mostra para ele, Responsável pelas denúncias, por favor. Os processos.
<!-- b1113 -->Responsável pelas denúncias: Esse processo eu fiz agora.
<!-- b1114 -->Beatriz: É, só mostrar como o senhor faz, vou pegar, tá bom?
<!-- b1115 -->Responsável pelas denúncias: Só olha aqui, a gente põe o nome, no caso desse aqui é sigiloso. Mas geralmente a gente põe o nome do reclamante, o endereço dele e o telefone dele. No caso desse aqui é sigiloso, a gente só tem endereço da ocorrência. Aqui é a numeração do processo, a data dele, a referência. Isso aqui é um processo que foi mandado pela prefeitura. Mas aí os processos eles vão mudando. Tem processo, por exemplo, aqui, ó, olha só, deixa eu pegar aqui o livro, o processo. Esse aqui desse ano. Aqui, ó. Tivemos processos aqui, se você quiser depois censurar os nomes. Por exemplo, aqui, ó. Esse daqui, aí o que aconteceu? Tinha um morcego na casa dele. Então, material para exame de raiva, um quiróptero, um morcego. Esse aqui, infestação de morcegos. Esse aqui, mais material para exame de raiva. Esse aqui tá com infestação de morcegos. Esse ano ainda, tudo assim, questão de infestação ou exames para de alguma febre. Esse aqui, febre maculosa. Esse aqui, esporotricose. Esse aqui, no caso, foi uma denúncia, possível criação irregular de galinhas. É isso, não tem, é simples, mas depois que a gente termina aqui, a gente passa para o nosso fiscal. Aí a gente não acompanha mais. Aí depois a gente só recebe de novo quando está terminado, o fiscal que faz todo o resto.
<!-- b1116 -->Beatriz: Qual que é o todo resto?
<!-- b1117 -->Responsável pelas denúncias: Então, pior que nem eu sei explicar.
<!-- b1118 -->Veterinária II: É, porque dependendo da denúncia, o fiscal tem que ir no local e averiguar o que está acontecendo. Porque assim, nem sempre o que o denunciante fala é verdade. Então, tem que ir lá e averiguar. Por exemplo, criação irregular de galinha, que no meio urbano não pode ter, né? Aí o fiscal vai lá e vê o que tá acontecendo, se é realmente uma criação de galinha, e instrui, né? A primeira ação do fiscal é a instrução. Se o munícipe não acatar, daí possivelmente pode acontecer de multar o munícipe, tudo isso aí. Mas a primeira abordagem é sempre instrutiva.
<!-- b1119 -->Beatriz: Mas daí você pega só presencial, ou eles ligam aqui.
<!-- b1120 -->Responsável pelas denúncias: A gente costumava fazer por telefone, mas as pessoas começaram a passar trote para gente, então a gente parou de fazer por telefone agora, só presencial.
<!-- b1121 -->Beatriz: Só presencial.
<!-- b1122 -->Responsável pelas denúncias: É. Agora a questão assim, a gente pegava também questão de maus-tratos. Quando assim: "Ah, tá um maltrato no animal", mas agora a gente não pega mais, isso agora é com a GEPAR, que é uma divisão da Guarda Municipal.
<!-- b1123 -->Beatriz: Ah, é outra coisa.
<!-- b1124 -->Responsável pelas denúncias: Isso, agora é a jurisdição deles.
<!-- b1125 -->Beatriz: Mas vocês lidam só com as doenças, então?
<!-- b1126 -->Responsável pelas denúncias: Só com as doenças, basicamente. Só as doenças.
<!-- b1127 -->Beatriz: E como que entra nessa questão das galinhas, por exemplo?
<!-- b1128 -->Responsável pelas denúncias: No caso das galinhas, porque é uma questão sanitária.
<!-- b1129 -->Beatriz: Sanitária? Não pode, né?
<!-- b1130 -->Responsável pelas denúncias: Não pode.
<!-- b1131 -->Beatriz: Aí entra na zoonoses.
<!-- b1132 -->Responsável pelas denúncias: Aí entra na zoonoses, porque zoonoses se caracteriza como qualquer doença que inicia num animal e possa passar para o ser humano. Então, no caso, as galinhas são um fator de zoonoses. Elas podem, as doenças podem vir delas para a gente, como por exemplo, a leishmaniose. Leishmaniose pode começar na galinha, o mosquito-palha pica ela, depois vem e pica você e transmite a leishmaniose aí...
<!-- b1133 -->Beatriz: Então atualmente telefone é só para agendamento de castração.
<!-- b1134 -->Responsável pelas denúncias: Só agendamento, instrução. No caso, às vezes, as pessoas ligam assim, fala: "Ó, tem um caso que achamos um cachorro ferido no meio da rua". A gente é obrigado, é nossa função ir lá e socorrer. Se achou um cachorro doente ou morto, a gente tem que recolher o óbito também. Aí, recolhendo o óbito, o óbito vai para lá, fica no refrigerador congelado. A EPPO tem contrato com a prefeitura e três vezes por semana eles vêm aqui, coletam os óbitos e levam para São Paulo para ser cremado. Mas aí assim o telefone é só para isso.
<!-- b1135 -->Isaque: O senhor enxerga alguma forma de colocar algum sistema para o senhor? Porque tipo, é só presencial, então online não daria para fazer, né?
<!-- b1136 -->Responsável pelas denúncias: Não, não, não.
<!-- b1137 -->Beatriz: Acho que seria [inaudível].
<!-- b1138 -->Responsável pelas denúncias: Tem, tem reclamação online. Essa aqui mesmo é uma reclamação online, aqui, olha. Ela é feita direto no site da prefeitura.
<!-- b1139 -->Beatriz e Isaque: Ah, tá.
<!-- b1140 -->Responsável pelas denúncias: Entendeu? A reclamação pode ser feita presencialmente ou online, mas online é pelo site da prefeitura.
<!-- b1141 -->Isaque: Não é direto na zoonoses.
<!-- b1142 -->Responsável pelas denúncias: Não é direto na zoonoses, porque se você for ver, essa aqui, ó, foi feita dia 6, mas chegou só hoje. Então, quando faz online, não é instantânea, porque a gente vê aqui, ó, de novo aqui. Olha. Você vai vendo aqui, ó, as datas. Ó, essa aqui foi dia 5, no primeiro dia que a gente voltou. Aí, ó, só essa aqui a gente recebeu, ela é do dia 30. Então é retroativa. Essa aqui foi dia 30 de dezembro. Mas então assim, vai conforme a gente vai recebendo. Ó, essa daqui, ó, essa aqui chegou hoje. Hoje era para ser dia 9, mas é dia 6, então é retroativa. Entendeu?
<!-- b1143 -->Isaque: Então passa para a prefeitura para evitar justamente o trote, porque lá eles já dão uma filtrada.
<!-- b1144 -->Responsável pelas denúncias: Sim, sim.
<!-- b1145 -->Beatriz: Aí você coloca por quê nesse caderno? Você tem a ficha?
<!-- b1146 -->Responsável pelas denúncias: Isso. Isso é porque essa ficha não vai ficar com a gente.
<!-- b1147 -->Beatriz: Ah, aqui é para vocês terem um controle.
<!-- b1148 -->Responsável pelas denúncias: Isso aqui é um controle nosso. Isso daqui não fica com a gente. Isso daqui fica com o fiscal.
<!-- b1149 -->Beatriz: Ah, tá.
<!-- b1150 -->Responsável pelas denúncias: Ele devolve para gente só depois que esse negócio aqui está completo. Depois que acabou todo o negócio. Então se a gente precisar de um controle, de alguma coisa que não está com a gente, a gente precisa do caderno.
<!-- b1151 -->Isaque: Então você acha que seria bom colocar aquele caderno no sistema?
<!-- b1152 -->Responsável pelas denúncias: Hum. Eu, por mim...
<!-- b1153 -->Beatriz: Porque daí você conseguiria, por exemplo, filtrar por data, por exemplo, filtrar por nome.
<!-- b1154 -->Isaque: Ou por protocolo mesmo.
<!-- b1155 -->Beatriz: Ah, como o número do protocolo, como que funciona?
<!-- b1156 -->Responsável pelas denúncias: Por ordem crescente. É, por ordem crescente. Esse aqui é o 12º desse ano. Os números... a numeração de protocolo aqui é simples, vai por ordem crescente e por ano. Então, 2026, começa no 1, 1, 2, 3, 4, 5, 6. Ano passado aqui, esse aqui é do ano passado. A gente teve um total de 273 processos no decorrer do ano. Assim, você vê a numeração é simples, 237, então, 237, aí acabou o ano, voltou para o 1, só que esse aqui é agora 2026. A numeração é por ano e crescente. Uma contagem simples. Ah, então assim, eu até acho que seria bom sim, se a gente colocasse isso num sistema. Um dos problemas para a gente: tudo, tudo ultrapassado. Tudo ultrapassado. Se eu abri as especificações desse computador aqui, eu fiquei meio assustado da primeira vez. Quando eu comecei a trabalhar com esse computador aqui, que antes eu trabalhava ali na recepção. Aquele ali não dá nem para abrir as especificações. Se você começar a pedir muita coisa, ele já trava. Se você fizer mais do que uma coisa de cada vez naquele ali, já trava. Então assim, você tá aberto no sistema para fazer o atendimento e você abre as configurações, ele já começa a engasgar. Esse daqui, ó, também, lerdo toda vida.
<!-- b1157 -->Isaque: No livro o senhor coloca quais dados da denúncia?
<!-- b1158 -->Beatriz: Já dá para ver já.
<!-- b1159 -->Responsável pelas denúncias: Nome, endereço e o telefone, e no caso de ser exame de raiva, coloco o e-mail do munícipe também, porque a gente tem que mandar o resultado para eles, aí a gente manda para o e-mail.
<!-- b1160 -->Isaque: Ah.
<!-- b1161 -->Responsável pelas denúncias: Então é isso, nome, endereço e e-mail. Agora tem uns outros casos. Putz, aí eu tenho que mostrar um caso. Aqui, ó, essa folha aqui que a gente preenche. Aqui, ó. Tem o nome aqui de quem atendeu, a data, o nome do munícipe, o endereço dele e tal, o telefone, o CPF. É, esse aqui é um pouquinho mais antigo. Tem também um espaço para o e-mail. Mas aí, nos casos que a denúncia era contra outra pessoa, por exemplo, tal pessoa tava fazendo maus-tratos, como no caso a gente não tá mais recebendo denúncias por maus-tratos, mas assim, tal pessoa tá fazendo isso, no caso, assim, é uma questão sanitária que nem a criação irregular de galinhas ali, não é dele, é de outro, é do vizinho dele. Aí a gente pega também isso aqui, olha só. O nome do denunciante, esse aqui é o denunciado. Então, o nome da pessoa, o endereço dela, telefone, o CPF. Claro que dificilmente o cara vai ter o CPF, por exemplo, mas todas as informações possíveis do denunciado. Então, tem isso. E depois a assinatura do reclamante. Mas assim, esse aqui não tá sendo mais muito útil agora que a gente não tá mais pegando maus-tratos. Ah, quando eu pegava maus-tratos, aí era porque toda hora era denunciando alguém. É aqui, ó, só, especificação do sistema. Vocês fazem ciência da computação, né?
<!-- b1162 -->Isaque: Não, não, a gente faz Análise e Desenvolvimento de Sistemas.
<!-- b1163 -->Responsável pelas denúncias: Ah, sim, sim. Eu confundi. Ah, mas vocês vão entender melhor do que eu. Eu assim, do pouco que eu entendo eu já vi assim, putz, essa máquina não é lá essas coisas. Até para abrir um Sobre, ele já travou de novo.
<!-- b1164 -->Beatriz: Cria paciência, né?
<!-- b1165 -->Responsável pelas denúncias: Olha as especificações.
<!-- b1166 -->Beatriz: Nossa, dois de RAM?
<!-- b1167 -->Responsável pelas denúncias: Pois é, só 1,75 utilizado, então tem que ser um sistema leve porque os nossos computadores... até a prefeitura... até acontecer alguma coisa, esse negócio de sei lá pegar fogo, prefeitura não vai mandar dar um computador novo para a gente.
<!-- b1168 -->Isaque: Está funcionando, está bom.
<!-- b1169 -->Beatriz: É. Funcionando naquelas.
<!-- b1170 -->Responsável pelas denúncias: É, funcionando na cadeira de rodas. Cadeira de rodas, sendo alimentado por tubo. Isso aqui para ligar, é uma luta todo dia para ligar esse negócio. Para desligar fica meia hora desligando. É, então, você vê aqui a especificação, os computadores, e esse daqui é um dos piores, mas nenhum deles está muito melhor. Todos os computadores aqui são bem assim... bem de dar pena, então se o sistema que vocês desenvolverem for mais leve, a gente vai agradecer, porque ele vai, se não precisar, se não exigir muito do computador, vai agradecer, porque se exigir um pouquinho mais, pode ter o melhor sistema possível, mas não vai rodar.
<!-- b1171 -->Beatriz: E a internet aqui é boa?
<!-- b1172 -->Responsável pelas denúncias: É instável pra dedéu, cai toda hora, é lerda. Ai, meu Deus do céu. Deixa eu mostrar aqui a internet. É que eu tava abrindo uns negócio aqui. Eu faço, como é que é mesmo? Eu faço design de animação. Eu tô querendo fazer um projeto de stop motion. Tava vendo uns boneco para eu comprar. Aqui, vamos na Amazon. Aqui, ó, a gente tá com um negócio que é... eu tava vendo aqui para comprar para fazer um projeto meu. Olha só, lerdo, lerdo, lerdo, tá, tudo bem, uma página, tudo bem, começa a abrir mais, o negócio começa a travar. Aqui olha, esse aqui que a gente usa, esse aqui que a gente usa. Esse daqui nem abre, esse sistema aqui, que é da internet, mas ele não abre. Aqui olha, já começou a travar. Tá vendo, já está capengando o computador. Está travando, esse daqui nem abre, e esse daqui eu preciso usar esse daqui. Então, toda vez que eu preciso usar esse aqui, eu tenho que ir no computador deles para poder mexer nisso aqui.
<!-- b1173 -->Beatriz: Esse é qual?
<!-- b1174 -->Responsável pelas denúncias: Esse é o VivoPet.
<!-- b1175 -->Secretária: É o que a gente faz os pedidos de vacina antirrábica para GBE.
<!-- b1176 -->Responsável pelas denúncias: É, quem faz isso mais é ela e a Albertina, quando a Albertina não tá de férias. E esse aqui eu não tenho nenhum usuário, esse daqui. Ah, mas então, é isso. A gente vai dando do jeito que dá. Não tem muito assim. Não tem, a gente não pode dizer que tem as melhores coisas, assim, pelo menos tá, pelo menos tá abastecido alguns remédios, outros a gente tá precisando economizar. Mas fora isso... um sistema... a gente tem um sistema para controle dos remédios, né, Secretária?
<!-- b1177 -->Secretária: É, o SISSAÚDE da recepção.
<!-- b1178 -->Responsável pelas denúncias: É, então, a gente tem um sistema que eu não mexo, nesse aí eu não mexo. Beatriz: Ah, aquele lá que a senhora mostrou é para medicamento também.
<!-- b1179 -->Veterinária II: Isso, também. Não é só para os veterinários, tem a parte administrativa também.
<!-- b1180 -->Responsável pelas denúncias: No caso, seria a parte administrativa, né? Mas aí... mais alguma coisa que vocês precisam saber?
<!-- b1181 -->Beatriz: Não, é mais isso, que a gente queria saber como que funcionava as denúncias mesmo.
<!-- b1182 -->Responsável pelas denúncias: É, as denúncias agora, assim, geralmente assim, quando a gente atendia maus-tratos a gente estava tendo mais. Agora que maus-tratos virou jurisdição da GEPAR, agora tá um pouco mais tranquilo. Agora a gente só tá pegando mais questão de doença mesmo. O que a gente precisa é, assim, um formulário para preencher qual tipo de doença que a gente vai investigar. O problema... já teve um caso ano passado que o munícipe veio aqui, ele teve contato com morcego. Pegou o morcego na mão, tal, aí ficamos: "Putz, grila", a gente abriu aqui o processo, mas falou para ele: "Ó, daqui você vai direto para o SAMU, você não vai para casa". Porque você pegou o morcego na mão, não devia ter pegado. E se por acaso esse bicho te infectou, ele lambeu sua mão bem num lugar que tem uma rachadura microscópica na pele, mas foi o suficiente para a saliva entrar, e se a doença manifestar em você... a doença pode ficar dormente até 1 ano dentro da pessoa, da raiva. Pode ficar até um ano dormente, mas se manifestou o primeiro sintoma, você é um homem morto. Não tem o que fazer. A raiva é 100% de taxa de mortalidade, não existe cura. Não existe cura, não existe tratamento. A única coisa que você pode fazer: você foi infectado, enquanto tá nesse período de incubação que o vírus tá dormente, você pode ser administrado vacina e aí resolve. Mas se manifestou, se o vírus ativou, manifestou, tchau, já faz o seu, prepara as suas coisas que você está indo embora, e você está indo embora em menos de 15 dias, é rápida a doença, é bem rápida. É, então assim, a gente tem que ter assim um sistema que leva em conta se o munícipe teve contato ou não com a doença. É raro ter contato, esse foi um caso só ano passado, foi um caso só, graças a Deus não teve mais. Assim, se o sistema é também isso aí. As doenças, datas, se o processo é retroativo ou não, uma numeração simples. Vocês precisam saber de mais alguma coisa para fazer o sistema?
<!-- b1183 -->Beatriz: Acho que não.
<!-- b1184 -->Isaque: Quando eles vêm fazer denúncia aqui, eles vêm falar com o senhor aqui, ou falam na recepção, depois ela passa para o senhor.
<!-- b1185 -->Responsável pelas denúncias: Ah, eles falam ali na recepção, aí eles passam aqui para mim. Falam assim: "Ah, é com ele ali dentro". Aí eles passam aqui, sentam na cadeira, a gente conversa, eu pego os dados e a gente abre o processo. É simples, é rápido, mas assim, é tudo por enquanto, tudo no papel. A gente precisava modernizar, mas também é difícil modernizar com as máquinas assim de 1999.
<!-- b1186 -->PARTE 5: AGENDAMENTO E INFORMAÇÕES FINAIS
<!-- b1187 -->Veterinária II: De ligações pelo WhatsApp. Ligação é só no telefone fixo, né? É, mas a maioria é gente interessada em castrar o animal, né?
<!-- b1188 -->Beatriz: Você pode me mostrar um pouco?
<!-- b1189 -->Isaque: Teria como fazer o agendamento pelo site?
<!-- b1190 -->Veterinária II: Não, o agendamento é só pessoal, porque tem que trazer documento. Porque assim, existe uma lei que regulamenta o nosso serviço que é para pessoas de baixa renda, então a pessoa precisa trazer o comprovante de renda e residência.
<!-- b1191 -->Isaque: Então o site seria só informativo.
<!-- b1192 -->Veterinária II: Isso, mais informação.
<!-- b1193 -->Secretária: Aí, todos os bairros próximos da Cidade Nova, são para depois da Valdomiro Correia, são todas as zonas da Vila Martins. Então, a gente também encaminha para eles quando é o caso. Só que lá eles não têm WhatsApp. Aí, a gente só coloca a mensagem de que pertence à Vila Martins para eles entrarem em contato pelo telefone fixo deles. E acho que é basicamente isso.
<!-- b1194 -->Isaque e Beatriz: Obrigado. _____________________________________________________________________
<!-- b1195 -->Fim da Transcrição
<!-- b1197 --># APÊNDICE D – REGISTRO FOTOGRÁFICO DA VISITA AO CCZ DE ITU
<!-- b1198 -->Este apêndice reúne as fotografias feitas pelos autores na visita ao CCZ de Itu em 9 de janeiro de 2026: telas da plataforma AnimalTag, ficha física de controle do canil, planilhas em uso, formulários dos processos sanitários e instalações. Os dados pessoais de munícipes e funcionários foram ocultados, em observância à Lei nº 13.709/2018 (LGPD).
<!-- b1200 -->Ficha em papel preenchida à mão para cada animal recolhido, com raça, porte, pelagem, sexo, microchip, vacinas, procedimentos e destino (adotado, resgatado, óbito ou eutanásia). Esses campos deram origem às entidades Animal, Vacinação, Procedimento e Adoção.
<!-- b1201 -->Figura 48 – Ficha física de controle do canil
<!-- b1202 --> ![rId78](image31.jpeg)
<!-- b1203 -->Fonte: Acervo dos autores (2026).
<!-- b1204 -->Planilha eletrônica que reúne os animais alojados por baia, com porte, sexo, cor da pelagem, raça e castração. É o controle de ocupação que o SISZOO substitui (RF-A02).
<!-- b1205 -->Figura 49 – Planilha de registro dos animais do canil
<!-- b1206 --> ![rId79](image32.jpeg)
<!-- b1207 -->Fonte: Acervo dos autores (2026).
<!-- b1208 -->Páginas seguintes da planilha, que mostram o volume de registros mantidos manualmente.Figura 50 – Planilha de animais do canil com marcação por cores
<!-- b1209 -->Figura 50 – Continuação da planilha de animais do canil
<!-- b1210 --> ![rId80](image33.jpeg)
<!-- b1211 -->Fonte: Acervo dos autores (2026)
<!-- b1213 -->Planilha em que os processos são registrados com data de abertura, doença, responsável, espécie, idade, sexo, bairro, resultado e observações, com o andamento indicado por cores. Serviu de base para o Módulo de Processos Sanitários.
<!-- b1214 -->Figura 51 – Planilha de controle dos processos sanitários
<!-- b1215 --> ![rId81](image34.jpeg)
<!-- b1216 -->Fonte: Acervo dos autores (2026)
<!-- b1218 -->Capa em papel do processo, com carimbo de protocolo numerado (007) e datado, e quadro de movimentação entre setores. Evidencia a numeração sequencial por ano, que o SISZOO padroniza no formato 0000/AAAA.
<!-- b1219 -->Figura 52 – Capa de processo sanitário em manuseio
<!-- b1220 --> ![rId82](image35.jpeg)
<!-- b1221 -->Fonte: Acervo dos autores (2026)
<!-- b1223 -->Ficha padronizada de notificação e investigação, com identificação do cão, do proprietário e lista de sinais e sintomas. A lista deu origem ao catálogo Sintoma do SISZOO.
<!-- b1224 -->Figura 53 – Ficha de notificação de cão com suspeita de leishmaniose visceral
<!-- b1225 --> ![rId83](image36.jpeg)
<!-- b1226 -->Fonte: Acervo dos autores (2026)
<!-- b1228 -->Requisição emitida no Gerenciador de Ambiente Laboratorial com caracterização do animal, tipo de abrigo, contato com humanos, nível de contato, material biológico e meio de transporte da amostra. Esses dados deram origem à entidade AmostraAnimal.
<!-- b1229 -->Figura 54 – Requisição de exame no GAL
<!-- b1230 --> ![rId84](image37.jpeg)
<!-- b1231 -->Fonte: Acervo dos autores (2026)
<!-- b1232 -->Etiqueta com código de barras que identifica a amostra no GAL. O número é registrado no SISZOO para rastreabilidade (campo número GAL).
<!-- b1233 -->Figura 55 – Etiqueta de protocolo do GAL
<!-- b1234 --> ![rId85](image38.jpeg)
<!-- b1235 -->Fonte: Acervo dos autores (2026)
<!-- b1236 -->Página com a pesquisa por biologia molecular e os dados da notificação no SINAN: agravo, CID (B55.0), número e data da notificação. O CID consta da tabela Doenca e o número da notificação é registrado no processo.
<!-- b1237 -->Figura 56 –  Requisição de exame molecular e notificação no SINAN
<!-- b1238 --> ![rId86](image39.jpeg)
<!-- b1239 -->Fonte: Acervo dos autores (2026)
<!-- b1241 -->Formulário com amostras, tipo, resultado (negativo, positivo, material inadequado), laboratórios de referência e evolução (óbito natural, eutanásia, outro). Deu origem aos tipos ResultadoLaboratorial e DesfechoAnimal e ao catálogo Laboratório.
<!-- b1242 -->Figura 57 – Folha de coleta e exame laboratorial
<!-- b1243 --> ![rId87](image40.jpeg)
<!-- b1244 -->Fonte: Acervo dos autores (2026).
<!-- b1245 -->Gráficos impressos com a distribuição de casos suspeitos por doença e de raiva por espécie (canino, felino, quiróptero, primata não humano), montados manualmente pela equipe. Correspondem aos indicadores do painel do SISZOO (RF-D01).
<!-- b1246 -->Figura 58 – Gráficos de casos suspeitos de zoonoses afixados em mural
<!-- b1247 --> ![rId88](image41.jpeg)
<!-- b1248 -->Fonte: Acervo dos autores (2026)
<!-- b1251 -->Gráficos de resultados positivos e negativos de leishmaniose visceral canina e esporotricose felina, também montados manualmente.
<!-- b1252 -->Figura 59 – Gráficos de resultados laboratoriais afixados em mural
<!-- b1253 --> ![rId89](image42.jpeg)
<!-- b1254 -->Fonte: Acervo dos autores (2026)
<!-- b1256 --># APÊNDICE E – TELAS DOS RELATÓRIOS DO SISZOO
<!-- b1257 -->Este apêndice apresenta as telas dos relatórios específicos do SISZOO, descritos no Quadro 11.
<!-- b1258 -->Figura 49 – Tela T18: Relatório anual de processos
<!-- b1259 -->[INSERIR CAPTURA DA TELA T18 – RELATÓRIO ANUAL DE PROCESSOS]
<!-- b1260 -->Fonte: Elaborado pelos autores (2026).
<!-- b1261 -->Figura 50 – Tela T19: Relatório de vacinação
<!-- b1262 -->[INSERIR CAPTURA DA TELA T19 – RELATÓRIO DE VACINAÇÃO]
<!-- b1263 -->Fonte: Elaborado pelos autores (2026).
<!-- b1264 -->Figura 51 – Tela T20: Relatório de adoções
<!-- b1265 -->[INSERIR CAPTURA DA TELA T20 – RELATÓRIO DE ADOÇÕES]
<!-- b1266 -->Fonte: Elaborado pelos autores (2026).
<!-- b1267 -->Figura 52 – Tela T21: Relatório de procedimentos
<!-- b1268 -->[INSERIR CAPTURA DA TELA T21 – RELATÓRIO DE PROCEDIMENTOS]
<!-- b1269 -->Fonte: Elaborado pelos autores (2026).
<!-- b1270 -->Figura 53 – Tela T22: Relatório de ocupação de baias
<!-- b1271 -->[INSERIR CAPTURA DA TELA T22 – RELATÓRIO DE OCUPAÇÃO DE BAIAS]
<!-- b1272 -->Fonte: Elaborado pelos autores (2026).
<!-- b1273 -->Figura 54 – Tela T23: Relatório de ocorrências por bairro
<!-- b1274 -->[INSERIR CAPTURA DA TELA T23 – RELATÓRIO DE OCORRÊNCIAS POR BAIRRO]
<!-- b1275 -->Fonte: Elaborado pelos autores (2026).
<!-- b1277 --># ANEXO A – PLANILHAS DE CONTROLE DO CCZ DE ITU
<!-- b1278 -->Este anexo reproduz trechos das planilhas eletrônicas utilizadas pelo CCZ de Itu para o controle dos animais do canil e dos processos sanitários, cedidas pela unidade. Os nomes e bairros dos munícipes foram substituídos por “XXX”.
<!-- b1280 -->A planilha organiza os cães por baia, com número do microchip, gênero, porte, cor da pelagem, raça e castração (OSH/orquiectomia). A quantidade de animais em cada baia é digitada manualmente abaixo de cada grupo. Os campos e a contagem por baia correspondem às entidades Animal e Baia e ao controle de ocupação do SISZOO (RF-A02).
<!-- b1281 -->Figura 60 - Trecho da planilha “Animais do Canil”
<!-- b1282 --> ![rId90](image43.png)
<!-- b1283 -->Fonte: Centro de Controle de Zoonoses de Itu (2026).
<!-- b1284 -->Lista de cães e gatos com espécie, nome, raça, sexo e situação (disponível para adoção, falecido, adotado). Os registros de animais falecidos ficam destacados em vermelho. Os valores correspondem ao destino do animal registrado na saída e na adoção do SISZOO.
<!-- b1286 -->Figura 61 - Trecho da planilha “Animais do Canil”: cães e gatos por situação
<!-- b1287 --> ![rId91](image44.png)
<!-- b1288 -->Fonte: Centro de Controle de Zoonoses de Itu (2026).
<!-- b1290 -->Os processos sanitários são registrados com número de protocolo, data de abertura, doença, responsável, espécie, idade e sexo do animal, bairro, resultado, data do resultado e observações. Cada doença tem uma cor, e a contagem de casos de raiva por espécie, ao final, é feita à mão. Essa contagem dá origem aos gráficos do mural (Apêndice D). Os campos correspondem à entidade ProcessoSanitario, e a contagem, aos indicadores do painel (RF-D01).
<!-- b1291 -->Figura 62 - Trecho da planilha “Controle de Processos Zoonoses”: processos por doença
<!-- b1292 --> ![rId92](image45.png)
<!-- b1293 -->Fonte: Centro de Controle de Zoonoses de Itu (2026).
<!-- b1295 -->Os processos com amostra enviada ao laboratório e ainda sem resultado são separados em um bloco “AGUARDANDO RESULTADO”. Esse controle corresponde à situação “Aguardando resultado” do processo sanitário no SISZOO.
<!-- b1296 -->Figura 63 - Trecho da planilha “Controle de Processos Zoonoses”: processos aguardando resultado
<!-- b1297 --> ![rId93](image46.png)
<!-- b1298 -->Fonte: Centro de Controle de Zoonoses de Itu (2026).