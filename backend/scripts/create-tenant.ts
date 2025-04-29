// scripts/create-tenant.ts
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// Make sure you run "npx prisma generate" before running this script

async function createTenant() {
  // Read command line arguments
  const args = process.argv.slice(2);
  const name = args.find(arg => arg.startsWith("--name="))?.split("=")[1];
  const domain = args.find(arg => arg.startsWith("--domain="))?.split("=")[1];
  const espoCrmUrl = args.find(arg => arg.startsWith("--espo-url="))?.split("=")[1] || "http://192.168.4.150:8080";
  const espoCrmApiKey = args.find(arg => arg.startsWith("--espo-key="))?.split("=")[1] || "";

  if (!name) {
    console.error("Error: Tenant name is required");
    console.log("Usage: npx ts-node scripts/create-tenant.ts --name=TenantName [--domain=example.com] [--espo-url=http://espocrm.example.com] [--espo-key=api-key]");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: uuidv4(),
        name,
        domain,
        espoCrmUrl,
        espoCrmApiKey,
      },
    });

    console.log("Tenant created successfully:");
    console.log(tenant);
    
  } catch (error) {
    console.error("Error creating tenant:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTenant().catch(console.error);