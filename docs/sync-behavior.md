# Comportamento de sync — Trilho (Fase 11.3)

## Modos

| Modo              | Persistência              | Nuvem |
| ----------------- | ------------------------- | ----- |
| Guest (sem login) | `localStorage` apenas     | Não   |
| Logado            | `localStorage` + Supabase | Sim   |

O app **sempre** grava local primeiro (cache offline). Quando autenticado, envia alterações para o Supabase com debounce de ~800 ms.

## Primeiro login neste aparelho

1. Se a nuvem **já tem dados** → pull substitui o cache local (multi-dispositivo).
2. Se a nuvem **está vazia** e há dados locais → sheet **“Sincronizar este aparelho”**:
   - **Usar o que já tenho** → upload one-shot + `local_import_done = true`
   - **Começar do zero** → limpa local + marca import concluído

## Conflitos (MVP)

- Estratégia: **last-write-wins** por snapshot completo.
- Ao reabrir o app nativo (foreground), o refresh é **push-before-pull**: cancela os debounces pendentes, empurra o snapshot local inteiro (`pushUserSnapshot`) e só então faz o pull. Edição offline feita **neste aparelho** não é sobrescrita pelo snapshot remoto.
- O refresh de foreground só roda depois do initial sync completo — um device zerado pré-pull nunca empurra snapshot vazio (o diff+delete apagaria os dados da conta).
- Entre devices continua LWW: outro aparelho pode ganhar no pull seguinte ao push local.
- Sem fila de writes offline além do cache local — edições offline neste aparelho são empurradas no próximo debounce se houver rede, ou no push do próximo foreground.

## Falhas de sync (feedback visual)

- `cloud-sync.ts` propaga erros do supabase-js (`assertNoSyncError`) — antes, um upsert falho passava por sucesso e o diff+delete podia apagar linhas na nuvem.
- Pull com erro lança exceção em vez de virar snapshot vazio (que apagaria o cache local no `applySnapshot`).
- Push/pull falho mostra toast de erro com ação **Tentar novamente** (reexecuta o refresh). Um toast por falha; reseta em qualquer sync bem-sucedido. Erros também vão para o PostHog (`captureException`).
- `SyncStatusIndicator` montado no app (junto do `ImportLocalDataSheet`): mostra "Sincronizando" durante sync ativo.
- Offline autenticado: `OfflineNetworkBanner` monta `NetworkErrorState` com **Tentar novamente** (`refreshFromCloud`).
- Validação automatizada sem Vitest: `npm run test:sync` (checa ordem push→pull, asserts de erro, indicator montado e docs).
- Feedback UI wiring: `npm run test:feedback-ui` (NetworkErrorState, useAsyncAction, toasts, focus trap).

### Histórico diário (`day_history`)

- O push do histórico faz **diff + delete**: datas presentes no remoto mas ausentes localmente são removidas (mesmo padrão de `tasks`). A poda local de 90 dias, portanto, propaga para a nuvem.
- **Exceção:** com histórico local **vazio**, o push é no-op — nada é deletado do remoto. Isso protege device novo pré-pull de apagar o histórico da conta; o pull inicial traz o histórico da nuvem.

### Nome da conta (`display_name`)

- `display_name` participa do push contínuo do perfil (igual ao `nickname`), com fallback para `"Alex"` se o valor local estiver vazio (check do DB exige 2–50 chars).
- No login, o pull inicial (`pullUserSnapshot` → `applyProfile`) roda **antes** de qualquer push de perfil, então um device limpo (perfil local default `"Alex"`) não rebaixa um `display_name` real já existente na nuvem.

## O que sincroniza

- Tarefas (`tasks`), incluindo `scheduled_date` (dia da agenda) e campos de rotina
- Histórico diário (`day_history`)
- Perfil / avatar (`profiles`)
- Preferências de notificação (`notification_preferences`)
- Inbox in-app (`notifications`)
- Templates de rotina (`routine_templates`)

### Compatibilidade `scheduled_date`

- Coluna nullable: app antigo sem o campo continua fazendo upsert sem quebrar.
- Janela pequena: task criada num device novo com `scheduledDate` e editada num app antigo (spread de `Task` sem o campo) pode perder `scheduled_date` no próximo upsert — aceitável até todos os devices atualizarem.

## O que **não** sincroniza nesta fase

- Push nativo (Capacitor) — continua por dispositivo
- Push remoto via Edge Functions — adiado (requer FCM/APNs + tokens)
- Ícones customizados de push e tipos `daily_goal_reached` / `streak_milestone` nativos — Fase 8.5 / 11.3b

## Logout

- Com sessão ativa, `signOut` chama `clearAllLocalAppData()` antes de `supabase.auth.signOut()` — o próximo login no mesmo aparelho não herda tarefas, perfil ou histórico do usuário anterior.
- A UI recarrega a página após logout (`ProfileScreen`, cancelar em `NewPasswordScreen`) para reinicializar providers com storage vazio; só limpar `localStorage` deixaria estado em memória stale até o reload.
- `deleteAccount` continua limpando local + RPC + signOut; o wipe no `signOut` é idempotente se chamado em sequência.
- PostHog: o listener `SIGNED_OUT` em `auth-context` dispara `resetAnalyticsUser` e o evento `auth signed out`.

## Segurança

- RLS garante `auth.uid() = user_id` em todas as tabelas.
- Client usa somente anon key; nenhum service-role no bundle.
