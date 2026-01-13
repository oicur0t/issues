import { redirect } from 'next/navigation'

interface EditIssuePageProps {
  params: Promise<{
    id: string
  }>
}

// Edit page is no longer needed - we have inline editing on the view page
export default async function EditIssuePage({ params }: EditIssuePageProps) {
  const { id } = await params
  redirect(`/issues/${id}`)
}