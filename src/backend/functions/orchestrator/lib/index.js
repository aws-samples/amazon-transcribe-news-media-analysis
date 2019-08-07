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

function createDeleteParams({mediaUrl, tasksTableName}) {
   return {
      TableName: tasksTableName,
      Key: {
         MediaUrl: mediaUrl
      }
   };
}

const stopTranscription = R.curry((ecs, {mediaUrl, cluster, task, tasksTableName}) => {
   return ecs.stopTask({cluster, task})
       .promise()
       .then(() => ({mediaUrl, tasksTableName}));
});

function createUpdateParams({tasksTableName, mediaUrl, taskArn}) {
   return {
      TableName: tasksTableName,
      Key: {
         MediaUrl: mediaUrl
      },
      AttributeUpdates: {
         TaskArn: {
            Action: 'PUT',
            Value: taskArn,
         },
         TaskStatus: {
            Action: 'PUT',
            Value: 'INITIALIZING'
         }
      }
   }
}

// startTranscription :: AWS.ECS -> AWS.DDB -> Promise {k: v}
const startTranscription = R.curry((ecs, {cluster, taskName, tasksTableName, mediaUrl, subnets}) => {
   const params = {
      taskDefinition: taskName,
      cluster: cluster,
      launchType: 'FARGATE',
      networkConfiguration: {
         awsvpcConfiguration: {
            subnets: subnets,
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
                     value: mediaUrl
                  }
               ]
            }
         ]
      }
   };

   return ecs.runTask(params)
       .promise()
       .then(({tasks}) => ({tasksTableName, mediaUrl, taskArn: tasks[0].taskArn}))
});

// waiting :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> String -> Promise {k:v}
const waiting = R.curry((ecs, updateItem, env, {MediaUrl: mediaUrl}) =>
    R.pipe(
        convertEnvVars,
        R.mergeRight({mediaUrl}),
        startTranscription(ecs),
        R.then(createUpdateParams),
        R.then(updateItem)
    )(env)
);

// terminating :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> String -> Promise {k:v}
const terminating = R.curry((ecs, deleteItem, env, {MediaUrl: mediaUrl, TaskArn: task}) =>
   R.pipe(
       convertEnvVars,
       R.mergeRight({task, mediaUrl}),
       stopTranscription(ecs),
       R.then(createDeleteParams),
       R.then(deleteItem)
   )(env)
);

function error(ecs, ddb) {}


// handler :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> ({k: v} -> {k: v} -> Promise {k: v})
module.exports = (ecs, ddb, env) => {
   const handlers = {
      WAITING: waiting(ecs, params => ddb.update(params).promise()),
      INITIALIZING: noop,
      PROCESSING: noop,
      TERMINATING: terminating(ecs, params => ddb.delete(params).promise()),
      ERROR: error
   };

   return (event, context) => {
      const promises = R.map(record => {
         const image = converter.unmarshall(R.path(['dynamodb', 'NewImage'], record));
         return handlers[image.TaskStatus](env, image);
      }, event.Records);

      return Promise.all(promises);
   };
};
