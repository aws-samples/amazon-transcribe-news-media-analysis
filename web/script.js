
var kinesisStreamName = 'mediainfer-transcribe';
var videoSource = 'https://d3qqomtyfn19a9.cloudfront.net/out/v1/41ac8697e2a24f55898b4d43e83849cd/index.m3u8';

var awsConfig = AWS.config;
awsConfig.credentials = new AWS.Credentials('AKIAJSUU2UC2GXZOR2GQ', '5S+zQVf0vkKB7xqdllC+vXHmQwTOSBMH99HNsTw5');
awsConfig.region = 'eu-west-1';
var kinesis = new AWS.Kinesis();

var getRecordsStarted = false;
var recordLimit = 5;
var getRecordsIntervalAfterNoRecords = 500;
var getRecordsIntervalAfterRecords = 0;
var getRecordsIntervalAfterError = 1000;

var transcriptionElement;
var resultStartTimeElement;
var resultEndTimeElement;
var resultTypeElement;
var resultAlternativesElement;
var itemStartTimeElement;
var itemEndTimeElement;

var transcriptStartTimeElement;
var transcriptEndTimeElement;
var mediaCurrentTimeElement;

var videoElement;

var autoplayButton;
var autoscrollButton;
var hls;
		

function startGettingRecords(start) {
	if (start && !getRecordsStarted) {
		if (videoElement) {
			//videoElement.play();
		}
		console.log('Start getting records from stream \'' + kinesisStreamName + '\'');
		getRecordsStarted = true;
		kinesis.describeStream({ StreamName: kinesisStreamName }).promise().then(function(data) {
			if (getRecordsStarted) {
				var shards = data.StreamDescription.Shards;
				console.log('There are ' + shards.length + ' shards for stream \'' + kinesisStreamName + '\'');
				for (var shard of shards) {
					var shardId = shard.ShardId;
					console.log('Shard ID is \'' + shardId + '\'');
					kinesis.getShardIterator({ StreamName: kinesisStreamName, ShardId: shardId, ShardIteratorType: 'LATEST'}).promise().then(function(data) {
						if (getRecordsStarted) {
							var shardIterator = data.ShardIterator;
							getRecords(kinesisStreamName, shardIterator);
						}
					}).catch(function(err) {
						console.error('Error getting shard iterator for stream \'' + kinesisStreamName + '\': ', err);
					});
					break; //limiting to one shard at the moment...
				}
			}
		}).catch(function(err) {
			console.error('Error describing stream \'' + kinesisStreamName + '\': ', err);
		});
	} else if (!start && getRecordsStarted) {
		if (videoElement) {
			//videoElement.stop();
		}
		console.log('Stop getting records from stream \'' + kinesisStreamName + '\'');
		getRecordsStarted = false;
	}
}

function getRecords(kinesisStreamName, shardIterator, interval) {
	if (getRecordsStarted) {
		if (arguments.length >= 3) {
			setTimeout(function() { getRecords(kinesisStreamName, shardIterator); }, interval);
		} else {
			//console.log('Getting records from stream \'' + kinesisStreamName + '\'');
			kinesis.getRecords({ ShardIterator: shardIterator, Limit: recordLimit}).promise().then(function(data) {
				if (getRecordsStarted) {
					var records = data.Records;
					//console.log('There are ' + records.length + ' records from stream \'' + kinesisStreamName + '\'');
					for (var record of records) {
						var sequenceNumber = record.SequenceNumber;
						var dataString = String.fromCharCode.apply(null, record.Data);
						var dataObject = JSON.parse(dataString);
						displayData(dataObject);
					}
					shardIterator = data.NextShardIterator; 
					var nextInterval = (records.Length === 0 ? getRecordsIntervalAfterNoRecords : getRecordsIntervalAfterRecords);
					getRecords(kinesisStreamName, shardIterator, nextInterval);
				}
			}).catch(function(err) {
				console.error('Error getting records from stream \'' + kinesisStreamName + '\'', err);
				if (getRecordsStarted) {
					getRecords(kinesisStreamName, shardIterator, getRecordsIntervalAfterError);
				}
			});
		}
	}
}

