<p align="center">
  <img src="public/trilho-logo.png" alt="Logo do Trilho" width="96" />
</p>

<h1 align="center">Trilho 🚂</h1>

<p align="center">
  <strong>Sua rotina, sobre trilhos.</strong><br />
  Um app de produtividade pensado para quem tem dificuldade em manter foco e organização no dia a dia — com um sistema de sequência (streak) gamificado e nada punitivo.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Ionic-8-3880ff?logo=ionic&logoColor=white" alt="Ionic 8" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Capacitor-8-119eff?logo=capacitor&logoColor=white" alt="Capacitor 8" />
  <img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3fcf8e?logo=supabase&logoColor=white" alt="Supabase" />
  <a href="https://github.com/JoaoLops3/Trilho/actions/workflows/secret-scan.yml"><img src="https://github.com/JoaoLops3/Trilho/actions/workflows/secret-scan.yml/badge.svg" alt="Secret scan" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licença-MIT-blue" alt="Licença MIT" /></a>
</p>

---

## 📖 Sobre o projeto

**Trilho** é um app de rotina diária construído com Ionic + React + Capacitor, com foco em pessoas que têm dificuldade de manter constância — incluindo o público com TDAH. A ideia central é simples: transformar a rotina em algo visual e acompanhável, sem culpa quando um dia falha.

O nome e a identidade visual usam a metáfora de um **trem em movimento**: cada dia de consistência avança o trem na linha; quando a sequência quebra, o trem simplesmente recomeça — sem contadores agressivos, sem "zerou tudo", sem pressão. É gamificação leve, não punitiva.

Diferenciais do projeto:

- **Foco no "agora"** — a tela inicial mostra a tarefa em andamento (com timer e anel de progresso) e só as próximas tarefas do dia, sem poluir com histórico.
- **Rotinas recorrentes** — o usuário cria uma rotina uma vez (ex.: "Estudar", seg/qua/sex, 25 min) e ela se repete automaticamente, sem precisar recriar a tarefa todo dia.
- **Streak gamificado com trem animado** — visual dedicado (`TrainStreakCard`) para a sequência de dias, com recorde pessoal e "pontos" da última semana.
- **Dark theme nativo** — paleta escura (obsidian/mint/coral/electric) pensada para uso à noite e para reduzir fadiga visual.
- **Local-first com sync na nuvem** — funciona 100% offline em `localStorage` e, ao criar conta, sincroniza tarefas, perfil, histórico e preferências entre dispositivos via Supabase.
- **Privacidade como cidadão de primeira classe** — tela de política de privacidade própria, consentimento explícito de analytics (PostHog) e exclusão de conta self-service.

## ✨ Funcionalidades

Extraído diretamente das telas e componentes em `src/`:

- **Início (`DashboardScreen`)** — saudação dinâmica (bom dia/boa tarde/boa noite), card da tarefa em andamento com timer circular (`ProgressRing`), ações rápidas de pausar/encerrar, e lista das próximas tarefas do dia.
- **Nova tarefa / Editar tarefa (`NewTaskSheet`)** — sheet modal para criar ou editar tarefas, com campos de título, categoria, prioridade, horário agendado e duração em horas + minutos (`DurationFields`); também funciona no modo de criação de rotina.
- **Rotinas (`RoutinesScreen`)** — CRUD de rotinas recorrentes: escolha de dias da semana, duração, horário, toggle de ativar/desativar e exclusão com confirmação. As rotinas geram tarefas automaticamente no dia correspondente.
- **Agenda (`AgendaScreen`)** — visão do dia agrupada em "Em Andamento", próximas (ordenadas por horário) e concluídas.
- **Estatísticas (`StatsScreen`)** — meta de foco diário (`StatsWidget`), tarefas e rotinas concluídas no dia (`DailyTasksCard`), sequência de dias com trem animado e recorde pessoal (`TrainStreakCard`), e gráfico de foco dos últimos 7 dias (`FocusWeekChart`).
- **Perfil (`ProfileScreen`)** — avatar gerado via **DiceBear** (estilo `toon-head`, com seletor dedicado `AvatarPickerSheet`), edição de nome/apelido, badge de sequência de dias, atalhos para rotinas/notificações/preferências, troca de senha, política de privacidade e exclusão de conta.
- **Preferências (`SettingsScreen`)** — formulário de preferências de notificação, meta diária de foco (`DailyGoalSettings`) e consentimento de analytics (`AnalyticsConsentSettings`).
- **Notificações (`NotificationsScreen` + `NotificationPreferencesScreen`)** — central de notificações in-app agrupada em Hoje/Ontem/Anteriores, com tipos como tarefa próxima, tarefa concluída, meta diária batida, marco/risco de sequência e tarefa atrasada; espelhado em notificações nativas via `@capacitor/local-notifications`.
- **Autenticação (`LoginScreen`, `SignUpScreen`, `ForgotPasswordScreen`)** — login/cadastro com Supabase Auth, recuperação de senha e deep link de confirmação (`auth-deeplink.ts`).
- **Importação de dados locais (`ImportLocalDataSheet`)** — ao logar por conta pela primeira vez, oferece migrar os dados já salvos localmente no aparelho para a nuvem.
- **Política de Privacidade (`PrivacyPolicyScreen`)** — texto próprio, com sheet de consentimento de analytics (`AnalyticsConsentSheet`) exibido antes de qualquer coleta.

