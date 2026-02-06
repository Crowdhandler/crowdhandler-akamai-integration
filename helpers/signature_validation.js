import { generateSignature } from "./misc_functions.js";
//import { logger } from "log";

function signatureValidate(
  chRequested,
  api_key,
  token,
  signature,
  queueActivatesOn,
  slug,
  crowdhandlerCookieValue,
  timeout
) {
  const validationResponse = {
    expiration: null,
    success: null,
    validatedSignature: null,
  };

  //Convert to array if we're dealing with a string (signature pulled from ch-id-signature parameter)
  if (typeof signature === "string") {
    signature = signature.split();
  }

  const hashCandidates = [];
  const activeCookie = crowdhandlerCookieValue?.tokens?.at(-1);
  let matchedSignature;

  if (chRequested) {
    hashCandidates.unshift(
      `${api_key}${slug}${queueActivatesOn}${token}${chRequested}`
    );
  } else {
    //Collect historically generated timestamps (most recent first for optimisation)
    //and generate possible hash candidates
    for (let i = signature.length - 1; i >= 0; i--) {
      hashCandidates.push(
        `${api_key}${slug}${queueActivatesOn}${token}${signature[i].gen}`
      );
    }
  }

  //If there's no signature match it's a failure and we shouldn't proceed any further
  if (chRequested) {
    const requiredHash = generateSignature(hashCandidates[0]);
    if (signature.some((item) => item === requiredHash)) {
      matchedSignature = requiredHash;
    }
  } else {
    for (const hash of hashCandidates) {
      const requiredHash = generateSignature(hash);
      if (signature.some((item) => item.sig === requiredHash)) {
        matchedSignature = requiredHash;
        break;
      }
    }
  }

  //No signature matches found. Validation failed.
  if (!matchedSignature) {
    validationResponse.expiration = false;
    validationResponse.success = false;
    return validationResponse;
  }

  function minutesSinceTokenCreated(datestamp) {
    //UTC
    const currentDatestamp = new Date().getTime();

    //Time passed since creation time in minutes
    let minutesPassed = (currentDatestamp - datestamp) / 1000 / 60;
    //One decimal place
    minutesPassed = Math.round(minutesPassed * 10) / 10;
    return minutesPassed;
  }

  //This will only be true if we're dealing with a request that has recently been promoted from the waiting room or lite-validator.
  if (chRequested) {
    if (minutesSinceTokenCreated(Date.parse(chRequested)) < timeout) {
      validationResponse.expiration = false;
      validationResponse.success = true;
      return validationResponse;
    }
  } else {
    if (
      activeCookie &&
      activeCookie.touchedSig ===
        generateSignature(`${api_key}${activeCookie.touched}`) &&
      minutesSinceTokenCreated(activeCookie.touched) < timeout
    ) {
      validationResponse.expiration = false;
      validationResponse.success = true;
      return validationResponse;
    }
  }

  //catch all
  validationResponse.expiration = true;
  validationResponse.success = false;
  return validationResponse;
}

export { signatureValidate };
