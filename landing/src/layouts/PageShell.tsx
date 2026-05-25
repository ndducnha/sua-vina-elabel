import type { PropsWithChildren } from 'react'

export function PageShell({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen w-full bg-[#eef2f7]">
      <div className="mx-auto max-w-[32rem] px-4 pb-8 pt-3 sm:px-4 sm:pt-4">{children}</div>
    </main>
  )
}