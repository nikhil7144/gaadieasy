"use client";

import ReactMarkdown from "react-markdown";

const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mt-8 mb-3 text-3xl font-black text-slate-950 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mt-7 mb-3 text-2xl font-black text-slate-950 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-6 mb-2 text-xl font-black text-slate-950 first:mt-0">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mt-5 mb-2 text-lg font-black text-slate-950">{children}</h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 leading-7 text-slate-700 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-black text-slate-950">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-slate-800">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-slate-700">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-slate-700">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-7">{children}</li>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a className="font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900" href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-4 border-l-4 border-emerald-400 pl-4 italic text-slate-600">{children}</blockquote>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <pre className="my-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-emerald-200">
          <code>{children}</code>
        </pre>
      );
    }
    return <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800">{children}</code>;
  },
  hr: () => <hr className="my-8 border-slate-200" />,
};

export function MarkdownBody({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown components={components as never}>{children}</ReactMarkdown>
    </div>
  );
}
