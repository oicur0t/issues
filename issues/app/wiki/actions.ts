'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import { 
  WikiPage, 
  CreateWikiData, 
  UpdateWikiData, 
  WikiFilter, 
  WikiPageWithAuthor,
  WikiSearchResult
} from '@/lib/types'
import { isEmptyOrWhitespace, createSlug } from '@/lib/utils'
import { isApiAuthError } from '@/lib/api-errors'

/**
 * Creates a new wiki page
 * @param data - Wiki page data to create
 * @returns Promise<WikiPage> - Created wiki page
 */
export async function createWikiPage(data: CreateWikiData): Promise<WikiPage> {
  try {
    const user = await requireAuth('developer')
    
    // Validate input
    if (isEmptyOrWhitespace(data.title)) {
      throw new Error('Wiki page title is required')
    }
    
    if (isEmptyOrWhitespace(data.content)) {
      throw new Error('Wiki page content is required')
    }

    const wikiCollection = await getCollection('wiki')
    
    // Generate unique slug
    let slug = createSlug(data.title)
    const existingPage = await wikiCollection.findOne({ slug })
    
    if (existingPage) {
      // If slug exists, append a number to make it unique
      let counter = 1
      let uniqueSlug = `${slug}-${counter}`
      
      while (await wikiCollection.findOne({ slug: uniqueSlug })) {
        counter++
        uniqueSlug = `${slug}-${counter}`
      }
      
      slug = uniqueSlug
    }
    
    const newWikiPage: Omit<WikiPage, '_id'> = {
      title: data.title.trim(),
      slug,
      content: data.content.trim(),
      summary: data.summary?.trim(),
      authorId: user._id,
      tags: data.tags || [],
      isPublished: data.isPublished ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    }

    const result = await wikiCollection.insertOne(newWikiPage as any)
    
    // Revalidate the wiki pages
    revalidatePath('/wiki')
    revalidatePath(`/wiki/${slug}`)
    
    return {
      _id: result.insertedId,
      ...newWikiPage,
    }
  } catch (error) {
    console.error('Error creating wiki page:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to create wiki page')
  }
}

/**
 * Gets all wiki pages with optional filtering
 * @param filter - Optional filter criteria
 * @returns Promise<WikiPageWithAuthor[]> - List of wiki pages with author details
 */
export async function getWikiPages(filter: WikiFilter = {}): Promise<WikiPageWithAuthor[]> {
  try {
    const user = await requireAuth('viewer')
    
    const wikiCollection = await getCollection('wiki')
    const usersCollection = await getCollection('users')
    
    // Build query
    const query: any = {}
    
    if (filter.isPublished !== undefined) {
      query.isPublished = filter.isPublished
    }
    
    if (filter.authorId) {
      query.authorId = new ObjectId(filter.authorId)
    }
    
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags }
    }
    
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { content: { $regex: filter.search, $options: 'i' } },
        { summary: { $regex: filter.search, $options: 'i' } },
      ]
    }
    
    // Get wiki pages
    const wikiPages = await wikiCollection
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()
    
    // Get author details
    const authorIds = wikiPages.map(page => page.authorId.toString())
    const authors = await usersCollection
      .find({ _id: { $in: authorIds.map(id => new ObjectId(id)) } })
      .toArray()
    
    const authorMap = new Map(authors.map(author => [author._id.toString(), author]))
    
    // Transform wiki pages to include author details
    const wikiPagesWithAuthors = wikiPages.map(page => {
      const author = authorMap.get(page.authorId.toString())
      const lastEditor = page.lastEditedBy
        ? authorMap.get(page.lastEditedBy.toString())
        : undefined

      if (!author) {
        console.warn('Author not found for page:', page._id?.toString(), 'authorId:', page.authorId?.toString())
      }

      return {
        ...page,
        author: author ? {
          _id: author._id!,
          name: author.name,
          email: author.email,
        } : {
          _id: new ObjectId(),
          name: 'Unknown Author',
          email: 'unknown@example.com',
        },
        lastEditor: lastEditor ? {
          _id: lastEditor._id!,
          name: lastEditor.name,
          email: lastEditor.email,
        } : undefined,
      } as WikiPageWithAuthor
    })
    
    return wikiPagesWithAuthors
  } catch (error) {
    console.error('Error getting wiki pages:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get wiki pages')
  }
}

