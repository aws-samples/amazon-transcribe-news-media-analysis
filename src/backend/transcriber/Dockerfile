FROM amazoncorretto:8

LABEL maintainer="leeatk@amazon.co.uk"

RUN yum install -y wget xz tar

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
    unxz ffmpeg-release-amd64-static.tar.xz && \
    mkdir /ffmpeg && \
    tar xf ffmpeg-release-amd64-static.tar -C /ffmpeg --strip-components 1 && \
    rm -f ffmpeg-release-amd64-static.tar

RUN wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl && \
    chmod a+rx /usr/local/bin/youtube-dl

COPY target/transcriber-1.0-SNAPSHOT-jar-with-dependencies.jar /transcriber.jar

COPY src/main/resources/log4j2.xml log4j2.xml

#ENTRYPOINT [ "java", "-jar", "/mediainfer.jar" ]
#java -jar /mediainfer.jar blah https://www.youtube.com/watch?v=lrX6ktLg8WQ --youtubedl-path /usr/local/bin/youtube-dl --transcribe-kinesis-stream-name MyKinesisStream --ffmpeg-path ffmpeg/ffmpeg

CMD ["bash"]