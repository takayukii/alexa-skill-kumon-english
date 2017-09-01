'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');
const {shuffle} = require('./utils');

const MSG_RE_PROMPT = 'Please say that again?';
const MSG_THANK_YOU = 'Thank you very much. See you at next time!';

const LIST_OF_SECTIONS = require('../resources/listen-repeats.json');

function createHandlers(state) {
  return Alexa.CreateStateHandler(state, {
    'Start': function () {
      console.log('LISTEN_REPEAT Start');
      shuffle(LIST_OF_SECTIONS);
      this.attributes['sections'] = LIST_OF_SECTIONS.slice(0, 20);
      this.attributes['sectionCount'] = 0;
      this.attributes['phraseCount'] = 0;
      this.attributes['repeat'] = '';
      this.attributes['percentage'] = 0;
      this.attributes['again'] = false;
      this.attributes['againCount'] = 0;
      this.emitWithState('AskListenRepeat');
    },
    'AskListenRepeat': function () {
      console.log('LISTEN_REPEAT AskListenRepeat');
      const {sections, sectionCount, phraseCount, repeat, percentage, again, againCount} = this.attributes;
      const praise = percentage > 95 ? 'Great.' : 'Good.';
      const evaluation = `${praise}`;
      if (!again && sectionCount === sections.length - 1 && phraseCount === sections[sectionCount]['phrases'].length) {
        return this.emit(':tell', `${evaluation} ${MSG_THANK_YOU}`);
      }
      let sectionInfo = `Section ${sectionCount + 1}.<break time='500ms'/>`;
      if (sections[sectionCount]['scene']) {
        sectionInfo = `Section ${sectionCount + 1}, following phrases are from ${sections[sectionCount]['scene']}<break time='500ms'/>`;
      }
      let person = '';
      if (sections[sectionCount]['phrases'][phraseCount]['person']) {
        person = `<prosody volume="soft">${sections[sectionCount]['phrases'][phraseCount]['person']}</prosody><break time='300ms'/>`;
      }
      let phrase = `${sections[sectionCount]['phrases'][phraseCount]['phrase']}`;
      let lead = '';
      if (sectionCount === 0 && phraseCount === 0) {
        lead = `${sectionInfo}`;
      } else {
        if (phraseCount === 0) {
          lead = `${evaluation} ${sectionInfo} `;
        } else {
          lead = `${evaluation} `;
        }
      }
      if (again === true) {
        if (repeat) {
          lead = `Okay, you said ${repeat}. `;
        } else {
          lead = `Okay. you're doing great. `;
        }
        if (againCount === 3) {
          this.attributes['againCount'] = 0;
          if (phraseCount + 1 === sections[sectionCount]['phrases'].length && sectionCount + 1 < sections.length) {
            this.attributes['sectionCount'] += 1;
            this.attributes['phraseCount'] = 0;
          } else {
            this.attributes['phraseCount'] += 1;
          }
          if (this.attributes['sectionCount'] === sections.length - 1 && this.attributes['phraseCount'] === sections[this.attributes['sectionCount']]['phrases'].length) {
            return this.emit(':tell', `${evaluation} ${MSG_THANK_YOU}`);
          }
          lead += `Let's go next one. `;
          phrase = `${sections[this.attributes['sectionCount']]['phrases'][this.attributes['phraseCount']]['phrase']}`;
        } else {
          lead += `One more time? `;
        }
      }
      this.emit(':ask', `${lead}<break time='1s'/>${person} <prosody volume="x-loud" rate="slow">${phrase}</prosody>`, MSG_RE_PROMPT);
    },
    'ListenRepeatIntent': function () {
      console.log('LISTEN_REPEAT ListenRepeatIntent');
      console.log('slots', this.event.request.intent.slots);
      this.attributes['repeat'] = this.event.request.intent.slots.ListenRepeat.value;
      const {sections, sectionCount, phraseCount, repeat} = this.attributes;

      const expectedPhrase = sections[sectionCount]['phrases'][phraseCount]['phrase'].replace(/[^0-9|a-zA-Z| ]/ig, '').replace('  ', ' ');
      const similarity = stringSimilarity.compareTwoStrings(expectedPhrase, repeat);
      const percentage = Math.floor(similarity * 100);
      this.attributes['percentage'] = percentage;

      if (percentage > 50) {
        if (phraseCount + 1 === sections[sectionCount]['phrases'].length && sectionCount + 1 < sections.length) {
          this.attributes['sectionCount'] += 1;
          this.attributes['phraseCount'] = 0;
        } else {
          this.attributes['phraseCount'] += 1;
        }
        this.attributes['again'] = false;
        this.attributes['againCount'] = 0;
        this.emitWithState('AskListenRepeat');
      } else {
        this.attributes['again'] = true;
        this.attributes['againCount'] += 1;
        this.emitWithState('AskListenRepeat');
      }
    },
    'AMAZON.StopIntent': function () {
      this.emit(':tell', MSG_THANK_YOU);
    },
    'AMAZON.CancelIntent': function () {
      this.emit(':tell', MSG_THANK_YOU);
    },
    'Unhandled': function () {
      console.log('LISTEN_REPEAT Unhandled');
      this.attributes['again'] = true;
      this.attributes['againCount'] += 1;
      this.attributes['repeat'] = undefined;
      this.attributes['percentage'] = 0;
      this.emitWithState('AskListenRepeat');
    }
  });
}

function showCustomSlotTypes() {
  console.log('LIST_OF_LISTEN_REPEATS');
  const phrasesSet = new Set();
  for (const section of LIST_OF_SECTIONS) {
    for (const phrase of section['phrases']) {
      phrasesSet.add(phrase['phrase']);
    }
  }
  for (const item of phrasesSet) {
    console.log(item);
  }
  console.log();
}

module.exports = {
  createHandlers,
  showCustomSlotTypes
};