/**
 * Gets a single wiki page by slug
 * @param slug - Wiki page slug
 * @returns Promise<WikiPageWithAuthor | null> - Wiki page with author details or null if not found
 */
export async function getWikiPage(slug: string): Promise<WikiPageWithAuthor | null> {
  try {
    const user = await requireAuth('viewer')
    
    const wikiCollection = await getCollection('wiki')
    const usersCollection = await getCollection('users')
    
    const wikiPage = await wikiCollection.findOne({ slug })
    
    if (!wikiPage) {
      return null
    }
    
    // Get author details
    const author = await usersCollection.findOne({ _id: wikiPage.authorId })
    const lastEditor = wikiPage.lastEditedBy 
      ? await usersCollection.findOne({ _id: wikiPage.lastEditedBy })
      : undefined
    
    return {
      ...wikiPage,
      author: author ? {
        _id: author._id!,
        name: author.name,
        email: author.email,
      } : {
        _id: new ObjectId(),
        name: 'Unknown Author',
        email: 'unknown@example.com',
      },
      lastEditor: lastEditor ? {
        _id: lastEditor._id!,
        name: lastEditor.name,
        email: lastEditor.email,
      } : undefined,
    } as WikiPageWithAuthor
  } catch (error) {
    console.error('Error getting wiki page:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get wiki page')
  }
}

/**
 * Updates an existing wiki page
 * @param slug - Wiki page slug
 * @param data - Updated wiki page data
 * @returns Promise<WikiPage> - Updated wiki page
 */
export async function updateWikiPage(slug: string, data: UpdateWikiData): Promise<WikiPage> {
  try {
    const user = await requireAuth('developer')
    
    const wikiCollection = await getCollection('wiki')
    
    // Validate input if provided
    if (data.title !== undefined && isEmptyOrWhitespace(data.title)) {
      throw new Error('Wiki page title cannot be empty')
    }
    
    if (data.content !== undefined && isEmptyOrWhitespace(data.content)) {
      throw new Error('Wiki page content cannot be empty')
    }
    
    // Get existing page
    const existingPage = await wikiCollection.findOne({ slug })
    if (!existingPage) {
      throw new Error('Wiki page not found')
    }
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      lastEditedBy: user._id,
      version: existingPage.version + 1,
    }
    
    if (data.title !== undefined) {
      updateData.title = data.title.trim()
      
      // Update slug if title changed
      if (data.title.trim() !== existingPage.title) {
        let newSlug = createSlug(data.title.trim())
        const slugExists = await wikiCollection.findOne({ 
          slug: newSlug, 
          _id: { $ne: existingPage._id } 
        })
        
        if (slugExists) {
          let counter = 1
          let uniqueSlug = `${newSlug}-${counter}`
          
          while (await wikiCollection.findOne({ 
            slug: uniqueSlug, 
            _id: { $ne: existingPage._id } 
          })) {
            counter++
            uniqueSlug = `${newSlug}-${counter}`
          }
          
          updateData.slug = uniqueSlug
        } else {
          updateData.slug = newSlug
        }
      }
    }
    
    if (data.content !== undefined) {
      updateData.content = data.content.trim()
    }
    
    if (data.summary !== undefined) {
      updateData.summary = data.summary?.trim()
    }
    
    if (data.tags !== undefined) {
      updateData.tags = data.tags
    }
    
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished
    }
    
    const result = await wikiCollection.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Wiki page not found')
    }

    // Revalidate paths
    revalidatePath('/wiki')
    revalidatePath(`/wiki/${slug}`)
    if (updateData.slug && updateData.slug !== slug) {
      revalidatePath(`/wiki/${updateData.slug}`)
    }

    return result as WikiPage
  } catch (error) {
    console.error('Error updating wiki page:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to update wiki page')
  }
}

