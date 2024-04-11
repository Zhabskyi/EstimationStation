import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudFront from "aws-cdk-lib/aws-cloudfront";

import { Construct } from "constructs";

import appConfig from "./app.config.json";

const appName = `${appConfig.appName}`;

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Add S3 Bucket
    const s3Site = new s3.Bucket(this, `${appConfig.context}-${appConfig.appName}-bucket`, {
      bucketName: `${appConfig.context}-${appConfig.appName}-s3-bucket`,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
    });
    this.enableCorsOnBucket(s3Site);

    // Create a new CloudFront Distribution
    const distribution = new cloudFront.CloudFrontWebDistribution(
      this,
      `${appConfig.context}-${appConfig.appName}-cf-distribution`,
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: s3Site,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                compress: true,
                allowedMethods: cloudFront.CloudFrontAllowedMethods.ALL,
                cachedMethods: cloudFront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
                forwardedValues: {
                  queryString: true,
                  cookies: {
                    forward: "none",
                  },
                  headers: ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"],
                },
              },
            ],
          },
        ],
        comment: `estimation station - CloudFront Distribution`,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    );

    // Setup Bucket Deployment to automatically deploy new assets and invalidate cache
    new s3deploy.BucketDeployment(this, `${appConfig.context}-${appConfig.appName}--s3bucket-deployment`, {
      sources: [s3deploy.Source.asset("../build")],
      destinationBucket: s3Site,
      distribution: distribution,
      distributionPaths: ["/*"],
    });

    // Final CloudFront URL
    new cdk.CfnOutput(this, "CloudFront URL", {
      value: distribution.distributionDomainName,
    });
  }

  enableCorsOnBucket = (bucket: s3.IBucket) => {
    const cfnBucket = bucket.node.findChild("Resource") as s3.CfnBucket;
    cfnBucket.addPropertyOverride("CorsConfiguration", {
      CorsRules: [
        {
          AllowedOrigins: ["*"],
          AllowedMethods: ["HEAD", "GET", "PUT", "POST", "DELETE"],
          ExposedHeaders: ["x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"],
          AllowedHeaders: ["*"],
        },
      ],
    });
  };
}
