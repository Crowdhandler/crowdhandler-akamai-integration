import { httpRequest } from "http-request";
import { logger } from "log";

async function getConfig(api_key, configType) {
  function getStaticConfig() {
    //UNCOMMENT THIS LINE AND PASTE YOUR CONFIG OBJECT HERE IF YOU ARE INTEGRATING USING A STATIC CONFIG FILE
    //*const config = {}
    return config;
  }

  async function getConfigFromCache() {
    const options = {
      method: "GET",
      headers: {
        "x-api-key": api_key,
        "x-request-source": "akamai",
      },
      timeout: 1400,
    };

    try {
      const response = await httpRequest("/ch-api/v1/rooms", options);

      if (response.status >= 400 && response.status < 500) {
        logger.error(`[CH] Config fetch 4xx (${response.status}) - check API key`);
        return { result: [] };
      }

      if (response.status >= 500) {
        logger.error(`[CH] Config fetch 5xx (${response.status})`);
        return { result: [] };
      }

      const responseGenerated = response.getHeader("x-datestamp");

      //Don't use rooms feeds older than 2 minutes
      if (Math.floor(new Date().getTime() / 1000.0) - responseGenerated > 120) {
        logger.log("[CH] Config feed stale (>2 min) - using empty config");
        return { result: [] };
      }

      return await response.json();
    } catch (e) {
      logger.error(`[CH] Config fetch failed - network/timeout: ${e.message || e}`);
      return { result: [] };
    }
  }

  switch (configType.toLowerCase()) {
    case "static":
      return getStaticConfig();
    case "cache":
      return getConfigFromCache();
    case "edgekv":
      //Coming soon
      break;
  }
}

export { getConfig };
