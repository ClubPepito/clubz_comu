import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import { docsSections } from './docsContent';
import { DynamicApiDocs } from './DynamicApiDocs';
import { ChevronRight, FileText, Code, Terminal, Book, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_NAME } from '@/constants/branding';

const ICONS: Record<string, typeof Book> = {
  introduction: Book,
  cli: Terminal,
  sdk: Code,
  manifest: FileText,
  api: Globe,
};

export function Documentation() {
  const [activeSection, setActiveSection] = useState<string>(docsSections[0].id);

  const activeDoc = docsSections.find((s) => s.id === activeSection) || docsSections[0];
  const activeIndex = docsSections.findIndex((s) => s.id === activeSection);
  const prevSection = activeIndex > 0 ? docsSections[activeIndex - 1] : null;
  const nextSection =
    activeIndex < docsSections.length - 1 ? docsSections[activeIndex + 1] : null;

  return (
    <div className="mt-1 flex min-h-[600px] flex-col items-start gap-6 md:flex-row">
      <aside className="w-full shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 shadow-klyb-sm md:sticky md:top-24 md:w-64">
        <div className="mb-2 px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documentation
          </h3>
        </div>
        <nav className="space-y-0.5">
          {docsSections.map((section) => {
            const Icon = ICONS[section.id] || FileText;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex w-full items-start justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <div className="flex flex-1 items-start gap-3">
                  <Icon
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      isActive ? 'text-primary' : 'opacity-60',
                    )}
                  />
                  <span className="leading-snug">{section.title}</span>
                </div>
                {isActive && <ChevronRight className="mt-1 size-3 shrink-0 opacity-50" />}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 max-w-[800px] flex-1 rounded-2xl border border-border/60 bg-card p-8 shadow-klyb-sm transition-all md:p-10">
        <article className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary prose-code:rounded-md prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border/30 prose-pre:bg-[#282c34] prose-pre:text-white">
          {activeSection === 'api-reference' ? (
            <DynamicApiDocs />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {activeDoc.content}
            </ReactMarkdown>
          )}
        </article>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {prevSection && (
              <button
                type="button"
                onClick={() => setActiveSection(prevSection.id)}
                className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                ← {prevSection.title}
              </button>
            )}
            {nextSection && (
              <button
                type="button"
                onClick={() => setActiveSection(nextSection.id)}
                className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {nextSection.title} →
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {BRAND_NAME} Platform
          </p>
        </div>
      </main>
    </div>
  );
}
