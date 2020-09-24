import cheerio from "cheerio";
import path from "path";
import toughCookie from "tough-cookie";
import urlParser from "url";
import { WrongCredentialsError } from "../errors";
import { WrongCredentialsLimitError } from "../errors";
import { AbuseBehavior } from "../errors/abuse-behaviour";
import { AccountNotFound } from "../errors/account-not-found";
import { AccountRecoverRestriction } from "../errors/account-recover-restriction";
import { AccountUpdate } from "../errors/account-update";
import { GoogleAuthRequired } from "../errors/google-auth";
import * as httpErrors from "../errors/http";
import { IdentityCheckRequired } from "../errors/identity-check-required";
import { MicrosoftAccountLoginError } from "../errors/microsoft-account";
import * as getLiveKeysErrors from "../errors/microsoft-account/get-live-keys";
import * as getLiveTokenErrors from "../errors/microsoft-account/get-live-token";
import * as getSkypeTokenErrors from "../errors/microsoft-account/get-skype-token";
import { MicrosoftAuthenticator } from "../errors/microsoft-authenticator";
import { UpsellOfferError } from "../errors/upsell-offer";
import { SkypeToken } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";

export const skypeWebUri: string = "https://web.skype.com/";
export const skypeLoginUri: string = "https://login.skype.com/login/";
export const liveLoginUri: string = "https://login.live.com/";
export const webClientLiveLoginId: string = "578134";

/**
 * Checks if the user `username` exists
 */
// export async function userExists(username: string, httpIo: io.HttpIo = requestIo): Promise<boolean> {
//   const microsoftAccounts = "fjosi";
//   const uri = `${microsoftAccounts}/GetCredentialType.srf`;
//
//   const res: io.Response = await httpIo.post({
//     uri: uri,
//     form: {
//       username: username
//     }
//   });
//
//   const data = JSON.parse(res.body);
//   return data["IfExistsResult"];
// }

export interface Credentials {
  /**
   * Skype username or email address
   */
  login: string;
  password: string;
}

export interface LoginOptions {
  credentials: Credentials;
  httpIo: io.HttpIo;
  cookies: toughCookie.Store;
  proxy?: string;
}

export async function login(options: LoginOptions): Promise<SkypeToken> {
  try {
    const liveKeys: LiveKeys = await getLiveKeys(options);

    const liveToken: string = await getLiveToken({
      username: options.credentials.login,
      password: options.credentials.password,
      httpIo: options.httpIo,
      cookies: options.cookies,
      liveKeys,
      proxy: options.proxy,
    });

    return getSkypeToken({
      liveToken,
      cookies: options.cookies,
      httpIo: options.httpIo,
      proxy: options.proxy,
    });
  } catch (_err) {
    const err: MicrosoftAccountLoginError.Cause = _err;
    switch (err.name) {
      case getLiveKeysErrors.GetLiveKeysError.name:
      case getLiveTokenErrors.GetLiveTokenError.name:
      case getSkypeTokenErrors.GetSkypeTokenError.name:
      case WrongCredentialsError.name:
      case WrongCredentialsLimitError.name:
        throw MicrosoftAccountLoginError.create(err);
      default:
        throw _err;
    }
  }
}

export interface LoadLiveKeysOptions {
  httpIo: io.HttpIo;
  cookies: toughCookie.Store;
}

export interface LiveKeys {
  /**
   * MicroSoft P Requ ?
   *
   * Examples:
   * - `"$uuid-46f6d2b2-ff98-4446-aafb-2ba99c0c0638"`
   */
  MSPRequ: string;

  /**
   * MicroSoft P OK ?
   *
   * Examples:
   * - `"lt=1483826635&co=1&id=293290"`
   */
  MSPOK: string;

  /**
   * PPF Token ?
   *
   * Examples: (see spec)
   */
  PPFT: string;
}

