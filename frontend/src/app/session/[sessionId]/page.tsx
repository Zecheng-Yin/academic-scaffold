import AppShell from '@/components/layout/AppShell'

interface SessionPageProps {
  params: {
    sessionId: string
  }
}

export default function SessionPage({ params }: SessionPageProps) {
  return <AppShell sessionId={params.sessionId} />
}
