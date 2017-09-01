'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');
const {shuffle} = require('./utils');

const MSG_RE_PROMPT = 'Please say that again?';
const MSG_THANK_YOU = 'Thank you very much. See you at next time!';

const LIST_OF_DIALOGUES = require('../resources/listen-repeats.json');

function createHandlers(state) {
  return Alexa.CreateStateHandler(state, {
    'Start': function () {
      console.log('LISTEN_REPEAT Start');
      let secitons;
      while (true) {
        shuffle(LIST_OF_DIALOGUES);
        secitons = LIST_OF_DIALOGUES.slice(0, 15);
        if (secitons.find(dialogue => dialogue.scene)) {
          break;
        }
      }
      this.attributes['dialogues'] = secitons;
      this.attributes['dialogueCount'] = 0;
      this.attributes['phraseCount'] = 0;
      this.attributes['repeat'] = '';
      this.attributes['percentage'] = 0;
      this.attributes['again'] = false;
      this.attributes['againCount'] = 0;
      this.emitWithState('AskListenRepeat');
    },
    'AskListenRepeat': function () {
      console.log('LISTEN_REPEAT AskListenRepeat');
      const {dialogues, dialogueCount, phraseCount, repeat, percentage, again, againCount} = this.attributes;
      const praise = percentage > 95 ? 'Great.' : 'Good.';
      const evaluation = `${praise}`;
      if (!again && dialogueCount === dialogues.length - 1 && phraseCount === dialogues[dialogueCount]['phrases'].length) {
        return this.emit(':tell', `${evaluation} ${MSG_THANK_YOU}`);
      }
      let dialogueInfo = `Number ${dialogueCount + 1}.<break time='500ms'/>`;
      if (dialogues[dialogueCount]['scene']) {
        dialogueInfo = `Number ${dialogueCount + 1}, following phrases are from ${dialogues[dialogueCount]['scene']}<break time='500ms'/>`;
      }
      let person = '';
      if (dialogues[dialogueCount]['phrases'][phraseCount]['person']) {
        person = `${dialogues[dialogueCount]['phrases'][phraseCount]['person']}`;
      }
      let phrase = `${dialogues[dialogueCount]['phrases'][phraseCount]['phrase']}`;
      let lead = '';
      if (dialogueCount === 0 && phraseCount === 0) {
        lead = `${dialogueInfo}`;
      } else {
        if (phraseCount === 0) {
          lead = `${evaluation} ${dialogueInfo} `;
        } else {
          lead = `${evaluation} `;
        }
      }
      if (again === true) {
        if (repeat) {
          lead = `Good. You said ${repeat}. `;
        } else {
          lead = `You're doing great. `;
        }
        if (againCount === 3) {
          this.attributes['againCount'] = 0;
          if (phraseCount + 1 === dialogues[dialogueCount]['phrases'].length && dialogueCount + 1 < dialogues.length) {
            this.attributes['dialogueCount'] += 1;
            this.attributes['phraseCount'] = 0;
          } else {
            this.attributes['phraseCount'] += 1;
          }
          if (this.attributes['dialogueCount'] === dialogues.length - 1 && this.attributes['phraseCount'] === dialogues[this.attributes['dialogueCount']]['phrases'].length) {
            return this.emit(':tell', `${evaluation} ${MSG_THANK_YOU}`);
          }
          lead += `Let's go next one! `;

          if (dialogues[this.attributes['dialogueCount']]['phrases'][this.attributes['phraseCount']]['person']) {
            person = `${dialogues[this.attributes['dialogueCount']]['phrases'][this.attributes['phraseCount']]['person']} said.`;
          }
          phrase = `${dialogues[this.attributes['dialogueCount']]['phrases'][this.attributes['phraseCount']]['phrase']}`;
        } else {
          lead += `One more time? `;
        }
      }
      if (person) {
        this.emit(':ask', `${lead}<break time='1s'/>${person} said.<break time='1s'/> <prosody volume="x-loud" rate="slow">${phrase}</prosody>`, MSG_RE_PROMPT);
      } else {
        this.emit(':ask', `${lead}<break time='1s'/><prosody volume="x-loud" rate="slow">${phrase}</prosody>`, MSG_RE_PROMPT);
      }
    },
    'ListenRepeatIntent': function () {
      console.log('LISTEN_REPEAT ListenRepeatIntent');
      console.log('slots', this.event.request.intent.slots);
      this.attributes['repeat'] = this.event.request.intent.slots.ListenRepeat.value;
      const {dialogues, dialogueCount, phraseCount, repeat} = this.attributes;

      const expectedPhrase = dialogues[dialogueCount]['phrases'][phraseCount]['phrase'].replace(/[^0-9|a-zA-Z| ]/ig, '').replace('  ', ' ');
      const similarity = stringSimilarity.compareTwoStrings(expectedPhrase, repeat);
      const percentage = Math.floor(similarity * 100);
      this.attributes['percentage'] = percentage;

      if (percentage > 50) {
        if (phraseCount + 1 === dialogues[dialogueCount]['phrases'].length && dialogueCount + 1 < dialogues.length) {
          this.attributes['dialogueCount'] += 1;
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
  for (const dialogue of LIST_OF_DIALOGUES) {
    for (const phrase of dialogue['phrases']) {
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
