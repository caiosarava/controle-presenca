-- ============================================
-- SCHEMA DO BANCO DE DADOS - SUPABASE
-- Sistema de Controle de Presença com Geolocalização
-- ============================================

-- Habilitar extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: users (perfis de usuários)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    role TEXT DEFAULT 'normal' CHECK (role IN ('admin', 'normal')),
    locais_autorizados UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- TABELA: locais (locais permitidos para registro)
-- ============================================
CREATE TABLE IF NOT EXISTS public.locais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    raio_metros INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_locais_nome ON public.locais(nome);

-- ============================================
-- TABELA: registros (registros de presença)
-- ============================================
CREATE TABLE IF NOT EXISTS public.registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    local_id UUID NOT NULL REFERENCES public.locais(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    tempo_permanencia TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_registros_user_id ON public.registros(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_local_id ON public.registros(local_id);
CREATE INDEX IF NOT EXISTS idx_registros_data_hora ON public.registros(data_hora);
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON public.registros(tipo);

-- ============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para locais
CREATE TRIGGER locais_updated_at
    BEFORE UPDATE ON public.locais
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TRIGGER: Criar perfil automaticamente ao criar usuário auth
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'normal')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: users
-- ============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Admin pode ver todos os usuários
CREATE POLICY "users_select_all_admin" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin pode atualizar qualquer usuário
CREATE POLICY "users_update_admin" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin pode deletar qualquer usuário
CREATE POLICY "users_delete_admin" ON public.users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Usuários podem criar seu próprio perfil (cadastro)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- POLICIES: locais
-- ============================================

-- Todos podem ler locais
CREATE POLICY "locais_select_all" ON public.locais
    FOR SELECT
    USING (true);

-- Apenas admin pode inserir locais
CREATE POLICY "locais_insert_admin" ON public.locais
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Apenas admin pode atualizar locais
CREATE POLICY "locais_update_admin" ON public.locais
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Apenas admin pode deletar locais
CREATE POLICY "locais_delete_admin" ON public.locais
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- POLICIES: registros
-- ============================================

-- Usuários podem ver seus próprios registros
CREATE POLICY "registros_select_own" ON public.registros
    FOR SELECT
    USING (user_id = auth.uid());

-- Admin pode ver todos os registros
CREATE POLICY "registros_select_all_admin" ON public.registros
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Usuários podem inserir seus próprios registros
CREATE POLICY "registros_insert_own" ON public.registros
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admin pode inserir registros
CREATE POLICY "registros_insert_admin" ON public.registros
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin pode atualizar registros
CREATE POLICY "registros_update_admin" ON public.registros
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin pode deletar registros
CREATE POLICY "registros_delete_admin" ON public.registros
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- DADOS INICIAIS (opcional)
-- ============================================

-- Inserir um local de exemplo (ajuste as coordenadas)
-- INSERT INTO public.locais (nome, latitude, longitude, raio_metros)
-- VALUES ('Sede Central', -23.550520, -46.633308, 100);

-- ============================================
-- FUNÇÕES ADICIONAIS
-- ============================================

-- Função para calcular tempo de permanência (opcional)
CREATE OR REPLACE FUNCTION public.calcular_tempo_permanencia(entrada_hora TIMESTAMPTZ, saida_hora TIMESTAMPTZ)
RETURNS TEXT AS $$
DECLARE
    diff INTERVAL;
    horas INTEGER;
    minutos INTEGER;
BEGIN
    diff = saida_hora - entrada_hora;
    horas = EXTRACT(EPOCH FROM diff) / 3600;
    minutos = (EXTRACT(EPOCH FROM diff) - (horas * 3600)) / 60;
    RETURN horas || 'h ' || minutos || 'm';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VISUALIZAÇÕES (opcional)
-- ============================================

-- View para estatísticas de registros por dia
CREATE OR REPLACE VIEW public.vw_registros_por_dia AS
SELECT
    DATE(data_hora) as data,
    COUNT(*) as total,
    SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) as entradas,
    SUM(CASE WHEN tipo = 'saida' THEN 1 ELSE 0 END) as saidas
FROM public.registros
GROUP BY DATE(data_hora)
ORDER BY data DESC;

-- View para resumo de usuários
CREATE OR REPLACE VIEW public.vw_resumo_usuarios AS
SELECT
    u.id,
    u.nome,
    u.email,
    u.role,
    COUNT(r.id) as total_registros,
    MAX(r.data_hora) as ultimo_registro
FROM public.users u
LEFT JOIN public.registros r ON u.id = r.user_id
GROUP BY u.id, u.nome, u.email, u.role;
