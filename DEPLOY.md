# Guia de Implantação

## Visão Geral

Este guia passo-a-passo irá ajudá-lo a configurar e implantar o Sistema de Controle de Presença.

---

## Passo 1: Configurar Supabase

### 1.1 Criar Conta e Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **Start your project** ou **Sign Up**
3. Cune uma conta (pode usar GitHub, Google ou email)
4. Clique em **New Project**
5. Preencha:
   - **Name:** controle-presenca
   - **Database Password:** (anote esta senha)
   - **Region:** escolha a mais próxima (ex: Brazil)
6. Clique em **Create new project**

### 1.2 Executar Schema SQL

1. No painel do projeto, clique em **SQL Editor** no menu lateral
2. Clique em **New query**
3. Copie o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em **Run**
5. Verifique se todas as tabelas foram criadas em **Table Editor**

### 1.3 Anotar Credenciais

1. Vá para **Settings** (engrenagem no canto inferior esquerdo)
2. Clique em **API**
3. Copie:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **anon/public key** (chave pública)

---

## Passo 2: Configurar Aplicação

### 2.1 Atualizar Configuração

Edite o arquivo `js/config.js`:

```javascript
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-CHAVE-ANONIMA-AQUI';
```

### 2.2 (Opcional) Criar Primeiro Admin

No SQL Editor do Supabase:

```sql
-- 1. Criar usuário de autenticação
INSERT INTO auth.users (email, raw_user_meta_data)
VALUES ('admin@empresa.com', '{"nome": "Administrador"}');

-- 2. Atualizar para admin
UPDATE public.users SET role = 'admin' WHERE email = 'admin@empresa.com';
```

Ou após criar a conta via login, atualize manualmente:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
```

---

## Passo 3: Testar Localmente

### 3.1 Servidor Local

Opção A - Usando Python:
```bash
python -m http.server 8000
```

Opção B - Usando Node.js:
```bash
npx serve
```

Opção C - Usando PHP:
```bash
php -S localhost:8000
```

### 3.2 Acessar

Navegue até `http://localhost:8000` e faça login.

---

## Passo 4: Implantar na Vercel

### 4.1 Criar Conta na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **Sign Up**
3. Use GitHub, GitLab, Bitbucket ou email

### 4.2 Importar Projeto

**Opção A - Via Git (Recomendado)**

1. Faça push do código para GitHub/GitLab
2. Na Vercel, clique em **Add New Project**
3. Selecione **Import Git Repository**
4. Escolha o repositório
5. Clique em **Deploy**

**Opção B - Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Fazer deploy
vercel
```

**Opção C - Via Upload Manual**

1. Baixe e instale a CLI da Vercel
2. Execute `vercel` na pasta do projeto
3. Siga as instruções

### 4.3 Configurar Variáveis de Ambiente

No painel da Vercel:

1. Vá para **Settings** > **Environment Variables**
2. Adicione:
   - `VITE_SUPABASE_URL` = `https://SEU-PROJETO.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `SUA-CHAVE`
3. Faça redeploy para aplicar

---

## Passo 5: Cadastrar Locais e Usuários

### 5.1 Acessar como Admin

1. Faça login em `https://seu-app.vercel.app`
2. Use as credenciais do usuário admin

### 5.2 Cadastrar Locais

1. Menu **Locais**
2. **Novo Local**
3. Preencha:
   - Nome: Ex: "Escritório Central"
   - Latitude/Longitude: Use "Usar minha localização" ou Google Maps
   - Raio: 100m (padrão)

**Como pegar coordenadas:**
- Google Maps: clique com botão direito no local > copie coordenadas
- Ex: `-23.550520, -46.633308`

### 5.3 Cadastrar Usuários

1. Menu **Usuários**
2. **Novo Usuário**
3. Preencha:
   - Nome completo
   - Email
   - Senha temporária
   - Perfil: normal ou admin
   - Locais autorizados: selecione os locais

---

## Passo 6: Testar Funcionamento

### 6.1 Teste de Usuário

1. Faça logout da conta admin
2. Faça login com usuário normal
3. Permita acesso à localização
4. Verifique se está dentro do raio do local
5. Clique em **Registrar Entrada**
6. Após alguns minutos, clique em **Registrar Saída**
7. Verifique no **Histórico**

### 6.2 Teste de Admin

1. Acesse **Dashboard** para ver estatísticas
2. Verifique **Histórico Geral**
3. Teste exportação CSV

---

## Solução de Problemas

### Erro: "Permissão de localização negada"

- Verifique se o site tem permissão de localização
- HTTPS é obrigatório para geolocalização
- Em localhost, use `localhost` ou `127.0.0.1`

### Erro: "Erro ao fazer login"

- Verifique as credenciais do Supabase
- Confirme se o usuário existe no Auth do Supabase
- Verifique se o RLS está configurado corretamente

### Erro: "Fora do local permitido"

- Verifique se o raio está adequado (100m pode ser pouco em áreas com GPS impreciso)
- Teste em área aberta para melhor sinal de GPS
- Atualize a página para recalcular localização

### Deploy falhou

- Verifique variáveis de ambiente na Vercel
- Confirme se todos os arquivos foram enviados
- Acesse logs de deploy na Vercel

---

## URLs Importantes

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentação Supabase:** https://supabase.com/docs

---

## Próximos Passos

1. Configurar domínio personalizado (opcional)
2. Habilitar notificações push (avançado)
3. Configurar backups automáticos do banco
4. Implementar relatórios avançados
