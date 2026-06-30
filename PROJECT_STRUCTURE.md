# Trading Master - Structure du Projet

## Architecture

Ce projet utilise React 19 avec Vite comme bundler, et suit une architecture modulaire avec séparation des responsabilités.

## Structure des Dossiers

```
src/
├── components/          # Composants React réutilisables
│   ├── layout/         # Composants de mise en page (header, footer, nav)
│   ├── ui/             # Composants UI génériques (buttons, cards, etc.)
│   ├── home/           # Composants spécifiques à la page d'accueil
│   ├── formations/     # Composants spécifiques aux formations
│   └── lives/          # Composants spécifiques aux sessions live
├── views/              # Pages principales de l'application (Home, Formations, Dashboard, etc.)
├── services/           # Logique métier et gestion des données
├── utils/              # Fonctions utilitaires
└── assets/             # Ressources statiques (images, styles)
```

## Composants

### Composants UI (ui/)
- **BaseButton**: Bouton réutilisable avec différentes variantes
- **BaseCard**: Carte réutilisable avec différentes options
- **DynamicNavigation**: Navigation animée avec méga-menu

### Composants de Layout (layout/)
- **NavBar**: Navigation principale utilisant DynamicNavigation
- **AppFooter**: Pied de page
- **PriceTicker**: Bandeau défilant des prix du marché

### Composants par Page

#### Home (home/)
- **HeroSection**: Section principale avec CTA
- **FeaturesSection**: Fonctionnalités clés
- **StatsSection**: Statistiques

#### Formations (formations/)
- **FormationsHeader**: En-tête de la page
- **FormationsFilter**: Filtres de recherche
- **FormationCard**: Carte de formation individuelle

## Services

### formationsService.js
- Gestion des données des formations
- Fonctions de filtrage et tri
- Données mockées pour le développement

### userService.js
- Gestion des données utilisateur
- Données du tableau de bord
- Statistiques de la communauté

## Utils

### dateUtils.js
- Fonctions de formatage de dates
- Gestion des calendriers
- Utilitaires de manipulation temporelle

## Bonnes Pratiques

### 1. Séparation des Responsabilités
- Les composants UI sont purs et réutilisables
- Les composants de page gèrent la logique métier via des services
- Les services gèrent l'accès aux données

### 2. Nommage
- Composants: PascalCase (ex: BaseButton.jsx)
- Fichiers: camelCase (ex: formationsService.js)
- Props: camelCase (ex: formationData)

### 3. Structure des Composants (React)
```jsx
import React from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  // Logique
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### 4. Gestion des Données
- Utiliser les services pour centraliser la logique
- Passer les données via props aux composants enfants
- Émettre des événements pour la communication parent-enfant

## Ajout de Nouvelles Fonctionnalités

### Pour ajouter une nouvelle page:
1. Créer le fichier dans `src/views/`
2. Créer les composants spécifiques dans `src/components/[page-name]/`
3. Ajouter la route dans `src/router/index.js`
4. Créer les services nécessaires dans `src/services/`

### Pour ajouter un nouveau composant UI:
1. Créer le composant dans `src/components/ui/`
2. Assurer la réutilisabilité avec props flexibles
3. Documenter les props et les slots
4. Créer des exemples d'utilisation

### Pour ajouter une nouvelle fonctionnalité:
1. Créer le service dans `src/services/`
2. Créer les composants nécessaires
3. Implémenter la logique dans la page appropriée
4. Ajouter les utilitaires si nécessaire

## Maintenance

### Mise à jour des Composants
- Toujours vérifier l'impact sur les autres composants
- Maintenir la compatibilité descendante
- Mettre à jour la documentation

### Optimisation des Performances
- Utiliser `v-show` vs `v-if` judicieusement
- Implémenter le lazy loading pour les images
- Optimiser les watchers et computed properties

### Tests
- Tester chaque composant individuellement
- Vérifier la réactivité des données
- Tester la responsive design

## Support

Pour toute question ou problème, veuillez consulter la documentation officielle de Vue.js ou créer une issue dans le dépôt du projet.