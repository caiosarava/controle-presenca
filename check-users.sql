-- ============================================
-- VERIFICAR E CRIAR TRIGGER DE USUÁRIOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar se a função existe
SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
) AS function_exists;

-- 2. Se não existir, criar a função
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

-- 3. Dropar trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Criar o trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar se a tabela users existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS table_exists;

-- 6. Listar usuários cadastrados
SELECT * FROM public.users;

-- 7. Listar usuários do Auth
SELECT * FROM auth.users;

-- ============================================
-- CRIAR USUÁRIO ADMIN MANUALMENTE (OPCIONAL)
-- ============================================
-- Se precisar criar um admin manualmente:
-- UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
-- ============================================
