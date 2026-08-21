<div align="center">
  <img src="public/trilho-logo.png" alt="Logo do Trilho" width="96" />
  <h1>Trilho</h1>
</div>

**Sua rotina, sobre trilhos.**  
App de produtividade para quem tem dificuldade em manter foco e organização no dia a dia — com sequência (streak) gamificada e não punitiva.

![React 18](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)
![Ionic 8](https://img.shields.io/badge/Ionic-8-3880ff?logo=ionic&logoColor=white)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Capacitor 8](https://img.shields.io/badge/Capacitor-8-119eff?logo=capacitor&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3fcf8e?logo=supabase&logoColor=white)
![Licença MIT](https://img.shields.io/badge/licença-MIT-blue)

---

## Sobre o projeto

**Trilho** é um app de rotina diária construído com Ionic, React e Capacitor, voltado a quem tem dificuldade de manter constância — incluindo o público com TDAH. A proposta é tornar a rotina visual e acompanhável, sem culpa quando um dia falha.

O nome e a identidade visual usam a metáfora de um **trem em movimento**: cada dia de consistência avança o trem na linha; quando a sequência quebra, o trem recomeça — sem contadores agressivos nem pressão. Gamificação leve, não punitiva.

Diferenciais:

- **Foco no agora** — a tela inicial mostra a tarefa em andamento (timer e anel de progresso) e as próximas do dia, sem histórico poluindo a view.
- **Rotinas recorrentes** — o usuário define a rotina uma vez (ex.: "Estudar", seg/qua/sex, 25 min) e ela se repete automaticamente.
- **Streak com trem animado** — visual dedicado (`TrainStreakCard`) para a sequência de dias, com recorde pessoal e pontos da última semana.
- **Tema escuro nativo** — paleta obsidian/mint/coral/electric, pensada para uso noturno e menor fadiga visual.
- **Local-first com sync na nuvem** — funciona offline em `localStorage`; com conta, sincroniza tarefas, perfil, histórico e preferências via Supabase.
- **Privacidade em primeiro plano** — política de privacidade própria, consentimento explícito de analytics (PostHog) e exclusão de conta self-service.

## Funcionalidades

- **Início** (`DashboardScreen`) — saudação dinâmica, card da tarefa em andamento com timer circular (`ProgressRing`), ações de pausar/encerrar e lista das próximas tarefas do dia.
- **Nova / editar tarefa** (`NewTaskSheet`) — sheet para criar ou editar tarefas (título, categoria, prioridade, horário, duração em horas e minutos); também no modo de criação de rotina.
- **Rotinas** (`RoutinesScreen`) — CRUD de rotinas recorrentes: dias da semana, duração, horário, ativar/desativar e exclusão com confirmação. Geram tarefas no dia correspondente.
- **Agenda** (`AgendaScreen`) — visão do dia em "Em andamento", próximas (por horário) e concluídas.
- **Estatísticas** (`StatsScreen`) — meta de foco diário (`StatsWidget`), tarefas e rotinas concluídas (`DailyTasksCard`), sequência com trem animado (`TrainStreakCard`) e gráfico dos últimos 7 dias (`FocusWeekChart`).
- **Perfil** (`ProfileScreen`) — avatar via DiceBear (`toon-head`, `AvatarPickerSheet`), edição de nome/apelido, badge de sequência, atalhos para rotinas/notificações/preferências, troca de senha, privacidade e exclusão de conta.
- **Preferências** (`SettingsScreen`) — notificações, meta diária de foco (`DailyGoalSettings`) e consentimento de analytics (`AnalyticsConsentSettings`).
- **Notificações** (`NotificationsScreen`, `NotificationPreferencesScreen`) — central in-app (Hoje / Ontem / Anteriores) e notificações nativas via `@capacitor/local-notifications`.
- **Autenticação** (`LoginScreen`, `SignUpScreen`, `ForgotPasswordScreen`) — Supabase Auth, recuperação de senha e deep link de confirmação (`auth-deeplink.ts`).
- **Importação local** (`ImportLocalDataSheet`) — no primeiro login, oferece migrar dados locais do aparelho para a nuvem.
- **Política de privacidade** (`PrivacyPolicyScreen`) — texto próprio, com sheet de consentimento de analytics antes de qualquer coleta.

## Tecnologias

**Core**

- [React 18](https://react.dev/) + [React DOM](https://react.dev/)
- [Ionic React 8](https://ionicframework.com/docs/react) + `@ionic/react-router`
- [React Router DOM v5](https://v5.reactrouter.com/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)

**Mobile / nativo (Capacitor 8)**

- `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`
- `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`
- `@capacitor/local-notifications`
- `@aparajita/capacitor-secure-storage`
- `capacitor-native-settings`

**Backend / dados**

- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) — Postgres, Auth e RLS
- `localStorage` como camada local-first (`src/lib/storage.ts`)

**UI**

- [Tailwind CSS 3](https://tailwindcss.com/)
- [Framer Motion 12](https://www.framer.com/motion/)
- [lucide-react](https://lucide.dev/)
- [DiceBear](https://www.dicebear.com/) — avatares via URL

**Observabilidade**

- [PostHog](https://posthog.com/) (`posthog-js`, `@posthog/react`) — analytics com consentimento explícito

**Qualidade**

- ESLint 9 + `typescript-eslint`
- `tsc --noEmit` no pipeline de build

## Estrutura do projeto

```
Trilho/
├── src/
│   ├── components/     # UI reutilizável (cards, sheets, avatar, tab bar)
│   ├── hooks/          # Hooks customizados
│   ├── lib/            # Domínio: contexts, storage, Supabase, notificações, sync
│   │   └── sync/       # Sync local ↔ Supabase
│   ├── screens/        # Telas (uma por rota em App.tsx)
│   ├── theme/          # Variáveis de tema do Ionic
│   ├── types/          # Tipos compartilhados
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/     # Schema, RLS, hardening
│   ├── config.toml
│   └── seed.sql
├── ios/                # Projeto nativo Capacitor
├── docs/               # Docs internas (segurança, sync)
├── public/             # Assets estáticos
├── .cursor/plans/ROADMAP.md
├── capacitor.config.ts
├── tailwind.config.js
└── vite.config.ts
```

## Pré-requisitos

- **Node.js 20.x** (fixado em `.nvmrc` e em `engines` do `package.json`)
- **npm**
- **Xcode** — apenas para build/execução iOS (`npm run cap:ios`)
- **Conta [Supabase](https://supabase.com/)** — login, cadastro e sync; o app funciona localmente sem ela, mas as telas de auth dependem das variáveis de ambiente

O projeto **não usa CocoaPods**. As dependências nativas do iOS são resolvidas via **Swift Package Manager** (`ios/App/CapApp-SPM`), padrão do Capacitor 8+. O Xcode baixa os pacotes ao abrir o workspace — sem `pod install`.

## Como rodar localmente

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
# edite o .env (veja a seção "Variáveis de ambiente")

# 5. Servidor de desenvolvimento (Ionic + Vite)
npm run dev
# http://localhost:8100
```

Scripts disponíveis:

```bash
npm run build          # typecheck + build de produção
npm run preview        # preview do build
npm run lint           # ESLint
npm run typecheck      # checagem de tipos
npm run cap:sync       # build + sync dos assets com o projeto iOS
npm run cap:ios        # sync e abre no Xcode
npm run cap:open:ios   # abre o projeto iOS no Xcode
```

Para iOS: após `npm run cap:ios`, selecione um simulador ou dispositivo no Xcode e execute pela IDE.

## Variáveis de ambiente

| Variável                 | Descrição                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `VITE_APP_URL`           | URL pública do app, usada nos redirects de autenticação do Supabase em produção (opcional em dev). |
| `VITE_POSTHOG_KEY`       | Chave de projeto do PostHog (exposta no bundle do cliente).                                        |
| `VITE_POSTHOG_HOST`      | Host da API do PostHog (padrão: `https://us.i.posthog.com`).                                       |
| `VITE_SUPABASE_URL`      | URL do projeto Supabase (`https://xxxx.supabase.co`), sem `/rest/v1`.                              |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (`anon`) do Supabase — a única chave que deve existir no app Capacitor.              |

**Importante:** nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, JWT secret ou senha de banco em variáveis com prefixo `VITE_` — elas entram no bundle do cliente. Chaves privilegiadas ficam em Edge Functions / CI.

## Roadmap

Desenvolvimento por fases em [`.cursor/plans/ROADMAP.md`](.cursor/plans/ROADMAP.md). Status resumido:

- **Fases 1–10** — persistência local, CRUD de tarefas, timer, estatísticas, Agenda, notificações in-app e nativas, avatar, performance.
- **Fase 11 — Conta e sync (Supabase)** — schema com RLS, autenticação, sync multi-dispositivo. Pendente: push remoto (Edge Functions / FCM / APNs) e ícones customizados de notificação.
- **Fase 12 — Rotinas prontas / onboarding** — templates de rotina no primeiro uso (estudos, trabalho, saúde), pensados para TDAH.
- **Fase 13 — Agenda semanal** — visão da semana completa.
- **Fase 14 (futuro) — Rotina adaptativa** — sugestão de agenda com base no histórico real (PostHog + Supabase).

## Contribuição

1. Faça um fork do repositório
2. Crie uma branch (`git checkout -b feat/minha-feature`)
3. Siga os padrões do projeto (ESLint, TypeScript estrito, Conventional Commits: `feat:`, `fix:`, `docs:`)
4. Rode `npm run lint` e `npm run typecheck` antes do PR
5. Abra um Pull Request descrevendo a mudança e o motivo

## Autor

**João Lopes**

- GitHub: [@JoaoLops3](https://github.com/JoaoLops3)
- LinkedIn: [João Gabriel Aguiar](https://www.linkedin.com/in/joaogabrielaguiar/)

## Licença

MIT — veja [`LICENSE`](LICENSE).
