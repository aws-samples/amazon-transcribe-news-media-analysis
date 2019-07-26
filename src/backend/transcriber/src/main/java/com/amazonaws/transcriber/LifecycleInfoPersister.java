package com.amazonaws.transcriber;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.util.HashMap;
import java.util.Map;

class LifecycleInfoPersister {

    private static final Logger logger = LogManager.getLogger(LifecycleInfoPersister.class);

    private DynamoDbClient client = DynamoDbManager.getClient();
    private TranscriberConfig config = TranscriberConfig.getInstance();
    private String ddbTableName = config.tasksDynamoDbTable();

    private String mediaUrl;

    LifecycleInfoPersister(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    void transcriptionBegun() {
        writeTranscriptionStatus("PROCESSING");
    }

    void transcriptionTerminating() {
        writeTranscriptionStatus("TERMINATING");
    }

    private void writeTranscriptionStatus(String status) {
        logger.debug("Writing task status to DynamoDb...");
        PutItemRequest request = PutItemRequest.builder()
            .tableName(this.ddbTableName)
            .item(toDynamoDbItem(mediaUrl, status))
            .build();
        client.putItem(request);
        logger.debug("Task " + status + " status written to DynamoDb...");
    }

    private Map<String, AttributeValue> toDynamoDbItem(String mediaUrl, String status) {
        Map<String,AttributeValue> itemValues = new HashMap<>();

        itemValues.put("MediaUrl", AttributeValue.builder().s(mediaUrl).build());
        itemValues.put("TaskStatus", AttributeValue.builder().s(status).build());

        return itemValues;
    }

}
