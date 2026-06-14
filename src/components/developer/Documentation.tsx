import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css'; // Belle coloration syntaxique
import { docsSections } from './docsContent';
import { DynamicApiDocs } from './DynamicApiDocs';
import { ChevronRight, FileText, Code, Terminal, Book, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/constants/branding';

const ICONS: Record<string, any> = {
  introduction: Book,
  cli: Terminal,
  sdk: Code,
  manifest: FileText,
  api: Globe
};

export function Documentation() {
  const [activeSection, setActiveSection] = useState<string>(docsSections[0].id);

  const activeDoc = docsSections.find(s => s.id === activeSection) || docsSections[0];

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start min-h-[600px] mt-4">
      {/* Sidebar - Style Fumadocs */}
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden p-3">
        <div className="px-3 py-2 mb-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Documentation</h3>
        </div>
        <nav className="space-y-1">
          {docsSections.map((section) => {
            const Icon = ICONS[section.id] || FileText;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-start justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-left",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", isActive ? "text-primary" : "opacity-60")} />
                  <span className="leading-snug">{section.title}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 mt-1 opacity-50 shrink-0" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-[800px] bg-card border border-border/50 shadow-sm rounded-xl p-8 md:p-12 transition-all">
        <article className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#282c34] prose-pre:text-white prose-pre:border prose-pre:border-border/30">
          {activeSection === 'api-reference' ? (
            <DynamicApiDocs />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {activeDoc.content}
            </ReactMarkdown>
          )}
        </article>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {BRAND_NAME} Platform</p>
          <a href="#" className="hover:text-foreground transition-colors">Besoin d'aide ?</a>
        </div>
      </main>
    </div>
  );
}
