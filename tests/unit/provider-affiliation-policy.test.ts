import { describe, expect, it } from "vitest"

import {
  AffiliationTransitionError,
  assertAffiliationCanBeCreated,
  transitionAffiliation,
} from "@/lib/provider/affiliation-policy"

describe("professional affiliation policy", () => {
  it("requires the professional to accept a provider-originated request", () => {
    expect(() =>
      transitionAffiliation("REQUESTED_BY_PROVIDER", "PROVIDER", "PROVIDER", "ACCEPT"),
    ).toThrow(AffiliationTransitionError)

    expect(
      transitionAffiliation("REQUESTED_BY_PROVIDER", "PROVIDER", "PROFESSIONAL", "ACCEPT"),
    ).toMatchObject({ status: "ACTIVE", setStartsAt: true, setEndsAt: false })
  })

  it("requires the provider to accept a professional-originated request", () => {
    expect(
      transitionAffiliation(
        "REQUESTED_BY_PROFESSIONAL",
        "PROFESSIONAL",
        "PROVIDER",
        "ACCEPT",
      ),
    ).toMatchObject({ status: "ACTIVE", setStartsAt: true })
  })

  it("uses bilateral approval for termination", () => {
    const requested = transitionAffiliation(
      "ACTIVE",
      "PROVIDER",
      "PROFESSIONAL",
      "REQUEST_TERMINATION",
    )
    expect(requested).toMatchObject({
      status: "TERMINATION_REQUESTED",
      requestedBy: "TERMINATION_PROFESSIONAL",
    })

    expect(() =>
      transitionAffiliation(
        "TERMINATION_REQUESTED",
        requested.requestedBy,
        "PROFESSIONAL",
        "ACCEPT_TERMINATION",
      ),
    ).toThrow(AffiliationTransitionError)

    expect(
      transitionAffiliation(
        "TERMINATION_REQUESTED",
        requested.requestedBy,
        "PROVIDER",
        "ACCEPT_TERMINATION",
      ),
    ).toMatchObject({ status: "ENDED", setEndsAt: true })
  })

  it("allows a counterparty to reject termination and restore the active relation", () => {
    expect(
      transitionAffiliation(
        "TERMINATION_REQUESTED",
        "TERMINATION_PROVIDER",
        "PROFESSIONAL",
        "REJECT_TERMINATION",
      ),
    ).toMatchObject({ status: "ACTIVE", setEndsAt: false })
  })

  it("blocks duplicate pending or active relations", () => {
    expect(() => assertAffiliationCanBeCreated("ACTIVE")).toThrow(
      AffiliationTransitionError,
    )
    expect(() => assertAffiliationCanBeCreated("REQUESTED_BY_PROVIDER")).toThrow(
      AffiliationTransitionError,
    )
    expect(() => assertAffiliationCanBeCreated("ENDED")).not.toThrow()
    expect(() => assertAffiliationCanBeCreated("REJECTED")).not.toThrow()
  })
})
