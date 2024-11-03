import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { join } from 'path';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export class TextApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create a Lambda function to invoke Amazon Bedrock for text summarization
    const summaryLambda = new NodejsFunction(this, 'SummaryLambda', {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      handler: 'handler',
      entry: join(__dirname, '..', 'services', 'summary.ts'),
    });

    // grant the Lambda function permission to invoke Amazon Bedrock
    summaryLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      })
    );

    // create an API Gateway REST API
    const api = new RestApi(this, 'TextApi', {
      restApiName: 'Text API',
      description: 'This API allows you to summarize text using Amazon Bedrock',
    });

    const textResource = api.root.addResource('text');

    const summaryIntegration = new LambdaIntegration(summaryLambda);

    textResource.addMethod('POST', summaryIntegration);

    // output the URL of the API Gateway REST API
    new cdk.CfnOutput(this, 'TextApiUrl', {
      value: api.url,
    });
  }
}
