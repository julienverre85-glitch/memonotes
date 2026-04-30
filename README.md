# 📋 Mémo — Notes & Rappels

Application de prise de notes avec rappels, matrice Eisenhower, notifications push et email.  
Stack : React + Vite · GitHub Pages · Supabase

---

## 🚀 Installation pas à pas

### Étape 1 — Cloner le dépôt

Crée un nouveau dépôt GitHub (ex: `memo-notes`), puis upload tous ces fichiers dedans (ou clone et push).

---

### Étape 2 — Configurer Supabase

1. Va sur [supabase.com](https://supabase.com) > ton projet
2. **Créer les tables** : SQL Editor > New Query > colle le contenu de `supabase/schema.sql` > Run
3. **Activer l'authentification email** : Authentication > Providers > Email = ON
4. **Récupérer tes clés** : Settings > API  
   - `Project URL` → tu en auras besoin à l'étape 4
   - `anon public` key → idem

---

### Étape 3 — Générer les clés VAPID (notifications push)

Les clés VAPID permettent d'envoyer des notifications push de façon sécurisée.

1. Installe Node.js si ce n'est pas fait
2. Dans un terminal :

```bash
npx web-push generate-vapid-keys
```

3. Tu obtiens :
   - `Public Key` → pour l'app frontend
   - `Private Key` → pour la fonction Supabase (ne jamais la mettre dans le code !)

---

### Étape 4 — Modifier les fichiers de configuration

**`src/lib/supabase.js`**
```js
const SUPABASE_URL = 'https://XXXXX.supabase.co'      // ton Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOi...'             // ton anon key
```

**`src/App.jsx`** (ligne 7)
```js
const VAPID_PUBLIC_KEY = 'BDxxxxxxxxxxxxxxx...'        // ta clé VAPID publique
```

**`vite.config.js`** (ligne 5)
```js
base: '/memo-notes/',   // le nom exact de ton dépôt GitHub
```

**`supabase/functions/send-reminders/index.ts`** (ligne 38)
```ts
from: 'Mémo <rappels@tondomaine.com>',  // ton adresse Resend vérifiée
```

---

### Étape 5 — Configurer les secrets GitHub

Dans ton dépôt GitHub : Settings > Secrets and variables > Actions > New repository secret

| Nom du secret          | Valeur                                 |
|------------------------|----------------------------------------|
| `VITE_SUPABASE_URL`    | https://XXXXX.supabase.co              |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGciOi...                        |
| `VITE_VAPID_PUBLIC_KEY`  | BDxxx...                             |

---

### Étape 6 — Activer GitHub Pages

Dépôt GitHub > Settings > Pages > Source : **GitHub Actions** > Save

---

### Étape 7 — Déployer l'Edge Function Supabase (rappels email)

1. Installe Supabase CLI : https://supabase.com/docs/guides/cli
2. Connecte-toi :
```bash
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
```
3. Déploie la fonction :
```bash
supabase functions deploy send-reminders
```
4. Configure les secrets de la fonction (Supabase > Edge Functions > send-reminders > Secrets) :

| Clé                        | Valeur                          |
|----------------------------|---------------------------------|
| `RESEND_API_KEY`           | Clé API Resend (resend.com)     |
| `VAPID_PRIVATE_KEY`        | Ta clé VAPID privée             |
| `VAPID_PUBLIC_KEY`         | Ta clé VAPID publique           |
| `VAPID_SUBJECT`            | mailto:ton@email.com            |

5. Active le cron (Supabase > Edge Functions > send-reminders > Schedule) :
   - Cron expression : `*/15 * * * *` (toutes les 15 min)

---

### Étape 8 — Configurer Resend (emails)

1. Crée un compte sur [resend.com](https://resend.com) (gratuit : 3 000 emails/mois)
2. Ajoute et vérifie ton domaine
3. Génère une clé API → colle-la dans les secrets Supabase

---

## 🎨 Matrice d'Eisenhower

| Couleur | Quadrant                      | Action         |
|---------|-------------------------------|----------------|
| 🔴 Rouge  | Urgent + Important          | Faire maintenant |
| 🔵 Bleu   | Important + Pas urgent      | Planifier       |
| 🟡 Jaune  | Urgent + Pas important      | Déléguer        |
| ⚫ Gris   | Ni urgent, ni important     | Éliminer        |

---

## 📦 Structure des fichiers

```
├── .github/workflows/deploy.yml     # Déploiement auto GitHub Pages
├── public/sw.js                     # Service Worker (push)
├── src/
│   ├── App.jsx                      # Application principale
│   ├── main.jsx                     # Point d'entrée
│   ├── index.css                    # Styles globaux
│   └── lib/supabase.js              # Client Supabase
├── supabase/
│   ├── schema.sql                   # Tables à créer
│   └── functions/send-reminders/    # Edge Function rappels
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔧 Développement local

```bash
npm install
npm run dev
```

L'app sera disponible sur http://localhost:5173
