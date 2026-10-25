# 0w.lat — Directives pour Agents IA & Développeurs

Boîte à outils web personnelle orientée vie privée, performance et exécution côté client (*zero-knowledge*).

---

## 1. Stack Technique & Déploiement

- **Frontend** : Next.js (App Router, React 19, TypeScript, Tailwind CSS, FlyonUI).
  - Déployé sur **Vercel**.
  - URL de production : `https://0w.lat`
- **Backend** : FastAPI (Python 3.12+, Uvicorn avec support WebSocket, Tortoise ORM, PostgreSQL).
  - Déployé via **Docker** sur un VPS Debian derrière **Nginx**.
  - URL d'API : `https://dev.0w.lat`
- **Principe fondamental** : Traitement lourd, cryptographie et parsing exécutés dans le navigateur de l'utilisateur. Le backend n'intervient que pour la persistance indispensable, les WebSockets et les requêtes réseau non réalisables côté client.

---

## 2. Structure du Projet

```text
├── app/                          # Next.js App Router
│   ├── components/               # Composants interactifs ('use client')
│   ├── context/                  # I18nContext, ThemeContext
│   ├── lib/                      # Utilitaires (crypto.ts, i18n/dictionaries.ts)
│   ├── s/[id]/page.tsx           # Consultation de secret (Zero-Knowledge)
│   ├── tools/[slug]/page.tsx     # Pages Server Component (export const metadata)
│   ├── robots.ts                 # Règles d'indexation
│   └── sitemap.ts                # Générateur dynamique de sitemap
├── backend/
│   ├── models/                   # Modèles Tortoise ORM UNIQUEMENT
│   ├── schemas/                  # Schémas Pydantic v2 DTO UNIQUEMENT
│   ├── routers/                  # Points d'entrée FastAPI
│   └── main.py                   # Initialisation, CORS, Lifespan Tortoise
└── AGENTS.md                     # Ce document