export async function getLiveKeys(options: LoadLiveKeysOptions): Promise<LiveKeys> {
  try {
    const url: string = urlParser.resolve(skypeLoginUri, path.posix.join("oauth", "microsoft"));
    const queryString: { [key: string]: string } = {
      client_id: webClientLiveLoginId,
      redirect_uri: skypeWebUri,
    };
    const getOptions: io.GetOptions = {url, queryString, cookies: options.cookies};

    let response: io.Response;
    try {
      response = await options.httpIo.get(getOptions);
    } catch (err) {
      throw httpErrors.RequestError.create(err, getOptions);
    }

    let mspRequ: string | undefined;
    let mspOk: string | undefined;

    // Retrieve values for the cookies "MSPRequ" and "MSPOK"
    const cookies: toughCookie.Cookie[] = new toughCookie.CookieJar(options.cookies)
      .getCookiesSync("https://login.live.com/");
    for (const cookie of cookies) {
      switch (cookie.key) {
        case "MSPRequ":
          mspRequ = cookie.value;
          break;
        case "MSPOK":
          mspOk = cookie.value;
          break;
        default:
          // Ignore other cookies
          break;
      }
    }

    if (typeof mspOk !== "string") {
      throw getLiveKeysErrors.MspokCookieNotFoundError.create(getOptions, response);
    }
    if (typeof mspRequ !== "string") {
      throw getLiveKeysErrors.MsprequCookieNotFoundError.create(getOptions, response);
    }

    const ppftKey: string = scrapLivePpftKey(response.body);
    return {
      MSPRequ: mspRequ,
      MSPOK: mspOk,
      PPFT: ppftKey,
    };
  } catch (_err) {
    const err: getLiveKeysErrors.GetLiveKeysError.Cause = _err;
    switch (err.name) {
      case httpErrors.RequestError.name:
      case getLiveKeysErrors.MspokCookieNotFoundError.name:
      case getLiveKeysErrors.MsprequCookieNotFoundError.name:
      case getLiveKeysErrors.PpftKeyNotFoundError.name:
        throw getLiveKeysErrors.GetLiveKeysError.create(err);
      default:
        throw _err;
    }
  }
}

/**
 * Retrieves the PPFT key from the HTML response from login.live.com to get the Live keys.
 *
 * @param html The html body to scrap
 * @returns The PPFT key
 */
export function scrapLivePpftKey(html: string): string {
  /* tslint:disable-next-line:max-line-length */
  const ppftRegExp: RegExp = /<input\s+type="hidden"\s+name="PPFT"\s+id="i0327"\s+value="([*!0-9a-zA-Z]+\${1,2})"\s*\/>/;
  const regExpResult: RegExpExecArray | null = ppftRegExp.exec(html);

  if (regExpResult === null) {
    throw getLiveKeysErrors.PpftKeyNotFoundError.create(html);
  }

  return regExpResult[1];
}

export interface GetLiveTokenOptions {
  username: string;
  password: string;
  liveKeys: LiveKeys;
  httpIo: io.HttpIo;
  cookies: toughCookie.Store;
  proxy?: string;
}

export async function getLiveToken(options: GetLiveTokenOptions): Promise<string> {
  try {
    const response: io.Response = await requestLiveToken(options);
    const htmlResponse: any = await checkIfUpsellIsPresentAndDismiss(response.body, options);
    return scrapLiveToken(htmlResponse);
  } catch (_err) {
    const err: getLiveTokenErrors.GetLiveTokenError.Cause | WrongCredentialsError | WrongCredentialsLimitError = _err;
    switch (err.name) {
      case httpErrors.RequestError.name:
      case getLiveTokenErrors.LiveTokenNotFoundError.name:
        throw getLiveTokenErrors.GetLiveTokenError.create(err);
      case WrongCredentialsError.name:
        if (typeof err.data.username !== "string") {
          throw WrongCredentialsError.create(options.username);
        } else {
          throw err;
        }
      case WrongCredentialsLimitError.name:
      default:
        throw _err;
    }
  }
}

// Get live token from live keys and credentials
export async function requestLiveToken(options: GetLiveTokenOptions): Promise<io.Response> {
  const url: string = urlParser.resolve(liveLoginUri, path.posix.join("ppsecure", "post.srf"));
  const queryString: { [key: string]: string } = {
    wa: "wsignin1.0",
    wp: "MBI_SSL",
    // tslint:disable-next-line:max-line-length
    wreply: "https://lw.skype.com/login/oauth/proxy?client_id=578134&site_name=lw.skype.com&redirect_uri=https%3A%2F%2Fweb.skype.com%2F",
  };
  // MSPRequ should already be set
  // MSPOK should already be set
  const millisecondsSinceEpoch: number = Date.now(); // Milliseconds since epoch
  const ckTstCookie: toughCookie.Cookie = new (<any> toughCookie.Cookie)({
    key: "CkTst",
    value: millisecondsSinceEpoch.toString(10),
  });

  new toughCookie.CookieJar(options.cookies).setCookieSync(ckTstCookie, "https://login.live.com/");

  const formData: any = {
    login: options.username,
    passwd: options.password,
    PPFT: options.liveKeys.PPFT,
  };

  const postOptions: io.PostOptions = {
    url,
    queryString,
    cookies: options.cookies,
    form: formData,
    proxy: options.proxy,
  };

  try {
    return options.httpIo.post(postOptions);
  } catch (err) {
    throw httpErrors.RequestError.create(err, postOptions);
  }
}

