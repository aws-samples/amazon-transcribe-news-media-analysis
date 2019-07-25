package com.amazonaws.transcriber;

import com.amazonaws.utils;
import kong.unirest.Unirest;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.util.HashMap;
import java.util.Map;

public class LifecycleInfoPersister {

    private static final Logger logger = LogManager.getLogger(LifecycleInfoPersister.class);

    private static final String METADATA_ENDPOINT = utils.requiredEnvVar("ECS_CONTAINER_METADATA_URI");
    private static final String TASK_METADATA_ENDPOINT = METADATA_ENDPOINT + "/task";

    private String taskArn;
    private DynamoDbClient client = DynamoDbManager.getClient();
    private TranscriberConfig config = TranscriberConfig.getInstance();
    private String ddbTableName = config.tasksDynamoDbTable();

    private String mediaUrl;

    LifecycleInfoPersister(String mediaUrl) {
        this.taskArn = Unirest
            .get(TASK_METADATA_ENDPOINT)
            .asJson()
            .getBody()
            .getObject()
            .getString("TaskARN");

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
            .item(toDynamoDbItem(mediaUrl, taskArn, status))
            .build();
        client.putItem(request);
        logger.debug("Task " + status + " status written to DynamoDb...");
    }

    private Map<String, AttributeValue> toDynamoDbItem(String mediaUrl, String taskArn, String status) {
        Map<String,AttributeValue> itemValues = new HashMap<>();

        itemValues.put("MediaUrl", AttributeValue.builder().s(mediaUrl).build());
        itemValues.put("TaskArn", AttributeValue.builder().s(taskArn).build());
        itemValues.put("TaskStatus", AttributeValue.builder().s(status).build());

        return itemValues;
    }

}
