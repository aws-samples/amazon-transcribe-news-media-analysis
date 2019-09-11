# Install dependencies and build jar

FROM maven:3.6.2-jdk-8 as target

RUN apt -y install wget

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    unxz ffmpeg-release-amd64-static.tar.xz && \
    mkdir /ffmpeg && \
    tar xf ffmpeg-release-amd64-static.tar -C /ffmpeg --strip-components 1 && \
    rm -f ffmpeg-release-amd64-static.tar

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src/ /build/src/

RUN mvn package -o

# Main Dockerfile

FROM amazoncorretto:8

RUN yum install -y wget

RUN wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl && \
    chmod a+rx /usr/local/bin/youtube-dl

WORKDIR /app

COPY --from=target /ffmpeg /ffmpeg

COPY --from=target /build/target/transcriber-1.0-SNAPSHOT-jar-with-dependencies.jar transcriber.jar

COPY --from=target /build/src/main/resources/log4j2.xml log4j2.xml

CMD [ "java", "-jar", "-Dlog4j.configurationFile=log4j2.xml", "transcriber.jar" ]
