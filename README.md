# La boite à outils SEO

"La boite à outils SEO" est une suite d'outils intelligents conçus pour l'analyse, l'extraction et l'optimisation de données web.
Elle aide les professionnels du référencement à mieux comprendre leurs sites et à améliorer leur visibilité dans les moteurs de recherche.

---

## Fonctionnalités

- **Authentification des utilisateurs :** Connexion sécurisée pour accéder aux outils.
- **Gestion de projets :** Créez et organisez vos projets pour suivre vos analyses.
- **Scraping de SERP :** Extrayez les résultats de recherche Google pour une requête donnée.
- **Scraping de pages individuelles :** Récupérez le contenu (titre, méta-description, headings) de n'importe quelle page web.
- **Sauvegarde des résultats :** Enregistrez les résultats de scraping et associez-les à vos projets.
- **Journal des opérations :** Suivez en temps réel le déroulement des tâches de scraping.
- **Vérificateur d'indexation :** (Fonctionnalité en cours de développement) Outil pour vérifier le statut d'indexation de vos pages.

---

## Technologies utilisées

Ce projet est construit avec des technologies modernes et performantes :

- **Frontend :**
  - **React :** Bibliothèque JavaScript pour construire des interfaces utilisateur.
  - **TypeScript :** Sur-ensemble de JavaScript qui ajoute le typage statique.
  - **Vite :** Outil de build ultra-rapide pour le développement web moderne.
  - **Tailwind CSS :** Framework CSS "utility-first" pour un design rapide et personnalisé.
  - **Shadcn/ui :** Collection de composants d'interface utilisateur réutilisables.
  - **React Router :** Pour la gestion de la navigation et des routes.
  - **TanStack Query :** Pour la gestion du state asynchrone et du caching.
  - **Lucide Icons :** Bibliothèque d'icônes claire et cohérente.

- **Backend & Base de données :**
  - **Supabase :** Plateforme open-source qui fournit une base de données PostgreSQL, de l'authentification, et des APIs.
  - **API Proxy :** Une API proxy est utilisée pour effectuer les requêtes de scraping côté serveur, évitant ainsi les problèmes de CORS et protégeant les clés d'API.

---

## Démarrage rapide

Pour lancer le projet en local, suivez ces étapes :

1.  **Clonez le dépôt :**
    ```bash
    git clone https://github.com/mrbobu-seo/la-boite-a-outils.git
    cd la-boite-a-outils
    ```

2.  **Installez les dépendances :**
    ```bash
    npm install
    ```

3.  **Configurez les variables d'environnement :**
    Créez un fichier `.env.local` à la racine du projet et ajoutez vos clés d'API Supabase :
    ```
    VITE_SUPABASE_URL=VOTRE_URL_SUPABASE
    VITE_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_SUPABASE
    ```

4.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```

L'application devrait maintenant être accessible à l'adresse `http://localhost:5173`.

---

## Contact

Pour toute question ou suggestion, n'hésitez pas à me contacter sur Twitter : [@MisteurBobu](https://x.com/MisteurBobu)