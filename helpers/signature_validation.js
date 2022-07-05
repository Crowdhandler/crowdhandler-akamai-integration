import { generateSignature } from "./misc_functions.js";
//import { logger } from "log";

const signatureValidate = function (
  chRequested,
  api_key,
  token,
  signature,
  queueActivatesOn,
  slug,
  crowdhandlerCookieValue,
  timeout
) {
  let validationResponse = {
    expiration: null,
    success: null,
    validatedSignature: null,
  };

  //Convert to array if we're dealing with a string (signature pulled from ch-id-signature parameter)
  if (typeof signature === "string") {
    signature = signature.split();
  }

  let hashCandidates = [];
  let activeCookie;
  if (crowdhandlerCookieValue) {
    activeCookie =
      crowdhandlerCookieValue.tokens[crowdhandlerCookieValue.tokens.length - 1];
  }
  let matchedSignature;

  if (chRequested) {
    hashCandidates.unshift(
      `${api_key}${slug}${queueActivatesOn}${token}${chRequested}`
    );
  } else {
    //If we have a signature that is active, we can use that to generate the hash
    let generatedHistory = [];

    //Collect the historically generated timestamps
    //Unshift to get most recent sig objects first for optimisation purposes
    for (const item of signature) {
      generatedHistory.unshift(item.gen);
    }

    //Generate possible hash candidates
    for (const item of generatedHistory) {
      hashCandidates.push(
        `${api_key}${slug}${queueActivatesOn}${token}${item}`
      );
    }
  }

  //If there's no signature match it's a failure and we shouldn't proceed any further
  if (chRequested) {
    let requiredHash = generateSignature(hashCandidates[0]);

    if (signature.some((item) => item === requiredHash) === true) {
      matchedSignature = requiredHash;
    }
  } else {
    for (const hash of hashCandidates) {
      let requiredHash = generateSignature(hash);
      if (signature.some((item) => item.sig === requiredHash) === true) {
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
};

export { signatureValidate };
