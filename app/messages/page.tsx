'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  Search, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { sampleAgents, sampleProperties, type Agent } from '@/lib/sampleData'
import toast from 'react-hot-toast'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'image' | 'file'
}

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    avatar: string
    role: 'tenant' | 'agent'
    online: boolean
  }
  lastMessage: Message
  unreadCount: number
  property?: {
    id: string
    title: string
  }
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participant: {
        id: 'agent1',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/40/40',
        role: 'agent',
        online: true
      },
      lastMessage: {
        id: '1',
        sender_id: 'agent1',
        receiver_id: 'user1',
        content: 'The property viewing is confirmed for tomorrow at 2 PM.',
        timestamp: '2024-01-20T14:30:00Z',
        read: false,
        type: 'text'
      },
      unreadCount: 2,
      property: {
        id: '1',
        title: 'Modern 2BR Apartment'
      }
    },
    {
      id: '2',
      participant: {
        id: 'tenant1',
        name: 'John Doe',
        avatar: '/api/placeholder/40/40',
        role: 'tenant',
        online: false
      },
      lastMessage: {
        id: '2',
        sender_id: 'user1',
        receiver_id: 'tenant1',
        content: 'Thank you for the quick response!',
        timestamp: '2024-01-19T16:45:00Z',
        read: true,
        type: 'text'
      },
      unreadCount: 0
    }
  ]

  const mockMessages: Message[] = [
    {
      id: '1',
      sender_id: 'user1',
      receiver_id: 'agent1',
      content: 'Hi, I\'m interested in viewing the apartment in Westlands.',
      timestamp: '2024-01-20T10:00:00Z',
      read: true,
      type: 'text'
    },
    {
      id: '2',
      sender_id: 'agent1',
      receiver_id: 'user1',
      content: 'Hello! I\'d be happy to arrange a viewing for you. When would be convenient?',
      timestamp: '2024-01-20T10:15:00Z',
      read: true,
      type: 'text'
    },
    {
      id: '3',
      sender_id: 'user1',
      receiver_id: 'agent1',
      content: 'Tomorrow afternoon would work well for me.',
      timestamp: '2024-01-20T10:30:00Z',
      read: true,
      type: 'text'
    },
    {
      id: '4',
      sender_id: 'agent1',
      receiver_id: 'user1',
      content: 'The property viewing is confirmed for tomorrow at 2 PM.',
      timestamp: '2024-01-20T14:30:00Z',
      read: false,
      type: 'text'
    }
  ]

  useEffect(() => {
    const agentId = searchParams.get('agent')
    const propertyId = searchParams.get('property')
    
    let updatedConversations = [...mockConversations]
    
    // If agent and property parameters are provided, create or find conversation
    if (agentId && propertyId) {
      const agent = sampleAgents.find(a => a.id === agentId)
      const property = sampleProperties.find(p => p.id === propertyId)
      
      if (agent && property) {
        // Check if conversation already exists
        const existingConv = updatedConversations.find(c => c.participant.id === agentId)
        
        if (!existingConv) {
          // Create new conversation
          const newConversation: Conversation = {
            id: `conv_${agentId}_${propertyId}`,
            participant: {
              id: agent.id,
              name: agent.name,
              avatar: '/api/placeholder/40/40',
              role: 'agent',
              online: true
            },
            lastMessage: {
              id: 'initial',
              sender_id: 'system',
              receiver_id: agentId,
              content: `Started conversation about ${property.title}`,
              timestamp: new Date().toISOString(),
              read: true,
              type: 'text'
            },
            unreadCount: 0,
            property: {
              id: property.id,
              title: property.title
            }
          }
          
          updatedConversations.unshift(newConversation)
          setSelectedConversation(newConversation.id)
          
          // Set initial message template
          setMessages([])
          setNewMessage(`Hi! I'm interested in "${property.title}". Could you provide more information?`)
          
          toast.success(`Started conversation with ${agent.name}`)
        } else {
          setSelectedConversation(existingConv.id)
          setMessages(mockMessages)
        }
      }
    } else {
      // Default behavior
      if (updatedConversations.length > 0) {
        setSelectedConversation(updatedConversations[0].id)
        setMessages(mockMessages)
      }
    }
    
    setConversations(updatedConversations)
  }, [searchParams])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      sender_id: 'user1',
      receiver_id: conversations.find(c => c.id === selectedConversation)?.participant.id || '',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text'
    }

    setMessages([...messages, message])
    setNewMessage('')

    // Update conversation last message
    setConversations(conversations.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: message }
        : conv
    ))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="h-screen bg-nestie-grey-50 flex">
      {/* Conversations List */}
      <div className="w-80 bg-nestie-white border-r border-nestie-grey-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-nestie-grey-200">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-nestie-grey-600" />
              <span className="text-nestie-grey-600">Back</span>
            </Link>
            <h1 className="text-xl font-bold text-nestie-black">Messages</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-nestie-grey-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 border-b border-nestie-grey-100 cursor-pointer hover:bg-nestie-grey-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-nestie-grey-50' : ''
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-nestie-grey-200 rounded-full flex items-center justify-center">
                    <span className="text-nestie-grey-600 font-medium">
                      {conversation.participant.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  {conversation.participant.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-nestie-black truncate">
                      {conversation.participant.name}
                    </h3>
                    <span className="text-xs text-nestie-grey-500">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  {conversation.property && (
                    <p className="text-xs text-nestie-grey-500 mb-1">
                      Re: {conversation.property.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-nestie-grey-600 truncate">
                      {conversation.lastMessage.content}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-nestie-black text-nestie-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-nestie-white border-b border-nestie-grey-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-nestie-grey-200 rounded-full flex items-center justify-center">
                      <span className="text-nestie-grey-600 font-medium">
                        {selectedConv.participant.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {selectedConv.participant.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-nestie-black">{selectedConv.participant.name}</h2>
                    <p className="text-sm text-nestie-grey-500">
                      {selectedConv.participant.online ? 'Online' : 'Offline'} • {selectedConv.participant.role}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {selectedConv.property && (
                <div className="mt-3 p-3 bg-nestie-grey-50 rounded-lg">
                  <p className="text-sm text-nestie-grey-600">
                    Discussing: <span className="font-medium">{selectedConv.property.title}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender_id === 'user1' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === 'user1'
                      ? 'bg-nestie-black text-nestie-white'
                      : 'bg-nestie-white border border-nestie-grey-200'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                      message.sender_id === 'user1' ? 'text-nestie-grey-300' : 'text-nestie-grey-500'
                    }`}>
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                      {message.sender_id === 'user1' && (
                        message.read ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-nestie-white border-t border-nestie-grey-200 p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-nestie-grey-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-nestie-grey-400" />
              </div>
              <h3 className="text-lg font-semibold text-nestie-grey-600 mb-2">
                Select a conversation
              </h3>
              <p className="text-nestie-grey-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-nestie-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nestie-black mx-auto mb-4"></div>
          <p className="text-nestie-grey-600">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}