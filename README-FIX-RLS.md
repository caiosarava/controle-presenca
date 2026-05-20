# Instruções para Correção do Banco de Dados

## Problema Resolvido
- **Total de usuários** não atualizava corretamente devido às políticas de RLS
- **Presença atual** usava valor aleatório ao invés de dados reais
- **Atualização em tempo real** não existia (agora tem polling de 5 minutos)

## O que o Script SQL Faz

### 1. Cria funções essenciais:
- `is_admin()` - Verifica se usuário é admin (sem recursão)
- `get_total_usuarios()` - Retorna total correto de usuários
- `get_presenca_dia()` - Conta registros de entrada do dia atual
- `handle_new_user()` - Cria perfil automaticamente

### 2. Reconfigura políticas RLS:
- **Admin**: vê todos usuários, pode editar/excluir qualquer um
- **Normal**: vê e edita apenas o próprio registro

### 3. Garante dados consistentes:
- Cria perfis para usuários existentes
- Define seu usuário como admin
- Valida integridade dos dados

## Como Executar

### Passo 1: Acesse o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral

### Passo 2: Execute o Script SQL
1. Copie o conteúdo do arquivo `fix-rls-completo.sql`
2. Cole no editor SQL do Supabase
3. Clique em **"Run"** ou pressione `Ctrl+Enter`

### Passo 3: Verifique os Resultados
O script vai mostrar várias consultas de verificação:
- Lista de usuários com status
- Teste da função `is_admin()`
- Total de usuários e admins
- Teste da função de presença

### Passo 4: Atualize a Página do Admin
1. Volte para página do dashboard admin
2. Atualize a página (F5)
3. Verifique se:
   - **Total Usuários** mostra número correto
   - **Presença Atual** mostra entradas do dia
   - Dados atualizam a cada 5 minutos automaticamente

## Comportamento Esperado

### Dashboard Admin
| Métrica | Valor Anterior | Valor Atual |
|---------|---------------|-------------|
| Total Usuários | Não atualizava | Atualiza corretamente |
| Presença Atual | Aleatório | Entradas reais do dia |
| Atualização | Manual (refresh) | Automática (5 min) |

### Políticas de Acesso
| Ação | Usuário Normal | Admin |
|------|---------------|-------|
| Ver lista usuários | ❌ (só vê o seu) | ✅ (vê todos) |
| Ver próprio perfil | ✅ | ✅ |
| Editar próprio perfil | ✅ | ✅ |
| Editar perfil de outro | ❌ | ✅ |
| Deletar qualquer usuário | ❌ | ✅ |

## Troubleshooting

### Erro: "permission denied for table auth.users"
- **Causa**: Usuário não tem permissão para acessar auth.users
- **Solução**: O script já resolve criando funções SECURITY DEFINER

### Erro: "function get_total_usuarios does not exist"
- **Causa**: Script SQL não foi executado corretamente
- **Solução**: Execute o script `fix-rls-completo.sql` novamente

### Total de usuários ainda mostra 1
- **Causa**: Seu usuário não está marcado como admin
- **Solução**: Verifique se a linha `UPDATE public.users SET role = 'admin' WHERE email = 'caio.sarava@gmail.com'` foi executada

### Presença atual mostra 0
- **Causa**: Nenhum registro de entrada hoje
- **Solução**: Registre um ponto de entrada para testar

## Próximos Passos Sugeridos

1. ✅ Executar script SQL no Supabase
2. ✅ Testar dashboard admin
3. ✅ Verificar se total de usuários está correto
4. ✅ Registrar ponto de entrada para testar presença
5. ✅ Aguardar 5 minutos para verificar polling

## Arquivos Modificados

- `fix-rls-completo.sql` - **NOVO** - Script SQL completo
- `js/admin.js` - Adicionado `buscarPresencaDia()` e atualizado `buscarEstatisticas()`
- `admin/index.html` - Adicionado polling de 5 minutos e uso de `buscarPresencaDia()`
