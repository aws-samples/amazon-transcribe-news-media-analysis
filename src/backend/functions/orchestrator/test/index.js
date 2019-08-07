const {assert} = require('chai');
const mockedEnv = require('mocked-env');
const rewire = require('rewire');
const sinon = require('sinon');

const index = rewire('../index');

describe('index.js', () => {

    describe('handler', () => {
        let restore;

        before(() => {
            restore = mockedEnv({
                AWS_REGION: 'eu-west-1',
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            }, { clear: true })
        });


        const handlerStub = sinon.stub().returns(() => {});
        const revertHandler = index.__set__('handler', handlerStub);

        it('should call the handler with dependencies', () => {
            index.handler({}, {});
            sinon.assert.calledWith(handlerStub, index.__get__('ecs'), index.__get__('ddb'), {
                AWS_REGION: 'eu-west-1',
                TASKS_TABLE_NAME: 'MediaAnalysisTasks',
                CLUSTER: 'MyCluster',
                TASK_NAME: 'transcriber',
                SUBNETS: 'subnet1, subnet2',
            });
            revertHandler();
        });

        after(() => restore())
    });
});