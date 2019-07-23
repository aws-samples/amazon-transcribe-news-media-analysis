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
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

public class Encoder {

    private static final Logger logger = LogManager.getLogger(Encoder.class);

    private final String inputFormat;
    private final String input;
    private final String path;
    private final Pattern printFilter = Pattern.compile("^(?!(\\[info\\] (frame|size)=|\\[https @ 0x[0123456789abcdef]*\\] \\[info\\]|\\[hls,applehttp @ 0x[0123456789abcdef]{12}\\] \\[info\\])).+$");
    private Process process;
    private BufferedWriter stdinWriter;
    private Thread stderrReaderThread;

    

    Encoder(String path, String inputFormat, String input) {
        this.path = path;
        if (Strings.isNullOrEmpty(input)) {
            throw new IllegalArgumentException("input cannot be null or empty");
        }
        this.inputFormat = inputFormat;
        this.input = input;
    }

    private String convertLogLevel() {
        String level = logger.getLevel().toString().toLowerCase();
        switch(level) {
            case "off":
                return "quiet";
            case "warn":
                return "warning";
            default:
                return level;
        }
    }
    
    InputStream start() {
        List<String> args = new ArrayList<>(Arrays.asList(
            path,
            "-hide_banner",
            "-loglevel", "level+" + convertLogLevel(),
            "-i", input,
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            "-c:a", "pcm_s16le",
            "-f", inputFormat,
            "-" //output to stdout
        ));

        if (process != null) {
            throw new IllegalStateException("Already running");
        }

        logger.info("Starting with %s", args);
        ProcessBuilder processBuilder = new ProcessBuilder(args);

        try {
            process = processBuilder.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            stderrReaderThread = new Thread(() -> {
                Thread.currentThread().setName(logger.getName());
                reader.lines().forEach(line -> {
                    if (printFilter.matcher(line).matches()) {
                        logger.info(line);
                    }
                });
                logger.info("Completed");
            });
            stderrReaderThread.start();
            stdinWriter = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            return process.getInputStream();
        } catch (IOException e) {
            logger.error("Error starting", e);
            return null;
        }
    }

    void stop() {
        if ((process != null) && process.isAlive()) {
            try {
                stdinWriter.write("q");
                stdinWriter.flush();
                process.wait(1000);
            } catch (InterruptedException ex) {
                logger.info("ffmpeg thread for {} has been interrupted.", input);
            } catch (IOException e) {
                logger.error("Error quiting ffmpeg process", e);
            } finally {
                if ((process != null) && process.isAlive()) {
                    process.destroy();
                }
                if (stderrReaderThread != null) {
                    stderrReaderThread.interrupt();
                    stderrReaderThread = null;
                }
            }
        }
    }

    @Override
    public void finalize() throws Throwable {
        stop();
        super.finalize();
    }
}
