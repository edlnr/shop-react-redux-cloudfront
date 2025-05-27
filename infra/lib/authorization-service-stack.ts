import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeJsLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { Construct } from "constructs";
import { CLOUDFRONT_URL } from "../constants/constants";

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizerLambdaArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envConfig = {
      USERNAME: process.env.USERNAME || "",
      PASSWORD: process.env.PASSWORD || "",
    };

    const basicAuthorizerLambda = new nodeJsLambda.NodejsFunction(
      this,
      "basic-authorizer-lambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          "../authorization-service/src/functions/basicAuthorizer/basicAuthorizer.ts"
        ),
        handler: "handler",
        environment: {
          ...envConfig,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
        },
      }
    );

    this.basicAuthorizerLambdaArn = basicAuthorizerLambda.functionArn;

    new cdk.CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: this.basicAuthorizerLambdaArn,
      description: "ARN of the Basic Authorizer Lambda",
      exportName: "BasicAuthorizerLambdaArn",
    });
  }
}
