import got from "got";
import { OptionsOfDefaultResponseBody } from "got/dist/source/create";
import toughCookie from "tough-cookie";
import * as io from "./interfaces/http-io";
import tunnel from "tunnel";

/**
 * Converts implementation-independant IO options to the concrete
 * options used by the `request` library.
 *
 * @param ioOptions Implementation independent IO options
 * @returns {request.Options} Corresponding `request` options
 */
function asRequestOptions(ioOptions: io.GetOptions | io.PostOptions | io.PutOptions
  | io.DeleteOptions): OptionsOfDefaultResponseBody {
  const result: OptionsOfDefaultResponseBody = {...<any> ioOptions};
  if (ioOptions.queryString !== undefined) {
    delete (result as any).queryString;
    result.searchParams = ioOptions.queryString;
  }
  if (ioOptions.cookies !== undefined) {
    delete (result as any).cookies;
    result.cookieJar = new toughCookie.CookieJar(ioOptions.cookies);
  }
  if (ioOptions.proxy !== undefined) {
    delete (result as any).proxy;
    const parts = ioOptions.proxy.split(":");
    result.agent = tunnel.httpOverHttp({ proxy: {
      host: parts[0],
      port: Number(parts[1]),
    }});
  }
  return result;
}

/**
 * Send a GET request
 *
 * @param options
 */
export async function get(options: io.GetOptions): Promise<io.Response> {
  try {
    const params = asRequestOptions(options);
    params.method = "GET";
    const ret = await got(params);
    if (ret.statusCode === undefined) {
      throw new Error("Missing status code");
    }
    return {
      body: ret.body,
      headers: ret.headers,
      statusCode: ret.statusCode,
    };
  } catch (err) {
    throw err.response || err;
  }
}

/**
 * Send a POST request
 *
 * @param options
 */
export async function post(options: io.PostOptions): Promise<io.Response> {
  try {
    const params = asRequestOptions(options);
    params.method = "POST";
    const ret = await got(params);
    if (ret.statusCode === undefined) {
      throw new Error("Missing status code");
    }
    return {
      body: ret.body,
      headers: ret.headers,
      statusCode: ret.statusCode,
    };
  } catch (err) {
    throw err.response || err;
  }
}

/**
 * Send a PUT request
 *
 * @param options
 */
export async function put(options: io.PutOptions): Promise<io.Response> {
  try {
    const params = asRequestOptions(options);
    params.method = "PUT";
    const ret = await got(params);
    if (ret.statusCode === undefined) {
      throw new Error("Missing status code");
    }
    return {
      body: ret.body,
      headers: ret.headers,
      statusCode: ret.statusCode,
    };
  } catch (err) {
    throw err.response || err;
  }
}

/**
 * Send a DELETE request
 *
 * @param options
 */
export async function del(options: io.DeleteOptions): Promise<io.Response> {
  try {
    const params = asRequestOptions(options);
    params.method = "DELETE";
    const ret = await got(params);
    if (ret.statusCode === undefined) {
      throw new Error("Missing status code");
    }
    return {
      body: ret.body,
      headers: ret.headers,
      statusCode: ret.statusCode,
    };
  } catch (err) {
    throw err.response || err;
  }
}

export const requestIo: io.HttpIo = {
  get,
  post,
  put,
  del,
};
