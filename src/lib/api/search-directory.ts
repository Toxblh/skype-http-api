import { Incident } from "incident";
import * as Consts from "../consts";
import { Context } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";

export const VIRTUAL_CONTACTS: Set<string> = new Set(["concierge", "echo123"]);

export async function searchSkypeDirectory(io: io.HttpIo,
                                           apiContext: Context,
                                           userId: string): Promise<String> {
  if (VIRTUAL_CONTACTS.has(userId)) {
    // tslint:disable-next-line:max-line-length
    throw new Error(`${JSON.stringify(userId)} is not a real contact,
    you cannot get data for ${JSON.stringify(userId)}`);
  }
  try {
    const uriBase: string = "https://skypegraph.skype.com/v2.0/search?";

    const sessionId: string  =  apiContext.registrationToken.endpointId
                                      .replace("{", "").replace("}", "");

    const url: string  = `${uriBase}searchString=${encodeURIComponent(userId)
                          }&requestId=${Math.round((new Date()).getTime())
                          }0&sessionId=${sessionId}`;

    // get X-ECS-ETag from response headers and use it
    const requestOptions: io.GetOptions = {
      // tslint:disable-next-line:prefer-template
      url,
      cookies: apiContext.cookies,
      proxy: apiContext.proxy,
      headers: {
        "Origin": Consts.SKYPEWEB_API_ORIGIN,
        "User-Agent": Consts.SKYPEWEB_USER_AGENT,
        "X-Skypetoken": apiContext.skypeToken.value,
        "Accept": "application/json",
        "X-ECS-ETag": "",
        "Referer": Consts.SKYPEWEB_API_REFERRAL,
        "X-SkypeGraphServiceSettings": {
          experiment: "Default",
          geoProximity: "disabled",
          demotionScoreEnabled: "true",
        },
        "X-Skype-Client": Consts.SKYPEWEB_CLIENTINFO_VERSION,
      },
    };
    const res: io.Response = await io.get(requestOptions);
    if (res.statusCode !== 200) {
      return Promise.reject(new Incident("net",
        "Bad response when searching skype directory"));
    }

    const body: any = JSON.parse(res.body);
    const results: any = body.results;
    const searchResults: any[] = [];

    interface ProfileData {
      skypeId: string;
      name: string;
      avatarUrl: string;
    }

    interface NodeData {
      nodeProfileData: ProfileData;
    }

    results.forEach(function (value: NodeData) {
      searchResults.push({
        userComName: value.nodeProfileData.skypeId,
        name: value.nodeProfileData.name,
        avatarUrl: value.nodeProfileData.avatarUrl,
      });
    });

    return JSON.parse(JSON.stringify(searchResults));
  } catch (e) {
    throw new Error("Unable to search skype directory");
  }
}
