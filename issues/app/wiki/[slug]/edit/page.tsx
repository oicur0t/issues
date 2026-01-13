import { redirect } from 'next/navigation'

interface EditWikiPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EditWikiPage({ params }: EditWikiPageProps) {
  const { slug } = await params
  redirect(`/wiki/${slug}`)
}