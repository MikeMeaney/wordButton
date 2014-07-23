/**
 * Created by mikemeaney on 7/15/14.
 */

var request = require('request');
var http = require('http');

var randomWordURL = 'http://api.wordnik.com:80/v4/words.json/randomWord?hasDictionaryDef=true' +
    '&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';

http.createServer(function (req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');

    var theWord;

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


            console.log("---Sup man? I got your request from Pearson--")
            var theData = body; // Store the data from Pearson as theData
            theData = JSON.parse(theData); // Parse it as a JSON object
            //console.log(theData); //Show me what you've grabbed so far

            //Check to see if there were any results
            if (theData.results.length < 1) {
                //If there weren't any results returned, try again.
                console.error("Doh! That word doesn't exist @ Pearson");

                //Place function for selecting a different word --HERE---
                //I really really want to make this into a workable function
                console.log("--RETRY RETRY RETRY RETRY RETRY--");
                randomWord();


            } else {
                theData = theData.results;
                console.log("Tight, Pearson returned " + theData.length + " results")

                //Iterate through all the results
                for (var i = 0; i < theData.length; i++) {

                    //Tell me were you are in the array and it's corresponding headword
                    console.log("--- Result No. " + i + " " + theData[i].headword + "---");
                    var headWord = theData[i].headword;

                    //Tell me the part of speech for this result
                    if (theData[i].part_of_speech !== undefined) {
                        console.log("Part of Speech: " + theData[i].part_of_speech);
                        partOfSpeech = theData[i].part_of_speech;
                    } else {
                        console.error("No part if speech found for theData["+i+"]");
                    }

                    //the variable for working with the senses array of this particular result
                    //this is were the defintion data data would be found
                    var theseSenses = theData[i].senses;
                    //console.log(theseSenses);
                    if(theseSenses !== null) {
                        console.log("---Senses data for result ["+ i +"]---");
                        //check to see if the entry has a defition
                        for (var k = 0; k < theseSenses.length; k++) {
                            console.log(theseSenses[k]); // log the senses that are being worked with

                            if (theseSenses[k].definition !== undefined) {
                                console.log("Def: " + theseSenses[k].definition);
                                def = theseSenses[k].definition;
                            } else {
                                console.error("Bummer man, Pearson doesn't have a defittion for Senses["+k+"] :/");
                                //randomWord();
                            }
                        }
                    }

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
                            "word :/ theData["+i+"]" );
                        console.error(theData[i]);
                    }

                }

                // Prepare the data to be send to the client

                console.log("\n $$$$$$$$ Data to be sent to client: \n ----------------------------- \n"
                + headWord +" | " + def + " | "  + partOfSpeech + " | " + pronounce);


                var dataToClient = {
                    "headword" : headWord,
                    "def" : def,
                    "partOfSpeech" : partOfSpeech,
                    "pronounce" : pronounce
                };
                //res.end("Howdy @ " + Date.now());
                res.end(JSON.stringify(dataToClient));
            }




        });
    }

    function randomWord() {
        console.log("-------------ALLOW ME TO FETCH YE WORD OF RANDOMNESS AND MERCY------------------")
        //I really really want to make this into a workable function
        request(randomWordURL, function (error, response, body) {
            console.log("$$--This is the random word--$$");

            var WORD = body;
            WORD = JSON.parse(WORD);
            WORD = WORD.word;
            console.log(WORD);

//            pearsonURL = "https://api.pearson.com/v2/dictionaries/entries?headword="+theWord+"&apikey=s7673YUomVGLWud3HAYMZQt6NTv396Kc";

            getWordData(WORD);
        });
        console.log("-------------ACTION COMPLETE------------------");

    }

    //Alrighty then, let's get this party started
    randomWord();



}).listen(8080, '127.0.0.1');


