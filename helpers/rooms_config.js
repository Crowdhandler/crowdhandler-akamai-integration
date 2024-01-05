//import { logger } from "log";
import { creativeAssetExtensions } from "./misc_functions.js";

function staticAssetCheck(path) {
  //Handle static file extensions
  let fileExtension = path.match(/(.*)(\..*)/);
  if (fileExtension !== null) {
    fileExtension = fileExtension[2];
  }

  if (creativeAssetExtensions.indexOf(fileExtension) !== -1) {
    //Return the asset without intervention
    return true;
  } else {
    return false;
  }
}

const checkoutBusterCheck = function (integrationConfig, host, path) {
  let staticAsset = staticAssetCheck(path);

  if (staticAsset === true) {
    return false;
  }

  let filteredResults;
  filteredResults = integrationConfig.filter(function (item) {
    if (item.domain === `https://${host}`) {
      return item;
    }
  });

  for (const item of filteredResults) {
    try {
      let checkoutRegex = new RegExp(item.checkout);

      if (checkoutRegex.test(path)) {
        return true;
      }
    } catch (e) {
      //logger.error(e);
    }
  }

  return false;
};

const roomsConfigCheck = function (integrationConfig, host, path) {
  let staticAsset = staticAssetCheck(path);

  let filteredResults;
  filteredResults = integrationConfig.filter(function (item) {
    if (item.domain === `https://${host}`) {
      return item;
    }
  });

  function patternCheck(item) {
    switch (item.patternType) {
      case "regex":
        let regex = new RegExp(item.urlPattern);
        return regex.test(path);
        break;

      case "contains":
        let contains = item.urlPattern;
        return path.includes(contains);
        break;

      case "all":
        return true;
        break;

      default:
        break;
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

  for (const item of filteredResults) {
    if (patternCheck(item) === true && staticAsset !== true) {
      //Populate the roomMeta object.
      //Use slug as a guard to make sure if we've already found a match we don't override it with weaker ones as we loop.
      if (roomMeta.slug === null) {
        roomMeta.domain = item.domain;
        roomMeta.patternType = item.patternType;
        roomMeta.queueActivatesOn = item.queueActivatesOn;
        roomMeta.slug = item.slug;
        roomMeta.status = true;
        roomMeta.timeout = item.timeout;
      }
    }
  }

  return roomMeta;
};

export { checkoutBusterCheck, roomsConfigCheck };
