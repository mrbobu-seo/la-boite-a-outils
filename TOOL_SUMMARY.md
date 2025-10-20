# Résumé des outils de "la-boite-a-outils"

Ce document résume les deux outils principaux de l'application "la-boite-a-outils", leur fonctionnement et leur stack technique.

## 1. Scraper SEO

### Fonctionnement

Cet outil permet de scraper des pages web pour en extraire des informations à des fins d'analyse SEO. Il utilise une API externe, [ScraperAPI](https://www.scraperapi.com/), pour récupérer le contenu des URLs de manière anonyme et éviter les blocages.

L'utilisateur fournit une URL à scraper, et l'outil affiche les données extraites.

### Stack Technique

*   **Frontend:**
    *   Framework : React
    *   Build Tool : Vite
    *   Langage : TypeScript
    *   Styling : Tailwind CSS
    *   UI Components : Radix UI, Shadcn UI
    *   Gestion de formulaires : React Hook Form
Runtime : Node.js (fonction serverless pour Vercel)
    *   Fonctionnalité : Proxy vers l'API de ScraperAPI pour protéger la clé d'API.
    *   Dépendances principales : Aucune dépendance externe, utilise l'API `fetch` native de Node.js.

## 2. Index Checker & Indexation (SpeedyIndex)

### Fonctionnement

Cet outil permet de vérifier si des URLs sont indexées par les moteurs de recherche et de les soumettre à l'indexation via l'API de [SpeedyIndex](https://speedyindex.com/).

L'utilisateur peut soumettre une ou plusieurs URLs pour vérifier leur statut d'indexation ou pour demander une nouvelle indexation.

### Stack Technique

*   **Frontend:**
    *   Framework : React
    *   Build Tool : Vite
    *   Langage : TypeScript
    *   Styling : Tailwind CSS
    *   UI Components : Radix UI, Shadcn UI
*   **Backend:**
    *   Runtime : Node.js (fonction serverless, probablement pour Vercel)
    *   Fonctionnalité : Proxy vers l'API de SpeedyIndex pour protéger la clé d'API.
    *   Dépendances principales : Aucune dépendance externe, utilise l'API `fetch` native de Node.js.
