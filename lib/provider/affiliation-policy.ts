import type { AffiliationStatus } from "@prisma/client"

export const affiliationActions = [
  "ACCEPT",
  "REJECT",
  "REQUEST_TERMINATION",
  "ACCEPT_TERMINATION",
  "REJECT_TERMINATION",
] as const

export type AffiliationAction = (typeof affiliationActions)[number]
export type AffiliationParty = "PROVIDER" | "PROFESSIONAL"

export type AffiliationTransition = {
  status: AffiliationStatus
  requestedBy: string
  setStartsAt: boolean
  setEndsAt: boolean
}

export class AffiliationTransitionError extends Error {
  readonly code: "AFFILIATION_INVALID_TRANSITION" | "AFFILIATION_COUNTERPART_REQUIRED"

  constructor(code: AffiliationTransitionError["code"], message: string) {
    super(message)
    this.name = "AffiliationTransitionError"
    this.code = code
  }
}

function counterparty(party: AffiliationParty): AffiliationParty {
  return party === "PROVIDER" ? "PROFESSIONAL" : "PROVIDER"
}

function requestParty(status: AffiliationStatus): AffiliationParty | null {
  if (status === "REQUESTED_BY_PROVIDER") return "PROVIDER"
  if (status === "REQUESTED_BY_PROFESSIONAL") return "PROFESSIONAL"
  return null
}

function terminationParty(requestedBy: string): AffiliationParty | null {
  if (requestedBy === "TERMINATION_PROVIDER") return "PROVIDER"
  if (requestedBy === "TERMINATION_PROFESSIONAL") return "PROFESSIONAL"
  return null
}

export function affiliationRequestStatus(party: AffiliationParty): AffiliationStatus {
  return party === "PROVIDER" ? "REQUESTED_BY_PROVIDER" : "REQUESTED_BY_PROFESSIONAL"
}

export function assertAffiliationCanBeCreated(existingStatus?: AffiliationStatus | null): void {
  if (!existingStatus || existingStatus === "REJECTED" || existingStatus === "ENDED") return
  throw new AffiliationTransitionError(
    "AFFILIATION_INVALID_TRANSITION",
    "An active or pending affiliation already exists for this scope.",
  )
}

export function transitionAffiliation(
  status: AffiliationStatus,
  requestedBy: string,
  actorParty: AffiliationParty,
  action: AffiliationAction,
): AffiliationTransition {
  const requester = requestParty(status)
  if (requester) {
    if (actorParty !== counterparty(requester)) {
      throw new AffiliationTransitionError(
        "AFFILIATION_COUNTERPART_REQUIRED",
        "Only the counterparty can respond to an affiliation request.",
      )
    }
    if (action === "ACCEPT") {
      return { status: "ACTIVE", requestedBy, setStartsAt: true, setEndsAt: false }
    }
    if (action === "REJECT") {
      return { status: "REJECTED", requestedBy, setStartsAt: false, setEndsAt: true }
    }
  }

  if (status === "ACTIVE" && action === "REQUEST_TERMINATION") {
    return {
      status: "TERMINATION_REQUESTED",
      requestedBy: `TERMINATION_${actorParty}`,
      setStartsAt: false,
      setEndsAt: false,
    }
  }

  if (status === "TERMINATION_REQUESTED") {
    const terminationRequester = terminationParty(requestedBy)
    if (!terminationRequester || actorParty !== counterparty(terminationRequester)) {
      throw new AffiliationTransitionError(
        "AFFILIATION_COUNTERPART_REQUIRED",
        "Only the counterparty can respond to a termination request.",
      )
    }
    if (action === "ACCEPT_TERMINATION") {
      return { status: "ENDED", requestedBy, setStartsAt: false, setEndsAt: true }
    }
    if (action === "REJECT_TERMINATION") {
      return { status: "ACTIVE", requestedBy, setStartsAt: false, setEndsAt: false }
    }
  }

  throw new AffiliationTransitionError(
    "AFFILIATION_INVALID_TRANSITION",
    `Action ${action} is not valid while affiliation is ${status}.`,
  )
}
