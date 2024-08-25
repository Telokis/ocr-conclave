import dotenv from "dotenv";

dotenv.config();

export const PROJECT_ID = process.env.PROJECT_ID;
export const LOCATION = process.env.LOCATION;
export const PROCESSOR_ID = process.env.PROCESSOR_ID;
export const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE;

export const GDOC_OAUTH_APP_CREDENIALS = process.env.GDOC_OAUTH_APP_CREDENIALS;
export const GDOC_CLIENT_EMAIL = process.env.GDOC_CLIENT_EMAIL;
export const GDOC_PRIVATE_KEY = process.env.GDOC_PRIVATE_KEY;
export const GDOC_SCOPES = process.env.GDOC_SCOPES;
