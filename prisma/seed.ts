import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Clear existing records to ensure idempotent seed runs
  await prisma.report.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.savedListing.deleteMany()
  await prisma.listingPhoto.deleteMany()
  await prisma.accommodationListing.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash("Password123!", 10)

  const admin = await prisma.user.create({
    data: {
      name: "Community Admin",
      email: "admin@community.test",
      passwordHash,
      phone: "+8801711000001",
      role: "ADMIN",
      occupation: "Platform Admin",
      location: "Dhaka, Bangladesh",
      bio: "Moderating ashepashe student housing community.",
      interests: JSON.stringify(["Community", "Moderation", "Safety"]),
    },
  })

  const arif = await prisma.user.create({
    data: {
      name: "Arif Hossain",
      email: "arif@student.test",
      passwordHash,
      phone: "+8801711000002",
      role: "USER",
      occupation: "Student",
      education: "University of Dhaka (CSE)",
      location: "Mirpur 10, Dhaka",
      bio: "Final year student looking for flatmates and sub-leases.",
      interests: JSON.stringify(["CSE", "Gaming", "Cricket"]),
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80",
    },
  })

  const rahim = await prisma.user.create({
    data: {
      name: "Rahim Ahmed",
      email: "rahim@user.test",
      passwordHash,
      phone: "+8801711000003",
      role: "USER",
      occupation: "Software Engineer",
      education: "North South University",
      location: "Bashundhara R/A, Dhaka",
      bio: "Working bachelor at a local software firm, quiet and organized.",
      interests: JSON.stringify(["Coding", "Books", "Coffee"]),
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80",
    },
  })

  const fatima = await prisma.user.create({
    data: {
      name: "Fatima Noor",
      email: "fatima@user.test",
      passwordHash,
      phone: "+8801711000004",
      role: "USER",
      occupation: "Medical Student",
      education: "Dhaka Medical College",
      location: "Nilkhet, Dhaka",
      bio: "Looking for friendly female roommates near medical campus.",
      interests: JSON.stringify(["Medicine", "Reading", "Badminton"]),
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80",
    },
  })

  const listing1 = await prisma.accommodationListing.create({
    data: {
      ownerId: arif.id,
      title: "Master Bed in 3-Bed Bachelor Flat",
      description: "Spacious master bedroom with attached washroom and balcony in a peaceful building. High-speed WiFi and maid included.",
      monthlyRent: 8500,
      billsIncluded: true,
      area: "Mirpur 10",
      address: "House 24, Road 4, Block B, Mirpur 10, Dhaka",
      latitude: 23.8069,
      longitude: 90.3687,
      accommodationType: "ROOM",
      genderPreference: "MALE",
      tenantType: "BACHELOR",
      facilities: JSON.stringify(["wifi", "generator", "lift", "attached bath", "balcony", "fridge"]),
      totalRooms: 3,
      totalWashrooms: 3,
      balconies: 2,
      floorLevel: 4,
      availableFrom: new Date(Date.now() + 86400000 * 5),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            displayOrder: 1,
          },
        ],
      },
    },
  })

  const listing2 = await prisma.accommodationListing.create({
    data: {
      ownerId: arif.id,
      title: "Single Seat in Student Mess Room",
      description: "One seat vacant in a double sharing bedroom. Ideal for DU or college students. 2 minutes walk from metro station.",
      monthlyRent: 4200,
      billsIncluded: false,
      area: "Mirpur 1",
      address: "Lane 2, Darus Salam Road, Mirpur 1, Dhaka",
      latitude: 23.7956,
      longitude: 90.3537,
      accommodationType: "SEAT",
      genderPreference: "MALE",
      tenantType: "BACHELOR",
      facilities: JSON.stringify(["wifi", "filter water", "gas", "meal system"]),
      totalRooms: 2,
      totalWashrooms: 1,
      balconies: 1,
      floorLevel: 2,
      availableFrom: new Date(Date.now() + 86400000 * 2),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
        ],
      },
    },
  })

  const listing3 = await prisma.accommodationListing.create({
    data: {
      ownerId: rahim.id,
      title: "Modern 2-Bed Family / Bachelor Apartment",
      description: "Brand new flat in Bashundhara Block C. 24/7 security guard, CCTV, lift, generator, reserved bike parking.",
      monthlyRent: 22000,
      billsIncluded: false,
      area: "Bashundhara R/A",
      address: "Plot 118, Road 6, Block C, Bashundhara R/A, Dhaka",
      latitude: 23.8151,
      longitude: 90.4255,
      accommodationType: "FLAT",
      genderPreference: "ANY",
      tenantType: "ANY",
      facilities: JSON.stringify(["wifi", "generator", "lift", "parking", "security guard", "cctv"]),
      totalRooms: 2,
      totalWashrooms: 2,
      balconies: 2,
      floorLevel: 5,
      availableFrom: new Date(Date.now() + 86400000 * 10),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
            displayOrder: 1,
          },
        ],
      },
    },
  })

  const listing4 = await prisma.accommodationListing.create({
    data: {
      ownerId: rahim.id,
      title: "Single Room for Working Bachelor",
      description: "Cozy private room with shared bath in a tech professionals flat. Very quiet, clean, and high-speed fiber internet.",
      monthlyRent: 9000,
      billsIncluded: true,
      area: "Bashundhara R/A",
      address: "Road 12, Block D, Bashundhara R/A, Dhaka",
      latitude: 23.818,
      longitude: 90.431,
      accommodationType: "ROOM",
      genderPreference: "MALE",
      tenantType: "BACHELOR",
      facilities: JSON.stringify(["wifi", "ac", "generator", "maid service", "refrigerator"]),
      totalRooms: 3,
      totalWashrooms: 2,
      balconies: 1,
      floorLevel: 3,
      availableFrom: new Date(Date.now() + 86400000 * 1),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
        ],
      },
    },
  })

  const listing5 = await prisma.accommodationListing.create({
    data: {
      ownerId: fatima.id,
      title: "Female Only Single Room near DMC",
      description: "Furnished room with study table, wardrobe, and attached bath. Only for female students or doctors.",
      monthlyRent: 7500,
      billsIncluded: true,
      area: "Nilkhet",
      address: "Bakshi Bazar Road, near Dhaka Medical College, Dhaka",
      latitude: 23.733,
      longitude: 90.386,
      accommodationType: "ROOM",
      genderPreference: "FEMALE",
      tenantType: "BACHELOR",
      facilities: JSON.stringify(["wifi", "generator", "attached bath", "cooking allowed", "cctv"]),
      totalRooms: 3,
      totalWashrooms: 3,
      balconies: 1,
      floorLevel: 2,
      availableFrom: new Date(Date.now() + 86400000 * 7),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
        ],
      },
    },
  })

  const listing6 = await prisma.accommodationListing.create({
    data: {
      ownerId: fatima.id,
      title: "Shared Seat for Female Student",
      description: "Twin bed seat in clean hostel flat with 3 study partners. Strict safety, in-house meals available.",
      monthlyRent: 3800,
      billsIncluded: false,
      area: "Dhanmondi",
      address: "Road 27, Old, Dhanmondi, Dhaka",
      latitude: 23.7533,
      longitude: 90.3768,
      accommodationType: "SEAT",
      genderPreference: "FEMALE",
      tenantType: "BACHELOR",
      facilities: JSON.stringify(["wifi", "security guard", "cctv", "meal system"]),
      totalRooms: 4,
      totalWashrooms: 2,
      balconies: 2,
      floorLevel: 4,
      availableFrom: new Date(Date.now() + 86400000 * 3),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
        ],
      },
    },
  })

  const listing7 = await prisma.accommodationListing.create({
    data: {
      ownerId: arif.id,
      title: "Full 3-Bed Apartment for Family",
      description: "Well-ventilated flat on 6th floor with open south facing balcony. Near schools and markets.",
      monthlyRent: 26000,
      billsIncluded: false,
      area: "Mirpur 2",
      address: "Sector 2, Road 7, Mirpur 2, Dhaka",
      latitude: 23.8031,
      longitude: 90.3614,
      accommodationType: "FLAT",
      genderPreference: "ANY",
      tenantType: "FAMILY",
      facilities: JSON.stringify(["lift", "generator", "parking", "gas", "intercom"]),
      totalRooms: 3,
      totalWashrooms: 3,
      balconies: 3,
      floorLevel: 6,
      availableFrom: new Date(Date.now() + 86400000 * 14),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1502005229762-ee1b40280b91?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
        ],
      },
    },
  })

  const listing8 = await prisma.accommodationListing.create({
    data: {
      ownerId: rahim.id,
      title: "Corner Room with Huge Balcony in Mirpur 12",
      description: "Bright sunlit room with wide open view. Ideal for single professional or student.",
      monthlyRent: 6800,
      billsIncluded: true,
      area: "Mirpur 12",
      address: "Block D, Road 3, Mirpur 12, Dhaka",
      latitude: 23.8267,
      longitude: 90.3644,
      accommodationType: "ROOM",
      genderPreference: "ANY",
      tenantType: "BACHELOR",
      facilities: JSON.stringify(["wifi", "balcony", "generator", "gas"]),
      totalRooms: 3,
      totalWashrooms: 2,
      balconies: 2,
      floorLevel: 3,
      availableFrom: new Date(Date.now() + 86400000 * 4),
      availabilityStatus: "AVAILABLE",
      moderationStatus: "APPROVED",
      photos: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
            displayOrder: 0,
          },
        ],
      },
    },
  })

  // Cross-user test comments
  await prisma.comment.create({
    data: {
      listingId: listing1.id,
      authorId: rahim.id,
      content: "Is bike parking space included with the rent?",
    },
  })

  await prisma.comment.create({
    data: {
      listingId: listing1.id,
      authorId: arif.id,
      content: "Yes, dedicated bike parking is available on ground floor.",
    },
  })

  await prisma.comment.create({
    data: {
      listingId: listing5.id,
      authorId: fatima.id,
      content: "Feel free to message or comment if you want a video walkthrough before visiting.",
    },
  })

  console.log(`Database seeded with 1 admin, 3 regular users, 8 listings, and sample comments.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

