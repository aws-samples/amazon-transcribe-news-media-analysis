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

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

public class Encoder extends Ffmpeg {
    private final Ffmpeg.LogLevel logLevel;
    private final String inputFormat;
    private final String input;
    private final String output;
    
    Encoder(Logger logger, String path, Ffmpeg.LogLevel logLevel, String inputFormat, String input, String output) {
        super("encoder", logger, path, Pattern.compile("^(?!(\\[info\\] (frame|size)=|\\[https @ 0x[0123456789abcdef]*\\] \\[info\\]|\\[hls,applehttp @ 0x[0123456789abcdef]{12}\\] \\[info\\])).+$"));
        if (Strings.isNullOrEmpty(input)) {
            throw new IllegalArgumentException("input cannot be null or empty");
        }
        this.logLevel = logLevel;
        this.inputFormat = inputFormat;
        this.input = input;
        this.output = output; // example is "udp://localhost:1234" 
    }
    
    public InputStream start() {
        Ffmpeg.LogLevel minLogLevel = Ffmpeg.LogLevel.From(Math.max(Ffmpeg.LogLevel.INFO.getValue(), logLevel.getValue()));
        String minLogLevelString = minLogLevel.toString().toLowerCase();
        
        List<String> args = new ArrayList(Arrays.asList(
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

        if (!Strings.isNullOrEmpty(output)) {
            args.addAll(Arrays.asList(
                "-vf", "scale=w=960:h=540:force_original_aspect_ratio=decrease"
                    + ",drawtext=fontfile=/Library/Fonts/arial.ttf:fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:text='%{localtime}'",
                "-c:v", "libx264",
                "-b:v", "500k",
                "-b:a", "128k",
                "-f", "mpegts",
                output
            ));
        }
        
        return super.start(args);
    }
}
