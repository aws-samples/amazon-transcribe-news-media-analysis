package com.amazonaws.transcriber;

import org.apache.logging.log4j.LogManager;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.transcribestreaming.model.Result;

import java.util.HashMap;
import java.util.Map;

/**
 * TranscribedSegmentWriter writes the transcript segments to DynamoDB
 *
 * <p>Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.</p>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 * <p>
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
public class TranscribedSegmentWriter {
    private static final org.apache.logging.log4j.Logger logger = LogManager.getLogger(TranscribedSegmentWriter.class);

    private DynamoDbClient ddbClient;
    private String ddbTableName;
    private String mediaUrl;


    public TranscribedSegmentWriter(DynamoDbClient ddbClient, String ddbTableName, String mediaUrl) {
        this.ddbClient = ddbClient;
        this.ddbTableName = ddbTableName;
        this.mediaUrl = mediaUrl;
    }

    public DynamoDbClient getDdbClient() {

        return this.ddbClient;
    }

    public void writeToDynamoDB(long responseTime, String transcript, Result result) {
        PutItemRequest request = PutItemRequest.builder()
            .tableName(this.ddbTableName)
            .item(toDynamoDbItem(responseTime, transcript, result))
            .build();

        ddbClient.putItem(request);
//
//        return this.ddbClient.putItem(request).whenComplete((res, ex) -> {
//            if (ex != null) logger.error(ex);
//        });
    }

    private Map<String,AttributeValue> toDynamoDbItem(long responseTime, String transcript, Result result) {

        Map<String,AttributeValue> itemValues = new HashMap<>();

        itemValues.put("MediaUrl", AttributeValue.builder().s(mediaUrl).build());
        itemValues.put("ResultId", AttributeValue.builder().s(result.resultId()).build());
        itemValues.put("FragmentTimestamp", AttributeValue.builder().n(Long.toString(responseTime)).build());
        itemValues.put("Transcript", AttributeValue.builder().s(transcript).build());
        itemValues.put("IsPartial", AttributeValue.builder().bool(result.isPartial()).build());

        return itemValues;
    }
}

