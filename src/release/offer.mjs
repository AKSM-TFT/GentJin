export const OFFER_TEXT =
  "Would you like paste-ready release notes for the changes since the previous release?"

/**
 * Decides whether to offer release notes after a push. This is a pure decision so the skip,
 * decline, and already-explicit paths are verifiable without performing a push.
 */
export function decideOffer({
  pushSucceeded = false,
  userRequested = false,
  eligibleChanges = 0,
  offeredThisPush = false,
  declinedThisPush = false,
} = {}) {
  if (!pushSucceeded) {
    return { offer: false, run: false, reason: "the push did not succeed, so there is nothing to report" }
  }

  if (userRequested) {
    return { offer: false, run: true, reason: "the user already asked for release notes, so do not ask again" }
  }

  if (declinedThisPush) {
    return {
      offer: false,
      run: false,
      reason: "the user declined for this push; do not loop, and a later successful push may offer again",
    }
  }

  if (offeredThisPush) {
    return { offer: false, run: false, reason: "already offered once for this push" }
  }

  if (!eligibleChanges) {
    return { offer: false, run: false, reason: "no eligible changes, so no empty release should be offered" }
  }

  return { offer: true, run: false, text: OFFER_TEXT, reason: "eligible changes exist and none was offered yet" }
}
