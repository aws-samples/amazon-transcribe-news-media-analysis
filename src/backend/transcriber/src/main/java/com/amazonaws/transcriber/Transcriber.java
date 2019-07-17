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


import com.amazonaws.transcribestreaming.AudioStreamPublisher;
import com.amazonaws.transcribestreaming.retryclient.StreamTranscriptionBehavior;
import com.amazonaws.transcribestreaming.retryclient.TranscribeStreamingRetryClient;
import com.google.common.base.Strings;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.transcribestreaming.TranscribeStreamingAsyncClient;
import software.amazon.awssdk.services.transcribestreaming.model.LanguageCode;
import software.amazon.awssdk.services.transcribestreaming.model.MediaEncoding;
import software.amazon.awssdk.services.transcribestreaming.model.StartStreamTranscriptionRequest;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;

import java.util.concurrent.ExecutionException;

public class Transcriber {
    private static final Logger logger = LogManager.getLogger(Transcriber.class);
    
    private final MediaEncoding encoding;
    private final int sampleRate; 
    private final LanguageCode language;
    private final String vocabularyName;

    private final StreamTranscriptionBehavior handler;
    private TranscribeStreamingRetryClient retryClient;
    private AudioStreamPublisher audioStreamPublisher;

    public Transcriber(String mediaUrl, LanguageCode language, MediaEncoding encoding,
                       int sampleRate, String vocabularyName) {

        this.encoding = encoding;
        this.sampleRate = sampleRate;
        this.language = language;
        this.vocabularyName = vocabularyName;

        this.handler = new ResponseHandler(mediaUrl);
    }

    public void start(InputStream inputStream) throws InterruptedException, ExecutionException {
        if (audioStreamPublisher != null) {
            throw new IllegalStateException("Already running");
        }
        TranscribeStreamingAsyncClient asyncClient = TranscribeStreamingAsyncClient.create();
        retryClient = new TranscribeStreamingRetryClient(asyncClient);
        StartStreamTranscriptionRequest.Builder requestBuilder = StartStreamTranscriptionRequest.builder()
            .languageCode(language.toString())
            .mediaEncoding(encoding)
            .mediaSampleRateHertz(sampleRate);
        if (!Strings.isNullOrEmpty(vocabularyName)) {
            requestBuilder.vocabularyName(vocabularyName);
        }
        StartStreamTranscriptionRequest request = requestBuilder.build();
        audioStreamPublisher = new AudioStreamPublisher(new BufferedInputStream(inputStream));
        retryClient.startStreamTranscription(request, audioStreamPublisher, handler).get();
    }

    public void stop() {
        if (audioStreamPublisher != null) {
            try {
                audioStreamPublisher.close();
            } catch (IOException ex) {
                logger.error("Error closing audio stream", ex);
            } finally {
                audioStreamPublisher = null;
                retryClient.close();
                retryClient = null;
            }
        }
    }
}