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
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

public class Encoder extends Ffmpeg {
    private static final Logger logger = LogManager.getLogger(Encoder.class);

    private final String inputFormat;
    private final String input;
    private final Ffmpeg.LogLevel logLevel;

    
    Encoder(String path, Ffmpeg.LogLevel logLevel, String inputFormat, String input) {
        super("encoder", path, Pattern.compile("^(?!(\\[info\\] (frame|size)=|\\[https @ 0x[0123456789abcdef]*\\] \\[info\\]|\\[hls,applehttp @ 0x[0123456789abcdef]{12}\\] \\[info\\])).+$"));
        if (Strings.isNullOrEmpty(input)) {
            throw new IllegalArgumentException("input cannot be null or empty");
        }
        this.inputFormat = inputFormat;
        this.input = input;
        this.logLevel = logLevel;
    }
    
    public InputStream start() {
        Ffmpeg.LogLevel minLogLevel = Ffmpeg.LogLevel.From(Math.max(Ffmpeg.LogLevel.INFO.getValue(), logLevel.getValue()));
        String minLogLevelString = minLogLevel.toString().toLowerCase();
        
        List<String> args = new ArrayList<>(Arrays.asList(
            "-hide_banner",
            "-loglevel", "level+" + minLogLevelString/*,
            "-re" //realtime */
        ));
        if (!Strings.isNullOrEmpty(inputFormat)) {
            args.addAll(Arrays.asList("-f", inputFormat));
        }

        args.addAll(Arrays.asList(
            "-i", input,
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            "-c:a", "pcm_s16le",
            "-f", "s16le",
            "-" //output to stdout
        ));
        
        return super.start(args);
    }
}
