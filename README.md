# CIRS — Confederação Internacional Real Soccer

Site oficial da CIRS — comunidade competitiva de HaxBall Real Soccer X5 com PowerShot.

## Stack

- **Next.js 16** (App Router) + React 19
- **TypeScript**
- **Tailwind CSS 4**
- **Prisma ORM** (SQLite local / PostgreSQL na produção)
- **bcryptjs** para senhas (autenticação por cookie seguro)

## Como rodar localmente

### Pré-requisitos

- Node.js 18+ instalado

### Passos

```bash
cd C:\Users\Pichau\Documents\cirs
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

O site vai abrir em **http://localhost:3000**

## Login do Admin

- **URL:** http://localhost:3000/admin/login
- **Usuário:** `admin`
- **Senha padrão:** `cirs2024`

> **IMPORTANTE:** Troque a senha padrão após o primeiro login!

## Como Hospedar de Graça

### Passo 1: Criar banco de dados PostgreSQL gratuito

Escolha uma destas opções:

**Opção A — Neon (recomendado, mais simples):**
1. Acesse https://neon.tech
2. Crie conta (pode usar GitHub)
3. Clique em **"New Project"** (nome: `cirs`)
4. Copie a string de conexão (algo como `postgresql://user:pass@host/db?sslmode=require`)

**Opção B — Supabase:**
1. Acesse https://supabase.com
2. Crie conta e novo projeto
3. Vá em Settings > Database > copie a "Connection string"

### Passo 2: Subir o código para o GitHub

```bash
cd C:\Users\Pichau\Documents\cirs
git init
git add .
git commit -m "CIRS site"
```

Crie um repositório no GitHub e faça o push.

### Passo 3: Deploy na Vercel

1. Acesse https://vercel.com e crie conta (use a conta do GitHub)
2. Clique em **"New Project"** > **"Import Git Repository"**
3. Selecione o repositório do GitHub
4. Configure as variáveis de ambiente:
   - Clique em **"Environment Variables"**
   - Adicione:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | String de conexão que você copiou do Neon/Supabase |
| `NEXTAUTH_SECRET` | Uma string aleatória (ex: `cirs-` + qualquer coisa longa e imprevisível) |
| `NEXTAUTH_URL` | Deixe em branco (a Vercel preenche automaticamente) |
| `ADMIN_PASSWORD` | `cirs2024` (ou a senha que quiser) |

5. Clique em **"Deploy"**
6. Aguarde o build terminar (alguns minutos)
7. Acesse o link que a Vercel mostrará

### Primeiro acesso

Após o deploy, acesse `https://SEU-SITE.vercel.app/admin/login` e entre com:
- **Usuário:** `admin`
- **Senha:** `cirs2024` (ou a que você definiu em `ADMIN_PASSWORD`)

Depois de entrar no painel admin, você pode cadastrar clubes, jogadores, ligas, campeonatos e começar a usar o simulador de partidas.

## Estrutura do Projeto

```
src/
├── app/                  # Páginas (App Router)
│   ├── page.tsx          # Home
│   ├── admin/            # Painel administrativo
│   │   ├── login/
│   │   ├── clubes/       # CRUD de clubes
│   │   ├── jogadores/    # CRUD de jogadores
│   │   ├── ligas/
│   │   ├── temporadas/
│   │   ├── campeonatos/
│   │   ├── partidas/
│   │   ├── simulador/    # Simulador de partidas
│   │   ├── estadios/
│   │   ├── patrocinadores/
│   │   ├── noticias/
│   │   ├── downloads/
│   │   ├── tecnicos/
│   │   ├── arbitros/
│   ├── api/              # Rotas de API
│   │   ├── auth/         # Login/logout
│   │   ├── clubs/        # CRUD clubes
│   │   ├── players/      # CRUD jogadores
│   │   ├── ...           # Domicílio entidades
│   │   └── simulate/     # Simulação de partidas
│   ├── campeonatos/      # Páginas públicas
│   ├── ligas/
│   ├── ranking/
│   ├── estatisticas/
│   ├── times/
│   ├── jogadores/
│   ├── simulacoes/
│   ├── noticias/
│   ├── hall-da-fama/
│   ├── downloads/
│   ├── discord/
│   └── jogar/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── AdminSidebar.tsx
│   └── CrudManager.tsx
└── lib/
    ├── prisma.ts
    ├── auth.ts
    ├── session.ts
    ├── simulator.ts
    └── utils.ts
```

## Funcionalidades

- Banner principal com CTA
- Menu superior com todas as seções
- Tema visual preto + azul + branco + detalhes dourados
- Animações suaves
- Painel administrativo completo (CRUD)
- Login seguro de admin com senha criptografada
- Sistema de simulação com base nos atributos
- Estatísticas automáticas por partida
- Rankings (artilharia, assists, MVP, goleiros)
- Sistema de notícias
- Hall da Fama
- Área de downloads
- Sistema de ligas, temporadas e campeonatos
- Responsivo (mobile e desktop)
- SEO otimizado
- Dark Mode nativo

## Deploy Alternativo (Netlify)

1. Suba para GitHub
2. Crie conta na Netlify, "New site from Git", importe o repo
3. Build command: `node scripts/build-vercel.js`
4. Publish directory: `.next`
5. Adicione as mesmas variáveis de ambiente

---

Desenvolvido para a CIRS — Confederação Internacional Real Soccer