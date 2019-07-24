package com.amazonaws.transcriber;

import kong.unirest.Unirest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

public class LifecycleInfoPersister {

    private static final String metadataEndpoint = "http://169.254.170.2/v3/metadata";
    private DynamoDbClient client = DynamoDbManager.getClient();

    public void beginProcessing() {

    }

}
