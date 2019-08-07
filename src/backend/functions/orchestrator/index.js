const AWS = require('aws-sdk');
const ecs = new AWS.ECS({region: process.env.AWS_REGION});
const ddb = new AWS.DynamoDB.DocumentClient({region: process.env.AWS_REGION});

const handler = require('./lib');

exports.handler = function (event, context) {
    // need to invoke lazily or else can't mock handler
    return handler(ecs, ddb, process.env)(event, context);
};