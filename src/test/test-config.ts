import * as dotenv from "dotenv";
import { Credentials } from "../lib/interfaces/api/api";

dotenv.config();

export interface TestConfig {
  /**
   * Perform online tests (default: false)
   */
  online: boolean;

  credentials: Credentials;

  secondaryAccounts: Credentials[];

  verbose: boolean;
}

const online: boolean = process.env["OCILO_TEST_ONLINE"] === "true";
const verbose: boolean = process.env["OCILO_TEST_VERBOSE"] === "true";

const credentials: Credentials = {
  username: process.env.SKYPE_USERNAME || "",
  password: process.env.SKYPE_PASSWORD || "",
};

const secondaryAccounts: Credentials[] = [
  {
    username: process.env.SKYPE_USERNAME || "",
    password: process.env.SKYPE_PASSWORD || "",
  },
];

export const testConfig: TestConfig = {online, credentials, secondaryAccounts, verbose};
