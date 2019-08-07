const AWS = require('aws-sdk');
const R = require('ramda');
const converter = AWS.DynamoDB.Converter;

// snakeToCamel :: String -> String
const snakeToCamel = R.replace(/([_][a-z])/g, R.compose(R.replace('_', ''), R.toUpper));

function noop() {}

// convertEnvVars :: {k: v} -> {k: v}
const convertEnvVars = R.pipe(
    R.toPairs,
    R.map(R.adjust(0, R.compose(snakeToCamel, R.toLower))),
    R.fromPairs,
    R.evolve({subnets: subnets => [...subnets.split(',').map(R.trim)]})
);

// startTranscription :: AWS.ECS -> AWS.DDB -> Promise {k: v}
const startTranscription = R.curry((ecs, ddb, options) => {
   const params = {
      taskDefinition: options.taskName,
      cluster: options.cluster,
      launchType: 'FARGATE',
      networkConfiguration: {
         awsvpcConfiguration: {
            subnets: options.subnets,
            assignPublicIp: 'DISABLED'
         }
      },
      overrides: {
         containerOverrides: [
            {
               name: 'transcriber',
               environment: [
                  {
                     name: 'MEDIA_URL',
                     value: options.mediaUrl
                  }
               ]
            }
         ]
      }
   };

   return ecs.runTask(params)
       .promise()
       .then(({tasks}) => {
         return ddb.put({
            TableName: options.tasksTableName,
            Item: {
               MediaUrl: options.mediaUrl,
               TaskArn: tasks[0].taskArn,
               TaskStatus: 'INITIALIZING'
            }
         }).promise()
   });
});

// waiting :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> String -> Promise {k:v}
const waiting = R.curry((ecs, ddb, env, mediaUrl) =>
    R.compose(startTranscription(ecs, ddb), R.mergeRight({mediaUrl}), convertEnvVars)(env)
);

function terminating(ecs, ddb) {}

function error(ecs, ddb) {}

// handler :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> ({k: v} -> {k: v} -> Promise {k: v})
module.exports = (ecs, ddb, env) => {
   const handlers = {
      WAITING: waiting(ecs, ddb),
      INITIALIZING: noop,
      PROCESSING: noop,
      TERMINATING: terminating,
      ERROR: error
   };

   return (event, context) => {
      const promises = R.map(record => {
         const {TaskStatus, MediaUrl} = converter.unmarshall(R.path(['dynamodb', 'NewImage'], record));
         return handlers[TaskStatus](env, MediaUrl);
      }, event.Records);

      return Promise.all(promises);
   };
};
