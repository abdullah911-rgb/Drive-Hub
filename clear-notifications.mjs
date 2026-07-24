import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_pUVDo8BPEjA7@ep-red-heart-aotz9zbr.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
})

async function main() {
  console.log('=== CLEARING NOTIFICATIONS ===')
  
  // Update all notifications to be marked as read
  const result = await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true }
  })
  
  console.log(`✅ Marked ${result.count} notification(s) as read.`)

  // Let's also delete them to be absolutely sure they are removed
  const deleteResult = await prisma.notification.deleteMany()
  console.log(`✅ Deleted ${deleteResult.count} notification(s) completely.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
