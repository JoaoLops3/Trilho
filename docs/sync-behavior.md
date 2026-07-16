# Comportamento de sync — Trilho (Fase 11.3)

## Modos

| Modo | Persistência | Nuvem |
|------|--------------|-------|
| Guest (sem login) | `localStorage` apenas | Não |
| Logado | `localStorage` + Supabase | Sim |

O app **sempre** grava local primeiro (cache offline). Quando autenticado, envia alterações para o Supabase com debounce de ~800 ms.

## Primeiro login neste aparelho

1. Se a nuvem **já tem dados** → pull substitui o cache local (multi-dispositivo).
2. Se a nuvem **está vazia** e há dados locais → sheet **“Sincronizar este aparelho”**:
   - **Usar o que já tenho** → upload one-shot + `local_import_done = true`
   - **Começar do zero** → limpa local + marca import concluído

## Conflitos (MVP)

- Estratégia: **last-write-wins** por snapshot completo.
- Ao reabrir o app nativo, faz pull da nuvem (pode sobrescrever edições offline feitas em outro device sem sync).
- Sem fila de writes offline além do cache local — edições offline neste aparelho são empurradas no próximo debounce se houver rede.

### Histórico diário (`day_history`)

- O push do histórico faz **diff + delete**: datas presentes no remoto mas ausentes localmente são removidas (mesmo padrão de `tasks`). A poda local de 90 dias, portanto, propaga para a nuvem.
- **Exceção:** com histórico local **vazio**, o push é no-op — nada é deletado do remoto. Isso protege device novo pré-pull de apagar o histórico da conta; o pull inicial traz o histórico da nuvem.

### Nome da conta (`display_name`)

- `display_name` participa do push contínuo do perfil (igual ao `nickname`), com fallback para `"Alex"` se o valor local estiver vazio (check do DB exige 2–50 chars).
- No login, o pull inicial (`pullUserSnapshot` → `applyProfile`) roda **antes** de qualquer push de perfil, então um device limpo (perfil local default `"Alex"`) não rebaixa um `display_name` real já existente na nuvem.

## O que sincroniza

- Tarefas (`tasks`)
- Histórico diário (`day_history`)
- Perfil / avatar (`profiles`)
- Preferências de notificação (`notification_preferences`)
- Inbox in-app (`notifications`)

## O que **não** sincroniza nesta fase

- Push nativo (Capacitor) — continua por dispositivo
- Push remoto via Edge Functions — adiado (requer FCM/APNs + tokens)
- Ícones customizados de push e tipos `daily_goal_reached` / `streak_milestone` nativos — Fase 8.5 / 11.3b

## Segurança

- RLS garante `auth.uid() = user_id` em todas as tabelas.
- Client usa somente anon key; nenhum service-role no bundle.
