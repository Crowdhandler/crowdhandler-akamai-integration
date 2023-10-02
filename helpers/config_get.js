import { httpRequest } from "http-request";

const getConfig = async function (api_key, configType) {
  function getStaticConfig() {
    //UNCOMMENT THIS LINE AND PASTE YOUR CONFIG OBJECT HERE IF YOU ARE INTEGRATING USING A STATIC CONFIG FILE
    //*const config = {}
    return config;
  }

  async function getConfigFromCache() {
    let options = {};
    options.method = "GET";
    options.headers = {
      "x-api-key": api_key,
    };
    options.timeout = 1400;

    const response = await httpRequest("/ch-api/v1/rooms", options);
    const responseGenerated = response.getHeader("x-datestamp");

    //Don't use rooms feeds older than 2 minutes
    if (Math.floor(new Date().getTime() / 1000.0) - responseGenerated > 120) {
      return { result: [] };
    }

    return response.json();
  }

  switch (configType.toLowerCase()) {
    case "static":
      return getStaticConfig();
    case "cache":
      return getConfigFromCache();
    //Coming soon
    case "edgekv":
  }
};

export { getConfig };
