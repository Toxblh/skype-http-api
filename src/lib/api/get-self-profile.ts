import { Incident } from "incident";
import { JsonReader } from "kryo/readers/json";
import toughCookie from "tough-cookie";
import * as apiUri from "../api-uri";
import { UnexpectedHttpStatusError } from "../errors";
import { ProxyError } from "../errors/proxy-error";
import { SkypeToken } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";
import { $ApiProfile, ApiProfile } from "../types/api-profile";
import { Url } from "../types/url";

export async function getSelfProfile(
  httpIo: io.HttpIo,
  cookies: toughCookie.Store,
  skypeToken: SkypeToken,
  proxy?: string,
): Promise<ApiProfile> {
  const url: Url = apiUri.userProfile(apiUri.DEFAULT_USER);
  const request: io.GetOptions = {
    url,
    cookies,
    headers: {
      "X-Skypetoken": skypeToken.value,
    },
    proxy,
  };
  const response: io.Response = await httpIo.get(request);
  if (response.statusCode !== 200) {
    UnexpectedHttpStatusError.create(response, new Set([200]), request);
  }
  let parsed: any;
  try {
    parsed = JSON.parse(response.body);
  } catch (err) {
    // Added for debug
    console.log(JSON.stringify(skypeToken));
    console.log(JSON.stringify(response.headers));
    if (response.body.indexOf("Proxy Error") > -1) {
      throw ProxyError.create(response.body);
    }
    throw new Incident(err, "UnexpectedResponseBody", {body: response.body, response});

  }
  const reader: JsonReader = new JsonReader();
  let result: ApiProfile;
  try {
    if ($ApiProfile.read) {
      result = $ApiProfile.read(reader, response.body);
    } else {
      throw Error("read should always be defined");
    }
  } catch (err) {
    // Added for debug
    console.log(JSON.stringify(skypeToken));
    console.log(JSON.stringify(response.headers));
    throw new Incident(err, "UnexpectedResult", {body: parsed, response});
  }
  return result;
}
