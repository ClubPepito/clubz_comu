export type DocSection = {
  id: string;
  title: string;
  content: string;
};

export const docsSections: DocSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: `
# Bienvenue sur Clubz

Cette documentation est destinée aux développeurs souhaitant créer des widgets et des pages pour le **Clubz Community Builder**.

Clubz vous permet de créer des widgets dynamiques en React, de les prévisualiser en temps réel, et de les distribuer aux administrateurs de communautés via un format simple (le manifeste \`clubz.json\`).

### Nouveau Workflow (Recommandé)

Le processus de déploiement a été entièrement repensé pour être plus simple et plus sécurisé :
1. Créez votre widget localement avec n'importe quel framework.
2. Définissez vos métadonnées dans un \`clubz.json\`.
3. Cliquez sur **Déployer un Widget** dans l'espace développeur, sélectionnez votre dossier, et l'interface s'occupe de tout !

Vous n'avez plus besoin d'installer notre CLI ni de gérer des tokens d'API en ligne de commande.
`
  },
  {
    id: "cli",
    title: "La CLI",
    content: `
# Utilisation de la CLI

Cependant, vous pouvez toujours utiliser le module NPM pour **générer un template de base** rapidement :

\`\`\`bash
npx @clubz/cli@latest init mon-super-widget
\`\`\`

Cette commande va générer un dossier contenant :
- Un template React + Vite prêt à l'emploi.
- Le SDK Clubz pré-installé.
- Un manifeste \`clubz.json\` basique.

Une fois développé, retournez sur l'onglet **Mes Créations** et importez le dossier.
`
  },
  {
    id: "sdk",
    title: "Clubz SDK",
    content: `
# Le SDK React (\`@clubz/sdk\`)

Le SDK vous permet de communiquer avec l'application hôte (Clubz) depuis l'Iframe de votre widget.

## Installation

\`\`\`bash
npm install @clubz/sdk
\`\`\`

## Hooks Principaux

Le SDK expose plusieurs hooks React utiles pour récupérer le contexte d'exécution.

### \`useWidget()\`
Récupère les informations du widget courant et ses paramètres d'instance.

\`\`\`tsx
import { useWidget } from '@clubz/sdk';

export function MonWidget() {
  const { widget, instanceId, config } = useWidget();
  
  return (
    <div>
      <h1>Widget: {widget.name}</h1>
      <p>ID Instance: {instanceId}</p>
      {/* Utilisation d'une configuration personnalisée définie dans le manifest */}
      <div style={{ color: config.themeColor }}>Texte dynamique</div>
    </div>
  );
}
\`\`\`

### \`useUser()\`
Permet d'accéder à l'utilisateur courant (si connecté dans l'application mère).

\`\`\`tsx
import { useUser } from '@clubz/sdk';

export function UserProfile() {
  const { user, isAuthenticated } = useUser();
  
  if (!isAuthenticated) return <p>Veuillez vous connecter</p>;
  return <p>Bonjour {user.name} !</p>;
}
\`\`\`
`
  },
  {
    id: "manifest",
    title: "Le Manifeste",
    content: `
# Le fichier \`clubz.json\`

Chaque widget doit posséder un fichier \`clubz.json\` (ou \`widget.json\`) à la racine de son build (souvent le dossier \`public/\`). 

Il permet à Clubz de comprendre ce qu'est votre widget.

\`\`\`json
{
  "name": "Mon Super Widget",
  "version": "1.0.0",
  "description": "Un widget qui fait des trucs géniaux.",
  "type": "Widget", 
  "tags": ["social", "feed"],
  "entry": "/index.html"
}
\`\`\`

### Propriétés :
- **\`name\`** : Le nom affiché sur la marketplace.
- **\`version\`** : Doit suivre le format SemVer.
- **\`description\`** : Décrivez l'utilité de votre widget.
- **\`type\`** : \`Widget\` (module encastrable) ou \`Page\` (pleine page).
- **\`entry\`** : Le point d'entrée de votre build. Par défaut \`/index.html\` pour une SPA Vite.

> **Astuce :** Vous pouvez éditer ces informations en direct depuis la modale de déploiement web avant de valider votre publication !
`
  },
  {
    id: "api",
    title: "Appels API & Environnements",
    content: `
# Réseau et Environnements

### 1. Appeler des API externes depuis un Widget

Les widgets Clubz s'exécutent côté client, dans le navigateur de l'utilisateur (via une iframe sécurisée). 
Vous pouvez faire des appels vers des API externes (ex: Météo, Stripe, etc.) en utilisant un \`fetch\` ou \`axios\` classique :

\`\`\`tsx
const response = await fetch("https://api.monservice.com/data");
const data = await response.json();
\`\`\`

> ⚠️ **Sécurité (Clés Privées)** : Ne placez **jamais** de clés d'API privées (ex: Stripe Secret Key, OpenAI API Key) dans le code source de votre widget ! Puisqu'il s'exécute côté client, n'importe qui pourrait lire votre clé. Si vous devez utiliser une clé privée, vous devez soit créer votre propre petit serveur backend pour faire le relais, soit n'utiliser que des clés publiques conçues pour le frontend.

### 2. Comment le SDK gère-t-il les environnements (Local, Preprod, Prod) ?

C'est la magie du \`@clubz/sdk\` : **il n'a pas besoin d'être configuré !** 

Le SDK ne fait **aucune requête HTTP directe** vers l'API Clubz. À la place, il utilise un "Pont de communication" (Native Bridge) via \`postMessage\` pour parler directement à l'application hôte (Clubz Web ou Clubz Mobile) qui l'encadre.

C'est l'application hôte (\`clubz_comu\`) qui sait si elle est en mode local (\`localhost:3000\`), en préproduction ou en production. Quand vous utilisez \`bridge.getUser()\`, le SDK demande simplement à l'application mère de lui fournir l'utilisateur. 

### 3. Comment faire si mon propre backend a besoin de données Clubz ?

Si votre widget possède son propre serveur backend (ex: pour stocker des scores, gérer des paiements sécurisés) et que ce serveur a besoin de données de Clubz, **il ne faut jamais faire confiance aux données envoyées par le frontend**.

Voici l'architecture de sécurité standard à adopter :

**A. La méthode d'authentification par Jeton (JWT)**
1. Le frontend de votre widget demande un jeton temporaire via le SDK : \`const token = await bridge.getSessionToken();\` *(Cette fonctionnalité sera bientôt disponible dans le SDK)*
2. Le frontend envoie ce \`token\` à **votre** backend.
3. Votre backend vérifie la signature de ce \`token\` en appelant l'API Clubz (ou via une clé publique Clubz). S'il est valide, votre backend sait avec certitude quel utilisateur est connecté.

**B. La méthode Server-to-Server (API Keys)**
Si votre backend a besoin de récupérer des données communautaires de manière asynchrone (même quand l'utilisateur n'est pas sur le widget), vous devrez :
1. Générer une **Clé d'API Serveur** depuis cet espace développeur.
2. Utiliser cette clé sur votre backend pour interroger directement l'API REST de Clubz (\`https://api.clubz.co\`).
`
  },
  {
    id: "api-reference",
    title: "Références de l'API Développeur",
    content: `
# API Server-to-Server (Développeurs)

Les routes suivantes sont **strictement réservées aux développeurs**. 
Pour y accéder depuis votre propre backend ou via un script, vous devez fournir votre **Clé d'API** dans l'en-tête de votre requête HTTP.

> ⚠️ **Attention** : Ces requêtes nécessitent une Clé API valide générée depuis l'onglet "Clés API". Ne partagez jamais cette clé !

### Authentification requise
\`\`\`http
Authorization: Bearer <VOTRE_CLE_API_SECRETE>
\`\`\`

---

## 🛠 Gestion des Widgets (\`/widget-library/developer/*\`)

Voici la liste des points d'accès disponibles pour automatiser la gestion de vos widgets :

### \`POST /api/widget-library/developer/create\`
Crée la coquille vide d'un nouveau widget (brouillon).

### \`GET /api/widget-library/developer/drafts\`
Récupère tous vos widgets actuellement en brouillon.

### \`GET /api/widget-library/developer/my-widgets\`
Récupère l'intégralité de vos widgets (tous statuts confondus).

### \`GET /api/widget-library/developer/:id\`
Récupère les détails d'un widget spécifique.

### \`PATCH /api/widget-library/developer/:id\`
Mise à jour des métadonnées d'un widget (ex: passage en statut "pending" pour validation).

### \`DELETE /api/widget-library/developer/:id\`
Supprime définitivement un widget.

### \`POST /api/widget-library/developer/deploy\`
Déploie une nouvelle version du widget. Reçoit un fichier \`.zip\` (le build) et un champ \`manifest\` contenant le JSON. C'est l'API utilisée en interne par la CLI \`clubz deploy\`.

---

> 💡 **En coulisse :** Le backend Clubz (NestJS) sécurise ces routes grâce à la balise \`@DeveloperRoute()\`. Cette balise garantit qu'une Clé API ne peut être utilisée **que** sur ces endpoints spécifiques, rendant impossible l'utilisation de votre clé pour lire les messages ou modifier des profils utilisateurs !
`
  }
];