function createText(text) {
	return document.createTextNode(text);
}
function createSpan(className, innerText) {
	var span = document.createElement('span');
	span.className = className;
	if (innerText) {
		span.innerText = innerText;
	}
	return span;
}

function dateAddTime(date, timeSecs) {
	return timeSecs ? new Date(date.getTime() + (timeSecs * 1000)) : date;
}
function dateToIso(date, timeSecs) {
	return dateAddTime(date, timeSecs ).toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ
}

function dateToDisplay(date, timeSecs) {
	return dateIsoToDisplay(dateToIso(date, timeSecs)); // YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ
}

function dateIsoToDisplay(dateIso) {
	var length = dateIso.length; // 24 or 27
	if ((length === 24) || (length === 27)) {
		var tPosition = (length === 24 ? 10 : 13);
		if (dateIso[tPosition] === 'T') {
			dateIso = dateIso.substring(0, tPosition) 
				+ ' ' 
				+ dateIso.substring(tPosition + 1, length - 1); //remove the ending 'Z'
		}
	}
	return dateIso;
}

function setStartAndEndTimeDataset(dataset, date, obj) {
	dataset.startTime = dateToIso(date, obj.startTime);
	dataset.endTime = dateToIso(date, obj.endTime);
}

var lastPartialResultElement;
var lastItemElement;

function updateStartAndEndTimeElements(startElement, endElement, element) {
	var startString;
	var endString;
	if (element) {
		var data = element.dataset;
		startString = dateIsoToDisplay(data.startTime);
		endString = dateIsoToDisplay(data.endTime);
	} else {
		startString = '';
		endString = '';
	}
	startElement.innerText = startString;
	endElement.innerText = endString;
}
function updateResultStartAndEndTimeElements(resultElement) {
	updateStartAndEndTimeElements(resultStartTimeElement, resultEndTimeElement, resultElement);
}
function updateItemStartAndEndTimeElements(itemElement) {
	updateStartAndEndTimeElements(itemStartTimeElement, itemEndTimeElement, itemElement);
}


function resultMouseEnter(event) {
	updateResultStartAndEndTimeElements(event.target);
	var dataset = event.target.dataset;
	resultTypeElement.innerText = dataset.type;
	resultAlternativesElement.innerText = dataset.alternativeCount;
}
function resultMouseLeave(event) {
	var relatedTarget = event.relatedTarget;
	if (!relatedTarget || !relatedTarget.classList.contains('result')) {
		updateResultStartAndEndTimeElements();
		resultAlternativesElement.innerText = '';
	}
}


function itemMouseEnter(event) {
	updateItemStartAndEndTimeElements(event.target);
}
function itemMouseLeave(event) {
	var relatedTarget = event.relatedTarget;
	if (!relatedTarget || !relatedTarget.classList.contains('item')) {
		updateItemStartAndEndTimeElements();
	}
}

