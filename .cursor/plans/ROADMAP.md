# Roadmap — Núcleo Funcional do Trilho

> Origem: veredito do conselho (`/council`). O app hoje é uma casca bonita: tarefas
> hardcoded, nada persiste, stats falsas, só 1 tela. Antes de qualquer polimento novo,
> construir o **loop básico**: criar → concluir → persistir.
>
> Regra de ouro: faça **uma fase por vez**, do topo pra baixo. Fases 1–10 e a maior
> parte da **11** já estão na `main`; siga com o que falta na 11.3 ou avance para a 12.

---

## Fase 1 — Persistência local (a base de tudo)

**Objetivo:** o que está na tela sobrevive ao fechar o app.

- [x] Criar `src/lib/storage.ts` com `loadTasks()` / `saveTasks()` usando `localStorage`.
- [x] No `DashboardScreen`, inicializar o estado a partir de `loadTasks()` (lista vazia na 1ª vez — ver Fase 9.5).
- [x] Salvar em `localStorage` sempre que `tasks` mudar (`useEffect`).
- [x] Persistir mudança de status (concluir/pausar/ativar).

**Pronto quando:** marco uma tarefa como concluída, fecho e reabro o app → ela continua concluída.

**Arquivos:** `src/lib/storage.ts` (novo), `src/screens/DashboardScreen.tsx`

---

## Fase 2 — Criar tarefa

**Objetivo:** o usuário consegue adicionar a própria tarefa (fim do hardcoded).

- [x] Botão "+ Nova tarefa" (botão central da tab bar).
- [x] Modal/sheet com campos: título, categoria, duração, horário (opcional) e prioridade.
- [x] Ao salvar: gera `id`, status `pending`, `elapsed: 0`, e persiste (Fase 1).
- [x] Evento PostHog `task created`.

**Pronto quando:** crio uma tarefa nova do zero e ela aparece + persiste.

**Arquivos:** `src/components/NewTaskSheet.tsx` (novo), `DashboardScreen.tsx`

---

## Fase 3 — Editar e excluir tarefa

**Objetivo:** o menu `MoreVertical` (hoje decorativo) passa a funcionar.

- [x] Ação de excluir tarefa (com confirmação).
- [x] Ação de editar (reaproveita o sheet da Fase 2).
- [x] Persistir as mudanças.

**Pronto quando:** consigo editar e apagar qualquer tarefa, e some/atualiza ao reabrir.

**Arquivos:** `TaskCard.tsx`, `NewTaskSheet.tsx`, `DashboardScreen.tsx`

---

## Fase 4 — Corrigir unidades e o timer

**Objetivo:** acabar com a confusão min × segundos.

- [x] Definir 1 unidade canônica para `duration`/`elapsed` (sugestão: **segundos**).
- [x] Ajustar exibição ("min restantes", "X min") para converter corretamente.
- [x] *(Polish pós-Fase 4)* Duração em **horas + minutos** no sheet (`DurationFields`, `task-duration.ts`; até 8h).
- [x] Revisar o `setInterval` do timer (tick de 1s coerente com a unidade).
- [x] Conferir `ProgressRing` e `TaskCard` (cálculo de progresso).

**Pronto quando:** uma tarefa de "25 min" realmente leva 25 min no timer e mostra os números certos.

**Arquivos:** `DashboardScreen.tsx`, `TaskCard.tsx`, `ProgressRing.tsx`

---

## Fase 5 — Estatísticas reais

**Objetivo:** Hoje `streak: 12`, `+23%`, `87%` são chumbados.

- [x] Calcular `tasksCompleted`, `focusTime` a partir das tarefas reais.
- [x] Streak/eficiência: ou calcular de verdade, ou remover até existir histórico.
- [x] Guardar histórico diário em `localStorage` para alimentar tendências.

**Pronto quando:** os números do `StatsWidget` batem com o que eu realmente fiz no dia.

**Arquivos:** `src/lib/day-stats.ts`, `StatsWidget.tsx`, `DashboardScreen.tsx`

---

## Fase 6 — Navegação real (Agenda)

**Objetivo:** a tab bar deixa de ser decorativa.

- [x] Finalizar a `AgendaScreen` (hoje vazia) — visão por horário/dia.
- [x] Adicionar rotas reais no `App.tsx` (além de `/`).
- [x] Conectar a `CustomTabBar` à navegação.

