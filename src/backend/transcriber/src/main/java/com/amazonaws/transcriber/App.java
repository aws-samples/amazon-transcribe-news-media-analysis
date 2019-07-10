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

import com.google.common.base.Strings;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;
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
import java.util.EnumSet;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Command(name = "mediainfer", 
    description = "Inference of media streams with Amazon machine learning services.", 
    version = "1.0.0",
    mixinStandardHelpOptions = true, 
    sortOptions = false,
    defaultValueProvider = CommandLineArgumentDefaultProvider.class)

public class App implements Runnable {
    public static void main(String... args) {
        CommandLine.run(new App(), args);
    }
    
    @Parameters(index = "0", 
        description = "The name of this channel.")
    private String channelName;

    @Parameters(index = "1",
        description = "Input media. See ffmpeg's -i argument.")
    private String input;

    @Option(names = {"--aws-region"}, 
        description = "AWS region. Default: AWS SDK default.", 
        converter = AWSRegionConverter.class)
    private Region awsRegion;

    @Option(names = {"--ffmpeg-path"}, 
        description = "Path of FFMPEG exectuable. Default: ${DEFAULT-VALUE}.")
    private String ffmpegPath = "./ffmpeg";

    @Option(names = {"--ffmpeg-log-level"}, 
        description = "Level of ffmpeg log output. Log outputs of this level and above are logged to stderr. Default: ${DEFAULT-VALUE}.", 
        converter = FfmpegLogLevelConverter.class)
    private Ffmpeg.LogLevel ffmpegLogLevel = Ffmpeg.LogLevel.WARNING;

    @Option(names = {"--ffplay-path"}, 
        description = "Path of ffplay exectuable. Default: ${DEFAULT-VALUE}.")
    private String ffplayPath = "./ffplay";

    @Option(names = {"--youtubedl-path"}, 
        description = "Path of youtube-dl exectuable. Default: ${DEFAULT-VALUE}.")
    private String youtubeDlPath = "./youtube-dl";

    
    @Option(names = {"--input-format"}, 
        description = "Input media's format. See ffmpeg's -f argument.")
    private String inputFormat;

    @Option(names = {"--input-language"}, 
        description = "Input language. Default: ${DEFAULT-VALUE}.")
    private LanguageCode inputLanguage = LanguageCode.EN_US; //would be nice if we can default to the language in the media stream...
    
    
    @Option(names = "--output", 
        description = "Output to send monitor stream to. Default: ${DEFAULT-VALUE}.")
    private String output;


    @Option(names = {"--transcribe-media-encoding"}, 
        description = "Amazon Transribe media encoding. One of: ${COMPLETION-CANDIDATES}. Default: ${DEFAULT-VALUE}.")
    private MediaEncoding transcribeMediaEncoding = MediaEncoding.PCM;

    @Option(names = {"--transcribe-media-sample-rate"}, 
        description = "Amazon Transribe media sample rate, in Hz. Default: ${DEFAULT-VALUE}.")
    private int transcribeMediaSampleRate = 16_000;

    @Option(names = {"--transcribe-vocabulary-name"}, 
        description = "Amazon Transribe custom vocabulary. Default: ${DEFAULT-VALUE}.")
    private String transcribeVocabularyName;

    @Option(names = "--transcribe-kinesis-stream-name", 
        description = "Name of Amazon Kinesis data stream to send Amazon Transribe outputs to. Default: ${DEFAULT-VALUE}.")
    private String transcribeKinesisStreamName;
    
    @Option(names = "--transcribe-stdout-result-types",
        description = "Types of Amazon Transcribe results to send to stdout. One or more of: ${COMPLETION-CANDIDATES}. Default: ${DEFAULT-VALUE}",
        split = ",")
    // https://github.com/remkop/picocli/issues/628. Exception if I set the default value. Workaround is to use a default provider.
    private EnumSet<TranscribeResultTypes> transcribeStdOutResultTypes = EnumSet.noneOf(TranscribeResultTypes.class); 
    
    private final Logger logger = new Logger();
    private final Logger.Log log = logger.getLog("main");
    private Player player;
    private Encoder encoder;
    private Transcriber transcriber;
    
    public void run() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> { 
            log.info("Shutting down");
            stop();
        })); 
        log.info("Channel Name is %s", channelName);
        log.info("Input is %s", input);
        if (input.startsWith("https://www.youtube.com/")) {
            input = getYouTubeUrl(input);
            log.info("YouTube input is %s", input);
        }
        if (Strings.isNullOrEmpty(input)) {
            throw new IllegalArgumentException("input cannot be null or empty");
        }
        if (!Strings.isNullOrEmpty(output)) {
            player = new Player(logger, ffplayPath, channelName, output);
            player.start();
        }
        AwsCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
        transcriber = new Transcriber(logger, input, credentialsProvider, awsRegion, inputLanguage,
                transcribeMediaEncoding, transcribeMediaSampleRate, transcribeVocabularyName,
                transcribeStdOutResultTypes);
        encoder = new Encoder(logger, ffmpegPath, ffmpegLogLevel, inputFormat, input, output);
        InputStream mediaStream = encoder.start();
        try {
            transcriber.start(mediaStream);
        } catch (InterruptedException | ExecutionException ex) {
            log.error("Starting transcriber...", ex);
        }
    }
    
    private String getYouTubeUrl(String input) {
        List<String> command = new ArrayList(Arrays.asList(youtubeDlPath, "--hls-use-mpegts", "--hls-prefer-ffmpeg", "--get-url", input));
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
                    log.warn("youtube-dl exit code is %d", exitCode);
                }
            } catch (InterruptedException e) { }
        } catch (IOException e) { }
        return null;
    }
    
    private void stop() {
        if (encoder != null) {
            encoder.stop();
        }
        if (player != null) {
            player.stop();
        }
        if (transcriber != null) {
            transcriber.stop();
        }
    }
    
    @Override
    public void finalize() throws Throwable {
        stop();
        super.finalize();
    }         
}