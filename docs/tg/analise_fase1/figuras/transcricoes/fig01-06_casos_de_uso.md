# Transcrição – Figuras 1 a 6 (diagramas de casos de uso, PlantUML)

Legibilidade: todas legíveis em resolução original (image1–6.png; recortes fig02–fig06).

## Figura 1 – Diagrama de casos de uso geral (image1.png, 954×1168)
- Atores: Administrador, Veterinário, Agente Sanitário.
- Generalização: Administrador → Veterinário; Administrador → Agente Sanitário (setas de herança).
- Sistema "SISZOO" com 5 elipses (módulos):
  - "Módulo 1 - Autenticação e Controle de Acesso"
  - "Módulo 2 - Gestão de Animais do Canil"
  - "Módulo 3 - Ocorrências e Denúncias"
  - "Módulo 4 - Processos Sanitários"
  - "Módulo 5 - Dashboard e Relatórios"
- Associações: Veterinário → Módulo 2, Módulo 1, Módulo 5. Agente Sanitário → Módulo 1, Módulo 5, Módulo 3, Módulo 4. Administrador: só herança (sem associação direta).

## Figura 2 – Módulo 1: Autenticação e Controle de Acesso (image2.png, 2187×1023)
- Título do pacote: "Módulo 1 - Autenticação e Controle de Acesso".
- Atores: Veterinário, Agente Sanitário, Administrador (Administrador generaliza os dois).
- Casos de uso (7): Realizar Login; Encerrar Sessão; Editar Preferências; Desativar/Reativar Usuário; Consultar Trilha de Auditoria; Gerenciar Usuários; Atribuir Cargo e Permissões.
- Associações: Veterinário → Realizar Login, Encerrar Sessão, Editar Preferências. Agente Sanitário → Realizar Login, Encerrar Sessão, Editar Preferências. Administrador → Consultar Trilha de Auditoria, Gerenciar Usuários.
- Relações: Desativar/Reativar Usuário «extend» → Gerenciar Usuários (sem condição). Gerenciar Usuários «include» → Atribuir Cargo e Permissões.
- Notas: nenhuma.
- Diferenças de nome vs Apêndice A: "Encerrar Sessão" (diagrama) × "Encerrar Sessão (Logout)" (Quadro 17); "Editar Preferências" × "Editar Preferências do Usuário" (Quadro 18).

## Figura 3 – Módulo 2: Gestão de Animais do Canil (image3.png, 1810×1779)
- Título: "Módulo 2 - Gestão de Animais do Canil".
- Atores: Administrador (generaliza Veterinário), Veterinário.
- Casos de uso (12): Gerenciar Baias; Cadastrar Animal; Editar Dados do Animal; Transferir Animal de Baia; Consultar Animais por Baia; Prescrever Medicamento; Registrar Saída/Desfecho; Registrar Aplicação de Vacina; Registrar Procedimento Clínico; Registrar Exame; Registrar Adoção; Anexar Documento ao Animal.
- Associações: Administrador → Gerenciar Baias. Veterinário → Cadastrar Animal, Editar Dados do Animal, Transferir Animal de Baia, Consultar Animais por Baia, Prescrever Medicamento, Registrar Saída/Desfecho, Registrar Aplicação de Vacina, Registrar Procedimento Clínico, Registrar Exame.
- Relações: Registrar Adoção «extend» [destino = ADOTADO] → Registrar Saída/Desfecho. Anexar Documento ao Animal «extend» → Registrar Aplicação de Vacina; «extend» → Registrar Procedimento Clínico; «extend» → Registrar Exame (sem condição).
- Notas: nenhuma.
- Nomes idênticos aos Quadros 23–34.

## Figura 4 – Módulo 3: Ocorrências e Denúncias (image4.png, 1689×1252)
- Título: "Módulo 3 - Ocorrências e Denúncias".
- Atores: Administrador (generaliza Agente Sanitário), Agente Sanitário.
- Casos de uso (5): Consultar e Filtrar Ocorrências; Encerrar Ocorrência; Informar Denunciado; Anexar Documento à Ocorrência; Registrar Nova Ocorrência.
- Associações: Agente Sanitário → Consultar e Filtrar Ocorrências, Encerrar Ocorrência, Registrar Nova Ocorrência. Administrador: só herança.
- Relações: Informar Denunciado «extend» [há denunciado] → Registrar Nova Ocorrência. Anexar Documento à Ocorrência «extend» [há documento] → Registrar Nova Ocorrência.
- Notas: (ligada a Consultar e Filtrar Ocorrências) "Ocorrência sigilosa: dados do denunciante visíveis só para o Administrador (RN03)."; (ligada a Encerrar Ocorrência) "Bloqueado enquanto o processo sanitário vinculado não tiver resultado (RN05)."
- Nomes idênticos aos Quadros 35–39.

## Figura 5 – Módulo 4: Processos Sanitários (image5.png, 1500×1510)
- Título: "Módulo 4 - Processos Sanitários".
- Atores: Administrador (generaliza Agente Sanitário), Agente Sanitário.
- Casos de uso (6): Abrir Processo Sanitário; Registrar Resultado Laboratorial; Consultar e Filtrar Processos; Encerrar Processo; Gerar Documento do Processo; Registrar Animal Amostrado.
- Associações: Agente Sanitário → Abrir Processo Sanitário, Registrar Resultado Laboratorial, Consultar e Filtrar Processos, Encerrar Processo, Gerar Documento do Processo.
- Relações: Abrir Processo Sanitário «include» → Registrar Animal Amostrado.
- Notas: (ligada a Abrir Processo Sanitário) "Protocolo 0000/AAAA gerado pelo sistema (RN02). Contato humano-animal torna o processo urgente (RN04)."; (ligada a Registrar Resultado Laboratorial) "Positivo ou Inconclusivo: e-mail ao responsável e à Vigilância Epidemiológica (RN10)."
- Nomes idênticos aos Quadros 40–45.

## Figura 6 – Módulo 5: Dashboard e Relatórios (image6.png, 1589×1549)
- Título: "Módulo 5 - Dashboard e Relatórios".
- Atores: Veterinário, Administrador (generaliza Veterinário e Agente Sanitário), Agente Sanitário.
- Casos de uso (6): Consultar Alertas Vacinais; Monitorar Ocupação de Baias; Visualizar Dashboard; Solicitar Geração de Relatório; Baixar Relatório Gerado; Acompanhar Status do Relatório.
- Associações: Veterinário → Visualizar Dashboard, Acompanhar Status do Relatório, Solicitar Geração de Relatório. Agente Sanitário → Solicitar Geração de Relatório, Visualizar Dashboard, Acompanhar Status do Relatório. Administrador: só herança. Consultar Alertas Vacinais e Monitorar Ocupação de Baias não têm associação direta com ator (só «extend»).
- Relações: Consultar Alertas Vacinais «extend» → Visualizar Dashboard; Monitorar Ocupação de Baias «extend» → Visualizar Dashboard; Baixar Relatório Gerado «extend» [status = CONCLUIDO] → Acompanhar Status do Relatório.
- Notas: nenhuma.
- Diferença de nome: "Visualizar Dashboard" (diagrama) × "Visualizar Dashboard em Tempo Real" (Quadro 46).

## Síntese: 36 casos de uso nos diagramas = 36 quadros (16–51).
