const {assert} = require('chai');
const rewire = require('rewire');
const sinon = require('sinon');

const index = rewire('../../lib');

const waitingEvent = require('../fixtures/waiting_ddb_event.json');

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

    describe('convertEnvVars', () => {
        const convertEnvVars = index.__get__('convertEnvVars');

        it('should convert environment variables to parameters waiting function options', () => {
            const input = {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            };

            const expected = {
                tasksTableName: 'MediaAnalysisTasks',
                cluster: 'MyCluster',
                taskName: 'transcriber',
                subnets: ['subnet1', 'subnet2']
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

            const putStub = sinon.stub().returns({promise: () => Promise.resolve('yay')});

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

            const expectedPutParams = {
                TableName: 'MediaAnalysisTasks',
                Item: {
                    MediaUrl: 'https://foo.bar/foo',
                    TaskArn: 'taskArn',
                    TaskStatus: 'INITIALIZING'
                }
            };

            const handler = index({runTask: runTaskStub}, {put: putStub}, {
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });

            return handler(waitingEvent, {})
                .then(() => {
                    sinon.assert.calledWith(runTaskStub, expectedTaskParams);
                    sinon.assert.calledWith(putStub, expectedPutParams);
                })
        });

    });

});
