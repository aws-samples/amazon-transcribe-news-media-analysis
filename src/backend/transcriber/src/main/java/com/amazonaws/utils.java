package com.amazonaws;

import java.util.Optional;
import java.util.function.Function;

public class utils {

    private static <T> T parseEnvVar(Function<String, T> parseFn, String name, T defVal) {
        try {
            return Optional.ofNullable(System.getenv(name)).map(parseFn).orElse(defVal);
        } catch (Exception e) {
            return defVal;
        }
    }

    public static int parseEnvVar(String name, int defVal) {
        return parseEnvVar(Integer::parseInt, name, defVal);
    }

    public static boolean parseEnvVar(String name, boolean defVal) {
        return parseEnvVar(Boolean::parseBoolean, name, defVal);
    }

    public static String parseEnvVar(String name, String defVal) {
        return parseEnvVar(Function.identity(), name, defVal);
    }

    public static String requiredEnvVar(String name) {
        return Optional.ofNullable(System.getenv(name)).orElseThrow(IllegalStateException::new);
    }
}
