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

import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.transcribestreaming.model.LanguageCode;
import software.amazon.awssdk.services.transcribestreaming.model.MediaEncoding;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;

public class App {

    private static final Logger logger = LogManager.getLogger(App.class);

    private static TranscriberConfig config = TranscriberConfig.getInstance();

    public static void main(String... args) {
        String input = config.mediaUrl();
        logger.info("Input is {}", input);
        if (input.startsWith("https://www.youtube.com/")) {
            input = getYouTubeUrl(config.youtubeDlPath(), input);
            logger.info("YouTube input is %s", input);
        }

        Transcriber transcriber = new Transcriber(input, LanguageCode.EN_US, MediaEncoding.PCM,
            config.mediaSampleRate(), "");
        Encoder encoder = new Encoder(config.ffmpegPath(), Ffmpeg.LogLevel.WARNING, "", input);

        InputStream mediaStream = encoder.start();
        try {
            transcriber.start(mediaStream);
        } catch (InterruptedException | ExecutionException ex) {
            logger.error("Starting transcriber...", ex);
        }

        // the transcriber runs in a separate thread so that's why we need an infinite loop, there's probably a better
        // way to do this but it'll do for now
        while(true) {
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                logger.info("Application closing");
            }
        }
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