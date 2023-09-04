## Amazon Transcribe News Media Analysis

Transcribe video in realtime

> **Note** 
This repository is archived and this code is not maintained anymore.

This solution allows you to create transcriptions of live streaming video using AWS Transcribe. The application 
consists of a Web UI where the user may submit URLs of videos for processing, which in turn creates an ECS task per URL
running in Fargate to begin the transcription. A user can then view the video and follow the text in real time by 
clicking on the link provided by the UI. 

### Architecture

The Transcribe News Media Analysis uses:
* [Amazon Transcribe](https://aws.amazon.com/transcribe) for transcribing audio to text
* [AWS Lambda](https://aws.amazon.com/lambda) and [Amazon ECS](https://aws.amazon.com/ecs) for computing
* [Amazon DynamoDB](https://aws.amazon.com/dynamodb) for storage
* [Amazon API Gateway](https://aws.amazon.com/api-gateway) and [Amazon Cognito](https://aws.amazon.com/cognito) for the API
* [Amazon S3](https://aws.amazon.com/s3), [AWS Amplify](https://aws.amazon.com/amplify), and [React](https://reactjs.org) for the front-end layer

An overview of the architecture is below:

![Architecture](docs/arch_diagram.png)

## License

This sample code is made available under a modified MIT license. See the LICENSE file.
