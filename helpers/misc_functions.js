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

function processQueryString(unprocessedQueryString) {
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
    let pairs = [];
    for (const key of Object.keys(queryString)) {
      const values = Array.isArray(queryString[key]) ? queryString[key] : [queryString[key]];
      for (const val of values) {
        pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(val));
      }
    }
    queryString = `?${pairs.join("&")}`;
  } else {
    queryString = "";
  }

  return queryString;
}

function queryStringParse(queryString) {
  function paramsToObject(entries) {
    const result = {};
    for (const [key, value] of entries) {
      if (result.hasOwnProperty(key)) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  var urlParams = new URLSearchParams(queryString);
  const entries = urlParams.entries();
  const params = paramsToObject(entries);

  return params;
}

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

function generateSignature(input) {
  return sha256(input);
}

function sourceTokenandSignature(chID, chIDSignature, crowdhandlerCookieValue) {
  const lastToken = crowdhandlerCookieValue?.tokens?.at(-1);

  const token = chID || lastToken?.token;
  const signature = chIDSignature || lastToken?.signatures;

  return [token, signature];
}

export {
  creativeAssetExtensions,
  generateSignature,
  noCacheHeaders,
  processQueryString,
  queryStringParse,
  sourceTokenandSignature,
};
