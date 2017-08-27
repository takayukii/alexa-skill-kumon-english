'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');
const {shuffle} = require('./utils');

const MSG_RE_PROMPT = 'Please say that again?';
const MSG_THANK_YOU = 'Thank you very much. See you at next time!';

const LIST_OF_QUESTION_ANSWERS = require('../resources/question-answers.json');

function createHandler(state) {
  return Alexa.CreateStateHandler(state, {
    'Start': function () {
      console.log('QUESTION_ANSWER Start');
      shuffle(LIST_OF_QUESTION_ANSWERS);
      this.attributes['questionAnswers'] = LIST_OF_QUESTION_ANSWERS.slice(0, 5);
      this.attributes['count'] = 0;
      this.attributes['answer'] = '';
      this.attributes['example'] = '';
      this.attributes['again'] = false;
      this.emitWithState('AskQuestionAnswer');
    },
    'AskQuestionAnswer': function () {
      console.log('QUESTION_ANSWER AskQuestionAnswer');
      const questionAnswers = this.attributes['questionAnswers'];
      let intro = `Please answer the following question. `;
      if (this.attributes['count'] > 0) {
        intro = `Good. Your answer is ${this.attributes['example']}. Let's move on next question. `;
      }
      if (this.attributes['again'] === true) {
        intro = `Hmm, you said ${this.attributes['answer']} ${this.attributes['example']}. One more time. `;
        this.attributes['again'] = false;
      }
      if (this.attributes['count'] === this.attributes['questionAnswers'].length) {
        this.emit(':tell', `Good. Your answer is ${this.attributes['example']}. ` + MSG_THANK_YOU);
      } else {
        intro += `I want you to answer like ${questionAnswers[this.attributes['count']].answer.replace('?', 'blah blah')}. Question ${this.attributes['count'] + 1}. `;
        this.emit(':ask', intro + questionAnswers[this.attributes['count']].question, MSG_RE_PROMPT);
      }
    },
    'QuestionAnswerIntent': function () {
      console.log('QUESTION_ANSWER QuestionAnswerIntent');
      console.log('slots', this.event.request.intent.slots);
      this.attributes['answer'] = this.event.request.intent.slots.QuestionAnswer.value;
      this.attributes['example'] = this.event.request.intent.slots.QuestionAnswerExample.value;

      const similarity = stringSimilarity.compareTwoStrings(this.attributes['questionAnswers'][this.attributes['count']].answer.replace('?', ''), this.attributes['answer']);
      const percentage = Math.floor(similarity * 100);
      if (percentage > 50) {
        this.attributes['count'] += 1;
        this.emitWithState('AskQuestionAnswer');
      } else {
        this.attributes['again'] = true;
        this.emitWithState('AskQuestionAnswer');
      }
    },
    'AMAZON.StopIntent': function () {
      this.emit(':tell', MSG_THANK_YOU);
    },
    'AMAZON.CancelIntent': function () {
      this.emit(':tell', MSG_THANK_YOU);
    },
    'Unhandled': function () {
      console.log('QUESTION_ANSWER Unhandled');
      this.emitWithState('AskQuestionAnswer');
    }
  });
}

function showCustomSlotTypes() {
  console.log('LIST_OF_QUESTION_ANSWERS');
  for (const qa of LIST_OF_QUESTION_ANSWERS) {
    console.log(qa.answer.replace('?', ''));
  }
  console.log();
  console.log('LIST_OF_QUESTION_ANSWER_EXAMPLES');
  for (const qa of LIST_OF_QUESTION_ANSWERS) {
    for (const example of qa.examples) {
      console.log(example);
    }
  }
  console.log();
}

module.exports = {
  createHandler,
  showCustomSlotTypes
};
