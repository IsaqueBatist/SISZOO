# SISZOO - Sistema de Gerenciamento do CCZ de Itu

[![CI](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaqueBatist/SISZOO/actions/workflows/ci.yml)

Sistema web interno para o **Centro de Controle de Zoonoses (CCZ) de Itu/SP**, desenvolvido para substituir os controles manuais em papel e planilhas Excel utilizados atualmente na rotina do canil e no acompanhamento de processos sanitários.

> **TCC - Análise e Desenvolvimento de Sistemas (ADS) | FATEC Itu | 2026**
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

### Dados de teste (opcional)

Com o Postgres **e o backend no ar** (o backend aplica as migrations e cria as
vacinações, recalculando a ficha completa dos animais):

```bash
npm install
npm run db:seed     # usuários, baias, animais e histórico clínico fictícios
npm run test:seed   # confere a ficha completa dos animais semeados
```

O seed é idempotente. A API usada é `SEED_API_URL` (padrão `http://localhost:8080`, ver `.env.example`).
Num banco semeado por uma versão anterior do seed, a primeira execução corrige pela API a ficha completa
que aquela versão gravava errado (`ficha_corrigida_do_seed_anterior` na saída; ver
`docs/decisoes/ficha-completa-seed-fuso.md`).

> **Importante (LGPD):** nunca versione dados reais de munícipes, denunciantes ou animais. Utilize apenas dados fictícios em seeds e fixtures.

## Estrutura do repositório

```
siszoo/
├── backend/            # API Spring Boot (Java 21 + Maven)
├── frontend/           # Aplicação React 19 + TypeScript + Vite
├── docs/               # Documentação: DER, DBML, decisões, contratos, protótipo (índice em docs/README.md)
├── docs/tg/            # TG: análises de alinhamento, capturas, diagramas e scripts (o .docx fica fora do git)
├── scripts/            # Seed de dados fictícios (npm run db:seed)
├── .gitignore
├── LICENSE
└── README.md
```

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autores

- **Beatriz Silva de Camargo**
- **Isaque Batista Barbosa**

Trabalho de Conclusão de Curso apresentado ao curso de Análise e Desenvolvimento de Sistemas da FATEC Itu, sob orientação do Prof. Me. Francisco Bianchi (2026).
