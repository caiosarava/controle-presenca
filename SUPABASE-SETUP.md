# ⚠️ IMPORTANTE: Configuração do Supabase

O erro "500 Internal Server Error" na tabela `users` indica que o **trigger** que cria o perfil automaticamente não está funcionando.

## ✅ Passos para Corrigir

### Passo 1: Acesse o Supabase

1. Vá para https://supabase.com
2. Selecione seu projeto: `nxgvbxkgfetmjjnadhhg`

### Passo 2: Execute o Script SQL

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Copie e cole o seguinte código:

```sql
-- Recriar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome, role, locais_autorizados)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'normal'),
        '{}'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropar trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verificar se a tabela users existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS table_exists;
```

4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Deve aparecer "Success" no canto inferior direito

### Passo 3: Verificar se Funcionou

1. No menu lateral, clique em **Authentication** > **Users**
2. Verifique se há usuários listados
3. Agora clique em **Table Editor** > **users**
4. Deve haver uma entrada para cada usuário do Auth

### Passo 4: Criar Primeiro Admin

No **SQL Editor**, execute:

```sql
-- Atualizar seu usuário para admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'caio.sarava@gmail.com';
```

### Passo 5: Testar Login

1. Volte para o site do app
2. Tente fazer login novamente
3. Deve funcionar agora! 🎉

## 🔍 Diagnóstico do Problema

O erro ocorre porque:

1. **Usuário é criado no Auth** ✅
2. **Trigger deveria criar perfil na tabela `users`** ❌ (não está funcionando)
3. **Login tenta buscar perfil** ❌ (retorna null)
4. **Código tenta acessar `profile.role`** ❌ (erro: Cannot read properties of null)

## 🛠️ Solução Alternativa

Se o trigger não funcionar, crie o perfil manualmente:

```sql
-- Inserir perfil manualmente para usuário existente
INSERT INTO public.users (id, email, nome, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'nome', SPLIT_PART(au.email, '@', 1)),
    'normal'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

## 📞 Ainda com Problemas?

Se ainda estiver com erro:

1. Verifique o **SQL Editor** para mensagens de erro
2. Tente deletar e recriar o trigger
3. Verifique se a tabela `users` existe em **Table Editor**
4. Confira se as permissões de RLS estão corretas

## 📝 Notas

- O trigger é **essencial** para o funcionamento do sistema
- Sem ele, usuários criados via cadastro não têm perfil
- Admins podem criar perfis manualmente pela gestão de usuários
