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
    private boolean persistLifecycleInfo = parseEnvVar("PERSIST_LIFECYCLE_INFO", true);
    private String transcriptsDynamoDbTable = requiredEnvVar("TRANSCRIPTS_DYNAMO_DB_TABLE");
    private String tasksDynamoDbTable = requiredEnvVar("TASKS_DYNAMO_DB_TABLE");
    private String mediaUrl = requiredEnvVar("MEDIA_URL");
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

    private boolean parseEnvVar(String name, boolean defVal) {
        return parseEnvVar(Boolean::parseBoolean, name, defVal);
    }

    private String parseEnvVar(String name, String defVal) {
        return parseEnvVar(Function.identity(), name, defVal);
    }

    private String requiredEnvVar(String name) {
        return Optional.ofNullable(System.getenv(name)).orElseThrow(IllegalStateException::new);
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
