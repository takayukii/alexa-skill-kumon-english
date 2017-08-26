'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');

const phrases = [
  `which do you want?`,
  `I want the ring`,
  `what color do you want?`,
  `I want pink`
];

const handlers = {
  'LaunchRequest': function () {
    this.attributes['phrases'] = phrases;
    this.attributes['count'] = 0;
    this.attributes['phrase'] = '';
    this.attributes['shadow'] = '';
    this.attributes['percentage'] = 0;
    this.attributes['repeating'] = false;
    this.emit('AskShadow');
  },
  'AskShadow': function () {
    let intro = `Welcome to kumon English shadowing practice. Let's repeat the following phrase. Phrase ${this.attributes['count'] + 1}. `;
    if (this.attributes['count'] > 0) {
      intro = `Good. ${this.attributes['percentage']} percent correctness. let's move on next phrase. Phrase ${this.attributes['count'] + 1}. `;
    }
    if (this.attributes['repeating']) {
      intro = `Hmm, ${this.attributes['percentage']} percent correctness. You said ${this.attributes['shadow']}. One more time. `;
      this.attributes['repeating'] = false;
    }
    this.attributes['phrase'] = this.attributes['phrases'][this.attributes['count']];
    this.emit(':ask', intro + this.attributes['phrase'], 'Please say that again?');
  },
  'ShadowIntent': function () {
    this.attributes['shadow'] = this.event.request.intent.slots.Shadow.value;
    const phrase = this.attributes['phrase'];
    const shadow = this.attributes['shadow'];

    const similarity = stringSimilarity.compareTwoStrings(phrase, shadow);
    const percentage = Math.floor(similarity * 100);
    this.attributes['percentage'] = percentage;

    if (percentage > 70) {
      if (this.attributes['count'] + 1 < this.attributes['phrases'].length) {
        this.attributes['count'] += 1;
        this.emit('AskShadow');
      } else {
        this.emit(':tell', 'Thank you very much. See you at next time!');
      }
    } else {
      this.attributes['repeating'] = true;
      this.emit('AskShadow');
    }
  },
  'Unhandled': function() {
    this.emit('AskShadow');
  }
};

module.exports.kumon = (event, context, callback) => {
  const alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
