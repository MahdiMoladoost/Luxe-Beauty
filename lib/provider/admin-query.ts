import type { SessionPrincipal } from "@/lib/auth/types"
import { assertRecentProviderReviewStepUp } from "@/lib/provider/policy"
import { prisma } from "@/lib/infrastructure/prisma"

export async function listProviderReviewQueue(principal: SessionPrincipal) {
  assertRecentProviderReviewStepUp(principal)
  const applications = await prisma.providerApplication.findMany({
    where: { status: { in: ["PENDING_REVIEW", "APPEALED"] } },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
  })
  const providerIds = applications.map((application) => application.providerId)
  const providers = await prisma.providerOrganization.findMany({ where: { id: { in: providerIds } } })
  const documents = await prisma.providerDocument.findMany({ where: { providerId: { in: providerIds } } })
  const providerById = new Map(providers.map((provider) => [provider.id, provider]))

  return applications.map((application) => ({
    application,
    provider: providerById.get(application.providerId) ?? null,
    documents: documents.filter((document) => document.providerId === application.providerId),
  }))
}
