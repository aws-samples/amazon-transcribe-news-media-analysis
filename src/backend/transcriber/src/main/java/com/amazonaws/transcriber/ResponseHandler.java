/*
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
package com.amazonaws.transcriber;

import com.amazonaws.transcribestreaming.retryclient.StreamTranscriptionBehavior;
import com.amazonaws.utils;
import com.google.common.base.Strings;
import org.apache.commons.lang3.Validate;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.transcribestreaming.model.*;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;

import static com.google.common.base.Predicates.not;

public class ResponseHandler implements StreamTranscriptionBehavior {
    private static final Logger logger = LogManager.getLogger(ResponseHandler.class);

    private TranscriberConfig config = TranscriberConfig.getInstance();

    private final int DEBOUNCE_DURATION = config.debounceDuration();

    private long debounceTime;

    private String requestId;
    private String sessionId;
    private TranscribedSegmentWriter writer;

    private Instant responseTime;

    public ResponseHandler(String mediaUrl, AwsCredentialsProvider credentialsProvider, Region region) {
        this.debounceTime = System.currentTimeMillis();
        this.writer = new TranscribedSegmentWriter(DynamoDbClient.builder().build(), config.transcriptsDynamoDbTable(), mediaUrl);
    }

    @Override
    public void onError(Throwable e) {
        logger.error("Transcribe error occurred", e);
    }

    final private class TranscribeStreamData {
        private Result result;
        private String transcript;

        TranscribeStreamData(Result result, String transcript) {
            this.result = result;
            this.transcript = transcript;
        }

        Result getResult() {
            return result;
        }

        String getTranscript() {
            return transcript;
        }
    }

    private void logResult(TranscribeStreamData streamData) {
        Result result = streamData.getResult();
        if(!result.isPartial() || logger.getLevel() == Level.DEBUG) {
            Instant started = responseTime.plusMillis(Math.round(1000 * result.startTime()));
            Instant ended = responseTime.plusMillis(Math.round(1000 * result.endTime()));
            String info = result.isPartial() ? "PARTIAL" : "COMPLETE";
            logger.info("{} {} {}", info, Duration.between(ended, started), streamData.getTranscript());
    }}

    private boolean shouldDebounce() {
        return System.currentTimeMillis() - debounceTime < DEBOUNCE_DURATION;
    }

    @Override
    public void onStream(TranscriptResultStream event) {
        Transcript transcript = ((TranscriptEvent) event).transcript();

        transcript.results().stream()
            .filter(not(result ->result.isPartial() && shouldDebounce()))
            .flatMap(result -> result.alternatives().stream().limit(1)
                .map(Alternative::transcript)
                .filter(not(Strings::isNullOrEmpty))
                .map(transcriptText -> new TranscribeStreamData(result, transcriptText)))
            .peek(this::logResult)
            .forEach(streamData -> {
                Result result = streamData.getResult();
                logger.info(streamData.getTranscript());
                long startTimestamp = responseTime.plusMillis(Math.round(1000 * result.startTime())).toEpochMilli();
                writer.writeToDynamoDB(startTimestamp, streamData.getTranscript(), result);
                // if we've got here we need to reset the debounce timer
                debounceTime = System.currentTimeMillis();
            });
    }

    @Override
    public void onResponse(StartStreamTranscriptionResponse r) {
        responseTime = Instant.now();
        requestId = r.requestId();
        sessionId = r.sessionId();
        logger.info("Request ID is {}. Response started at {}", requestId, responseTime);
    }

    @Override
    public void onComplete() {
        logger.info("Response ended");
    }
}