## 🛠️ Tecnologias utilizadas

Baseado no `package.json`:

**Core**

- [React 18](https://react.dev/) + [React DOM](https://react.dev/)
- [Ionic React 8](https://ionicframework.com/docs/react) + `@ionic/react-router`
- [React Router DOM v5](https://v5.reactrouter.com/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/) (build e dev server)

**Mobile / nativo (Capacitor 8)**

- `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`
- `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`
- `@capacitor/local-notifications` — notificações push locais
- `@aparajita/capacitor-secure-storage` — armazenamento seguro (ex.: sessão de auth)
- `capacitor-native-settings`

**Backend / dados**

- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) — Postgres, Auth e RLS
- `localStorage` como camada local-first (`src/lib/storage.ts`)

**UI / UX**

- [Tailwind CSS 3](https://tailwindcss.com/) — tema dark customizado (`tailwind.config.js`)
- [Framer Motion 12](https://www.framer.com/motion/) — animações
- [lucide-react](https://lucide.dev/) — ícones
- [DiceBear](https://www.dicebear.com/) — geração dos avatares do perfil (via URL, sem dependência local)

**Observabilidade**

- [PostHog](https://posthog.com/) (`posthog-js`, `@posthog/react`) — analytics de produto com consentimento explícito

**Qualidade**

- ESLint 9 + `typescript-eslint`
- `tsc --noEmit` no pipeline de build

## 🏗️ Arquitetura / Estrutura do projeto

```
Trilho/
├── src/
│   ├── components/     # Componentes de UI reutilizáveis (cards, sheets, avatar, tab bar...)
│   ├── hooks/          # Hooks customizados (useHoldStepper, useKeyboardInset, useUpdateAvatar...)
│   ├── lib/            # Regra de negócio: contexts, storage, Supabase client, notificações, sync
│   │   └── sync/       # Sincronização local ↔ Supabase (cloud-sync.ts, mappers.ts)
│   ├── screens/        # Telas/páginas do app (uma por rota do App.tsx)
│   ├── theme/          # Variáveis de tema do Ionic (variables.css)
│   ├── types/          # Tipos TypeScript compartilhados (routine, avatar, notification, database)
│   ├── App.tsx          # Definição de rotas e providers globais
│   └── main.tsx         # Entry point da aplicação
├── supabase/
│   ├── migrations/     # Migrations SQL versionadas (schema, RLS, hardening)
│   ├── config.toml     # Configuração do projeto Supabase (CLI)
│   └── seed.sql         # Dados de seed para ambiente local
├── ios/                 # Projeto nativo iOS gerado/gerenciado pelo Capacitor
├── docs/                 # Documentação interna (auditorias de segurança, comportamento de sync)
├── public/               # Assets estáticos (fontes, logo)
├── .cursor/plans/ROADMAP.md  # Roadmap de desenvolvimento por fases
├── capacitor.config.ts  # Configuração do Capacitor (ícones, splash, plugins nativos)
├── tailwind.config.js   # Tema visual (cores obsidian/mint/coral/electric)
└── vite.config.ts       # Configuração de build (code-splitting, vendor chunks)
```

## ✅ Pré-requisitos

- **Node.js 20.x** (versão fixada em `.nvmrc` e em `engines` do `package.json`)
- **npm** (gerenciador de pacotes usado no projeto)
- **Xcode** — necessário apenas para build/execução no iOS via Capacitor (`npm run cap:ios`)
- **Conta no [Supabase](https://supabase.com/)** — necessária para login/cadastro e sincronização na nuvem; o app funciona localmente sem ela, mas as telas de autenticação dependem das variáveis de ambiente configuradas

> ℹ️ O projeto **não usa CocoaPods** — as dependências nativas do iOS são resolvidas via **Swift Package Manager** (`ios/App/CapApp-SPM`), padrão do Capacitor 8+. O Xcode baixa esses pacotes automaticamente ao abrir o workspace, sem passo manual de `pod install`.

## 🚀 Como rodar o projeto localmente

```bash
# 1. Clone o repositório
git clone https://github.com/JoaoLops3/Trilho.git
cd Trilho

# 2. Use a versão correta do Node (opcional, se usar nvm)
nvm use

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com suas chaves (veja a seção "Variáveis de ambiente" abaixo)

# 5. Rode o servidor de desenvolvimento (Ionic + Vite)
npm run dev
# abre em http://localhost:8100
```

Outros scripts disponíveis (`package.json`):

```bash
npm run build          # tsc --noEmit + build de produção (Vite)
npm run preview        # pré-visualiza o build de produção
npm run lint           # roda o ESLint
npm run typecheck      # roda apenas a checagem de tipos
npm run cap:sync       # builda e sincroniza os assets web com o projeto iOS
npm run cap:ios        # sincroniza e abre o projeto no Xcode
npm run cap:open:ios   # apenas abre o projeto iOS existente no Xcode
```

Para rodar no iOS: depois de `npm run cap:ios`, o Xcode abre com o workspace do Capacitor — selecione um simulador ou dispositivo e rode normalmente pela IDE.

## 🔐 Variáveis de ambiente

Baseado no `.env.example` (sem valores reais, apenas o que cada chave representa):

| Variável                 | Descrição                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `VITE_APP_URL`           | URL pública do app, usada nos redirects de autenticação do Supabase em produção (opcional em dev). |
| `VITE_POSTHOG_KEY`       | Chave de projeto do PostHog (segura para expor no bundle do cliente).                              |
| `VITE_POSTHOG_HOST`      | Host da API do PostHog (padrão: `https://us.i.posthog.com`).                                       |
| `VITE_SUPABASE_URL`      | URL do projeto Supabase — apenas o host (`https://xxxx.supabase.co`), sem `/rest/v1`.              |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (`anon`) do Supabase — a única chave que deve existir no app Capacitor.              |

> ⚠️ **Nunca** coloque `SUPABASE_SERVICE_ROLE_KEY`, JWT secret ou senha de banco em variáveis com prefixo `VITE_` — elas vão para o bundle do cliente. Chaves privilegiadas ficam restritas a Edge Functions / CI.

## 🗺️ Roadmap / Próximos passos

O projeto é desenvolvido em fases, documentadas em [`.cursor/plans/ROADMAP.md`](.cursor/plans/ROADMAP.md). Status resumido:

- ✅ **Fases 1–10** — persistência local, CRUD de tarefas, timer, estatísticas reais, navegação (Agenda), notificações in-app e nativas, seletor de avatar, performance.
- ✅ **Fase 11 — Login, conta e sync na nuvem (Supabase)** — schema com RLS, autenticação, sincronização multi-dispositivo. Pendente: push remoto via Edge Functions/FCM/APNs e ícones customizados de notificação.
- 🔄 **Fase 12 — Rotinas prontas / onboarding acolhedor** — oferecer templates de rotina para quem acabou de criar conta (foco em estudos, trabalho, saúde), pensados para TDAH.
- 📋 **Fase 13 — Agenda semanal** — visão da semana completa, não só do dia.
- 💡 **Fase 14 (futuro) — Rotina adaptativa** — sugestão de agenda com base no histórico real de uso (PostHog + Supabase).

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature ou correção (`git checkout -b feat/minha-feature`)
3. Siga os padrões de código já existentes (ESLint, TypeScript estrito, convenções de commit `feat:`/`fix:`/`docs:` usadas no histórico do projeto)
4. Rode `npm run lint` e `npm run typecheck` antes de abrir o PR
5. Abra um Pull Request descrevendo a mudança e o motivo

## 👤 Autor

**João Lopes**

- GitHub: [@JoaoLops3](https://github.com/JoaoLops3)
- LinkedIn: [João Gabriel Aguiar](https://www.linkedin.com/in/joaogabrielaguiar/)

## 📄 Licença

Este projeto está sob a licença **MIT** — veja o arquivo [`LICENSE`](LICENSE) para o texto completo.
