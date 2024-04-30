import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

import { Construct } from "constructs";

import appConfig from "./app.config.json";
import { BlockPublicAccess, BucketEncryption, IBucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Configuration } from "./configurations";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

const appName = `${appConfig.appName}`;

export class StationInfrastructureStack extends cdk.Stack {
  appConfig: Configuration;

  constructor(scope: Construct, id: string, appConfig: Configuration) {
    super(scope, id);

    this.appConfig = appConfig;

    // Add S3 Bucket
    const s3Site = new s3.Bucket(this, `${appConfig.context}-${appConfig.appName}-bucket`, {
      bucketName: `${appConfig.context}-${appConfig.appName}-s3-bucket`,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
    });

    s3Site.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:GetObject"],
        principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
        resources: [s3Site.bucketArn + "/*"],
        conditions: {
          StringLike: {
            //Only allow cloudfront distributions of the same account to read from bucket
            "AWS:SourceARN": [`arn:aws:cloudfront::${Stack.of(this).account}:distribution/*`],
          },
        },
      }),
    );

    // Setup Bucket Deployment to automatically deploy new assets and invalidate cache
    new s3deploy.BucketDeployment(this, `${appConfig.context}-${appConfig.appName}--s3bucket-deployment`, {
      sources: [s3deploy.Source.asset("../build")],
      destinationBucket: s3Site,
      destinationKeyPrefix: appConfig.appName,
      retainOnDelete: false,
    });

    this.storeDistributionDetails(s3Site);
  }

  storeDistributionDetails = (bucket: IBucket) => {
    const target = { pathPattern: this.appConfig.appName, bucketName: bucket.bucketName };
    const id = `${this.appConfig.appName}-param`;
    new StringParameter(this, id, {
      parameterName: id,
      stringValue: JSON.stringify(target),
      description: `This config for ${this.appConfig.appName}`,
      allowedPattern: ".*",
    });
  };
}
