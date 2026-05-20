# Controle de Presença com Geolocalização

Sistema web para registro de presença (entrada e saída) com verificação de geolocalização. Os usuários só podem registrar presença quando estão dentro de um raio específico de um local autorizado.

## Funcionalidades

### Usuário Normal
- Registro de presença (entrada/saída) com verificação de geolocalização
- Visualização do histórico de registros
- Menu lateral responsivo
- PWA instalável

### Administrador
- Dashboard com estatísticas e gráficos
- Gestão de locais (cadastrar, editar, excluir)
- Gestão de usuários (criar, editar, designar roles e locais)
- Histórico geral de todos os usuários
- Exportação de dados em CSV

## Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Deploy:** Vercel
- **PWA:** Manifest + Service Worker

## Estrutura do Projeto

```
controle-presenca/
├── index.html                 # Login
├── dashboard.html             # Dashboard do usuário
├── historico.html             # Histórico do usuário
├── admin/
│   ├── index.html            # Dashboard admin
│   ├── locais.html           # Gestão de locais
│   ├── usuarios.html         # Gestão de usuários
│   └── historico.html        # Histórico geral
├── css/
│   ├── global.css            # Estilos globais
│   ├── login.css             # Login
│   ├── dashboard.css         # Dashboard
│   ├── admin.css             # Admin
│   └── components.css        # Componentes
├── js/
│   ├── config.js             # Configurações
│   ├── supabase.js           # Cliente Supabase
│   ├── auth.js               # Autenticação
│   ├── geo.js                # Geolocalização
│   ├── registro.js           # Registros
│   ├── admin.js              # Funções admin
│   └── export.js             # Exportação CSV
├── assets/                   # Imagens e ícones
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker
├── supabase-schema.sql       # Schema do banco
├── vercel.json               # Config Vercel
└── README.md
```

## Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá para **SQL Editor** e execute o script `supabase-schema.sql`
4. Anote a **URL** e a **Chave Anônima** do projeto

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

Ou atualize diretamente no arquivo `js/config.js`:

```javascript
const SUPABASE_URL = 'sua_url_do_supabase';
const SUPABASE_ANON_KEY = 'sua_chave_anonima';
```

### 3. Configurar Autenticação no Supabase

No painel do Supabase:

1. Vá para **Authentication** > **Providers**
2. Ative **Email** como provedor
3. Desative a confirmação de email (opcional para testes)

### 4. Implantar na Vercel

1. Instale a CLI da Vercel (opcional):
   ```bash
   npm i -g vercel
   ```

2. Faça deploy:
   ```bash
   vercel
   ```

3. Ou importe o repositório no site da [Vercel](https://vercel.com)

### 5. Configurar Variáveis na Vercel

No painel da Vercel, adicione as variáveis de ambiente:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Como Usar

### Primeiro Acesso (Admin)

1. Crie a primeiro usuário via Supabase Auth
2. Atualize o role para 'admin' manualmente no banco:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
   ```
3. Faça login com este usuário

### Cadastrar Locais

1. Acesse o menu **Locais**
2. Clique em **Novo Local**
3. Preencha nome, coordenadas e raio (ou use "Usar minha localização")
4. Salve

### Cadastrar Usuários

1. Acesse o menu **Usuários**
2. Clique em **Novo Usuário**
3. Preencha dados, senha e selecione os locais autorizados
4. Defina o perfil (admin ou normal)
5. Salve

### Registrar Presença (Usuário)

1. Faça login
2. O sistema verifica automaticamente sua localização
3. Se estiver dentro do raio permitido, o botão de registro será habilitado
4. Clique em **Registrar Entrada** ou **Registrar Saída**

## Regras de Negócio

- **Raio padrão:** 100 metros (configurável por local)
- **Verificação:** A cada 30 segundos a localização é atualizada
- **Tempo de permanência:** Calculado automaticamente entre entrada e saída
- **Múltiplos locais:** Usuários podem ter acesso a vários locais

## PWA (Progressive Web App)

O aplicativo é totalmente funcional como PWA:

- **Instalação:** O navegador oferecerá para instalar o app
- **Offline:** Funcionalidades básicas disponíveis offline
- **Responsivo:** Adaptado para mobile e desktop
- **Notificações:** Suporte a push notifications (configuração adicional necessária)

## Segurança

- **RLS (Row Level Security):** Implementado em todas as tabelas
- **Autenticação:** Supabase Auth com JWT
- **HTTPS:** Obrigatório para geolocalização e PWA
- **Roles:** Separação clara entre admin e usuário normal

## APIs e Dependências Externas

- **Supabase JS SDK:** `@supabase/supabase-js`
- **Google Fonts:** Inter font family
- **Chart.js:** Para gráficos do dashboard admin
- **Lucide Icons:** Ícones SVG

## Navegadores Suportados

- Chrome/Edge (recomendado)
- Firefox
- Safari
- Opera

## Licença

MIT

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
