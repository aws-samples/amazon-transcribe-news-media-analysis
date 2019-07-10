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

import com.google.gson.*;

import java.lang.reflect.Type;
import java.time.Instant;
import java.time.format.DateTimeFormatter;

public class InstantConverter implements JsonSerializer<Instant>, JsonDeserializer<Instant> {
  private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_INSTANT;

  @Override
  public JsonElement serialize(Instant src, Type typeOfSrc, JsonSerializationContext context) {
    return new JsonPrimitive(FORMATTER.format(src));
  }

  @Override
  public Instant deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
    return FORMATTER.parse(json.getAsString(), Instant::from);
  }
}
