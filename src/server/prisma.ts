import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// La connexion dépend uniquement de DATABASE_URL :
//   postgresql://user:pw@host/db?sslmode=require  -> PostgreSQL (Neon)
// Le schéma Prisma est figé sur le provider « postgresql » : changer de moteur
// demanderait de le régénérer, pas seulement de changer cette variable.
function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL est absente : la base ne peut pas être ouverte.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      // Neon met le calcul en veille après une période d'inactivité. Le
      // réveil a lieu pendant l'établissement de la connexion, si bien que
      // toute la durée du démarrage est comptée dans ce délai. Mesuré depuis
      // l'Europe sur la région us-east-2, un réveil demande couramment de 5 à
      // 25 secondes : 15 s ne suffisaient pas et la fiche produit tombait en
      // erreur « Connection terminated due to connection timeout ».
      connectionTimeoutMillis: 40_000,
      // Une connexion inactive est rendue au bout de trente secondes plutôt
      // que gardée ouverte : Neon facture le temps de calcul, pas les
      // connexions, et le pooler préfère des sessions courtes.
      idleTimeoutMillis: 30_000,
      max: 10,
    }),
  });
}

// En développement, le client survit au rechargement à chaud : sinon chaque
// enregistrement de fichier ouvrirait de nouvelles connexions.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
