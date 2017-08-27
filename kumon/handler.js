'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');

const STATE = {
  SHADOWING: 'SHADOWING',
  QUESTIONS: 'QUESTIONS'
};

const LIST_OF_SHADOWS = [
  "I like milk",
  "I like juice",
  "I like coffee",
  "I like tea"
];

const handlers = {
  'LaunchRequest': function () {
    this.emit('AskPractice');
  },
  'AskPractice': function () {
    console.log('handlers AskPractice');
    const message =
      'Welcome to kumon English practice service. ' +
      'We\'re offering shadowing practice and questions and answers practice. ' +
      'Which one do you want to try?';
    this.emit(':ask', message, 'Please say that again?');
  },
  'PracticeIntent': function () {
    console.log('handlers PracticeIntent');
    const practice = this.event.request.intent.slots.Practice.value;
    if (practice === 'shadowing') {
      this.handler.state = STATE.SHADOWING;
      this.emitWithState('Init');
    } else if (practice === 'questions and answers') {
      this.emit(':tell', 'Under construction. bye');
    } else {
      this.emit('AskPractice');
    }
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'Unhandled': function() {
    console.log('handlers Unhandled');
    this.emit('AskPractice');
  }
};

const shadowingHandlers =  Alexa.CreateStateHandler(STATE.SHADOWING, {
  'Init': function () {
    console.log('shadowingHandlers Init');
    this.attributes['LIST_OF_SHADOWS'] = LIST_OF_SHADOWS;
    this.attributes['count'] = 0;
    this.attributes['phrase'] = '';
    this.attributes['shadow'] = '';
    this.attributes['percentage'] = 0;
    this.attributes['repeating'] = false;
    this.emitWithState('AskShadow');
  },
  'AskShadow': function () {
    console.log('shadowingHandlers AskShadow');
    let intro = `Let's repeat the following phrase. Phrase ${this.attributes['count'] + 1}. `;
    if (this.attributes['count'] > 0) {
      intro = `Good. ${this.attributes['percentage']} percent correct. let's move on next phrase. Phrase ${this.attributes['count'] + 1}. `;
    }
    if (this.attributes['repeating']) {
      intro = `Hmm, ${this.attributes['percentage']} percent correct. You said ${this.attributes['shadow']}. One more time. `;
      this.attributes['repeating'] = false;
    }
    this.attributes['phrase'] = this.attributes['LIST_OF_SHADOWS'][this.attributes['count']];
    this.emit(':ask', intro + this.attributes['phrase'], 'Please say that again?');
  },
  'ShadowIntent': function () {
    console.log('shadowingHandlers ShadowIntent');
    this.attributes['shadow'] = this.event.request.intent.slots.Shadow.value;
    const phrase = this.attributes['phrase'];
    const shadow = this.attributes['shadow'];

    const similarity = stringSimilarity.compareTwoStrings(phrase, shadow);
    const percentage = Math.floor(similarity * 100);
    this.attributes['percentage'] = percentage;

    if (percentage > 70) {
      if (this.attributes['count'] + 1 < this.attributes['LIST_OF_SHADOWS'].length) {
        this.attributes['count'] += 1;
        this.emitWithState('AskShadow');
      } else {
        this.emit(':tell', 'Thank you very much. See you at next time!');
      }
    } else {
      this.attributes['repeating'] = true;
      this.emit('AskShadow');
    }
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'Unhandled': function() {
    console.log('shadowingHandlers Unhandled');
    this.emitWithState('AskShadow');
  }
});

module.exports.kumon = (event, context, callback) => {
  const alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers, shadowingHandlers);
  alexa.execute();
};

console.log('LIST_OF_SHADOWS');
for (const shadow of LIST_OF_SHADOWS) {
  console.log(shadow);
}
