'use strict';

const Alexa = require('alexa-sdk');
const {createHandlers: createListenRepeatHandlers} = require('./lib/listen-repeat-handers');
const {createHandler: createQuestionAnswerHandlers} = require('./lib/question-answer-handlers');

const MSG_RE_PROMPT = 'Please say that again?';
const MSG_THANK_YOU = 'Thank you very much. See you at next time!';

const STATE = {
  LISTEN_REPEAT: 'LISTEN_REPEAT',
  QUESTION_ANSWER: 'QUESTION_ANSWER'
};

const handlers = {
  'LaunchRequest': function () {
    this.emit('AskPractice');
  },
  'AskPractice': function () {
    console.log('handlers AskPractice');
    const message = `Welcome to Kumon English practice. You can try practice of listen repeat <break time='500ms'/> and question answer. Which practice do you want to try?`;
    this.emit(':ask', message, MSG_RE_PROMPT);
  },
  'PracticeIntent': function () {
    console.log('handlers PracticeIntent');
    const practice = this.event.request.intent.slots.Practice.value;
    if (practice.includes('listen repeat')) {
      this.handler.state = STATE.LISTEN_REPEAT;
      this.emitWithState('Start');
    } else if (practice.includes('question answer')) {
      this.handler.state = STATE.QUESTION_ANSWER;
      this.emitWithState('Start');
    } else {
      this.emit('AskPractice');
    }
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', MSG_THANK_YOU);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', MSG_THANK_YOU);
  },
  'Unhandled': function () {
    console.log('handlers Unhandled');
    this.emit('AskPractice');
  }
};

const listenRepeatHandlers = createListenRepeatHandlers(STATE.LISTEN_REPEAT);
const questionAnswerHandlers = createQuestionAnswerHandlers(STATE.QUESTION_ANSWER);

module.exports.kumon = (event, context, callback) => {
  const alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers, listenRepeatHandlers, questionAnswerHandlers);
  alexa.execute();
};
