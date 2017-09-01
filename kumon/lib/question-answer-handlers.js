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
      const {questionAnswers, count, answer, example, again, againCount} = this.attributes;
      if (count === questionAnswers.length) {
        return this.emit(':tell', `Good. ${MSG_THANK_YOU}`);
      }
      let intro = `Please answer the following question. `;
      if (count > 0) {
        intro = `Good. Let's move on next question. `;
      }
      if (again === true) {
        if (answer) {
          if (example) {
            intro = `Hmm, you said ${answer} and ${example}. `;
          } else {
            intro = `Hmm, you said ${answer}. `;
          }
        } else {
          intro = `Hmm, I couldn't get what you said. `;
        }
        if (againCount === 5) {
          const remains = LIST_OF_QUESTION_ANSWERS.slice(5);
          const idx = Math.floor(Math.random() * (remains.length - 1));
          questionAnswers[count] = remains[idx];
          this.attributes['againCount'] = 0;
          intro += `Try another one. `;
        } else {
          intro += `One more time. `;
        }
      }
      if (againCount > 0 && againCount % 2 === 1) {
        let example = '';
        if (typeof questionAnswers[count].answer === 'string') {
          if (questionAnswers[count].examples && questionAnswers[count].examples.length > 0) {
            example = questionAnswers[count].answer.replace('?', questionAnswers[count].examples[0]);
          } else {
            example = questionAnswers[count].answer;
          }
        } else {
          if (questionAnswers[count].answer.length > 0) {
            if (questionAnswers[count].examples && questionAnswers[count].examples.length > 0) {
              example = questionAnswers[count].answer[0].replace('?', questionAnswers[count].examples[0]);
            } else {
              example = questionAnswers[count].answer[0];
            }
          }
        }
        intro += `I want you to answer like ${example} `;
      }
      intro += `Question ${count + 1}. <break time='1s'/>`;
      this.emit(':ask', `${intro}${questionAnswers[count].question}`, MSG_RE_PROMPT);
    },
    'QuestionAnswerIntent': function () {
      console.log('QUESTION_ANSWER QuestionAnswerIntent');
      console.log('slots', this.event.request.intent.slots);
      this.attributes['answer'] = this.event.request.intent.slots.QuestionAnswer.value;
      this.attributes['example'] = this.event.request.intent.slots.QuestionAnswerExample.value;

      const {questionAnswers, count, answer} = this.attributes;

      let similarity = 0;
      if (typeof questionAnswers[count].answer === 'string') {
        const expectedAnswer = questionAnswers[count].answer.replace('?', '').replace(' .', '').replace(/[^0-9|a-zA-Z| ]/ig, '').replace('  ', ' ').trim();
        similarity = stringSimilarity.compareTwoStrings(expectedAnswer, answer);
        console.log('QUESTION_ANSWER QuestionAnswerIntent similarity', expectedAnswer, answer, similarity);
      } else {
        for (const ans of questionAnswers[count].answer) {
          const expectedAnswer = ans.replace('?', '').replace(' .', '').trim();
          const sim = stringSimilarity.compareTwoStrings(expectedAnswer, answer);
          console.log('QUESTION_ANSWER QuestionAnswerIntent similarity', expectedAnswer, answer, sim);
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
      this.attributes['answer'] = undefined;
      this.attributes['example'] = undefined;
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
