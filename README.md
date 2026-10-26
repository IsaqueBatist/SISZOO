# SISZOO - Sistema de Gerenciamento do CCZ de Itu

[![CI](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml)

Sistema web interno para o **Centro de Controle de Zoonoses (CCZ) de Itu/SP**, desenvolvido para substituir os controles manuais em papel e planilhas Excel utilizados atualmente na rotina do canil e no acompanhamento de processos sanitários.

> **TG (Trabalho de Graduação) - Análise e Desenvolvimento de Sistemas (ADS) | FATEC Itu | 2026**
> Orientador: Prof. Me. Francisco Bianchi
> Autores: Beatriz Silva de Camargo e Isaque Batista Barbosa

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Módulos](#módulos)
- [Stack tecnológica](#stack-tecnológica)
- [Regras de negócio críticas](#regras-de-negócio-críticas)
- [Perfis de usuário](#perfis-de-usuário)
- [Restrições de infraestrutura](#restrições-de-infraestrutura)
- [Como executar](#como-executar)
- [Dados fictícios](#dados-fictícios)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Limitações conhecidas](#limitações-conhecidas)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Licença](#licença)
- [Autores](#autores)

---

## Sobre o projeto

O CCZ de Itu (Vila Progresso) gerencia atualmente o canil e os processos de zoonoses por meio de fichas de papel, etiquetas físicas de vacinas e planilhas Excel multi-página. Esse fluxo gera fragmentação de dados, dependência de memória humana para reforços vacinais e ausência de indicadores automáticos.

O **SISZOO** digitaliza e centraliza esses processos em um sistema web leve, de uso exclusivamente interno (sem portal público para o cidadão), voltado aos funcionários do CCZ.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **A -  Gestão de Animais do Canil** | Cadastro de animais (microchip, medalha, procedência), gestão de baias, histórico clínico imutável (vacinações, procedimentos, prescrições, exames), anexos do animal e alertas de reforço vacinal |
| **B -  Processos Sanitários** | Registro e acompanhamento de zoonoses (raiva, esporotricose, leishmaniose visceral, leptospirose, febre maculosa, febre amarela): amostras, resultado laboratorial imutável, notificação por e-mail |
| **C -  Autenticação e Perfis de Acesso** | Login stateless via JWT, perfis com permissões fixas, política de senha e trilha de auditoria consultável |
| **D -  Dashboard e Relatórios** | Indicadores e gráficos com cache de 5 min, seis relatórios em PDF/CSV com histórico de exportações |
| **E -  Ocorrências e Denúncias** | Registro com protocolo anual, denunciante sigiloso/anônimo, anexos, movimentações e encerramento com providência |

## Stack tecnológica

**Backend**
- Java 21
- Spring Boot 4
- Maven
- Spring Data JPA / Hibernate

**Frontend**
- React 19
- TypeScript
- Vite (TanStack Query, React Router, react-hook-form + Zod, Recharts, IndexedDB para rascunhos)

**Banco de dados**
- PostgreSQL 16

**Autenticação**
- JWT (stateless)

## Regras de negócio críticas

- **Microchip** (e número da medalha) é identificador único do animal quando informado; o microchip não muda depois de definido.
- **Protocolo** de ocorrência e de processo segue o formato `NNN/AAAA`, sequencial por ano e por entidade, gerado pelo sistema.
- **Ocorrências sigilosas:** dados do denunciante são mascarados no servidor para quem não tem a permissão `denunciante_sigiloso` (Administrador e Agente Sanitário a têm); cada acesso e cada recusa geram evento de auditoria (LGPD).
- **Contato humano-animal:** processos com essa característica são marcados como urgentes e aparecem no topo das listagens.
- **Imutabilidade:** vacinações, procedimentos, prescrições, exames e resultados laboratoriais nunca são editados ou excluídos — a correção é um novo registro que retifica o anterior, com auditoria; o resultado positivo é definitivo.
- **Alerta vacinal:** reforços são sinalizados com 7 dias de antecedência.
- **Resultado "Positivo" ou "Inconclusivo"** em processo sanitário dispara notificação ao munícipe por e-mail (uma vez por resultado; reenvio manual).
- **Laudo de eutanásia** é obrigatório ao registrar óbito por eutanásia.

## Perfis de usuário

| Perfil | Função |
|--------|--------|
| Administrador | Acesso total: usuários, trilha de auditoria, animais, ocorrências (inclusive denunciante sigiloso), processos e relatórios |
| Veterinário | Animais, baias e histórico clínico (leitura e escrita), processos sanitários (leitura e escrita), relatórios; sem acesso a ocorrências |
| Agente Sanitário | Ocorrências e denúncias (leitura e escrita, inclusive denunciante sigiloso), processos sanitários (leitura e escrita), consulta de animais, relatórios |

## Restrições de infraestrutura

- Computadores com **~2 GB de RAM** → o sistema deve ser **leve**.
- **Internet instável** → formulários devem preservar dados em caso de queda de rede.
- Acesso **exclusivamente via navegador** (Chrome, Edge ou Firefox).

## Como executar

> Pré-requisitos: Java 21, Node.js 18+, PostgreSQL 16 e Docker (para os testes
> de integração com Testcontainers). O Maven não precisa estar instalado à
> parte — o projeto já traz o Maven Wrapper (`./mvnw`).

### Backend

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo
export DB_USER=postgres
export DB_PASSWORD=postgres
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**E-mail (opcional):** a notificação ao munícipe sai pelo SMTP de `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e afins. Sem elas, o backend sobe
normalmente e cada envio só gera um aviso no log. No desenvolvimento, use um
SMTP sandbox (Mailtrap/Ethereal), nunca uma caixa real. Variáveis, sandbox e
testes com GreenMail: [docs/email.md](docs/email.md).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend sobe por padrão em `http://localhost:5173` e consome a API em `http://localhost:8080`.

## Dados fictícios

O backend tem um **seed de dados fictícios** (`com.siszoo.seed`) para testar o sistema com dados no banco, sem mocks
na aplicação. Ele chama os mesmos services da API: as regras de negócio, os protocolos, a ficha completa, o sigilo e a
auditoria são os de verdade. Decisões e detalhes: [docs/decisoes/seed-dev.md](docs/decisoes/seed-dev.md).

**Com Docker (mais simples):** um comando sobe banco, backend e frontend com os dados fictícios, em containers e
volume próprios (projeto `siszoo-seed`, separado do `docker compose up` normal; pare um antes de subir o outro, porque as
portas são as mesmas):

```bash
docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build
# front em http://localhost:5173; para recomeçar do zero: ... down -v
```

O `docker-compose.seed.yml` troca o perfil do backend para `dev,seed` e traz chave JWT e admin inicial de
desenvolvimento. **Nunca use esse arquivo num servidor.**

**Sem Docker para o backend:** pré-requisitos são PostgreSQL com um database **vazio** (ou já semeado por este seed),
`JWT_SECRET` e o admin inicial (`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`), que é quem cria os usuários fictícios.

```bash
docker compose up -d db                                   # só o Postgres
docker exec siszoo-db-1 createdb -U postgres siszoo_seed   # database novo para o seed
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/siszoo_seed DB_USER=postgres DB_PASSWORD=postgres
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SEED_EMAIL=admin.sistema@itu.sp.gov.br ADMIN_SEED_PASSWORD=Ccz-Dev-Itu-2026
SISZOO_SEED_HABILITADO=true ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev,seed
```

No PowerShell: `$env:SISZOO_SEED_HABILITADO = "true"` (e as demais com `$env:`), depois
`.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev,seed"`. O seed roda na subida, depois das migrations, e
registra no log quantos registros criou.

**Usuários** (todos fictícios, senha única **`Ficticio#2026`**):

| Perfil | E-mail |
|---|---|
| Administrador | `marta.siqueira.seed@itu.sp.gov.br` |
| Veterinário | `renato.albuquerque.seed@itu.sp.gov.br`, `camila.prado.seed@itu.sp.gov.br` |
| Veterinário (primeiro acesso: o login pede a troca de senha) | `helena.duarte.seed@itu.sp.gov.br` |
| Agente Sanitário | `paulo.teixeira.seed@itu.sp.gov.br`, `juliana.moreira.seed@itu.sp.gov.br`, `rafael.campos.seed@itu.sp.gov.br` |
| Agente Sanitário (desativado) | `sergio.lacerda.seed@itu.sp.gov.br` |

**O que é criado:**
- 6 baias;
- 32 animais com histórico clínico: vacinas vencendo e vencidas, procedimentos, prescrições, exames, anexos e
  retificações;
- 26 ocorrências (sigilosas, anônimas, em todos os status);
- 24 processos sanitários (todos os status e doenças, resultados positivos e retificados);
- categorias e medicamentos;
- uma exportação de cada relatório.

O suficiente para paginação, filtros, os 7 alertas e os gráficos do dashboard.

**Executar de novo:** basta subir o backend com o mesmo perfil. O seed é idempotente: cada passo tem uma chave em
`seed_controle`, e o que já existe é pulado, sem duplicar nem alterar nada. Para recomeçar do zero, recrie o database
(`docker exec siszoo-db-1 dropdb -U postgres siszoo_seed` e `createdb` de novo). Registros clínicos, processos e
auditoria não podem ser apagados (triggers das migrations), então o seed nunca limpa tabelas.

**Por que não roda em produção:**
- o seed só existe com o perfil `seed` **e** `SISZOO_SEED_HABILITADO=true`;
- o perfil `seed` exige `dev` ou `test` e derruba a subida se `docker` ou `prod` estiver ativo;
- num banco que já tem dados que não vieram dele, o seed recusa antes de gravar qualquer coisa;
- o `docker-compose.yml` e o `Dockerfile` não ligam o seed; só o `docker-compose.seed.yml`, de uso local, liga.

**Datas:** as datas de negócio (entrada, vacinação, abertura, resultado) são relativas ao dia da primeira execução e
congelam ali. Depois de alguns dias, vacinas "vencendo" viram "vencidas" e "registradas hoje" vai a 0; recrie o database
para renovar.

> **Importante (LGPD):** nunca versione dados reais de munícipes, denunciantes ou animais. O seed usa só dados fictícios:
> CPF vazio, telefones inválidos de propósito e e-mails no domínio reservado `exemplo.test`.

## Variáveis de ambiente

Exemplos em [`.env.example`](.env.example) (raiz, usado pelo `docker-compose.yml`) e em `frontend/.env.example`.

| Variável | Onde | Uso |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | docker-compose | Banco do container `db` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | backend (`dev`, `docker`, `prod`) | Conexão JDBC |
| `JWT_SECRET` | backend | Chave do JWT, 32 bytes ou mais (sem ela o backend não sobe) |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | backend | Admin inicial criado na primeira subida (`DataSeeder`); vazio = não cria |
| `SISZOO_SEED_HABILITADO` | backend (perfil `seed`) | `true` liga o seed de dados fictícios (só com `dev`) |
| `SISZOO_CORS_ORIGIN` | backend | Única origem do frontend aceita pela API |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS*`, `SMTP_SSL` | backend | E-mail ao munícipe ([docs/email.md](docs/email.md)) |
| `SISZOO_MAIL_FROM` | backend | Remetente dos e-mails |
| `VITE_API_BASE_URL` | frontend (build) | URL da API |
| `VITE_USE_MOCK_KPIS`, `VITE_USE_MOCK_GRAFICOS` | frontend (build) | Só `"true"` liga dados de demonstração no dashboard (com selo); ausente = dados reais |

## Limitações conhecidas

- **Adoções:** o dashboard e o relatório mostram o retrato atual (animais adotados e disponíveis). Não há "adoções no
  mês" nem meta mensal, porque a tabela `adocao` do DER não foi implementada.
- **Busca global:** não há busca global no topo das telas; cada listagem tem os próprios filtros.
- **Catálogos:** vacinas, tipos de procedimento e de exame, doenças, laboratórios e demais catálogos vêm das migrations;
  não há tela de cadastro deles.
- **Medicamentos:** não há edição ou desativação de medicamento na interface (só cadastro e listagem).
- **Seed:** o "Tempo médio (h)" do relatório Ocorrências por Bairro fica ≈0 h para as ocorrências encerradas pelo seed,
  porque o registro e o encerramento são gravados no mesmo momento, com o horário real.

## Estrutura do repositório

```
siszoo/
├── backend/            # API Spring Boot (Java 21 + Maven)
├── frontend/           # Aplicação React 19 + TypeScript + Vite
├── docs/               # Documentação: DER, DBML, decisões, contratos, protótipo (índice em docs/README.md)
├── docs/tg/            # TG: análises de alinhamento, capturas, diagramas e scripts (o .docx fica fora do git)
├── docker-compose.yml  # Postgres, backend (perfil docker) e frontend
├── docker-compose.seed.yml # Override local: o mesmo stack com dados fictícios (perfis dev,seed)
├── .env.example        # Variáveis do docker-compose
├── .gitignore
├── LICENSE
└── README.md
```

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autores

- **Beatriz Silva de Camargo**
- **Isaque Batista Barbosa**

Trabalho de Graduação (TG) apresentado ao curso de Análise e Desenvolvimento de Sistemas da FATEC Itu, sob orientação do Prof. Me. Francisco Bianchi (2026).
