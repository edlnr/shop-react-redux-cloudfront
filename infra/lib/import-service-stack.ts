import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeJsLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as path from "path";
import { Construct } from "constructs";
import { CLOUDFRONT_URL } from "../constants/constants";

const UPLOADED_PREFIX = "uploaded/";
const PARSED_PREFIX = "parsed/";

export interface ImportServiceStackProps extends cdk.StackProps {
  catalogItemsQueue: sqs.Queue;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const importServiceBucket = new s3.Bucket(this, "ImportServiceBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [CLOUDFRONT_URL],
          allowedHeaders: ["Content-Type"],
          maxAge: 3000,
        },
      ],
    });

    new cdk.CfnOutput(this, "ImportServiceBucketName", {
      value: importServiceBucket.bucketName,
      description: "Name of the S3 bucket for imports",
    });

    const importProductsFileLambda = new nodeJsLambda.NodejsFunction(
      this,
      "ImportProductsFileLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(
          __dirname,
          "../product-service/src/functions/importProductsFile/importProductsFile.ts"
        ),
        handler: "handler",
        environment: {
          IMPORT_SERVICE_BUCKET_NAME: importServiceBucket.bucketName,
          UPLOADED_PREFIX: UPLOADED_PREFIX,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
        },
      }
    );

    importServiceBucket.grantPut(
      importProductsFileLambda,
      `${UPLOADED_PREFIX}*`
    );

    const api = new apiGateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service API",
      description: "API for CSV import service.",
      defaultCorsPreflightOptions: {
        allowOrigins: [CLOUDFRONT_URL],
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: apiGateway.Cors.DEFAULT_HEADERS,
      },
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apiGateway.LambdaIntegration(importProductsFileLambda),
      {}
    );

    new cdk.CfnOutput(this, "ImportServiceApiUrl", {
      value: `${api.url}import`,
      description: "URL for the Import API Gateway",
      exportName: "ImportServiceApiEndpoint",
    });

    const importFileParserLambda = new nodeJsLambda.NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(
          __dirname,
          "../product-service/src/functions/importFileParser/importFileParser.ts"
        ),
        handler: "handler",
        environment: {
          IMPORT_SERVICE_BUCKET_NAME: importServiceBucket.bucketName,
          UPLOADED_PREFIX: UPLOADED_PREFIX,
          PARSED_PREFIX: PARSED_PREFIX,
          CLOUDFRONT_URL: CLOUDFRONT_URL,
          CATALOG_ITEMS_QUEUE_URL: props.catalogItemsQueue.queueUrl,
        },
        timeout: cdk.Duration.seconds(60),
      }
    );

    importServiceBucket.grantRead(
      importFileParserLambda,
      `${UPLOADED_PREFIX}*`
    );
    importServiceBucket.grantPut(importFileParserLambda, `${PARSED_PREFIX}*`);
    importServiceBucket.grantDelete(
      importFileParserLambda,
      `${UPLOADED_PREFIX}*`
    );

    importServiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: UPLOADED_PREFIX }
    );

    props.catalogItemsQueue.grantSendMessages(importFileParserLambda);
  }
}
