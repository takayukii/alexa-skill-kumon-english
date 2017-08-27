'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');
const {shuffle} = require('./utils');

const MSG_RE_PROMPT = 'Please say that again?';
const MSG_THANK_YOU = 'Thank you very much. See you at next time!';

const LIST_OF_LISTEN_REPEATS = require('../resources/listen-repeats.json');

function createHandlers(state) {
  return Alexa.CreateStateHandler(state, {
    'Start': function () {
      console.log('LISTEN_REPEAT Start');
      shuffle(LIST_OF_LISTEN_REPEATS);
      this.attributes['listenRepeats'] = LIST_OF_LISTEN_REPEATS.slice(0, 10);
      this.attributes['count'] = 0;
      this.attributes['repeat'] = '';
      this.attributes['percentage'] = 0;
      this.attributes['again'] = false;
      this.emitWithState('AskListenRepeat');
    },
    'AskListenRepeat': function () {
      console.log('LISTEN_REPEAT AskListenRepeat');
      const {listenRepeats, count, repeat, percentage, again} = this.attributes;
      let intro = `Let's repeat the following phrase. Phrase ${count + 1}. `;
      if (count > 0) {
        intro = `Good. ${percentage} percent correct. Let's move on next phrase. Phrase ${count + 1}. `;
      }
      if (again === true) {
        intro = `Hmm, ${percentage} percent correct. You said ${repeat}. One more time. `;
        this.attributes['again'] = false;
      }
      if (count === listenRepeats.length) {
        this.emit(':tell', `Good. ${percentage} percent correct. ${MSG_THANK_YOU}`);
      } else {
        this.emit(':ask', `${intro}${listenRepeats[count]}`, MSG_RE_PROMPT);
      }
    },
    'ListenRepeatIntent': function () {
      console.log('LISTEN_REPEAT ListenRepeatIntent');
      console.log('slots', this.event.request.intent.slots);
      this.attributes['repeat'] = this.event.request.intent.slots.ListenRepeat.value;

      const similarity = stringSimilarity.compareTwoStrings(this.attributes['listenRepeats'][this.attributes['count']], this.attributes['repeat']);
      const percentage = Math.floor(similarity * 100);
      this.attributes['percentage'] = percentage;

      if (percentage > 50) {
        this.attributes['count'] += 1;
        this.emitWithState('AskListenRepeat');
      } else {
        this.attributes['again'] = true;
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
      this.attributes['repeat'] = 'inaudible';
      this.emitWithState('AskListenRepeat');
    }
  });
}

function showCustomSlotTypes() {
  const listenRepeatSet = new Set(LIST_OF_LISTEN_REPEATS);
  console.log('LIST_OF_LISTEN_REPEATS');
  for (const item of listenRepeatSet) {
    console.log(item);
  }
  console.log();
}

module.exports = {
  createHandlers,
  showCustomSlotTypes
};
