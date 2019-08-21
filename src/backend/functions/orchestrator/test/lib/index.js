const {assert} = require('chai');
const rewire = require('rewire');
const sinon = require('sinon');

const index = rewire('../../lib');

const waitingEvent = require('../fixtures/waiting_ddb_event.json');
const errorEvent = require('../fixtures/error_ddb_event.json');
const retryEvent = require('../fixtures/retry_ddb_event.json');
const terminatingEvent = require('../fixtures/terminating_ddb_event.json');
const terminatedEvent = require('../fixtures/terminated_ddb_event.json');

describe('lib/index.js', () => {

    describe('snakeToCamel', () => {
        const snakeToCamel = index.__get__('snakeToCamel');

        it('should convert snake case to camel case', () => {
            assert.equal(snakeToCamel(''), '');
            assert.equal(snakeToCamel('not'), 'not');
            assert.equal(snakeToCamel('my_method'), 'myMethod');
            assert.equal(snakeToCamel('my_very_long_method'), 'myVeryLongMethod');
        });
    });

    describe('pascalToCamel', () => {
        const snakeToCamel = index.__get__('pascalToCamel');

        it('should convert pascal case to camel case', () => {
            assert.equal(snakeToCamel(''), '');
            assert.equal(snakeToCamel('not'), 'not');
            assert.equal(snakeToCamel('MyMethod'), 'myMethod');
        });
    });

    describe('convertEnvVars', () => {
        const convertEnvVars = index.__get__('convertEnvVars');

        it('should convert environment variables to parameters waiting function options', () => {
            const input = {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
                RETRY_THRESHOLD: '3'
            };

            const expected = {
                tasksTableName: 'MediaAnalysisTasks',
                cluster: 'MyCluster',
                taskName: 'transcriber',
                subnets: ['subnet1', 'subnet2'],
                retryThreshold: '3',
            };

            const actual = convertEnvVars(input);

            assert.deepEqual(actual, expected);
        });

    });

    describe('handler', () => {

        it('should start transcription when WAITING state received', () => {
            const runTaskStub = sinon.stub().returns({
                promise: () => Promise.resolve({
                    tasks: [{
                        taskArn: 'taskArn'
                    }]
                })
            });

            const updateStub = sinon.stub().returns({promise: () => Promise.resolve('yay')});

            const expectedTaskParams = {
                taskDefinition: 'transcriber',
                cluster:'MyCluster',
                launchType: 'FARGATE',
                networkConfiguration: {
                    awsvpcConfiguration: {
                        subnets: ['subnet1', 'subnet2'],
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
                                    value: 'https://foo.bar/foo'
                                }
                            ]
                        }
                    ]
                }
            };

            const expectedUpdateParams = {
                TableName: 'MediaAnalysisTasks',
                Key: {
                    MediaUrl: 'https://foo.bar/foo'
                },
                UpdateExpression: 'SET TaskStatus = :status, TaskArn = :task',
                ExpressionAttributeValues: {
                    ':status':  'INITIALIZING',
                    ':task': 'taskArn'
                },
                ReturnValues: 'ALL_NEW'
            };

            const handler = index({runTask: runTaskStub}, {update: updateStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
                RETRY_THRESHOLD: '3'
            });

            return handler(waitingEvent, {})
                .then(xs => {
                    sinon.assert.calledWith(runTaskStub, expectedTaskParams);
                    sinon.assert.calledWith(updateStub, expectedUpdateParams);
                })
        });

        it('should enter UNRECOVERABLE_ERROR state if start of transcription fails', () => {
            const runTaskStub = sinon.stub().returns({
                promise: () => Promise.reject(new Error('boo'))
            });

            const updateStub = sinon.stub().returns({promise: () => Promise.resolve('yay')});

            const expectedUpdateParams = {
                TableName: 'MediaAnalysisTasks',
                Key: {
                    MediaUrl: 'https://foo.bar/foo'
                },
                UpdateExpression: 'SET TaskStatus = :status',
                ExpressionAttributeValues: {
                    ':status':  'UNRECOVERABLE_ERROR'
                },
                ReturnValues: 'ALL_NEW'
            };

            const handler = index({runTask: runTaskStub}, {update: updateStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                RETRY_THRESHOLD: '3',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(waitingEvent, {})
                .then(() => {
                    sinon.assert.calledWith(updateStub, expectedUpdateParams);
                })
        });

        it('should enter UNRECOVERABLE_ERROR state if write to Dynamo fails after transcription begins', () => {
            const runTaskStub = sinon.stub().returns({
                promise: () => Promise.resolve({
                    tasks: [{
                        taskArn: 'taskArn'
                    }]
                })
            });

            const stopTaskStub = sinon.stub().returns({
                promise: () => Promise.resolve({
                    task: {
                        taskArn: 'taskArn'
                    }
                })
            });

            const updateStub = sinon.stub();

            updateStub.onCall(0).returns({promise: () => Promise.reject(new Error('boo'))});
            updateStub.onCall(1).returns({promise: () => Promise.resolve('yay')});

            const expectedUpdateParams = {
                TableName: 'MediaAnalysisTasks',
                Key: {
                    MediaUrl: 'https://foo.bar/foo'
                },
                UpdateExpression: 'SET TaskStatus = :status',
                ExpressionAttributeValues: {
                    ':status':  'UNRECOVERABLE_ERROR'
                },
                ReturnValues: 'ALL_NEW'
            };

            const expectedStopTaskParams = {
                task: 'taskArn',
                cluster: 'MyCluster'
            };

            const handler = index({runTask: runTaskStub, stopTask: stopTaskStub}, {update: updateStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                RETRY_THRESHOLD: '3',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(waitingEvent)
                .then(() => {
                    sinon.assert.calledWith(updateStub, expectedUpdateParams);
                    sinon.assert.calledWith(stopTaskStub, expectedStopTaskParams);
                })
        });

        it('should restart transcription when ERROR state received', () => {
            const runTaskStub = sinon.stub().returns({
                promise: () => Promise.resolve({
                    tasks: [{
                        taskArn: 'taskArn'
                    }]
                })
            });

            const updateStub = sinon.stub().returns({promise: () => Promise.resolve('yay')});

            const expectedTaskParams = {
                taskDefinition: 'transcriber',
                cluster:'MyCluster',
                launchType: 'FARGATE',
                networkConfiguration: {
                    awsvpcConfiguration: {
                        subnets: ['subnet1', 'subnet2'],
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
                                    value: 'https://foo.bar/foo'
                                }
                            ]
                        }
                    ]
                }
            };

            const expectedUpdateParams = {
                TableName: 'MediaAnalysisTasks',
                Key: {
                    MediaUrl: 'https://foo.bar/foo'
                },
                UpdateExpression: 'ADD Retries :val SET TaskStatus = :status, TaskArn = :task',
                ExpressionAttributeValues: {
                    ':val': 1,
                    ':status':  'WAITING',
                    ':task': 'taskArn'
                },
                ReturnValues: 'ALL_NEW'
            };

            const handler = index({runTask: runTaskStub}, {update: updateStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                RETRY_THRESHOLD: '3',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(errorEvent, {})
                .then(() => {
                    sinon.assert.calledWith(runTaskStub, expectedTaskParams);
                    sinon.assert.calledWith(updateStub, expectedUpdateParams);
                })
        });

        it('should not restart transcription when ERROR state received after 3 retries', () => {
            const runTaskStub = sinon.stub().returns({
                promise: () => Promise.resolve({
                    tasks: [{
                        taskArn: 'taskArn'
                    }]
                })
            });

            const updateStub = sinon.stub()
                .returns({promise: () => Promise.resolve({
                    Attributes: {
                        MediaDescription: 'desc',
                        TaskStatus: 'UNRECOVERABLE_ERROR',
                        MediaUrl: 'https://foo.bar/foo',
                        MediaTitle: 'title',
                        TaskArn: 'taskArn',
                        Retries: 3
                    }
                })});

            const expectedRetryParams = {
                TableName: 'MediaAnalysisTasks',
                Key: {
                    MediaUrl: 'https://foo.bar/foo'
                },
                UpdateExpression: 'SET TaskStatus = :status',
                ExpressionAttributeValues: {
                    ':status':  'UNRECOVERABLE_ERROR',
                },
                ReturnValues: 'ALL_NEW'
            };

            const handler = index({runTask: runTaskStub}, {update: updateStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                RETRY_THRESHOLD: '3',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(retryEvent, {})
                .then(() => sinon.assert.calledWith(updateStub, expectedRetryParams))
        });

        it('should stop transcription when TERMINATING state received', () => {
            const stopTaskStub = sinon.stub().returns({
                promise: () => Promise.resolve({
                    task: {
                        taskArn: 'taskArn'
                    }
                })
            });

            const expectedStopTaskParams = {
                task: 'taskArn',
                cluster:'MyCluster'
            };

            const handler = index({stopTask: stopTaskStub}, {}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                RETRY_THRESHOLD: 3,
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(terminatingEvent, {})
                .then(() => sinon.assert.calledWith(stopTaskStub, expectedStopTaskParams))
        });

        it('should remove DynamoDb item when TERMINATED state received', () => {
            const deleteStub = sinon.stub().returns({promise: () => Promise.resolve('yay')});

            const expectedDeleteParams = {
                TableName: 'MediaAnalysisTasks',
                Key: {
                    MediaUrl: 'https://foo.bar/foo',
                }
            };

            const handler = index({}, {delete: deleteStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                RETRY_THRESHOLD: 3,
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(terminatedEvent, {})
                .then(() => sinon.assert.calledWith(deleteStub, expectedDeleteParams))
        });

    });

});
