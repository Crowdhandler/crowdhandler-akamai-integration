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
  let PUBLIC_API_KEY = request.getVariable("PMUSER_CROWDHANDLER_PUBLIC_KEY");
  let PRIVATE_API_KEY = request.getVariable("PMUSER_CROWDHANDLER_PRIVATE_KEY");
  let HASHED_PRIVATE_API_KEY = generateSignature(PRIVATE_API_KEY);

  let newCookieValue = JSON.stringify({
    integration: "akamai",
    method: request.method,
    host: request.host,
    path: request.path,
    scheme: request.scheme,
    publickey: PUBLIC_API_KEY,
    hashedPrivatekey: HASHED_PRIVATE_API_KEY,
  });

  request.setVariable("PMUSER_CREDENTIALS", newCookieValue);
}