**Pronto quando:** troco de aba e vejo telas diferentes de verdade.

**Arquivos:** `src/screens/AgendaScreen.tsx`, `App.tsx`, `CustomTabBar.tsx`

---

## Fase 7 — Notificações in-app (MVP)

**Objetivo:** central de alertas dentro do app, com histórico e badge no sino.

- [x] Rota `/notificacoes` + `NotificationsScreen` (inbox agrupada Hoje/Ontem/Anteriores)
- [x] Tipos: `task_upcoming` (~10 min antes), `task_completed`, `daily_goal_reached`, `streak_milestone`, `streak_at_risk`
- [x] Persistência em `localStorage` (`trilho:notifications`) com `dedupKey`
- [x] Polling 60s para lembretes de tarefas agendadas (app aberto)
- [x] Sino no `HeaderBar` → navega + badge coral só com não lidas
- [x] Perfil → linha Notificações → mesma tela

**Pronto quando:** concluo tarefa, bato meta ou chega horário agendado → alerta aparece na central, persiste ao reabrir, sino mostra não lidas.

**Plano:** [`página_notificações_b4ce06b2.plan.md`](./página_notificações_b4ce06b2.plan.md)  
**Branch:** `feat/notificacoes` (mergeado na `main` via PR #6)

---

## Fase 8 — Notificações mobile + UX

**Objetivo:** alertas funcionam com app fechado e experiência polida.

### Crítico para mobile real

- [x] `@capacitor/local-notifications` — push com app fechado (ex.: lembrete às 14:50)
- [x] Permissão do sistema (iOS/Android) para notificações fora do app
- [x] Agendamento nativo ao criar/editar tarefa com horário; cancelar ao concluir/excluir

### Importante para UX

- [x] Preferências — ligar/desligar por tipo; lead time configurável (5 / 10 / 15 min)
- [x] Toque na notificação → deep link (tarefa no Dashboard ou Agenda)
- [x] Tipo `task_overdue` — passou horário e tarefa ainda `pending`
- [x] Tipo `timer_finished` — duração da tarefa ativa esgotou

**Pronto quando:** agendo tarefa às 15h, fecho o app, e às 14:50 recebo alerta nativo no celular.

**Branch:** `feat/notificacoes-fase-8`

### Já feito no polish pós-MVP (não bloqueia Fase 9)

- [x] Sync inbox com pushes entregues (`getDeliveredNotifications` ao abrir/voltar ao app)
- [x] Textos centralizados em `src/lib/notification-copy.ts`
- [x] Preferências separadas: alertas no celular vs central do app
- [x] Timer em background não cancela push `timer_finished` antes de disparar

---

## Fase 8.5 — Polish de notificações (pós-MVP) ✅

**Objetivo:** fechar lacunas deixadas na Fase 8 antes de partir para Supabase.

### Visual / identidade

- [ ] **Ícone do push no iOS** — notificação ainda usa ícone genérico do Capacitor; `AppIcon` do app já é Trilho (PR pós-rebrand) — *adiado → Fase 11*
- [ ] **Ícone do push no Android** — `smallIcon` em `res/drawable` + `capacitor.config.ts` (quando pasta `android/` voltar ao repo) — *adiado → Fase 11*

### Push nativo — tipos que hoje são só in-app

- [x] **`task_completed`** — copy unificada via `timer_finished` → "Tarefa concluída" quando timer acaba; dedup na inbox evita duplicata ao reabrir
- [x] **`streak_at_risk`** — agendar push nativo às 20h local (1x/dia, se streak > 0 e 0 conclusões)
- [ ] **`daily_goal_reached`** — push ao bater meta — *adiado → Fase 11*
- [ ] **`streak_milestone`** — push ao atingir 3, 7, 14, 30 dias — *adiado → Fase 11*

### Validação

- [x] Testar fluxo completo no **iOS** (permissão, agendamento, deep link, sync inbox, streak 20h)
- [x] Limpar notificações entregues do centro do sistema após sync na inbox (`removeDeliveredNotifications`)

**Pronto quando:** usuário entende conclusão de tarefa sem abrir o app; streak em risco avisa à noite com app fechado. *(ícones customizados do push adiados para Fase 11.)*

**Branch:** mergeado na `main` via PR #8 (`feat/notificacoes-fase-8 e 8.5`)

---

## Fase 9 — Seletor de avatar no Perfil ✅

> Plano: [`avatar_picker_perfil_d8c6a32e.plan.md`](./avatar_picker_perfil_d8c6a32e.plan.md)

**Objetivo:** o usuário escolhe um avatar DiceBear (toon-head) no Perfil; a escolha persiste localmente e aparece no header.

- [x] Types (`src/types/avatar.ts`) e `buildAvatarUrl` (DiceBear com `backgroundColor`).
- [x] `profile-storage.ts` + `ProfileProvider` / `useProfile()` (`trilho:profile`).
- [x] Componentes `Avatar`, `AvatarPicker`, `AvatarPickerSheet` (portal no `body`).
- [x] Hook `useUpdateAvatar` (localStorage hoje; contrato pronto para Supabase).
- [x] Integração: `ProfileScreen` (avatar clicável + atalho), `HeaderBar`, `DashboardScreen`, `App.tsx`.
- [x] Evento PostHog `avatar updated`.

**Pronto quando:** abro Perfil → escolho avatar → confirmo → aparece no Perfil e no header → persiste ao reabrir.

**Arquivos:** `src/types/avatar.ts`, `src/lib/avatar-url.ts`, `src/lib/profile-storage.ts`, `src/lib/profile-context.tsx`, `src/hooks/useUpdateAvatar.ts`, `src/components/Avatar.tsx`, `src/components/AvatarPicker.tsx`, `src/components/AvatarPickerSheet.tsx`, `ProfileScreen.tsx`, `HeaderBar.tsx`, `DashboardScreen.tsx`, `App.tsx`  
**Branch:** mergeado na `main` via PR #9 (`feat/avatar-picker-perfil`)

---

## Fase 9.5 — Primeira experiência limpa (sem tarefas demo) ✅

**Objetivo:** novos usuários não recebem mais 7 tarefas fake na 1ª abertura.

- [x] Remover `sampleTasks` de `tasks-context.tsx`.
- [x] Fallback `loadTasks() ?? []` — lista vazia na 1ª vez.
- [x] `completedRecordedRef` semeia a partir das tarefas carregadas (não do demo).
- [x] Empty state no Dashboard já existente ("Nenhuma tarefa no momento").

**Pronto quando:** instalação limpa → Dashboard vazio → crio tarefa pelo + → persiste ao reabrir.

**Arquivos:** `src/lib/tasks-context.tsx`  
**Branch:** mergeado na `main` via PR #10 (`feat/remover-sample-tasks`)

---

## Fase 10 — Performance e responsividade ✅

> **Por que entrou aqui:** durante a Fase 9.5 (primeira experiência limpa), o app ficou perceptivelmente lento no uso diário — timer causando re-renders globais, boot pesado, `localStorage` crescendo sem limite, blur e animações custosas no mobile. Em vez de seguir direto para Supabase (antiga Fase 10), priorizamos deixar a base local **rápida e estável** antes de sync na nuvem.
>
> Planos: [`performance_lazy_routes_timer_posthog.plan.md`](./performance_lazy_routes_timer_posthog.plan.md) (Fase 1 perf) · [`performance_fase2_renders_storage_boot.plan.md`](./performance_fase2_renders_storage_boot.plan.md) (Fase 2 perf)

**Objetivo:** app responsivo no dia a dia, boot mais leve e storage sob controle — sem regressão visual perceptível no desktop/web.

### Fase 10a — Runtime e boot (lazy + timer + analytics)

- [x] Lazy routes — Agenda, Stats, Perfil, Notificações carregam sob demanda (`React.lazy` + `Suspense`).
- [x] Timer isolado — `useActiveElapsed` + relógio de parede; sem `setTasks` a cada segundo.
- [x] PostHog deferido — init após first paint (`requestIdleCallback` / timeout).
- [x] PostHog enxuto no nativo — recorder/surveys off; depois também `autocapture`, `capture_pageview` e `capture_pageleave` off.
- [x] Sync nativo com fingerprint — reagenda notificações só quando status/horário/duração mudam, não no tick do timer.
- [x] Avatar picker — `preconnect` + prefetch do próximo lote (cache HTTP, sem `localStorage`).
- [x] `decoding="async"` no `<img>` do Avatar.

### Fase 10b — Renders, storage, boot e GPU

- [x] `TasksProvider` estável — handlers em `useCallback` + `value` em `useMemo` (refs para `tasks`/`editingTaskId`).
- [x] `React.memo(TaskCard)` — comparador nas props que afetam render; callbacks estáveis.
- [x] Poda de concluídas — `completedAt` (ISO) ao concluir; remove `completed` com mais de **14 dias** em `saveTasks`/`loadTasks`; legado sem data mantido.
- [x] Fontes self-hosted — Space Grotesk + Inter em `public/fonts/`; sem `@import` do Google Fonts.
- [x] Vendor chunks (Vite) — `vendor-ionic`, `vendor-motion`, `vendor-analytics`, `vendor-icons`.
- [x] GPU mobile — blur off em `.card-glass`/tab bar no mobile e nativo; `OrbBackground` off no nativo e com `prefers-reduced-motion`.
- [x] LazyMotion + `domMax` — `MotionProvider` no root (suporta `layoutId` da tab bar).
- [x] Baseline documentada — `docs/perf-phase-2-baseline.md`.

### Polish pós-perf (produto)

- [x] Remover seção **Concluídas** do Início — foco no agora; histórico de concluídas só na Agenda.
- [x] Corrigir artefato de quadrado no `ProgressRing` (glow sem `drop-shadow` CSS no SVG).

**Pronto quando:** pausar 1 tarefa em lista grande não re-renderiza todos os cards; boot sem requests a `fonts.googleapis.com`; build gera vendor chunks separados; scroll fluido no mobile; concluídas antigas somem do storage após 14 dias sem quebrar Stats/streak.

**Arquivos:** `tasks-context.tsx`, `TaskCard.tsx`, `storage.ts`, `index.css`, `vite.config.ts`, `posthog.ts`, `motion.tsx`, `OrbBackground.tsx`, `CustomTabBar.tsx`, `ProgressRing.tsx`, `DashboardScreen.tsx`, `App.tsx`, `public/fonts/*`, `docs/perf-phase-2-baseline.md`  
**Branch sugerida:** `perf/phase-2-renders-storage-boot` (em cima da Fase 10a ou `main` após merge)

---

## Fase 11 — Login, conta e sync na nuvem (Supabase) 🔄

> **Dividida em 3 etapas** — **11.1 ✅ · 11.2 ✅ · 11.3 quase completa** (sync core ok; falta push remoto, ícones de push e pushes nativos de meta/marco).

**Objetivo:** o usuário tem conta, dados na nuvem e continuidade ao trocar de aparelho.

**Pronto quando (fim da 11.3):** crio conta no celular A, adiciono tarefas, faço login no celular B → vejo as mesmas tarefas e perfil. *(Fluxo core já funciona; push remoto e ícones nativos ainda pendentes.)*

### Fase 11.1 — Preparação e schema Supabase ✅

- [x] Higiene: `.env.example`, checklist de segurança, CI secret-scan (gitleaks).
- [x] `supabase init`, migrations, RLS em todas as tabelas.
- [x] `src/lib/supabase.ts` (anon key only) + tipos `src/types/database.ts`.
- [x] Gate de auditoria pós-migration (zero CRITICAL/HIGH no Security Advisor).

**Plano:** [`fase_11_1_preparacao_schema_rls.plan.md`](./fase_11_1_preparacao_schema_rls.plan.md)  
**Docs:** `docs/security-supabase-checklist.md`, `docs/security-audit-fase-11-1.md`

### Fase 11.2 — Auth (login e conta) ✅

- [x] Tela de boas-vindas unificada (`/login`) — Entrar | Criar conta, sem scroll, toggle de senha.
- [x] `AuthProvider` + `AuthGate` — login como 1ª tela quando Supabase configurado.
- [x] Recuperar senha (`/recuperar-senha`) + deep links Capacitor (`auth-deeplink.ts`).
- [x] Perfil: email, sair → login, excluir conta (RPC `delete_own_account`). *(Exportar dados removido do Perfil — descoped.)*
- [x] Nome no cadastro (`display_name` no Supabase) + apelido editável no Perfil (`nickname`, sync na nuvem).
- [x] PostHog `identify` / `reset`; erros auth em PT-BR.
- [x] Privacidade PostHog — `taskAnalyticsProps()` sem `task_title`.
- [x] Redirects de produção — `VITE_APP_URL`, `docs/supabase-auth-production.md`.

**Plano:** [`fase_11_2_auth_login_conta.plan.md`](./fase_11_2_auth_login_conta.plan.md)

### Fase 11.3 — Sync na nuvem e multi-dispositivo 🔄

- [x] Persistência híbrida — `localStorage` + push/pull Supabase quando logado (`sync-context`).
- [x] Import local no 1º login (`ImportLocalDataSheet` — "usar o que já tenho neste aparelho").
- [x] Sync multi-dispositivo — tarefas, histórico, perfil/avatar, prefs, inbox in-app.
- [ ] **Push remoto (Edge Functions + FCM/APNs)** — adiado; push nativo continua por dispositivo.
- [ ] Ícones push iOS/Android + `daily_goal_reached` / `streak_milestone` nativos (adiados da 8.5).

**Plano:** [`fase_11_3_sync_nuvem_multidispositivo.plan.md`](./fase_11_3_sync_nuvem_multidispositivo.plan.md)  
**Docs:** `docs/sync-behavior.md`, `docs/supabase.md`, `docs/security-audit-fase-11-complete.md`

**Arquivos:** `src/lib/supabase.ts`, `src/lib/auth-context.tsx`, `src/lib/sync-context.tsx`, `src/lib/sync/*`, migrations `supabase/`, telas auth, `ImportLocalDataSheet.tsx`  
**Commit:** `27d30c9` — `feat: Fase 11 — Supabase, auth, sync e preparação pré-loja`

### Polish pós-11.3 (já na `main`)

- [x] Rebrand **Trilho** + logo no login/header (`app-brand.ts`, `AppLogo.tsx`).
- [x] Ícone do **app** iOS (Assets.xcassets) — distinto do ícone de **push** nativo (ainda pendente).
- [x] Boot iOS mais rápido até a tela de login (`perf(boot)`).
- [x] Teclado iOS nos forms auth + polish do sheet de nova tarefa e avatar picker.
- [x] Tab Perfil permanece ativa ao abrir Notificações pelo atalho do Perfil.
- [x] Migrations Supabase alinhadas com timestamps do remoto.

---

## Fase 11.5 — Estados de UI e Acessibilidade (pré-loja) ✅

> **Polish crítico** — antes de loja, levar estados de UI de 7/10 para 9+/10 e acessibilidade de 7.5/10 para 9+/10.

**Objetivo:** experiência profissional de loading, feedback visual e acessibilidade completa.

### Estados de UI

- [x] **Skeleton loading** — `TaskCardSkeleton`, `StatsWidgetSkeleton`, `TrainStreakCardSkeleton`, `ProfileHeaderSkeleton`, `ScreenLoadingSkeleton`.
- [x] **Error boundaries** — `ErrorBoundary`, `ErrorFallback`, `NetworkErrorState`, `GenericErrorState` (captura + recuperação de erros).
- [x] **Loading states** — `ButtonWithLoading`, `Spinner`, `useAsyncAction`, `SyncStatusIndicator`.
- [x] **Toast system** — `Toast`, `ToastContainer`, `useToast`, `useToastAsync` (feedback success/error/info/warning com ações).

### Acessibilidade (WCAG 2.1 AA)

- [x] **Contraste de cores** — obsidian-400/500 ajustados, variantes 300 AAA (7:1+), `a11y-colors.ts`.
- [x] **Prefers-reduced-motion** — utilitários em `motion.tsx`, regras CSS globais, desabilita animações de movimento.
- [x] **Focus-visible** — outline mint-400 + box-shadow em todos interativos, navegação por teclado 100% visível.
- [x] **ARIA labels/roles** — `CustomTabBar` (tablist/tab), `TaskCard` (article/live region), guia completo em `a11y-aria.ts`.

**Pronto quando:** percepção de loading -60%, taxa de recuperação de erro 100%, navegação por teclado visível, contraste WCAG AA em todas as cores, toasts em operações principais.

**Arquivos:** `Toast.tsx`, `ButtonWithLoading.tsx`, `Spinner.tsx`, `*Skeleton.tsx`, `Error*.tsx`, `toast-context.tsx`, `useAsyncAction.ts`, `a11y-*.ts`, `index.css`, `tailwind.config.js`, `motion.tsx`, `CustomTabBar.tsx`, `TaskCard.tsx`, `App.tsx`  
**Docs:** `docs/ui-accessibility-improvements.md`  
**Branch:** mergeado na `main` (`feat/ui-accessibility-improvements`)

---

## Fase 12 — Rotinas prontas (foco em acolhimento / TDAH) ✅

> **Depois da Fase 11** — onboarding de rotinas **após** login (a tela de login/cadastro já existe na 11.2).

**Objetivo:** quem acabou de criar conta não enfrenta lista vazia. Oferecer rotinas prontas, pensadas para quem tem dificuldade com foco e organização (incl. público com TDAH), com sensação de acolhimento e capacidade real de manter uma rotina.

### Fluxo (pós-login / pós-cadastro)

- [x] Tela de onboarding de rotina após 1º login com conta vazia — "Vamos montar sua rotina".
- [x] Perguntas curtas (3–5): foco principal (estudos, trabalho, saúde, equilíbrio/lazer), intensidade (leve vs completa).
- [x] Preview da rotina sugerida antes de confirmar.
- [x] Opção **"Começar do zero"** sempre visível — ninguém é obrigado ao template.
- [x] Ao confirmar: injeta tarefas no storage (local + Supabase se logado).
- [x] Usuário pode editar, excluir e criar novas tarefas a qualquer momento.

### Conteúdo das rotinas

- [x] Templates por perfil: estudos, trabalho, saúde, equilíbrio geral.
- [x] Blocos realistas para TDAH: 15–25 min, pausas explícitas, poucas tarefas no 1º dia (3–5).
- [x] Copy acolhedora — ponto de partida, não prescrição clínica.
- [x] Reaplicar template depois: atalho no Perfil ("Montar nova rotina").

**Pronto quando:** crio conta → respondo perguntas → escolho "Estudos, rotina leve" → Dashboard já tem tarefas úteis → posso apagar uma e criar outra sem perder o resto.

**Arquivos:** `src/lib/routine-templates.ts`, `src/screens/OnboardingRoutineScreen.tsx`, `src/lib/use-routine-onboarding-gate.ts`, integração em `App.tsx`, `AuthGate.tsx`, `ProfileScreen.tsx`  
**Eventos PostHog:** `routine_profile_selected`, `routine_intensity_selected`, `routine_applied`, `routine_skipped`

---

## Fase 13 — Agenda semanal

> Visão além do dia — planejar a semana inteira.

**Objetivo:** a Agenda deixa de ser só "hoje" e passa a mostrar a semana do usuário.

- [ ] Seletor de semana (navegar semana anterior / próxima).
- [ ] Visão por dia da semana com tarefas agrupadas (agendadas e livres).
- [ ] Tarefas com `scheduledTime` aparecem no dia correto; tarefas sem horário em seção "Sem horário".
- [ ] Destaque do dia atual na grade/semana.
- [ ] (Opcional) Arrastar tarefa entre dias — só se não complicar o modelo de dados.

**Pronto quando:** abro Agenda → vejo Seg–Dom da semana atual → navego para semana passada/futura → tarefas aparecem no dia certo.

**Arquivos (previstos):** `src/screens/AgendaScreen.tsx`, `src/lib/week-utils.ts`, possível campo `scheduledDate` em `Task`

---

## Fase 14 — (Futuro) Rotina adaptativa

> O ganho 10x — só faz sentido com dados reais de uso (PostHog + Supabase).

- [ ] Analisar horários reais de conclusão.
- [ ] Sugerir agenda automaticamente com base no histórico.

---

### Como trabalhar

> **Status atual:** Fases 1–10, **11.1 + 11.2 + 11.3** (sync core), **11.5** (UI/a11y) e **12** (rotinas prontas) concluídas na `main`. Pendente na 11.3: push remoto (Edge/FCM/APNs), ícones de push, pushes nativos `daily_goal_reached` / `streak_milestone`. **Próxima etapa aberta:** fechar lacunas da 11.3 ou iniciar **Fase 13** (Agenda semanal).

1. Pegue **a fase mais ao topo ainda aberta**.
2. Faça os checkboxes dela.
3. Valide o critério de "Pronto quando".
4. Commit pequeno com o nome da fase (ex.: `feat: fase 1 — persistência local`).
5. Só então passe pra próxima.
