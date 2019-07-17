package com.amazonaws.transcriber;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Optional;
import java.util.function.Function;

public class TranscriberConfig {

    private static final TranscriberConfig INSTANCE = new TranscriberConfig();

    private TranscriberConfig() {}

    private int debounceDuration = parseEnvVar("DEBOUNCE_DURATION", 1000);
    private String ffmpegPath = parseEnvVar("FFMPEG_EXE", "/ffmpeg/ffmpeg");
    private String youtubeDlPath = parseEnvVar("YOUTUBE_DL_EXE", "/usr/local/bin/youtube-dl");
    private int mediaSampleRate = parseEnvVar("MEDIA_SAMPLE_RATE", 16000);
    private String transcriptsDynamoDbTable = Optional.ofNullable(System.getenv("TRANSCRIPTS_DYNAMO_DB_TABLE")).orElseThrow(IllegalStateException::new);
    private String tasksDynamoDbTable = Optional.ofNullable(System.getenv("TASKS_DYNAMO_DB_TABLE")).orElseThrow(IllegalStateException::new);
    private String mediaUrl = Optional.ofNullable(System.getenv("MEDIA_URL")).orElseThrow(IllegalStateException::new);
    private String vocabularyName = System.getenv("VOCABULARY_NAME");

    static TranscriberConfig getInstance() {
        return INSTANCE;
    }

    private <T> T parseEnvVar(Function<String, T> parseFn, String name, T defVal) {
        try {
            return Optional.ofNullable(System.getenv(name)).map(parseFn).orElse(defVal);
        } catch (Exception e) {
            return defVal;
        }
    }

    private int parseEnvVar(String name, int defVal) {
        return parseEnvVar(Integer::parseInt, name, defVal);
    }

    private String parseEnvVar(String name, String defVal) {
        return parseEnvVar(Function.identity(), name, defVal);
    }

    int debounceDuration() {
        return debounceDuration;
    }

    String ffmpegPath() {
        return ffmpegPath;
    }

    String youtubeDlPath() {
        return youtubeDlPath;
    }

    int mediaSampleRate() {
        return mediaSampleRate;
    }

    String transcriptsDynamoDbTable() {
        return transcriptsDynamoDbTable;
    }

    public String tasksDynamoDbTable() {
        return tasksDynamoDbTable;
    }

    String mediaUrl() {
        return mediaUrl;
    }

    public Optional<String> vocabularyName() {
        return Optional.ofNullable(vocabularyName);
    }
}
