/**
 * Created by mikemeaney on 7/15/14.
 */

var request = require('request');
var http = require('http');

var randomWordURL = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true' +
    '&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';

var PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080 ;
var IP =  process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';


http.createServer(function (req, res){
    //  YAY! Cross-Origin-Resource-Sharing sans any kind of security! #itJustWorks4Now
    res.setHeader('Access-Control-Allow-Origin', '*');

    //Because this app only deals with one word at at time, let's make it a global varable.
    var theWord;

    //The function that fetches the random word from WordNik and sends it ot getWordData()
    function randomWord() {
        //I really really want to make this into a workable function
        request(randomWordURL, function (error, response, body) {
            console.log("$$--This is the random word--$$");

            var WORD = body;
            WORD = JSON.parse(WORD);
            WORD = WORD.word;
            console.log(WORD);

            getWordData(WORD);
        });

    }

    //The function that sends the random word to Pearsons. If Pearsons doesn't have it, then
    //it requests a new random word. This SHOULD repeat until a word is found with a part of
    //speech, pronunciation, and definition.
    //TODO- Improve retry logging. Each time a new word gets queried, it costs an API call
    //TODO- If the cause of the retry was becasue no results returned, save that word.
    //TODO- If the cause of the retry was because of imcomplete data, save that word's JSON data.
    //TODO-
    function getWordData(word) {
        var pearsonURL = "https://api.pearson.com/v2/dictionaries/entries?headword="+word+
            "&apikey=s7673YUomVGLWud3HAYMZQt6NTv396Kc";


        request(pearsonURL, function (error, response, body) {

            var headword = undefined;
            var pronounce = undefined;
            var def = undefined;
            var partOfSpeech = undefined;

           //testing a method for refining results by collecting results with deffinitons into an array,
           //then removing results without a part of speech. Those results are then parsed into another array
           //where results without a pronuncation are removed. Finally a random remaing result is chosen and
           //sent to the client.

            var wordsWithAPart = [];
            var wordsWithPronounce = [];


            var theData = body; // Store the data from Pearson as theData
            theData = JSON.parse(theData); // Parse it as a JSON object
            //console.log(theData); //Show me what you've grabbed so far

            //Check to see if there were any results
            if (theData.results.length < 1) {
                //If there weren't any results returned, try again.
                //console.error("Doh! That word doesn't exist @ Pearson");

                //Place function for selecting a different word --HERE---
                //I really really want to make this into a workable function
                console.error("--RETRY CAUSE: Pearsons does not have results for \""+word+"\"");
                randomWord();


            } else {
                theData = theData.results;
                console.log("Tight, Pearson returned " + theData.length + " results")

                //Iterate through all the results
                for (var i = 0; i < theData.length; i++) {

                    //Tell me were you are in the array and it's corresponding headword
                    console.log("--- Result No. " + i + "\" " + theData[i].headword + " \" ---");
                    var headWord = theData[i].headword;

                    //Tell me the part of speech for this result
                    if (theData[i].part_of_speech !== undefined) {
                        console.log("Part of Speech: " + theData[i].part_of_speech);
                        partOfSpeech = theData[i].part_of_speech;
                        wordsWithAPart[i] = theData[i];
                    } else {
                        console.error("No part if speech found for theData["+i+"]");
                    }

                    console.log("-$-$-$-$-$-$-[wordsWithAPart]-$-$-$-$-$-$-$");
                   // console.log(wordsWithAPart);

                    //the variable for working with the pronunciation array (if even present)
                    var thePronounce = theData[i].pronunciations;
                    console.log(thePronounce);

                    //check to see if each entry has an IPA pronunciation
                    if (thePronounce !== undefined) {
                        for (var k = 0; k < thePronounce.length; k++) {
                            if (thePronounce[k].ipa !== undefined) {
                                console.log("Pronounce: " + thePronounce[k].ipa);
                                pronounce = thePronounce[k].ipa;
                            } else {
                                console.error("Bummer man, Pearson doesn't have a prouncatitootototionation for this " +
                                    "word :/ theData["+i+"]["+k+"]" );
                            }
                        }
                    }else{
                        console.error("Bummer man, Pearson doesn't have a prouncatitootototionation for this " +
                            "word :/ " + theData[i].headword +" theData["+i+"]" );
                           //console.error(theData[i]); // DEBUGGING
                    }

                }

                var wordsWithDef = [];
                for(var i=0; i<wordsWithAPart.length; i++) {
                    //the variable for working with the senses array of this particular result
                    //this is were the defintion data data would be found
                    var theseSenses = theData[i].senses;
                    //console.log(theseSenses);
                    if (theseSenses !== null) {
                        console.log("---Senses data for result [" + i + "]---  " + theData[i].headword);
                        //check to see if the entry has a defition
                        for (var k = 0; k < theseSenses.length; k++) {
                            //console.log(theseSenses[k]); // log the senses that are being worked with

                            if (theseSenses[k].definition !== undefined) {
                                console.log("Def: " + theseSenses[k].definition);
                                wordsWithDef[i] = wordsWithAPart[i];
                                def = theseSenses[k].definition;
                            } else {
                                console.error("Bummer man, Pearson doesn't have a defittion for "+ theData[i].headword +" Senses[" + k + "] :/");
                                //randomWord();
                            }
                        }
                    }
                }
                console.log("-$-$-$-$-$-$-[wordsWithDef]-$-$-$-$-$-$-$");
                //console.log(wordsWithDef);

                // Prepare the data to be send to the client
                var dataToClient = {
                    "headword" : headWord,
                    "def" : def,
                    "partOfSpeech" : partOfSpeech,
                    "pronounce" : pronounce
                };

                //A boolean to trigger the actual send of the data
                var PASS_PRE_FLIGHT = true;

                //Before sending Data to the Client check to see that all required portions of the word are there
                if(dataToClient.headword === undefined){
                    console.error("-- RETRY REASON: HEADWORD UNDEFINED ON PRE-FLIGHT CHECK");
                    PASS_PRE_FLIGHT = false;
                }

                 if(dataToClient.def === undefined){
                    console.error("-- RETRY REASON: DEFINITION UNDEFINED ON PRE-FLIGHT CHECK");
                     PASS_PRE_FLIGHT = false;
                }

                if(dataToClient.partOfSpeech === undefined){
                    console.error("-- RETRY REASON: PART OF SPEECH UNDEFINED ON PRE-FLIGHT CHECK");
                    PASS_PRE_FLIGHT = false;
                }

                if(dataToClient.pronounce === undefined){
                    console.error("-- RETRY REASON: PRONUNCIATION UNDEFINED ON PRE-FLIGHT CHECK");
                    PASS_PRE_FLIGHT = false;
                }

                if(PASS_PRE_FLIGHT === true) {
                    //Log the data sent
                    console.log("\n $$$$$$$$ Data to be sent to client: \n ----------------------------- \n"
                        + headWord + " | " + def + " | " + partOfSpeech + " | " + pronounce);
                    //Send the data by closing the connection
                    res.end(JSON.stringify(dataToClient));
                } else {
                    console.error("--PRE FLIGHT FAILURE--- STARTING NEW QUERY");
                    randomWord();
                }

            }

        });
    }

    //Alrighty then, let's get this party started
    randomWord();

}).listen(8080, '127.0.0.1');
