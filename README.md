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
| **A -  Gestão de Animais do Canil** | Cadastro de animais, gestão de baias, histórico veterinário e alertas de reforço vacinal |
| **B -  Processos Sanitários** | Registro e acompanhamento de zoonoses: raiva, esporotricose, leishmaniose, leptospirose e febre maculosa |
| **C -  Autenticação e Perfis de Acesso** | Login stateless via JWT e controle de acesso por perfil |
| **D -  Dashboard de Indicadores** | Gráficos automáticos de casos, resultados e ocupação, substituindo os gráficos manuais do mural |

## Stack tecnológica

**Backend**
- Java 21
- Spring Boot 4
- Maven
- Spring Data JPA / Hibernate

**Frontend**
- React 18
- TypeScript
- Vite

**Banco de dados**
- PostgreSQL 16

**Autenticação**
- JWT (stateless)

## Regras de negócio críticas

- **Microchip** é o identificador único de cada animal.
- **Protocolo de processo** segue o formato `NNN/AAAA`, sequencial por ano.
- **Processos sigilosos:** dados do denunciante ficam ocultos, exceto para o perfil Administrador.
- **Contato humano-animal:** processos com essa característica exibem alerta de urgência visual.
- **Imutabilidade:** registros críticos (histórico veterinário e processos) não são editados livremente — só são atualizados com registro de log.
- **Alerta vacinal:** reforços são sinalizados com 7 dias de antecedência.
- **Resultado "Positivo"** em processo sanitário dispara notificação ao munícipe por e-mail.

## Perfis de usuário

| Perfil | Função |
|--------|--------|
| Administrador | Acesso total, incluindo dados sigilosos de denunciantes |
| Veterinário | Gestão de animais, histórico veterinário e procedimentos |
| Agente Sanitário | Processos de zoonoses |

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

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend sobe por padrão em `http://localhost:5173` e consome a API em `http://localhost:8080`.

> **Importante (LGPD):** nunca versione dados reais de munícipes, denunciantes ou animais. Utilize apenas dados fictícios em seeds e fixtures.

## Estrutura do repositório

```
siszoo/
├── backend/            # API Spring Boot (Java 21 + Maven)
├── frontend/           # Aplicação React 18 + TypeScript + Vite
├── docs/               # Documentação: diagramas, DER, casos de uso, entrevistas
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
