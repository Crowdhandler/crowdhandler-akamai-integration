import URLSearchParams from "url-search-params";
import { sha256 } from "js-sha256";

const creativeAssetExtensions = [
  ".aac",
  ".abw",
  ".arc",
  ".avi",
  ".azw",
  ".bin",
  ".bmp",
  ".bz",
  ".bz2",
  ".cgm",
  ".csv",
  ".css",
  ".csv",
  ".doc",
  ".docx",
  ".eot",
  ".eps",
  ".flac",
  ".flv",
  ".gif",
  ".gz",
  ".gzip",
  ".ico",
  ".ics",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".jsonld",
  ".mid",
  ".midi",
  ".mjs",
  ".mp3",
  ".mpeg",
  ".mp4",
  ".mpg",
  ".odp",
  ".ods",
  ".odt",
  ".oga",
  ".ogg",
  ".ogv",
  ".otf",
  ".png",
  ".pdf",
  ".ppt",
  ".pptx",
  ".rar",
  ".rtf",
  ".svg",
  ".swf",
  ".tar",
  ".tif",
  ".tiff",
  ".tsv",
  ".ttf",
  ".txt",
  ".wav",
  ".webm",
  ".woff",
  ".woff2",
  ".xls",
  ".xlsx",
  ".xml",
  ".xul",
  ".zip",
  ".3gp",
  ".3g2",
  ".7z",
];

const noCacheHeaders = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Expires: "Fri, 01 Jan 1970 00:00:00 GMT",
  Pragma: "no-cache",
};

const processQueryString = function (unprocessedQueryString) {
  let queryString = unprocessedQueryString;

  //Remove special params from the queryString object now that we don't need them anymore
  if (queryString) {
    delete queryString["ch-code"];
    delete queryString["ch-fresh"];
    delete queryString["ch-id"];
    delete queryString["ch-id-signature"];
    delete queryString["ch-public-key"];
    delete queryString["ch-requested"];
  }

  //Convert to usable querystring format
  if (queryString && Object.keys(queryString).length !== 0) {
    queryString = Object.keys(queryString)
      .map((key) => key + "=" + queryString[key])
      .join("&");

    queryString = `?${queryString}`;
  } else {
    queryString = "";
  }

  return queryString;
};

const queryStringParse = function (queryString) {
  function paramsToObject(entries) {
    const result = {};
    for (const [key, value] of entries) {
      //each 'entry' is a [key, value] tupple
      result[key] = value;
    }
    return result;
  }

  var urlParams = new URLSearchParams(queryString);
  const entries = urlParams.entries(); //returns an iterator of decoded [key,value] tuples
  const params = paramsToObject(entries);

  return params;
};

//Working extraction method. Left in code for sake of posterity. Not currently used.
/*const extractTokenDatestamp = function (token) {
  let base60 = "0123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz";
  let tok_meta = token.slice(4, 10);

  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC
  let year = base60.indexOf(tok_meta[0]);
  let month = base60.indexOf(tok_meta[1]) - 1;
  let day = base60.indexOf(tok_meta[2]);
  let hour = base60.indexOf(tok_meta[3]);
  let minute = base60.indexOf(tok_meta[4]);
  let second = base60.indexOf(tok_meta[5]);

  return Date.UTC(`20${year}`, month, day, hour, minute, second);
};*/

const generateSignature = function (input) {
  const hash = sha256(input);
  return hash;
};

const sourceTokenandSignature = function (
  chID,
  chIDSignature,
  crowdhandlerCookieValue
) {
  let token;
  let signature;

  //If the chID is not present, use the crowdhandlerCookieValue
  if (chID) {
    token = chID;
  } else if (crowdhandlerCookieValue) {
    token =
      crowdhandlerCookieValue.tokens[crowdhandlerCookieValue.tokens.length - 1]
        .token;
  }

  //If the chIDSignature is not present, use the crowdhandlerCookieValue
  if (chIDSignature) {
    signature = chIDSignature;
  } else if (crowdhandlerCookieValue) {
    signature =
      crowdhandlerCookieValue.tokens[crowdhandlerCookieValue.tokens.length - 1]
        .signatures;
  }

  return [token, signature];
};

export {
  creativeAssetExtensions,
  generateSignature,
  noCacheHeaders,
  processQueryString,
  queryStringParse,
  sourceTokenandSignature,
};
