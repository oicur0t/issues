'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

interface WikiRendererProps {
  content: string
  className?: string
}

export function WikiRenderer({ content, className }: WikiRendererProps) {
  return (
    <div className={cn('markdown-content prose prose-gray max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks with syntax highlighting
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const inline = !language

            return !inline && language ? (
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                className="rounded-lg"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          
          // Custom heading styles
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props}>
              {children}
            </h1>
          ),
          
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props}>
              {children}
            </h2>
          ),
          
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props}>
              {children}
            </h3>
          ),
          
          h4: ({ children, ...props }) => (
            <h4 className="text-lg font-semibold mt-3 mb-2 text-foreground" {...props}>
              {children}
            </h4>
          ),
          
          // Paragraph styling
          p: ({ children, ...props }) => (
            <p className="mb-4 leading-relaxed text-foreground" {...props}>
              {children}
            </p>
          ),
          
          // List styling
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          
          li: ({ children, ...props }) => (
            <li className="text-foreground" {...props}>
              {children}
            </li>
          ),
          
          // Blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 bg-muted/30 py-2" {...props}>
              {children}
            </blockquote>
          ),
          
          // Link styling
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="text-primary hover:underline underline-offset-2" 
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border" {...props}>
                {children}
              </table>
            </div>
          ),
          
          thead: ({ children, ...props }) => (
            <thead className="bg-muted" {...props}>
              {children}
            </thead>
          ),
          
          th: ({ children, ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-medium" {...props}>
              {children}
            </th>
          ),
          
          td: ({ children, ...props }) => (
            <td className="border border-border px-4 py-2" {...props}>
              {children}
            </td>
          ),
          
          // Horizontal rule
          hr: ({ ...props }) => (
            <hr className="border-border my-6" {...props} />
          ),
          
          // Image styling
          img: ({ src, alt, ...props }) => (
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full h-auto rounded-lg border border-border my-4"
              {...props} 
            />
          ),
          
          // Strong/bold text
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          
          // Emphasis/italic text
          em: ({ children, ...props }) => (
            <em className="italic text-foreground" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}