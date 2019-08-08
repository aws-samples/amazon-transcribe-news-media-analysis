const AWS = require('aws-sdk');
const R = require('ramda');
const converter = AWS.DynamoDB.Converter;

// o is similar to R.compose but takes exactly two arguments
const {o} = R;

// compose that works on promise returning functions
const composeP = (...fns) => R.composeWith(R.then)(fns);

// snakeToCamel :: String -> String
const snakeToCamel = R.replace(/([_][a-z])/g, o(R.replace('_', ''), R.toUpper));

function noop() {}

// convertEnvVars :: {k: v} -> {k: v}
const convertEnvVars = R.pipe(
    R.toPairs,
    R.map(R.adjust(0, o(snakeToCamel, R.toLower))),
    R.fromPairs,
    R.evolve({subnets: subnets => [...subnets.split(',').map(R.trim)]})
);

const stopTranscription = R.curry((ecs, {mediaUrl, cluster, task, tasksTableName}) => {
   return ecs.stopTask({cluster, task})
       .promise()
       .then(() => ({mediaUrl, tasksTableName}));
});

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

// handle :: ({k: v} -> Promise {k:v}) -> ({k:v} -> {k: v}) -> {k: v} -> {k: v}
const handle = R.curry((action, imageFn, env, image) =>
    R.compose(action, R.mergeRight(imageFn(image)), convertEnvVars)(env)
);

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

// waiting :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> String -> Promise {k:v}
const waiting = R.curry((ecs, updateItem) =>
    handle(composeP(updateItem, createUpdateParams, startTranscription(ecs)), image => {
       const {MediaUrl: mediaUrl} = image;
       return {mediaUrl};
    })
);

// terminating :: AWS.ECS -> {k: v} -> String -> Promise {k:v}
const terminating = R.curry(ecs =>
   handle(stopTranscription(ecs), image => {
      const {TaskArn: task} = image;
      return {task};
   })
);

function createDeleteParams({mediaUrl, tasksTableName}) {
   return {
      TableName: tasksTableName,
      Key: {
         MediaUrl: mediaUrl
      }
   };
}

// terminated :: ({k:v} -> Promise {k: v}) -> {k: v} -> String -> Promise {k:v}
const terminated = R.curry(deleteItem =>
    handle(o(deleteItem, createDeleteParams), image => {
       const {MediaUrl: mediaUrl} = image;
       return {mediaUrl};
    })
);

function error(ecs, ddb) {}


// handler :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> ({k: v} -> {k: v} -> Promise {k: v})
module.exports = (ecs, ddb, env) => {
   const handlers = {
      WAITING: waiting(ecs, params => ddb.update(params).promise()),
      INITIALIZING: noop,
      PROCESSING: noop,
      TERMINATING: terminating(ecs),
      TERMINATED: terminated(params => ddb.delete(params).promise()),
      ERROR: error
   };

   return (event, context) => {
      const promises = R.map(record => {
         const image = converter.unmarshall(R.path(['dynamodb', 'NewImage'], record));
         const handler = R.defaultTo(noop, handlers[image.TaskStatus]);
         return handler(env, image);
      }, event.Records);

      return Promise.all(promises)
          // this is temporary but important to remember that any uncaught DynamoDb stream errors block
          // the queue for 24 hrs
          .catch(console.log);
   };
};
