'use client'

import { useState, useTransition } from 'react'
import { createComment, deleteComment } from '../comments/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { MessageSquare, Trash2 } from 'lucide-react'
import { getUserInitials, generateAvatarColor } from '@/lib/utils'
import { LocalDate } from '@/app/components/LocalDate'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Comment {
  _id: string
  content: string
  createdAt: Date
  updatedAt: Date
  author: {
    _id: string
    name: string
    email: string
  }
  authorId: string
}

interface IssueCommentsProps {
  issueId: string
  initialComments: Comment[]
  currentUserId: string
}

export function IssueComments({ issueId, initialComments, currentUserId }: IssueCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    startTransition(async () => {
      try {
        const comment = await createComment({
          issueId,
          content: newComment,
        })

        setComments([...comments, comment as any])
        setNewComment('')
      } catch (error) {
        console.error('Failed to create comment:', error)
        alert(error instanceof Error ? error.message : 'Failed to create comment')
      }
    })
  }

  const handleDelete = (commentId: string) => {
    if (!confirm('Delete this comment?')) return

    startTransition(async () => {
      try {
        await deleteComment(commentId)
        setComments(comments.filter(c => c._id.toString() !== commentId))
      } catch (error) {
        console.error('Failed to delete comment:', error)
        alert(error instanceof Error ? error.message : 'Failed to delete comment')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-4 border-black p-6 bg-secondary" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
        <MessageSquare className="h-8 w-8" />
        <h2 className="text-3xl font-black uppercase">Comments ({comments.length})</h2>
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment._id.toString()} className="p-4 bg-white border-4 border-black" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
              <div className="flex gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${generateAvatarColor(comment.author.email)}`}>
                  {getUserInitials(comment.author.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold">{comment.author.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        <LocalDate date={comment.createdAt} />
                      </span>
                    </div>
                    {comment.authorId.toString() === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment._id.toString())}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="text-sm prose prose-sm max-w-none">
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
                              className="rounded-md text-xs my-2"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                              {children}
                            </code>
                          )
                        },
                        p: ({ children, ...props }) => (
                          <p className="mb-2 last:mb-0" {...props}>
                            {children}
                          </p>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul className="list-disc pl-4 mb-2 space-y-1" {...props}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol className="list-decimal pl-4 mb-2 space-y-1" {...props}>
                            {children}
                          </ol>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote className="border-l-3 border-primary pl-3 italic my-2 bg-muted/30 py-1" {...props}>
                            {children}
                          </blockquote>
                        ),
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
                        strong: ({ children, ...props }) => (
                          <strong className="font-bold" {...props}>
                            {children}
                          </strong>
                        ),
                        em: ({ children, ...props }) => (
                          <em className="italic" {...props}>
                            {children}
                          </em>
                        ),
                      }}
                    >
                      {comment.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... (Markdown supported)"
          rows={3}
          className="border-4 border-black focus:ring-0 focus:border-black"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        />
        <Button
          type="submit"
          disabled={isPending || !newComment.trim()}
          className="font-black border-4 border-black"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
    </div>
  )
}
