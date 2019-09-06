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

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.config.Configurator;
import org.apache.logging.log4j.core.LoggerContext;

import software.amazon.awssdk.services.transcribestreaming.model.LanguageCode;
import software.amazon.awssdk.services.transcribestreaming.model.MediaEncoding;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public class App {

    private static final Logger logger = LogManager.getLogger(App.class);

    private static TranscriberConfig config = TranscriberConfig.getInstance();
    private static String error;

    public static void main(String... args) {
        String input = config.mediaUrl();
        String resolved = input;
        LifecycleInfoPersister lcp  = new LifecycleInfoPersister(resolved);
        logger.info("Input is {}", resolved);
        if (input.startsWith("https://www.youtube.com/")) {
            resolved = getYouTubeUrl(config.youtubeDlPath(), input);
            logger.info("YouTube input is %s", resolved);
        }

        Encoder encoder = new Encoder(config.ffmpegPath(), "s16le", resolved);
        Transcriber transcriber = new Transcriber(input, LanguageCode.EN_US, MediaEncoding.PCM,
            config.mediaSampleRate(), config.vocabularyName().orElse(""));

        try {
            InputStream mediaStream = encoder.start();

            addShutdownHook(lcp);

            CompletableFuture<Void> promise = transcriber.start(mediaStream);

            logger.info("Persisting lifecycle stage PROCESSING in DynamoDb...");
            lcp.transcriptionBegun();
            // this blocks the main thread, we could have multiple transcriptions if we want by
            // storing the promises in an array and then using an infinite loop to keep the main
            // thread alive but as we only have one video per container this is not necessary
            promise.get();
        } catch (IOException ioe) {
            logger.error("There was an error starting ffmpeg...", ioe);
            error = ioe.getMessage();
        } catch (InterruptedException ie) {
            logger.info("Transcription thread stopped...");
        } catch (ExecutionException ex) {
            logger.error("Transcription errored...", ex);
            error = ex.getMessage();
        } finally {
            logger.info("Stopping transcription.");
            transcriber.stop();

            logger.info("Stopping ffmpeg encoding.");
            try {
                encoder.stop();
            } catch (IOException ioe) {
                logger.error("The ffmpeg process errored.", ioe);
                error = ioe.getMessage();
            }
        }
    }

    private static void addShutdownHook(LifecycleInfoPersister lcp) {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if(error == null) {
                logger.info("Persisting lifecycle stage TERMINATED in DynamoDb...");
                lcp.transcriptionTerminated();
            }
            else {
                logger.info("Persisting lifecycle stage ERROR in DynamoDb...");
                lcp.transcriptionErrored(error);
            }

            //shutdown log4j2
            if( LogManager.getContext() instanceof LoggerContext ) {
                logger.info("Shutting down log4j2");
                Configurator.shutdown((LoggerContext)LogManager.getContext());
            } else {
                logger.warn("Unable to shutdown log4j2");
            }
        }));
    }

    //TODO: use Optional or throw with a meaningful exception as currently this method can cause a NullPointerException
    private static String getYouTubeUrl(String youtubeDlPath, String input) {
        List<String> command = new ArrayList<>(Arrays.asList(youtubeDlPath, "--hls-use-mpegts", "--hls-prefer-ffmpeg", "--get-url", input));
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        try {
            Process process = processBuilder.start();
            try {
                int exitCode = process.waitFor();
                if (exitCode == 0) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                    try {
                        return reader.readLine();
                    } catch (IOException e) { }
                } else {
                    logger.warn("youtube-dl exit code is %d", exitCode);
                }
            } catch (InterruptedException e) { }
        } catch (IOException e) { }
        return null;
    }

}