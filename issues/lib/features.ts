import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'

/**
 * Resolves a feature reference (ObjectId string or readable number like "CUS-F001")
 * to the feature's ObjectId. Throws if the feature does not exist.
 * Not a server action - callers are responsible for authentication.
 */
export async function resolveFeatureId(idOrNumber: string): Promise<ObjectId> {
  const featuresCollection = await getCollection('features')
  const feature = ObjectId.isValid(idOrNumber)
    ? await featuresCollection.findOne({ _id: new ObjectId(idOrNumber) }, { projection: { _id: 1 } })
    : await featuresCollection.findOne({ featureNumber: idOrNumber }, { projection: { _id: 1 } })

  if (!feature) {
    throw new Error('Feature not found')
  }
  return feature._id
}
