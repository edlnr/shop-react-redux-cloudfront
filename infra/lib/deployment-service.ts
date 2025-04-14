import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_iam,
  aws_s3,
  aws_s3_deployment,
  CfnOutput,
  RemovalPolicy,
} from "aws-cdk-lib";
import { Construct } from "constructs";

const pathToFrontend = "./resources/build";

export class DeploymentService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const hostingBucket = new aws_s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new aws_cloudfront.Distribution(
      this,
      "FrontendDistribution",
      {
        defaultBehavior: {
          origin:
            aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
              hostingBucket
            ),
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    const bucketDeploymentRole = new aws_iam.Role(
      this,
      "BucketDeploymentRole",
      {
        assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      }
    );

    bucketDeploymentRole.addToPolicy(
      new aws_iam.PolicyStatement({
        actions: [
          "cloudfront:GetInvalidation",
          "cloudfront:CreateInvalidation",
        ],
        resources: ["*"],
      })
    );

    new aws_s3_deployment.BucketDeployment(this, "FrontendDeployment", {
      sources: [aws_s3_deployment.Source.asset(pathToFrontend)],
      destinationBucket: hostingBucket,
      distributionPaths: ["/*"],
      role: bucketDeploymentRole,
      distribution,
    });

    new CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "The distribution URL",
      exportName: "CloudFrontURL",
    });

    new CfnOutput(this, "S3BucketName", {
      value: hostingBucket.bucketName,
      description: "The S3 bucket name",
      exportName: "S3BucketName",
    });
  }
}