/**
 * Deletes a wiki page
 * @param slug - Wiki page slug
 * @returns Promise<boolean> - True if wiki page was deleted
 */
export async function deleteWikiPage(slug: string): Promise<boolean> {
  try {
    const user = await requireAuth('developer')
    
    const wikiCollection = await getCollection('wiki')
    
    const result = await wikiCollection.deleteOne({ slug })
    
    if (result.deletedCount === 0) {
      throw new Error('Wiki page not found')
    }
    
    // Revalidate paths
    revalidatePath('/wiki')
    revalidatePath(`/wiki/${slug}`)
    
    return true
  } catch (error) {
    console.error('Error deleting wiki page:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to delete wiki page')
  }
}

/**
 * Searches wiki pages
 * @param query - Search query
 * @returns Promise<WikiSearchResult[]> - Search results
 */
export async function searchWikiPages(query: string): Promise<WikiSearchResult[]> {
  try {
    const user = await requireAuth('viewer')
    
    if (isEmptyOrWhitespace(query)) {
      return []
    }
    
    const wikiCollection = await getCollection('wiki')
    const usersCollection = await getCollection('users')
    
    // Search for pages
    const pages = await wikiCollection
      .find({
        $and: [
          { isPublished: true },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { content: { $regex: query, $options: 'i' } },
              { summary: { $regex: query, $options: 'i' } },
              { tags: { $in: [new RegExp(query, 'i')] } },
            ],
          },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray()
    
    // Get author details
    const authorIds = pages.map(page => page.authorId.toString())
    const authors = await usersCollection
      .find({ _id: { $in: authorIds.map(id => new ObjectId(id)) } })
      .toArray()
    
    const authorMap = new Map(authors.map(author => [author._id.toString(), author]))
    
    // Transform pages to search results
    const searchResults: WikiSearchResult[] = pages.map(page => {
      const author = authorMap.get(page.authorId.toString())

      return {
        _id: page._id!,
        title: page.title,
        slug: page.slug,
        summary: page.summary,
        content: page.content,
        tags: page.tags,
        author: {
          _id: author!._id!,
          name: author!.name,
          email: author!.email,
        },
        updatedAt: page.updatedAt,
      }
    })
    
    return searchResults
  } catch (error) {
    console.error('Error searching wiki pages:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to search wiki pages')
  }
}

/**
 * Gets all unique tags from wiki pages
 * @returns Promise<string[]> - List of unique tags
 */
export async function getWikiTags(): Promise<string[]> {
  try {
    const user = await requireAuth('viewer')
    
    const wikiCollection = await getCollection('wiki')
    
    const tags = await wikiCollection.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } },
    ]).toArray()
    
    return tags.map(tag => tag._id)
  } catch (error) {
    console.error('Error getting wiki tags:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get wiki tags')
  }
}

/**
 * Gets wiki statistics for the dashboard
 * @returns Promise<Object> - Wiki statistics
 */
export async function getWikiStats(): Promise<{
  total: number
  published: number
  drafts: number
}> {
  try {
    const user = await requireAuth('viewer')
    
    const wikiCollection = await getCollection('wiki')
    
    const [total, published, drafts] = await Promise.all([
      wikiCollection.countDocuments(),
      wikiCollection.countDocuments({ isPublished: true }),
      wikiCollection.countDocuments({ isPublished: false }),
    ])
    
    return {
      total,
      published,
      drafts,
    }
  } catch (error) {
    console.error('Error getting wiki stats:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get wiki statistics')
  }
}