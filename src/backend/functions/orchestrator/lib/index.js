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

// handle :: ({k: v} -> Promise {k:v}) -> ({k:v} -> {k: v}) -> {k: v} -> {k: v} -> Promise {k: v}
const handle = R.curry((action, imageFn, env, image) =>
    R.compose(action, R.mergeRight(imageFn(image)), convertEnvVars)(env)
);

const stopTranscription = R.curry((ecs, {mediaUrl, cluster, task, tasksTableName}) => {
   return ecs.stopTask({cluster, task})
       .promise()
       .then(() => ({mediaUrl, tasksTableName}));
});

// startTranscription :: AWS.ECS -> {k: v} -> Promise {k: v}
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

const createUpdateParams = R.curry(({tasksTableName, mediaUrl, taskArn}) => {
   return {
      TableName: tasksTableName,
      Key: {
         MediaUrl: mediaUrl
      },
      UpdateExpression: 'SET TaskStatus = :status, TaskArn = :task',
      ExpressionAttributeValues: {
         ':status':  'INITIALIZING',
         ':task': taskArn
      },
      ReturnValues: 'ALL_NEW'
   }
});

// waiting :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> String -> Promise {k:v}
const waiting = R.curry((ecs, updateItem) =>
    handle(composeP(updateItem, createUpdateParams, startTranscription(ecs)), ({MediaUrl: mediaUrl}) => ({mediaUrl}))
);

// terminating :: AWS.ECS -> {k: v} -> String -> Promise {k:v}
const terminating = R.curry(ecs =>
   handle(stopTranscription(ecs), ({TaskArn: task}) => ({task}))
);

function createDeleteParams({mediaUrl, tasksTableName}) {
   return {
      TableName: tasksTableName,
      Key: {
         MediaUrl: mediaUrl
      }
   };
}

// terminated :: ({k:v} -> Promise {k: v}) -> {k: v} -> {k: v} -> Promise {k:v}
const terminated = R.curry(deleteItem =>
   handle(o(deleteItem, createDeleteParams), ({MediaUrl: mediaUrl}) => ({mediaUrl}))
);

const errorUpdate = R.curry((updateItem, {tasksTableName, mediaUrl, taskArn}) => {
   const params = {
      TableName: tasksTableName,
      Key: {
         MediaUrl: mediaUrl
      },
      UpdateExpression: 'ADD Retries :val SET TaskStatus = :status, TaskArn = :task',
      ExpressionAttributeValues: {
         ':val': 1,
         ':status':  'WAITING',
         ':task': taskArn
      },
      ReturnValues: 'ALL_NEW'
   };

   return updateItem(params)
       .then(({Attributes}) => ({...Attributes, tasksTableName}))
});

const unrecoverableError = R.curry((updateItem, {tasksTableName, MediaUrl}) => {
   const params = {
      TableName: tasksTableName,
      Key: {
         MediaUrl: MediaUrl
      },
      UpdateExpression: 'SET TaskStatus = :status',
      ExpressionAttributeValues: {
         ':status':  'UNRECOVERABLE_ERROR'
      },
      ReturnValues: 'ALL_NEW'
   };

   return updateItem(params);
});

// error :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> {k: v} -> Promise {k:v}
const error = R.curry((ecs, updateItem) =>
    handle(composeP(errorUpdate(updateItem), startTranscription(ecs)), ({MediaUrl: mediaUrl}) => ({mediaUrl}))
);

// handler :: AWS.ECS -> AWS.DynamoDB -> {k: v} -> ({k: v} -> {k: v} -> Promise {k: v})
module.exports = (ecs, ddb, env) => {
   const update = params => ddb.update(params).promise();

   const handlers = {
      WAITING: waiting(ecs, update),
      INITIALIZING: noop,
      PROCESSING: noop,
      TERMINATING: terminating(ecs),
      TERMINATED: terminated(params => ddb.delete(params).promise()),
      ERROR: error(ecs, update),
      UNRECOVERABLE_ERROR: noop
   };

   return event => {

      const promises = R.map(record => {
         const image = converter.unmarshall(R.path(['dynamodb', 'NewImage'], record));
         const {MediaUrl, Retries, TaskStatus} = image;
         const {TASKS_TABLE_NAME: tasksTableName} = env;

         console.log('Status: ' + TaskStatus);

         if(R.defaultTo(0, Retries) > parseInt(env.RETRY_THRESHOLD)) {
            console.log('Error threshold exceeded');
            return unrecoverableError(update, {MediaUrl, tasksTableName});
         }

         const handler = R.defaultTo(noop, handlers[TaskStatus]);
         return handler(env, image).catch(err => {
            const e = new Error(err.message);
            e.mediaUrl = MediaUrl;
            e.tasksTableName = tasksTableName;
            return e;
         });
      }, event.Records);

      return Promise.all(promises)
          .then(R.filter(x => x.name === 'Error'))
          .then(R.forEach(err => update({
             TableName: err.tasksTableName,
             Key: {
                MediaUrl: err.mediaUrl
             },
             UpdateExpression: 'SET TaskStatus = :status',
             ExpressionAttributeValues: {
                ':status':  'ERROR'
             },
             ReturnValues: 'ALL_NEW'
          })))
          // this is temporary but important to remember that any uncaught DynamoDb stream errors block
          // the queue for 24 hrs
          .catch(x => console.log(x));
   };
};
