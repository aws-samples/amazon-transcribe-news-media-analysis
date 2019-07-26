package com.amazonaws.transcriber;

import com.amazonaws.utils;

import java.util.Optional;
import java.util.function.Function;

public class TranscriberConfig {

    private static final TranscriberConfig INSTANCE = new TranscriberConfig();

    private TranscriberConfig() {}

    private int debounceDuration = utils.parseEnvVar("DEBOUNCE_DURATION", 1000);
    private String ffmpegPath = utils.parseEnvVar("FFMPEG_EXE", "/ffmpeg/ffmpeg");
    private String youtubeDlPath = utils.parseEnvVar("YOUTUBE_DL_EXE", "/usr/local/bin/youtube-dl");
    private int mediaSampleRate = utils.parseEnvVar("MEDIA_SAMPLE_RATE", 16000);
    private String transcriptsDynamoDbTable = utils.requiredEnvVar("TRANSCRIPTS_DYNAMO_DB_TABLE");
    private String tasksDynamoDbTable = utils.requiredEnvVar("TASKS_DYNAMO_DB_TABLE");
    private String mediaUrl = utils.requiredEnvVar("MEDIA_URL");
    private String vocabularyName = System.getenv("VOCABULARY_NAME");

    static TranscriberConfig getInstance() {
        return INSTANCE;
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

    String tasksDynamoDbTable() {
        return tasksDynamoDbTable;
    }

    String mediaUrl() {
        return mediaUrl;
    }

    public Optional<String> vocabularyName() {
        return Optional.ofNullable(vocabularyName);
    }
}
