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

import java.io.*;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

public abstract class Ffmpeg {
    public enum LogLevel {
        QUIET(-8),
        PANIC(0), 
        FATAL(8),
        ERROR(16),
        WARNING(24),
        INFO(32),
        VERBOSE(40),
        DEBUG(48),
        TRACE(56);

        private final int value;
        
        private LogLevel(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }

        public static LogLevel From(int value)
        {
            LogLevel[] arr = LogLevel.values();
            for (LogLevel i : arr) {
                if (i.getValue() == value) {
                    return i;
                }
            }
            return LogLevel.PANIC;
        }
    }
    
    private final Logger.Log log;
    private final String path;
    private final Pattern printFilter;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private Process process;
    private BufferedWriter stdinWriter;
    private Thread stderrReaderThread;

    
    Ffmpeg(String name, Logger logger, String path, Pattern printFilter) {
        this.log = logger.getLog(name);
        this.path = path;
        this.printFilter = printFilter;
    }
    
    protected InputStream start(List<String> args) {
        if (process != null) {
            throw new IllegalStateException("Already running");
        }
        args.add(0, path);
        
        log.info("Starting with %s", args);
        ProcessBuilder processBuilder = new ProcessBuilder(args);

        try {
            process = processBuilder.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            stderrReaderThread = new Thread(() -> {
                Thread.currentThread().setName(log.getName());
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        String line = reader.readLine();
                        if (line != null) {
                            if ((printFilter == null) || printFilter.matcher(line).matches()) {
                                log.info(line);
                            }
                        } else {
                            log.info("Completed");
                            break;
                        }
                    } catch (IOException e) {
                    }
                }
            });
            stderrReaderThread.start();
            stdinWriter = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            return process.getInputStream();
        } catch (IOException e) {
            log.error("Error starting", e);
            return null;
        }
    }
    
    protected void writeString(String str) {
        if ((process != null) && process.isAlive()) {
            try {
                stdinWriter.write(str);
                stdinWriter.flush();
            } catch (IOException ex) {
            }
        }
    }

    protected void stop() {
        if ((process != null) && process.isAlive()) {
            writeString("q");
            try {
                process.wait(1000);
            } catch (InterruptedException ex) {
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
