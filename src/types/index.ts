export type UserRole = "USER" | "ADMIN"

export type AccommodationType = "SEAT" | "ROOM" | "FLAT"

export type GenderPreference = "MALE" | "FEMALE" | "ANY"

export type TenantType = "BACHELOR" | "FAMILY" | "ANY"

export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "RENTED" | "HIDDEN"

export type ModerationStatus = "APPROVED" | "PENDING" | "FLAGGED" | "REJECTED"

export type ReportReason =
  | "SCAM"
  | "INACCURATE"
  | "NO_LONGER_AVAILABLE"
  | "DUPLICATE"
  | "INAPPROPRIATE"
  | "OTHER"

export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED"

export type ReportItem = {
  id: string
  listingId: string
  reporterId: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  reviewedById: string | null
  reviewedAt: string | null
  createdAt: string
  reporter: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
  listing: {
    id: string
    title: string
    area: string
    address: string
    monthlyRent: number
    accommodationType: AccommodationType
    availabilityStatus: AvailabilityStatus
    moderationStatus: ModerationStatus
    owner: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
    photos?: { imageUrl: string }[]
  }
  reviewedBy?: {
    id: string
    name: string
    email: string
  } | null
}

export type UpdateReportInput = {
  status: ReportStatus
}

export type SortOption =
  | "nearest"
  | "newest"
  | "lowest_price"
  | "highest_price"
  | "available_soonest"

export type UserPublic = {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  coverUrl: string | null
  occupation: string | null
  education: string | null
  location: string | null
  bio: string | null
  interests: string[]
  showContactInfo: boolean
  role: UserRole
  createdAt: string
  _count?: {
    listings: number
    savedListings: number
    comments: number
  }
}

export type AuthTokenPayload = {
  userId: string
  email: string
  role: UserRole
}

export type PhotoItem = {
  id: string
  imageUrl: string
  displayOrder: number
}

export type ListingCard = {
  id: string
  ownerId: string
  title: string
  description?: string
  monthlyRent: number
  billsIncluded: boolean
  area: string
  address: string
  latitude: number
  longitude: number
  locationPrecision?: "APPROXIMATE" | "EXACT"
  accommodationType: AccommodationType
  genderPreference: GenderPreference
  tenantType: TenantType
  facilities?: string[]
  totalRooms?: number | null
  totalWashrooms?: number | null
  balconies?: number | null
  floorLevel?: number | null
  availabilityStatus: AvailabilityStatus
  availableFrom: string
  createdAt: string
  distanceKm?: number
  photos: PhotoItem[]
  owner?: {
    id: string
    name: string
    avatarUrl: string | null
    occupation?: string | null
    education?: string | null
  }
  commentsCount?: number
  savedCount?: number
  isSaved?: boolean
}

export type CommentItem = {
  id: string
  listingId: string
  authorId: string
  content: string
  createdAt: string
  author: Pick<UserPublic, "id" | "name" | "avatarUrl">
}

export type ListingDetail = ListingCard & {
  description: string
  facilities: string[]
  totalRooms: number | null
  totalWashrooms: number | null
  balconies: number | null
  floorLevel: number | null
  moderationStatus: ModerationStatus
  owner: Pick<UserPublic, "id" | "name" | "avatarUrl" | "occupation" | "education"> & {
    phone?: string | null
    email?: string | null
    showContactInfo?: boolean
  }
  locationPrecision: "APPROXIMATE" | "EXACT"
  comments: CommentItem[]
  savedCount: number
  isSaved?: boolean
}

export type CreateListingInput = {
  title: string
  description: string
  monthlyRent: number
  billsIncluded?: boolean
  area: string
  address: string
  latitude: number
  longitude: number
  locationPrecision?: "APPROXIMATE" | "EXACT"
  accommodationType: AccommodationType
  genderPreference?: GenderPreference
  tenantType?: TenantType
  facilities?: string[] | string
  totalRooms?: number | null
  totalWashrooms?: number | null
  balconies?: number | null
  floorLevel?: number | null
  availableFrom: string
  photos?: (string | { imageUrl: string; displayOrder?: number })[]
}

export type UpdateListingStatusInput = {
  availabilityStatus: AvailabilityStatus
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  pagination?: PaginationMeta
}

export type MessageItem = {
  id: string
  conversationId: string
  senderId: string
  content: string
  photoUrl: string | null
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export type ConversationSnippetListing = {
  id: string
  title: string
  monthlyRent: number
  area: string
  imageUrl: string | null
}

export type ConversationSummary = {
  id: string
  otherUser: {
    id: string
    name: string
    avatarUrl: string | null
    occupation: string | null
  }
  listing?: ConversationSnippetListing | null
  lastMessage?: {
    content: string
    photoUrl: string | null
    createdAt: string
    senderId: string
    isRead: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

export type ConversationDetail = {
  id: string
  otherUser: {
    id: string
    name: string
    avatarUrl: string | null
    occupation: string | null
    education: string | null
    location: string | null
  }
  listing?: ConversationSnippetListing | null
  messages: MessageItem[]
}



