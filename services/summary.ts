import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// AWS region
const AWS_REGION_BEDROCK = 'us-east-1';

// create a client for interacting with the Bedrock service.
const client = new BedrockRuntimeClient({ region: AWS_REGION_BEDROCK });

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  if (event.body) {
    const parsedBody = JSON.parse(event.body);
    const numberOfPoints = event.queryStringParameters?.points;

    // check that request body and query param exist and are not null or undefined.
    if (parsedBody.text && numberOfPoints) {
      const text = parsedBody.text;
      const titanConfig = getTitanConfig(text, numberOfPoints);

      const response = await client.send(
        new InvokeModelCommand({
          modelId: 'amazon.titan-text-express-v1',
          body: JSON.stringify(titanConfig),
          accept: 'application/json',
          contentType: 'application/json',
        })
      );

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('responseBody', responseBody);
      const firstResult = responseBody.results[0];
      if (firstResult && firstResult.outputText) {
        return {
          statusCode: 200,
          body: JSON.stringify({ summary: firstResult.outputText }),
        };
      }
    }
  }

  return {
    statusCode: 400, // Bad Request - client error
    body: JSON.stringify({ message: 'Invalid request' }),
  };
}

// function to return the prompt.
function getTitanConfig(text: string, points: string) {
  const prompt = `Text: ${text}\\n
        From the text above, summarize the story in ${points} points.\\n
    `;

  return {
    inputText: prompt,
    // model configurations
    textGenerationConfig: {
      maxTokenCount: 4096,
      stopSequences: [],
      temperature: 0.5,
      topP: 1,
    },
  };
}
