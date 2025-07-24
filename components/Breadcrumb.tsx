'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-nestie-grey-500 mb-6">
      <Link href="/" className="flex items-center hover:text-nestie-black transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-nestie-black transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-nestie-black font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}