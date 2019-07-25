package com.amazonaws.transcriber;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

class DynamoDbManager {

    private static final DynamoDbClient client = DynamoDbClient.create();

    static DynamoDbClient getClient() {
        return client;
    }
}
