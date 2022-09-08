import { Cookies, SetCookie } from "cookies";
//import { logger } from "log";

import {
  generateSignature,
  noCacheHeaders,
  processQueryString,
  queryStringParse,
  sourceTokenandSignature,
} from "./helpers/misc_functions.js";

import { generateTokenObject } from "./helpers/cookie_generator.js";
import { getConfig } from "./helpers/config_get.js";
import { roomsConfigCheck } from "./helpers/rooms_config.js";
import { signatureValidate } from "./helpers/signature_validation.js";

export function onClientResponse(request, response) {
  //Pull the cookie object from the middleman variable that we set in the onClientRequest function
  let cookieValue = request.getVariable("PMUSER_CREDENTIALS");
  if (cookieValue) {
    let cookie = new SetCookie();
    cookie.name = "crowdhandler";
    cookie.path = "/";
    cookie.value = encodeURIComponent(cookieValue);
    response.addHeader("Set-Cookie", cookie.toHeader());
  }
}

export async function onClientRequest(request) {
  //UTC
  const requestStartTime = new Date().getTime();
  //Domain
  const host = request.host;
  const path = request.path;

  //Environment Setup
  //REMOVE B4 BUNDLING
  const API_ENDPOINT = request.getVariable("PMUSER_CROWDHANDLER_API_ENDPOINT");
  let PRIVATE_API_KEY;
  let PUBLIC_API_KEY;
  let HASHED_PRIVATE_API_KEY;

  if (
    request.getVariable("PMUSER_AUTOMATIONS") === "true" &&
    host.includes("automations")
  ) {
    PUBLIC_API_KEY = request.getVariable("PMUSER_CROWDHANDLER_SYNTH_KEY");
    PRIVATE_API_KEY = request.getVariable("PMUSER_CROWDHANDLER_PV_SYNTH_KEY");
  } else {
    PUBLIC_API_KEY = request.getVariable("PMUSER_CROWDHANDLER_PUBLIC_KEY");
    PRIVATE_API_KEY = request.getVariable("PMUSER_CROWDHANDLER_PRIVATE_KEY");
  }

  HASHED_PRIVATE_API_KEY = generateSignature(PRIVATE_API_KEY);

  //Our function to return a response sending requests needing validation to the lite validator
  function goToLiteValidator(targetURL, token, code, expiration) {
    if (!token) {
      token = "";
    }

    if (!code) {
      code = "";
    }

    let redirectLocation = {
      Location: `/ch-api/v1/redirect/requests/${token}?url=${targetURL}&ch-public-key=${PUBLIC_API_KEY}&ch-code=${code}&whitelabel=true`,
    };
    let headers = Object.assign(noCacheHeaders, redirectLocation);

    //Add a no-cache header here
    request.respondWith(302, headers, "{}");
  }

  //Strip the URL of special CrowdHandler parameters
  function generateCleanURL(queryString) {
    let redirectLocation;

    if (queryString) {
      redirectLocation = { Location: `${path}${queryString}` };
    } else {
      redirectLocation = { Location: path };
    }

    let headers = Object.assign(noCacheHeaders, redirectLocation);

    request.respondWith(302, headers, "{}");
  }

  /*
   * Fetch the room config feed
   * Method options are static, cache or edgekv.
   */
  const integrationConfig = await getConfig(PUBLIC_API_KEY, "cache");

  // Get the query string, parse and process it
  const unprocessedQueryString = request.query;
  let queryString;

  //Parse query string
  if (unprocessedQueryString) {
    queryString = queryStringParse(unprocessedQueryString);
  }

  //Destructure special params from query string if they are present
  let {
    "ch-code": chCode,
    "ch-id": chID,
    "ch-id-signature": chIDSignature,
    "ch-public-key": chPublicKey,
    "ch-requested": chRequested,
  } = queryString || {};

  //Override chCode value if the current one is unusable
  if (!chCode || chCode === "undefined" || chCode === "null") {
    chCode = "";
  }

  // Process the query string
  queryString = processQueryString(queryString);

  //Check the config file to see if we need to process this request any further
  let validationRequired = roomsConfigCheck(
    integrationConfig.result,
    host,
    path + queryString
  );

  //Validate the signature.
  if (validationRequired.status === true) {
    //URL encode the targetURL to be used later in redirects
    let targetURL;
    if (queryString) {
      targetURL = encodeURIComponent(`https://${host}${path}${queryString}`);
    } else {
      targetURL = encodeURIComponent(`https://${host}${path}`);
    }

    //Cookie Jar
    let cookies = new Cookies(request.getHeader("Cookie"));
    let crowdhandlerCookieValue = cookies.get("crowdhandler");
    if (crowdhandlerCookieValue) {
      crowdhandlerCookieValue = decodeURIComponent(crowdhandlerCookieValue);
      crowdhandlerCookieValue = JSON.parse(crowdhandlerCookieValue);
    }

    //Determine where to source the token and signature from
    let [token, signature] = sourceTokenandSignature(
      chID,
      chIDSignature,
      crowdhandlerCookieValue
    );

    //Move to next stage of validation
    if (token && signature) {
      let validationResult = signatureValidate(
        chRequested,
        HASHED_PRIVATE_API_KEY,
        token,
        signature,
        validationRequired.queueActivatesOn,
        validationRequired.slug,
        crowdhandlerCookieValue,
        validationRequired.timeout,
        validationRequired.patternType
      );

      if (validationResult.success !== true) {
        goToLiteValidator(
          targetURL,
          token,
          chCode,
          validationResult.expiration
        );
      } else {
        //If the signature is valid, we can continue to the next stage of the request
        let freshToken;
        //Flag if we're working with a never seen before signature
        let newSignature;
        let signatures = [];
        let tokenObjects = [];
        let requestStartTimeHash = generateSignature(
          `${HASHED_PRIVATE_API_KEY}${requestStartTime}`
        );

        //Push tokens already in the cookie
        if (crowdhandlerCookieValue) {
          for (const item of crowdhandlerCookieValue.tokens) {
            tokenObjects.push(item);
          }
        }

        //Determine if we're working with a new token or a previously seen one
        if (
          (Array.isArray(tokenObjects) && tokenObjects.length === 0) ||
          (Array.isArray(tokenObjects) &&
            tokenObjects[tokenObjects.length - 1].token !== token)
        ) {
          freshToken = true;
        } else {
          freshToken = false;
          //We want to work with the most recent array of signatures
          for (const item of tokenObjects[tokenObjects.length - 1].signatures) {
            signatures.push(item);
          }
        }

        let tokenObject = new generateTokenObject(
          requestStartTime,
          requestStartTimeHash,
          signature,
          chRequested,
          signatures,
          token
        );

        if (
          typeof signature === "string" &&
          signatures.some((item) => item.sig === signature) === false
        ) {
          signatures.push(tokenObject.signatureObject());
          newSignature = true;
        }

        if (freshToken) {
          //Reset the array. It's important we don't allow the PMUSER_CREDENTIALS variable exceed the byte limit.
          tokenObjects = [];
          tokenObjects.push(tokenObject.tokenObject());
        } else {
          //Update the cookie
          tokenObjects[tokenObjects.length - 1].signatures = signatures;
          tokenObjects[tokenObjects.length - 1].touched = requestStartTime;
          tokenObjects[tokenObjects.length - 1].touchedSig =
            requestStartTimeHash;
        }

        //Set the cookie in our middle man variable that we can access in onClientResponse
        request.setVariable(
          "PMUSER_CREDENTIALS",
          JSON.stringify({
            integration: "akamai",
            tokens: tokenObjects,
          })
        );

        //If we're coming in from the lite validator clean up the URL
        if (newSignature) {
          generateCleanURL(queryString);
        }
      }
    } else {
      goToLiteValidator(targetURL, token, chCode, true);
    }
  }
}