function displayData(data) {
	var channelName = data.channelName;
	var requestId = data.requestId;
	var sessionId = data.sessionId;
	var time = new Date(Date.parse(data.time));
	for (var result of data.transcript.results) {
		var alternatives = result.alternatives;
		var isPartial = result.isPartial; 
		//may need to limit the number of record elements in the document...
		if (transcriptionElement.children.length === 0) {
			transcriptStartTimeElement.innerText = dateToDisplay(time, result.startTime);
		}
		transcriptEndTimeElement.innerText = dateToDisplay(time, result.endTime);

		var resultElement = createSpan('result');
		if (isPartial) {
			resultElement.classList.add('partial');
		}
		resultElementDataset = resultElement.dataset;
		resultElementDataset.resultId = result.resultId;
		setStartAndEndTimeDataset(resultElementDataset, time, result);
		resultElementDataset.type = isPartial ? "partial" : "complete";
		resultElementDataset.alternativeCount = alternatives.length;
		for (var alternative of alternatives) {
			//we'll ignore the transcript text...
			var alternativeElement = createSpan('alternative');
			for (var item of alternative.items) {
				var itemElement = createSpan('item');
				itemElement.classList.add(item.type);
				if (lastItemElement && (item.type === 'pronunciation')) {
					lastItemElement.insertAdjacentText('afterend', ' ');
				}
				setStartAndEndTimeDataset(itemElement.dataset, time, item);
				itemElement.innerText = item.content;
				itemElement.addEventListener('mouseenter', itemMouseEnter);
				itemElement.addEventListener('mouseleave', itemMouseLeave);
				alternativeElement.append(itemElement);
				lastItemElement = itemElement;
			}
			resultElement.append(alternativeElement);
		}
		resultElement.addEventListener('mouseenter', resultMouseEnter);
		resultElement.addEventListener('mouseleave', resultMouseLeave);
		if (lastPartialResultElement) {
			lastPartialResultElement.replaceWith(resultElement);
			lastPartialResultElement = null;
		} else {
			transcriptionElement.append(resultElement);
			// sync player to start of result?
			if (videoElement) {
				var resultStartDateTime = dateAddTime(time, result.startTime);
				//console.log('result datetime: ' + resultStartDateTime.toISOString());
				//videoElement.currentTime = 
			}
		}
		if (isPartial) {
			lastPartialResultElement = resultElement;
		}
	}
	if (autoscrollButton.checked) {
		transcriptionElement.scrollIntoView(false);
	}
}

window.addEventListener('load', function() {
	// alert('The Demo is currently switched off. Please contact leeatk@ for more details.');
	// return;
	transcriptionElement = document.getElementById('transcription');
	resultStartTimeElement = document.getElementById('resultStartTime');
	resultEndTimeElement = document.getElementById('resultEndTime');
	resultTypeElement = document.getElementById('resultType');
	resultAlternativesElement = document.getElementById('resultAlternatives');
	itemStartTimeElement = document.getElementById('itemStartTime');
	itemEndTimeElement = document.getElementById('itemEndTime');
	transcriptStartTimeElement = document.getElementById('transcriptStartTime');
	transcriptEndTimeElement = document.getElementById('transcriptEndTime');
	mediaCurrentTimeElement = document.getElementById('mediaCurrentTime');
	
	autoplayButton = document.getElementById('autoplay');
	autoplayButton.addEventListener('change', function(event) {
		startGettingRecords(autoplayButton.checked);
	});
	autoscrollButton = document.getElementById('autoscroll');

	videoElement = document.getElementById('video');
	if (Hls.isSupported()) {
		hls = new Hls();
		hls.loadSource(videoSource);
		hls.attachMedia(videoElement);
		hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
		});
		// hls.on(Hls.Events.LEVEL_PTS_UPDATED, function(event, data) {
		// 	console.log('LEVEL_PTS_UPDATED')
		// });
		// hls.on(Hls.Events.FRAG_CHANGED, function(event, data) {
		// 	var dateTime = new Date(data.frag.programDateTime);
		// 	var dateTimeString = toDisplayableDateTime(dateTime);
		// 	console.log('current dateTime: ' + dateTimeString);
		// });
	} else {
		videoElement = null;
		window.alert('HLS playback is not supported in this browser');
	}
	if (videoElement) {
		var updateMediaTime;
		videoElement.addEventListener('pause', function() {
			window.clearInterval(updateMediaTime);
			delete updateMediaTime;
		});
		videoElement.addEventListener('playing', function() {
			updateMediaTime = window.setInterval(function() {

				var positionInMedia = videoElement.currentTime * 1000;
				var playingFragment = hls.streamController.fragPlaying;
				if (playingFragment) {
					var fragmentPDT = playingFragment.programDateTime;
					var fragmentStart = playingFragment.start * 1000;
					var positionInFragment = positionInMedia - fragmentStart;
					var currentDateTime = new Date(fragmentPDT + positionInFragment);
					var currentDateTimeString = dateToDisplay(currentDateTime);
					mediaCurrentTimeElement.innerText = currentDateTimeString;
//					console.log('positionInMedia: ' + positionInMedia + '  playingFragment: ' + JSON.stringify(playingFragment) + ' currentDateTime:' + currentDateTimeString);
				}
			}, 500);
		});
	}
	startGettingRecords(true);
})