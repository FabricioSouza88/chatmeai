import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

const components: Components = {
  p({ children }) {
    return (
      <p style={{ marginBottom: '0.85em', lineHeight: '1.75', fontWeight: 400 }}>{children}</p>
    )
  },
  strong({ children }) {
    return <strong style={{ fontWeight: 600 }}>{children}</strong>
  },
  ul({ children }) {
    return (
      <ul style={{ marginBottom: '0.85em', paddingLeft: '1.4em', listStyleType: 'disc' }}>
        {children}
      </ul>
    )
  },
  ol({ children }) {
    return (
      <ol style={{ marginBottom: '0.85em', paddingLeft: '1.4em', listStyleType: 'decimal' }}>
        {children}
      </ol>
    )
  },
  li({ children }) {
    return <li style={{ marginBottom: '0.35em', lineHeight: '1.7' }}>{children}</li>
  },
  h1({ children }) {
    return (
      <h1 style={{ fontSize: '1.25em', fontWeight: 600, marginBottom: '0.6em', lineHeight: '1.4' }}>
        {children}
      </h1>
    )
  },
  h2({ children }) {
    return (
      <h2 style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: '0.5em', lineHeight: '1.4' }}>
        {children}
      </h2>
    )
  },
  h3({ children }) {
    return (
      <h3 style={{ fontSize: '1em', fontWeight: 600, marginBottom: '0.4em', lineHeight: '1.4' }}>
        {children}
      </h3>
    )
  },
  table({ children }) {
    return (
      <div style={{ overflowX: 'auto', marginBottom: '0.85em' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875em',
            lineHeight: '1.6',
          }}
        >
          {children}
        </table>
      </div>
    )
  },
  thead({ children }) {
    return <thead>{children}</thead>
  },
  tbody({ children }) {
    return <tbody>{children}</tbody>
  },
  tr({ children }) {
    return <tr>{children}</tr>
  },
  th({ children }) {
    return (
      <th
        style={{
          padding: '0.5em 0.85em',
          textAlign: 'left',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        {children}
      </th>
    )
  },
  td({ children }) {
    return (
      <td
        style={{
          padding: '0.5em 0.85em',
          verticalAlign: 'top',
          color: 'var(--color-text-primary)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {children}
      </td>
    )
  },
  pre({ children }) {
    return <>{children}</>
  },
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '')
    if (match) {
      return (
        <SyntaxHighlighter
          language={match[1]}
          style={oneDark}
          customStyle={{ borderRadius: '8px', fontSize: '0.875rem', margin: '0.75rem 0' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    }
    return (
      <code
        className={className}
        style={{
          backgroundColor: 'var(--color-code-bg)',
          padding: '0.1em 0.4em',
          borderRadius: '4px',
          fontSize: '0.875em',
        }}
      >
        {children}
      </code>
    )
  },
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
