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
      this.attributes['againCount'] = 0;
      this.emitWithState('AskQuestionAnswer');
    },
    'AskQuestionAnswer': function () {
      console.log('QUESTION_ANSWER AskQuestionAnswer');
      let intro = `Please answer the following question. `;
      if (this.attributes['count'] > 0) {
        intro = `Good. Let's move on next question. `;
      }
      if (this.attributes['again'] === true) {
        if (this.attributes['example']) {
          intro = `Hmm, you said ${this.attributes['answer']} ${this.attributes['example']}. One more time. `;
        } else {
          intro = `Hmm, you said ${this.attributes['answer']}. One more time. `;
        }
      }
      if (this.attributes['count'] === this.attributes['questionAnswers'].length) {
        this.emit(':tell', `Good. ` + MSG_THANK_YOU);
      } else {
        if (this.attributes['againCount'] > 0 && this.attributes['againCount'] % 2 === 1) {
          let example = '';
          if (typeof this.attributes['questionAnswers'][this.attributes['count']].answer === 'string') {
            if (this.attributes['questionAnswers'][this.attributes['count']].examples && this.attributes['questionAnswers'][this.attributes['count']].examples.length > 0) {
              example = this.attributes['questionAnswers'][this.attributes['count']].answer.replace('?', this.attributes['questionAnswers'][this.attributes['count']].examples[0]);
            } else {
              example = this.attributes['questionAnswers'][this.attributes['count']].answer;
            }
          } else {
            if (this.attributes['questionAnswers'][this.attributes['count']].answer.length > 0) {
              if (this.attributes['questionAnswers'][this.attributes['count']].examples && this.attributes['questionAnswers'][this.attributes['count']].examples.length > 0) {
                example = this.attributes['questionAnswers'][this.attributes['count']].answer[0].replace('?', this.attributes['questionAnswers'][this.attributes['count']].examples[0]);
              } else {
                example = this.attributes['questionAnswers'][this.attributes['count']].answer[0];
              }
            }
          }
          intro += `I want you to answer like following. ${example} `;
        }
        intro += `Question ${this.attributes['count'] + 1}. `;
        this.emit(':ask', intro + this.attributes['questionAnswers'][this.attributes['count']].question, MSG_RE_PROMPT);
      }
    },
    'QuestionAnswerIntent': function () {
      console.log('QUESTION_ANSWER QuestionAnswerIntent');
      console.log('slots', this.event.request.intent.slots);
      this.attributes['answer'] = this.event.request.intent.slots.QuestionAnswer.value;
      this.attributes['example'] = this.event.request.intent.slots.QuestionAnswerExample.value;

      let similarity = 0;
      if (typeof this.attributes['questionAnswers'][this.attributes['count']].answer === 'string') {
        const answer = this.attributes['questionAnswers'][this.attributes['count']].answer.replace('?', '').replace(' .', '').trim();
        similarity = stringSimilarity.compareTwoStrings(answer, this.attributes['answer']);
        console.log('QUESTION_ANSWER QuestionAnswerIntent similarity', answer, this.attributes['answer'], similarity);
      } else {
        for (const answer of this.attributes['questionAnswers'][this.attributes['count']].answer) {
          const sim = stringSimilarity.compareTwoStrings(answer.replace('?', '').replace(' .', '').trim(), this.attributes['answer']);
          console.log('QUESTION_ANSWER QuestionAnswerIntent similarity', answer.replace('?', '').replace(' .').trim(), this.attributes['answer'], sim);
          if (sim > similarity) {
            similarity = sim;
          }
        }
      }
      const percentage = Math.floor(similarity * 100);
      if (percentage > 50) {
        this.attributes['count'] += 1;
        this.attributes['again'] = false;
        this.attributes['againCount'] = 0;
        this.emitWithState('AskQuestionAnswer');
      } else {
        this.attributes['again'] = true;
        this.attributes['againCount'] += 1;
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
      this.attributes['again'] = true;
      this.attributes['againCount'] += 1;
      this.attributes['answer'] = 'inaudible';
      this.attributes['example'] = '';
      this.emitWithState('AskQuestionAnswer');
    }
  });
}

function showCustomSlotTypes() {
  console.log('LIST_OF_QUESTION_ANSWERS');
  const answers = new Set();
  for (const qa of LIST_OF_QUESTION_ANSWERS) {
    if (typeof qa.answer === 'string') {
      const answer = qa.answer.replace('?', '').replace(' .', '').trim();
      if (answer) {
        answers.add(answer);
      }
    } else {
      for (let answer of qa.answer) {
        answer = answer.replace('?', '').replace(' .', '').trim();
        if (answer) {
          answers.add(answer);
        }
      }
    }
  }
  for (const item of answers) {
    console.log(item);
  }
  console.log();
  console.log('LIST_OF_QUESTION_ANSWER_EXAMPLES');
  const examples = new Set();
  for (const qa of LIST_OF_QUESTION_ANSWERS) {
    if (qa.examples) {
      for (const example of qa.examples) {
        examples.add(example);
      }
    }
  }
  for (const item of examples) {
    console.log(item);
  }
  console.log();
}

module.exports = {
  createHandler,
  showCustomSlotTypes
};