/**
 * Does the necessary steps to avoid the Authenticator Upsell offer in order to be able to complete
 * the login process
 * This step is required in order to get the html containing the `t` parameter necessary for scrapLiveToken
 *
 * @param html
 * @param options GetLiveTokenOptions
 *
 * @return html to be used by scrapLiveToken
 */
export async function checkIfUpsellIsPresentAndDismiss(html: string, options: GetLiveTokenOptions)
  : Promise<string> {
  let $: cheerio.Root = cheerio.load(html);
  if (html.indexOf("app=Authenticator") > -1) {
    console.log("<<<<<<  Upsell Detected  >>>>>");
    const url: string = $("form").attr("action") || ""
      .replace('\\"', "").replace('\\"', "");
    const inputValues: any = $("input");

    // tslint:disable-next-line variable-name
    let client_flight: any = "";
    let ipt: any = "";
    let pprid: any = "";
    let uaid: any = "";

    Object.values(inputValues).forEach(element => {
      // @ts-ignore
      if (element.attribs) {
        // @ts-ignore
        const paramName: string = element.attribs.name
          .replace('\\"', "").replace('\\"', "");
        // @ts-ignore
        const paramValue: string = element.attribs.value
          .replace('\\"', "").replace('\\"', "");

        switch (paramName) {
          case "client_flight":
            client_flight = paramValue;
            break;
          case "ipt":
            ipt = paramValue;
            break;
          case "pprid":
            pprid = paramValue;
            break;
          case "uaid":
            uaid = paramValue;
            break;
          default:
            break;
        }
      }
    });

    const formData: any = {
      client_flight,
      ipt,
      pprid,
      uaid,
    };

    const postOptions: io.PostOptions = {
      url,
      cookies: options.cookies,
      form: formData,
      proxy: options.proxy,
    };

    const getUpsellInfoResponse: io.Response = await options.httpIo.post(postOptions);

    $ = cheerio.load(getUpsellInfoResponse.body);
    const scriptData: any = $("script").get()[6].children[0].data;
    const parse: any = JSON.parse(scriptData.replace("//<![CDATA[\n$Config=", "")
      .replace(';window.$Do && window.$Do.register(\"$Config\", 0, true);\n//]]>', ""));

    const cancelUpselPostOptions: io.PostOptions = {
      url: parse.WLXAccount.upsellAuthenticator.options.viewDefs.cancel.url,
      cookies: options.cookies,
      proxy: options.proxy,
    };

    const cancelUpsellResponse: io.Response = await options.httpIo.post(cancelUpselPostOptions);

    console.log("<<<<<<  Upsell Avoided  >>>>>");
    return cancelUpsellResponse.body;
  } else {
    return html;
  }
}

/**
 * Scrap the result of a sendCredentials requests to retrieve the value of the `t` parameter
 * @param html
 * @returns The token provided by Live for Skype
 */
export function scrapLiveToken(html: string): string {
  // TODO(demurgos): Handle the possible failure of .load (invalid HTML)
  const $: cheerio.Root = cheerio.load(html);

  const tokenNode: cheerio.Cheerio = $("#t");
  const formSubmitUrl: string | undefined = $("form").attr("action");

  const tokenValue: string | undefined = tokenNode.val();
  if (tokenValue === undefined || tokenValue === "") {
    if (html.indexOf("sErrTxt:'Your account or password is incorrect.") >= 0
      && html.indexOf("GoogleRedirectUrl") < 0) {
      throw WrongCredentialsError.create();
      /* tslint:disable-next-line:max-line-length */
    } else if (html.indexOf("sErrTxt:\"You\\'ve tried to sign in too many times with an incorrect account or password.\"") >= 0) {
      throw WrongCredentialsLimitError.create();
    } else if (html.indexOf("identity/confirm") >= 0) {
      throw IdentityCheckRequired.create();
    } else if (html.indexOf("account.live.com/recover?") >= 0) {
      throw AccountRecoverRestriction.create();
    } else if (html.indexOf("upsell") >= 0) {
      throw UpsellOfferError.create();
    } else if (html.indexOf("GoogleRedirectUrl") >= 0) {
      throw GoogleAuthRequired.create();
    } else if (html.indexOf("Help us protect your account")  >= 0) {
      throw MicrosoftAuthenticator.create();
    } else if (html.indexOf("That Microsoft account doesn\\'t exist") >= 0) {
      throw AccountNotFound.create();
    } else if (formSubmitUrl !== undefined && formSubmitUrl !== "") {
      if (formSubmitUrl.indexOf("Abuse") >= 0) {
        throw AbuseBehavior.create();
      } else if (formSubmitUrl.indexOf("/login") >= 0) {
      } else if (formSubmitUrl.indexOf("/remind") >= 0) {
        throw AccountUpdate.create();
      }
    } else {
      // TODO: add authenticator case
      // TODO(demurgos): Check if there is a PPFT token (redirected to the getLiveKeys response)
      console.log(html);
      throw getLiveTokenErrors.LiveTokenNotFoundError.create(html);
    }
  }
  return tokenValue;
}

