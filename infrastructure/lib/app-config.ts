import { Configuration } from "./configurations";
import appConfig from "./app.config.json";

const appName = appConfig.appName;
const context = appConfig.context;

const commonConfig = {
  appName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  context,
};

export const configurations: { [key: string]: Configuration } = {
  ["dev"]: {
    ...commonConfig,
    stageName: "dev",
  },
  ["prod"]: {
    ...commonConfig,
    stageName: "prod",
  },
};
