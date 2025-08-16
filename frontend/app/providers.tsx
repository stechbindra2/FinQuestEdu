'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { AuthProvider } from '@/lib/auth/auth-context'
import { NotificationProvider } from '@/components/ui/notification-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
