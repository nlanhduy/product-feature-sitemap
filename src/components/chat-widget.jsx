'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  MoveRight,
  Eye,
  Plus,
  Pencil,
  Trash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import treeUtils from '@/lib/tree-utils'
import { ChatService } from '@/services/ChatService'
import { useMutation } from '@tanstack/react-query'

export function ChatWidget({
  className,
  sessionId: initialSessionId,
  handleMoveToNode,
  handleNodeDetailClick,
  handleAddSubfeature,
  handleDeleteFeature,
  handleEditFeature,
  tree,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [sessionId, setSessionId] = useState(initialSessionId || `session_${Date.now()}`)
  const messagesEndRef = useRef()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  const renderText = (content, options) => {
    return content ? (
      <ReactMarkdown components={{ ...options }} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    ) : null
  }

  const messageMutation = useMutation({
    mutationFn: ChatService.sendMessage,
    onSuccess: data => {
      if (data.success && data.message) {
        if (data.session_id) {
          setSessionId(data.session_id)
        }

        let nodeData = null
        if (tree && data.metadata?.current_context.current_node) {
          nodeData = treeUtils.findNode(tree, data.metadata.current_context.current_node)
        }

        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            text: data.message,
            isUser: false,
            timestamp: new Date(),
            nodeData,
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            text: data.error || 'Sorry, something went wrong. Please try again.',
            isUser: false,
            timestamp: new Date(),
          },
        ])
      }
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          text: 'Failed to send message. Please check your connection and try again.',
          isUser: false,
          timestamp: new Date(),
        },
      ])
    },
  })

  const sendMessage = text => {
    if (!text.trim() || messageMutation.isPending) return

    const userMessage = {
      id: `user_${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    messageMutation.mutate({ message: text, sessionId })
  }

  const handleSubmit = e => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  return (
    <>
      <div className={cn('fixed bottom-4 left-4 z-50', className)}>
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size='lg'
            className='h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90'>
            <MessageCircle className='h-6 w-6' />
          </Button>
        )}

        {isOpen && (
          <Card
            className={cn(
              'w-[400px] shadow-2xl transition-all duration-300 ease-in-out',
              isMinimized ? 'h-14' : 'h-[600px]',
            )}>
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg'>
              <div className='flex items-center gap-2'>
                <MessageCircle className='h-5 w-5' />
                <span className='font-medium'>Chat Support</span>
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsMinimized(!isMinimized)}
                  className='h-8 w-8 p-0 hover:bg-primary-foreground/20 text-primary-foreground'>
                  <Minimize2 className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsOpen(false)}
                  className='h-8 w-8 p-0 hover:bg-primary-foreground/20 text-primary-foreground'>
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className='flex-1 p-4 h-64 overflow-y-auto space-y-3'>
                  {messages.length === 0 && (
                    <div className='text-center text-muted-foreground text-sm'>
                      👋 Hi! How can I help you today?
                    </div>
                  )}
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex flex-col',
                        message.isUser ? 'items-end' : 'items-start',
                      )}>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}>
                        {renderText(message.text)}
                      </div>

                      {message.nodeData && (
                        <div className='mt-2 max-w-[80%] p-3 border rounded-lg bg-background'>
                          <div className='flex items-center justify-between mb-2'>
                            <h4 className='font-semibold text-sm'>
                              {message.nodeData.name}
                            </h4>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                handleMoveToNode(message.nodeData)
                                handleNodeDetailClick(message.nodeData)
                              }}
                              className='h-6 w-6 p-0'>
                              <MoveRight className='h-3 w-3' />
                            </Button>
                          </div>
                          <p className='text-xs text-muted-foreground mb-2'>
                            {message.nodeData.description}
                          </p>

                          {message.nodeData.children &&
                            message.nodeData.children.length > 0 && (
                              <div className='mb-2'>
                                <div className='text-xs font-medium mb-1'>Children:</div>
                                <div className='flex flex-wrap gap-1'>
                                  {treeUtils
                                    .getAllChildrenNames(tree, message.nodeData.id)
                                    .slice(0, 3)
                                    .map((childName, index) => (
                                      <Badge
                                        key={index}
                                        variant='outline'
                                        className='text-xs px-1 py-0'>
                                        {childName}
                                      </Badge>
                                    ))}
                                  {message.nodeData.children.length > 3 && (
                                    <Badge
                                      variant='outline'
                                      className='text-xs px-1 py-0'>
                                      +{message.nodeData.children.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          <div className='text-xs text-muted-foreground'>
                            <strong>Value:</strong> {message.nodeData.valueProposition}
                          </div>

                          <div className='flex flex-wrap gap-2 mt-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleNodeDetailClick(message.nodeData)}
                              className='h-7 text-xs px-2 flex items-center gap-1 basis-[45%]'>
                              <Eye className='w-3 h-3' />
                              Open Detail
                            </Button>

                            {handleAddSubfeature && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleAddSubfeature(message.nodeData.id)}
                                className='h-7 text-xs px-2 flex items-center gap-1 basis-[45%]'>
                                <Plus className='w-3 h-3' />
                                Add Subfeature
                              </Button>
                            )}

                            {handleEditFeature && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleEditFeature(message.nodeData)}
                                className='h-7 text-xs px-2 flex items-center gap-1 basis-[45%]'>
                                <Pencil className='w-3  h-3' />
                                Edit Feature
                              </Button>
                            )}

                            {handleDeleteFeature && (
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => handleDeleteFeature(message.nodeData.id)}
                                className='h-7 text-xs px-2 flex items-center gap-1 basis-[50%]'>
                                <Trash className='w-3 h-3' />
                                Delete Feature
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {messageMutation.isPending && (
                    <div className='flex justify-start'>
                      <div className='bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm'>
                        <div className='flex items-center gap-1'>
                          <div className='w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                          <div className='w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                          <div className='w-2 h-2 bg-current rounded-full animate-bounce'></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className='p-4 border-t'>
                  <form onSubmit={handleSubmit} className='flex gap-2'>
                    <Textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder='Type your message...'
                      disabled={messageMutation.isPending}
                      className='flex-1'
                    />
                    <Button
                      type='submit'
                      size='sm'
                      disabled={messageMutation.isPending || !inputValue.trim()}
                      className='px-3'>
                      <Send className='h-4 w-4' />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </>
  )
}
