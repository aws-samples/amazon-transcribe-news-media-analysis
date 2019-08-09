package com.amazonaws.transcriber;

import com.google.common.collect.ImmutableMap;
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
        writeTranscriptionStatus(ImmutableMap.of("TaskStatus", "PROCESSING"));
    }

    void transcriptionTerminated() {
        writeTranscriptionStatus(ImmutableMap.of("TaskStatus", "TERMINATED"));
    }

    void transcriptionErrored(String error) {
        writeTranscriptionStatus(ImmutableMap.of("TaskStatus", "ERROR", "ErrorMessage", error));
    }

    private void writeTranscriptionStatus(Map<String, String> items) {
        logger.debug("Writing task status to DynamoDb...");
        UpdateItemRequest request = UpdateItemRequest.builder()
            .tableName(this.ddbTableName)
            .key(toKey(mediaUrl))
            .attributeUpdates(toAttributeUpdates(items))
            .build();
        client.updateItem(request);
        logger.debug("Task " + items.get("TaskStatus") + " status written to DynamoDb...");
    }

    private Map<String, AttributeValueUpdate> toAttributeUpdates(Map<String, String> items) {
        Map<String,AttributeValueUpdate> itemValues = new HashMap<>();

        items.forEach((k, v) -> {
            itemValues.put(k, AttributeValueUpdate.builder()
                .value(AttributeValue.builder().s(v).build())
                .action(AttributeAction.PUT)
                .build());
        });

        return itemValues;
    }

    private Map<String, AttributeValue> toKey(String key) {
        Map<String,AttributeValue> keyValues = new HashMap<>();

        keyValues.put("MediaUrl", AttributeValue.builder().s(key).build());

        return keyValues;
    }
}
