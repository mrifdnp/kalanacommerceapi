import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { logger } from "../utils/logger.js";

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

prisma.$connect()
  .then(() => {
    logger.info(' Prisma connected to database successfully')
  })
  .catch((err) => {
    logger.error({ err }, ' Failed to connect Prisma to database')
  })
  
export { prisma }