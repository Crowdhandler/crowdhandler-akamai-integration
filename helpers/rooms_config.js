import { logger } from "log";
import { creativeAssetExtensions } from "./misc_functions.js";

function staticAssetCheck(path) {
  //Handle static file extensions
  let fileExtension = path.match(/(\.[^.]+)$/);
  if (fileExtension !== null) {
    fileExtension = fileExtension[1];
  }

  if (creativeAssetExtensions.indexOf(fileExtension) !== -1) {
    //Return the asset without intervention
    return true;
  } else {
    return false;
  }
}

function checkoutBusterCheck(integrationConfig, host, path) {
  if (staticAssetCheck(path)) {
    return false;
  }

  const domainUrl = `https://${host}`;
  const filteredResults = integrationConfig.filter(
    (item) => item.domain === domainUrl
  );

  for (const item of filteredResults) {
    if (!item.checkout) {
      continue;
    }
    try {
      let checkoutRegex = new RegExp(item.checkout);

      if (checkoutRegex.test(path)) {
        return true;
      }
    } catch (e) {
      logger.error(`[CH] Invalid checkout regex: ${item.checkout}`);
    }
  }

  return false;
}

function roomsConfigCheck(integrationConfig, host, path) {
  const staticAsset = staticAssetCheck(path);
  const domainUrl = `https://${host}`;
  const filteredResults = integrationConfig.filter(
    (item) => item.domain === domainUrl
  );

  function patternCheck(item) {
    switch (item.patternType) {
      case "regex":
        if (!item.urlPattern) {
          return false;
        }
        try {
          let regex = new RegExp(item.urlPattern);
          return regex.test(path);
        } catch (e) {
          logger.error(`[CH] Invalid room regex: ${item.urlPattern}`);
          return false;
        }

      case "contains":
        if (!item.urlPattern) {
          return false;
        }
        let contains = item.urlPattern;
        return path.includes(contains);

      case "all":
        return true;

      default:
        return false;
    }
  }

  let roomMeta = {
    domain: null,
    patternType: null,
    queueActivatesOn: null,
    slug: null,
    status: false,
    timeout: null,
  };

  //Find first matching room - use slug as guard to not override with weaker matches
  for (const item of filteredResults) {
    if (patternCheck(item) && !staticAsset && roomMeta.slug === null) {
      roomMeta.domain = item.domain;
      roomMeta.patternType = item.patternType;
      roomMeta.queueActivatesOn = item.queueActivatesOn;
      roomMeta.slug = item.slug;
      roomMeta.status = true;
      roomMeta.timeout = item.timeout;
      break;
    }
  }

  return roomMeta;
}

export { checkoutBusterCheck, roomsConfigCheck };
