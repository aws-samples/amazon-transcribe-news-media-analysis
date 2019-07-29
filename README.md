## Amazon Transcribe News Media Analysis

Transcribe news audio in realtime.

> Warning: This project is currently being developed and the code shouldn't be used in production.

[![Build Status](https://travis-ci.org/aws-samples/amazon-transcribe-news-media-analysis.svg?branch=master)](https://travis-ci.org/aws-samples/amazon-transcribe-news-media-analysis)


### Transcriber

To run the Transciber as a standalone application run the following shell commands:

```bash
cd /src/backend/transcriber

docker build -t transcriber .

docker run
--env AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
--env AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
--env TRANSCRIPTS_DYNAMO_DB_TABLE=MediaAnalysisTranscript
--env LOG_LEVEL=INFO
--env AWS_REGION=${AWS_REGION}
--env TASKS_DYNAMO_DB_TABLE=MediaAnalysisTasks
--env MEDIA_URL=${MEDIA_URL}
transcriber java -jar -Dlog4j.configurationFile=log4j2.xml /transcriber.jar
```

## License

This library is licensed under the MIT-0 License. 
