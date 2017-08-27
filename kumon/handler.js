'use strict';

const Alexa = require('alexa-sdk');
const stringSimilarity = require('string-similarity');

const STATE = {
  SHADOWING: 'SHADOWING',
  QUESTION_ANSWERS: 'QUESTION_ANSWERS'
};

const LIST_OF_SHADOWS = [
  "I like milk",
  "I like juice",
  "I like coffee",
  "I like tea"
];

const LIST_OF_QUESTION_ANSWERS = [
  {
    question: "Which do you want?",
    answer: "I want the ?",
    examples: ["ring", "watch", "shirt", "jacket"]
  },
  {
    question: "What color do you want?",
    answer: "I want ?",
    examples: ["pink", "blue", "green", "white"]
  }
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
      'Which practice do you want to try?';
    this.emit(':ask', message, 'Please say that again?');
  },
  'PracticeIntent': function () {
    console.log('handlers PracticeIntent');
    const practice = this.event.request.intent.slots.Practice.value;
    if (practice === 'shadowing') {
      this.handler.state = STATE.SHADOWING;
      this.emitWithState('Init');
    } else if (practice === 'questions and answers') {
      this.handler.state = STATE.QUESTION_ANSWERS;
      this.emitWithState('Init');
    } else {
      this.emit('AskPractice');
    }
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'Unhandled': function () {
    console.log('handlers Unhandled');
    this.emit('AskPractice');
  }
};

const shadowingHandlers = Alexa.CreateStateHandler(STATE.SHADOWING, {
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

    if (percentage > 50) {
      if (this.attributes['count'] + 1 < this.attributes['LIST_OF_SHADOWS'].length) {
        this.attributes['count'] += 1;
        this.emitWithState('AskShadow');
      } else {
        this.emit(':tell', 'Thank you very much. See you at next time!');
      }
    } else {
      this.attributes['repeating'] = true;
      this.emitWithState('AskShadow');
    }
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'Unhandled': function () {
    console.log('shadowingHandlers Unhandled');
    this.emitWithState('AskShadow');
  }
});

const questionAnswerHandlers = Alexa.CreateStateHandler(STATE.QUESTION_ANSWERS, {
  'Init': function () {
    console.log('questionAnswerHandlers Init');
    this.attributes['LIST_OF_QUESTION_ANSWERS'] = LIST_OF_QUESTION_ANSWERS;
    this.attributes['count'] = 0;
    this.attributes['question'] = '';
    this.attributes['answer'] = '';
    this.attributes['example'] = '';
    this.attributes['repeating'] = false;
    this.emitWithState('AskQuestionAnswer');
  },
  'AskQuestionAnswer': function () {
    console.log('questionAnswerHandlers AskQuestionAnswer');
    const questionAnswers = this.attributes['LIST_OF_QUESTION_ANSWERS'];
    let intro = `Please answer the following question. `;
    if (this.attributes['count'] > 0) {
      intro = `Good. Your answer is ${this.attributes['example']}. Let's move on next question. `;
    }
    if (this.attributes['repeating']) {
      intro = `Hmm, you said ${this.attributes['answer']} ${this.attributes['example']}. One more time. `;
      this.attributes['repeating'] = false;
    }
    intro += `I want you to answer like ${questionAnswers[this.attributes['count']].answer.replace('?', 'blah blah')}. Question ${this.attributes['count'] + 1}. `;
    const question = questionAnswers[this.attributes['count']].question;
    this.emit(':ask', intro + question, 'Please say that again?');
  },
  'QuestionAnswerIntent': function () {
    console.log('questionAnswerHandlers QuestionAnswerIntent');
    this.attributes['answer'] = this.event.request.intent.slots.QuestionAnswer.value;
    this.attributes['example'] = this.event.request.intent.slots.QuestionAnswerExample.value;
    const answer = this.attributes['answer'];

    const questionAnswers = this.attributes['LIST_OF_QUESTION_ANSWERS'];
    const questionAnswer = questionAnswers[this.attributes['count']];

    const similarity = stringSimilarity.compareTwoStrings(questionAnswer.answer.replace('?', ''), answer);
    const percentage = Math.floor(similarity * 100);
    if (percentage > 50) {
      if (this.attributes['count'] + 1 < this.attributes['LIST_OF_QUESTION_ANSWERS'].length) {
        this.attributes['count'] += 1;
        this.emitWithState('AskQuestionAnswer');
      } else {
        this.emit(':tell', `Good. Your answer is ${this.attributes['example']}. Thank you very much. See you at next time!`);
      }
    } else {
      this.attributes['repeating'] = true;
      this.emitWithState('AskQuestionAnswer');
    }
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Thank you, see you at next time');
  },
  'Unhandled': function () {
    console.log('questionAnswerHandlers Unhandled');
    this.emitWithState('AskQuestionAnswer');
  }
});

module.exports.kumon = (event, context, callback) => {
  const alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(handlers, shadowingHandlers, questionAnswerHandlers);
  alexa.execute();
};

console.log('LIST_OF_SHADOWS');
for (const shadow of LIST_OF_SHADOWS) {
  console.log(shadow);
}
console.log('LIST_OF_QUESTION_ANSWERS');
for (const question of LIST_OF_QUESTION_ANSWERS) {
  console.log(question.answer.replace('?', ''));
}
console.log('LIST_OF_QUESTION_ANSWER_EXAMPLES');
for (const question of LIST_OF_QUESTION_ANSWERS) {
  for (const example of question.examples) {
    console.log(example);
  }
}
