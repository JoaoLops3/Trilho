# App Review Notes — Notificações (Trilho)

Texto pronto para colar em **App Store Connect → App Review Information → Notes**.

---

## Por que o app usa notificações

O Trilho usa **notificações locais** (no aparelho, sem servidor de push) para:

- lembrar tarefas no horário agendado;
- avisar quando o timer de foco termina;
- alertar se a sequência do dia estiver em risco.

O usuário pode negar a permissão e continuar usando todas as funcionalidades principais (criar tarefas, timer, estatísticas, sequência).

---

## Passos para reproduzir (≈ 30 segundos)

1. Faça login com a conta demo fornecida.
2. Abra **Perfil → Preferências**.
3. Toque em **Ativar notificações** e conceda a permissão no iOS.
4. Crie uma tarefa com horário **já passado** (ex.: se são 15:00, defina 14:55).
5. Aguarde cerca de **5 segundos** — deve aparecer o alerta **“Tarefa atrasada”**.

### Alternativa (timer)

1. Com permissão concedida, crie uma tarefa e inicie o timer com duração de **1–2 minutos**.
2. Aguarde o término — deve aparecer **“Tarefa concluída”** / sessão de foco terminada.

### Alternativa (lembrete antecipado)

1. Crie uma tarefa com horário daqui a **6–11 minutos** (antecedência padrão: 10 min).
2. Aguarde — deve aparecer **“Tarefa chegando”**.

---

## Privacidade na lock screen

Em **Preferências**, o usuário pode ativar **“Ocultar conteúdo da tarefa nas notificações”** para exibir texto genérico na lock screen (sem nome da tarefa).

---

## Conta demo

*(Preencher antes da submissão: e-mail e senha da conta de teste.)*
