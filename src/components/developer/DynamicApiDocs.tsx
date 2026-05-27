import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { systemService } from '@/services/api';

export function DynamicApiDocs() {
  const [markdown, setMarkdown] = useState<string>('Chargement de la documentation API...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const response = await systemService.getDeveloperApiDocs();
        const swaggerJson = response.data;
        
        let md = `# Références de l'API Développeur\n\n`;
        md += `Les routes suivantes sont **strictement réservées aux développeurs**.\n\n`;
        md += `> ⚠️ **Attention** : Ces requêtes nécessitent une Clé API valide générée depuis l'onglet "Clés API".\n\n`;
        md += `### Authentification requise\n\`\`\`http\nAuthorization: Bearer <VOTRE_CLE_API_SECRETE>\n\`\`\`\n\n---\n\n`;
        
        const paths = swaggerJson.paths;
        if (!paths) {
          setMarkdown(md + "*Aucune route développeur disponible.*");
          return;
        }

        // Group by tags
        const routesByTag: Record<string, any[]> = {};
        
        for (const [path, methods] of Object.entries(paths)) {
          for (const [method, details] of Object.entries(methods as Record<string, any>)) {
             const routeStr = `### \`${method.toUpperCase()} ${path}\`\n${details.summary || ''}\n\n`;
             // In NestJS Swagger, paths might be prefixed with /api, but the JSON shows actual paths
             // We just list them.
             const tag = (details.tags && details.tags[0]) || 'Général';
             if (!routesByTag[tag]) routesByTag[tag] = [];
             routesByTag[tag].push(routeStr);
          }
        }

        for (const [tag, routes] of Object.entries(routesByTag)) {
          md += `## 🛠 ${tag}\n\n`;
          routes.forEach(r => md += r);
          md += `---\n\n`;
        }
        
        md += `> 💡 **En coulisse :** Le backend Clubz sécurise ces routes grâce à la balise \`@DeveloperRoute()\`. Cette balise garantit qu'une Clé API ne peut être utilisée **que** sur ces endpoints spécifiques.\n`;

        setMarkdown(md);
      } catch (err) {
        console.error('Failed to fetch API docs', err);
        setError("Impossible de charger la documentation de l'API (Assurez-vous que le backend est lancé).");
      }
    }
    
    fetchDocs();
  }, []);

  if (error) {
    return <div className="text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">{error}</div>;
  }

  return (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
    >
        {markdown}
    </ReactMarkdown>
  );
}
