package com.amazonaws.transcriber;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

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

    void transcriptionTerminated() {
        writeTranscriptionStatus("TERMINATED");
    }

    private void writeTranscriptionStatus(String status) {
        logger.debug("Writing task status to DynamoDb...");
        UpdateItemRequest request = UpdateItemRequest.builder()
            .tableName(this.ddbTableName)
            .key(toKey(mediaUrl))
            .attributeUpdates(toAttributeUpdates(status))
            .build();
        client.updateItem(request);
        logger.debug("Task " + status + " status written to DynamoDb...");
    }

    private Map<String, AttributeValueUpdate> toAttributeUpdates(String status) {
        Map<String,AttributeValueUpdate> itemValues = new HashMap<>();

        itemValues.put("TaskStatus", AttributeValueUpdate.builder()
            .value(AttributeValue.builder().s(status).build())
            .action(AttributeAction.PUT)
            .build());

        return itemValues;
    }

    private Map<String, AttributeValue> toKey(String key) {
        Map<String,AttributeValue> keyValues = new HashMap<>();

        keyValues.put("MediaUrl", AttributeValue.builder().s(key).build());

        return keyValues;
    }
}