export interface GetSkypeTokenOptions {
  liveToken: string;
  httpIo: io.HttpIo;
  cookies: toughCookie.Store;
  proxy?: string;
}

/**
 * Complete the OAuth workflow and get the Skype token
 *
 * @param options
 */
export async function getSkypeToken(options: GetSkypeTokenOptions): Promise<SkypeToken> {
  try {
    const startTime: number = Date.now();
    const res: io.Response = await requestSkypeToken(options);
    const scrapped: SkypeTokenResponse = scrapSkypeTokenResponse(res.body);
    // Expires in (seconds) (default: 1 day)
    const expiresIn: number = typeof scrapped.expires_in === "number" ? scrapped.expires_in : 864000;
    return {
      value: scrapped.skypetoken,
      expirationDate: new Date(startTime + expiresIn * 1000),
    };
  } catch (_err) {
    const err: getSkypeTokenErrors.GetSkypeTokenError.Cause = _err;
    switch (err.name) {
      case httpErrors.RequestError.name:
      case getSkypeTokenErrors.SkypeTokenNotFoundError.name:
        throw getSkypeTokenErrors.GetSkypeTokenError.create(err);
      default:
        throw _err;
    }
  }
}

export async function requestSkypeToken(options: GetSkypeTokenOptions): Promise<io.Response> {
  const url: string = urlParser.resolve(skypeLoginUri, "microsoft");

  const queryString: { [key: string]: string } = {
    client_id: "578134",
    redirect_uri: "https://web.skype.com",
  };

  const formData: { [key: string]: string } = {
    t: options.liveToken,
    client_id: "578134",
    oauthPartner: "999",
    site_name: "lw.skype.com",
    redirect_uri: "https://web.skype.com",
  };

  const postOptions: io.PostOptions = {
    url,
    queryString,
    form: formData,
    proxy: options.proxy,
  };

  try {
    return options.httpIo.post(postOptions);
  } catch (err) {
    throw httpErrors.RequestError.create(err, postOptions);
  }
}

export interface SkypeTokenResponse {
  skypetoken: string;
  expires_in: number | undefined;
}

/**
 * Scrap to get the Skype OAuth token
 *
 * @param html
 * @returns {string}
 */
export function scrapSkypeTokenResponse(html: string): SkypeTokenResponse {
  // TODO(demurgos): Handle .load errors (invalid HTML)
  const $: cheerio.Root = cheerio.load(html);
  const skypeTokenNode: cheerio.Cheerio = $("input[name=skypetoken]");
  // In seconds
  const expiresInNode: cheerio.Cheerio = $("input[name=expires_in]");

  const skypeToken: string | undefined = skypeTokenNode.val();
  const expiresIn: number | undefined = parseInt(expiresInNode.val(), 10);

  if (typeof skypeToken !== "string") {
    getSkypeTokenErrors.SkypeTokenNotFoundError.create(html);
  }

  // if (!skypetoken || !expires_in) {
  //   const skypeErrorMessage = $(".message_error").text();
  //   const errorName = "authentication-failed";
  //   const errorMessage = "Failed to get skypetoken. Username or password is incorrect OR you've hit a CAPTCHA wall.";
  //   if (skypeErrorMessage) {
  //     const skypeError = new Incident("skype-error", skypeErrorMessage);
  //     throw new Incident(skypeError, errorName, errorMessage);
  //   } else {
  //     throw new Incident(errorName, errorMessage);
  //   }
  // }
  // return result;

  return {
    skypetoken: skypeToken,
    expires_in: expiresIn,
  };
}
