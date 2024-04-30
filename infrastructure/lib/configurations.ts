import { Environment } from "aws-cdk-lib";

export interface Configuration {
  readonly stageName: string;
  readonly vpcId: string;
  readonly providerArn: string;
  readonly env?: Environment;
  readonly appName: string;
  readonly context: string;
  readonly orgName?: string;
}
