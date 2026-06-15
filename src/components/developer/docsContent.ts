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
# Bienvenue sur Klyb

Cette documentation est destinée aux développeurs souhaitant créer des widgets et des pages pour le **Klyb Community Builder**.

Klyb vous permet de créer des widgets dynamiques en React, de les prévisualiser en temps réel, et de les distribuer aux administrateurs de communautés via un format simple (le manifeste \`klyb.json\`).

### Nouveau Workflow (Recommandé)

Le processus de déploiement a été entièrement repensé pour être plus simple et plus sécurisé :
1. Créez votre widget localement avec n'importe quel framework.
2. Définissez vos métadonnées dans un \`klyb.json\`.
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
npx @klyb/cli@latest init mon-super-widget
\`\`\`

Cette commande va générer un dossier contenant :
- Un template React + Vite prêt à l'emploi.
- Le SDK Klyb pré-installé.
- Un manifeste \`klyb.json\` basique.

### Authentification & Environnements
La CLI gère nativement plusieurs environnements de déploiement. Utilisez la commande de connexion pour choisir votre cible :
- **Production** (par défaut) : \`klyb login\`
- **Pré-production** : \`klyb login --staging\`
- **Local** : \`klyb login --local\`

Une fois connecté, la commande \`klyb deploy\` publiera automatiquement votre widget sur le bon serveur !

### Mettre à jour un projet existant
L'écosystème Klyb évolue régulièrement. Pour profiter des dernières fonctionnalités dans vos widgets :

1. **Mettre à jour la CLI** (Outil de déploiement) :
   Si vous utilisez \`npx\`, rajoutez simplement \`@latest\` : \`npx @klyb/cli@latest deploy\`.
   Si vous l'avez installée globalement :
   \`\`\`bash
   npm update -g @klyb/cli
   \`\`\`

2. **Mettre à jour le SDK** (Code de votre widget) :
   Dans le dossier de votre projet, installez la dernière version du SDK :
   \`\`\`bash
   npm install @klyb/sdk@latest
   \`\`\`

> **Note de migration (Clubz ➡️ Klyb)** : Si votre projet a été généré à l'époque de "Clubz", renommez votre fichier \`clubz.json\` en \`klyb.json\`. Ensuite, dans votre code source, remplacez simplement vos imports \`@clubz/sdk\` par \`@klyb/sdk\`.
`
  },
  {
    id: "sdk",
    title: "Klyb SDK",
    content: `
# Le SDK React (\`@klyb/sdk\`)

Le SDK vous permet de communiquer avec l'application hôte (Klyb) depuis l'Iframe de votre widget. Il expose des hooks React ainsi qu'un objet \`bridge\` pour exécuter des actions natives sur le téléphone.

## Installation

\`\`\`bash
npm install @klyb/sdk
\`\`\`

## Hooks Principaux

Le SDK expose plusieurs hooks React utiles pour récupérer le contexte d'exécution.

### \`useWidget()\`
Récupère les informations du widget courant et ses paramètres d'instance.

\`\`\`tsx
import { useWidget } from '@klyb/sdk';

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
import { useUser } from '@klyb/sdk';

export function UserProfile() {
  const { user, isAuthenticated } = useUser();
  
  if (!isAuthenticated) return <p>Veuillez vous connecter</p>;
  return <p>Bonjour @{user.username} !</p>;
}
\`\`\`

## Actions Natives (Le Bridge)

### \`bridge.resize(height)\`
L'application mobile de Klyb enferme votre widget dans une zone délimitée. Si le contenu de votre widget dépasse, il sera coupé. Appelez \`bridge.resize()\` pour forcer l'application mobile à adapter sa hauteur à votre contenu !

\`\`\`tsx
import { bridge } from '@klyb/sdk';
import { useEffect, useRef } from 'react';

export function AutoResizingWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dès le chargement, on indique à l'app mobile notre taille réelle
    if (containerRef.current) {
       bridge.resize(containerRef.current.scrollHeight);
    }
  }, []);

  return <div ref={containerRef}>Contenu adaptatif de mon widget...</div>;
}
\`\`\`
`
  },
  {
    id: "manifest",
    title: "Le Manifeste",
    content: `
# Le fichier \`klyb.json\`

Chaque widget doit posséder un fichier \`klyb.json\` (ou \`widget.json\`) à la racine de son build (souvent le dossier \`public/\`). 

Il permet à Klyb de comprendre ce qu'est votre widget.

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

### Propriétés du Manifeste :

| Champ | Type | Description |
|-----------|------|-------------|
| **\`name\`** | \`string\` | Le nom affiché publiquement sur la marketplace Klyb. |
| **\`version\`** | \`string\` | Doit suivre le format standard *SemVer* (ex: \`1.0.2\`). |
| **\`description\`** | \`string\` | Décrivez l'utilité de votre widget en quelques mots. |
| **\`type\`** | \`enum\` | \`Widget\` (module encastrable) ou \`Page\` (pleine page). |
| **\`entry\`** | \`string\` | Le point d'entrée de votre build. Par défaut \`/index.html\` pour Vite. |

> **Astuce :** Vous pouvez éditer ces informations en direct depuis la modale de déploiement web avant de valider votre publication !
`
  },
  {
    id: "api",
    title: "Appels API & Environnements",
    content: `
# Réseau et Sécurité

### 1. Appels vers des API externes

Les widgets Klyb s'exécutent côté client, dans une iframe sécurisée au sein du navigateur de l'utilisateur. Vous pouvez effectuer des appels HTTP standards (\`fetch\`, \`axios\`) vers vos propres services ou des API publiques.

> ⚠️ **Attention aux secrets** : Ne placez **jamais** de clés d'API privées (Stripe Secret Key, OpenAI, etc.) dans le code source de votre widget ! Étant exécuté côté client, votre code est visible par n'importe qui. Pour utiliser des clés privées, créez votre propre backend sécurisé qui fera office de relais.

### 2. Architecture Décentralisée (Identity Provider)

Klyb adopte une architecture décentralisée de pointe (similaire à des plateformes comme Shopify ou Discord). Klyb n'héberge pas vos variables d'environnement. À la place, **Klyb agit comme un Fournisseur d'Identité (IdP)**.

#### Le Jeton d'Identité (Identity JWT)
Lorsque votre widget est chargé, Klyb lui injecte un **Identity JWT**. Ce jeton, signé cryptographiquement par l'infrastructure Klyb, atteste de l'identité de l'utilisateur actuel sans jamais exposer de données sensibles.

**Comment l'utiliser ?**
1. **Côté Widget (Frontend)** : Vous récupérez le jeton injecté et l'envoyez dans l'en-tête de vos requêtes vers votre propre backend :
   \`\`\`typescript
   // Le jeton est disponible globalement ou via le SDK
   const token = window.KLYB_CONTEXT?.props?.identityToken;
   
   await fetch('https://votre-backend.com/api/action', {
     headers: { 'Authorization': \`Bearer \${token}\` }
   });
   \`\`\`

2. **Côté Backend (Votre serveur)** : Vous devez impérativement vérifier la validité de la signature de ce JWT pour vous assurer que la requête provient bien de Klyb.

### 3. Vérification du JWT via JWKS

Afin de simplifier et sécuriser la validation des signatures, Klyb expose ses clés publiques via le standard de l'industrie **JWKS (JSON Web Key Set)**. Cela permet à vos bibliothèques JWT de télécharger et mettre en cache automatiquement les clés, tout en gérant nativement la rotation des clés (Key Rotation).

**URL JWKS :** \`https://api.klyb.app/.well-known/jwks.json\`

**Caractéristiques du Jeton :**
- **Algorithme (alg)** : \`RS256\`
- **Issuer (iss)** : \`https://api.klyb.app\`
- **Audience (aud)** : \`[ID_DE_VOTRE_WIDGET]\` (pour empêcher les attaques par rejeu d'un widget vers un autre)
- **Expiration (exp)** : Courte (15 minutes) pour une sécurité optimale.
- **Claims Personnalisés** : Le payload contient également \`userId\`, \`communityId\`, et \`role\` pour identifier formellement l'utilisateur.

**Exemple de vérification backend en NodeJS (avec \`jsonwebtoken\` et \`jwks-rsa\`) :**
\`\`\`javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://api.klyb.app/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Vérification du token entrant
jwt.verify(token, getKey, {
  audience: 'VOTRE_WIDGET_ID',
  issuer: 'https://api.klyb.app',
  algorithms: ['RS256']
}, function(err, decoded) {
  if (err) return res.status(401).send('Token invalide ou expiré');
  console.log("Utilisateur Klyb vérifié :", decoded.userId);
});
\`\`\`

### 4. Rafraîchissement du Jeton

Étant donné que l'Identity JWT a une durée de vie très courte (15 minutes), il finira par expirer si l'utilisateur laisse la page de son application ouverte longtemps. Klyb a prévu un mécanisme pour gérer cela silencieusement.

Si votre backend vous renvoie une erreur \`401 Unauthorized\` parce que le jeton a expiré, votre code frontal peut en demander un neuf sans recharger toute la page, grâce au bridge de Klyb :

\`\`\`javascript
try {
  // Rafraîchit silencieusement le jeton auprès de l'application hôte
  const freshToken = await window.Klyb.getIdentityToken();
  // Relancez votre requête HTTP avec ce freshToken !
} catch (error) {
  console.error("Impossible de rafraîchir le jeton", error);
}
\`\`\`

### 5. API Server-to-Server (Clés API)

Si votre backend a besoin d'interagir avec l'API Klyb de manière asynchrone ou détachée de l'utilisateur (ex: envoyer une notification push parce qu'un événement asynchrone est terminé), vous devez utiliser les **Clés d'API Serveur**.
Générez-les depuis l'onglet "Clés API" de cet Espace Développeur et passez-les via l'en-tête HTTP \`Authorization: Bearer <VOTRE_CLE>\` lors de vos appels vers l'API REST Klyb.
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
Déploie une nouvelle version du widget. Reçoit un fichier \`.zip\` (le build) et un champ \`manifest\` contenant le JSON. C'est l'API utilisée en interne par la CLI \`klyb deploy\`.

---

> 💡 **En coulisse :** Le backend Klyb (NestJS) sécurise ces routes grâce à la balise \`@DeveloperRoute()\`. Cette balise garantit qu'une Clé API ne peut être utilisée **que** sur ces endpoints spécifiques, rendant impossible l'utilisation de votre clé pour lire les messages ou modifier des profils utilisateurs !
`
  }
];
