import { extractTokenDatestamp, generateSignature } from "./misc_functions.js";

const signatureValidate = function (
  api_key,
  token,
  signature,
  slug,
  crowdhandlerCookieValue,
  timeout
) {
  let validationResponse = {
    expiration: null,
    success: null,
  };

  function minutesSinceTokenCreated(datestamp) {
    //UTC
    const currentDatestamp = new Date().getTime();

    //Time passed since creation time in minutes
    let minutesPassed = (currentDatestamp - datestamp) / 1000 / 60;
    //One decimal place
    minutesPassed = Math.round(minutesPassed * 10) / 10;
    return minutesPassed;
  }

  //Validate date stamp provided in the cookie.
  //Make sure that we don't attempt to validate the datestamp information of stale tokens.
  if (
    crowdhandlerCookieValue &&
    crowdhandlerCookieValue.tokens[crowdhandlerCookieValue.tokens.length - 1]
      .token === token
  ) {
    let dateMeta =
      crowdhandlerCookieValue.tokens[crowdhandlerCookieValue.tokens.length - 1]
        .datestamp;

    if (
      dateMeta.signature !==
        generateSignature(`${api_key}${dateMeta.touched}`) ||
      minutesSinceTokenCreated(dateMeta.touched) > timeout
    ) {
      validationResponse.expiration = true;
      validationResponse.success = false;
      return validationResponse;
    }
  }
  //If no cookie is found we work with the token extracted from the URL parameter
  else if (token) {
    if (minutesSinceTokenCreated(extractTokenDatestamp(token)) > timeout) {
      validationResponse.success = false;
      validationResponse.expiration = true;
      return validationResponse;
    }
  }
  //No cookie or query string token found. Can't validate this request.
  else {
    validationResponse.expiration = false;
    validationResponse.success = false;
    return validationResponse;
  }

  //Convert to array if we're dealing with a string (signature pulled from ch-id-signature parameter)
  if (typeof signature === "string") {
    signature = signature.split();
  }

  //Hash validation
  for (const hash of signature) {
    if (generateSignature(`${api_key}${slug}${token}`) === hash) {
      validationResponse.expiration = false;
      validationResponse.success = true;
      return validationResponse;
    }
  }

  validationResponse.expiration = false;
  validationResponse.success = false;
  return validationResponse;
};

export { signatureValidate };
