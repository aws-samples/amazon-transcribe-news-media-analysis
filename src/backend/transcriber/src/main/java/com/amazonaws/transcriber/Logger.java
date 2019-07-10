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

public class Logger {
    public enum Level {
        ERROR,
        WARNING,
        INFO
    }

    public class Log {

        private final String name;

        public Log(String name) {
            this.name = name;
        }
        
        public String getName() {
            return name;
        }

        private void log(Level level, String message) {
            System.err.printf("%s %s: %s\n", name, level, message);
        }

        public void info(String message, Object... args) {
            info(String.format(message, args));
        }

        public void info(String message) {
            log(Level.INFO, message);
        }

        public void warn(String message, Object... args) {
            warn(String.format(message, args));
        }
        
        public void warn(String message) {
            log(Level.WARNING, message);
        }
        
        public void error(String message, Throwable throwable, Object... args) {
            error(String.format(message, args), throwable);
        }
        
        public void error(String message, Throwable throwable) {
            log(Level.ERROR, message);
            throwable.printStackTrace();
        }
    }    
    
    public Log getLog(String name) {
        return new Log(name);
    }
}
