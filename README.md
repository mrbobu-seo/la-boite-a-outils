# La boite à outils SEO

"La boite à outils SEO" est une suite d'outils intelligents conçus pour l'analyse, l'extraction et l'optimisation de données web.  
Elle aide les professionnels du référencement à mieux comprendre leurs sites et à améliorer leur visibilité dans les moteurs de recherche.  

---

## Contact

Pour toute question ou suggestion, n'hésitez pas à me contacter sur Twitter : [@MisteurBobu](https://x.com/MisteurBobu)

---

## Quelles technologies sont utilisées pour ce projet ?

Ce projet est construit avec :

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

## Déploiement : pousser sur `main`

Le déploiement est déclenché automatiquement à chaque push sur la branche `main`. Voici la marche à suivre pour y publier vos
changements :

1. **Vérifier la configuration du dépôt distant**
   ```bash
   git remote -v
   ```
   Si aucun remote n'est listé, ajoutez `origin` avec l'URL du dépôt GitHub :
   ```bash
   git remote add origin git@github.com:<organisation>/<nom-du-depot>.git
   ```

2. **Mettre à jour votre branche locale**
   ```bash
   git fetch origin
   git checkout main
   git pull --ff-only origin main
   ```

3. **Fusionner ou rebaser votre travail** depuis votre branche de fonctionnalité :
   ```bash
   git checkout <ma-branche>
   git rebase main   # ou git merge main
   ```

4. **Exécuter les vérifications locales** (lint, tests, build) pour s'assurer que le déploiement réussira :
   ```bash
   npm run lint
   npm run build
   ```

5. **Fusionner sur `main`** puis pousser :
   ```bash
   git checkout main
   git merge <ma-branche>   # ou git rebase <ma-branche>
   git push origin main
   ```

Une fois le push effectué, surveillez le pipeline de déploiement (GitHub Actions, Vercel, etc.) pour vérifier que la mise en
production se déroule correctement.
