'use strict';

const {showCustomSlotTypes: showListenRepeatCustomSlotTypes} = require('./lib/listen-repeat-handers');
const {showCustomSlotTypes: showQuestionAnswerCustomSlotTypes} = require('./lib/question-answer-handlers');

console.log('LIST_OF_PRACTICES');
[
  'listen repeat',
  'question answer',
  'I want to try listen repeat',
  'I want to try question answer'
].forEach((item) => {
  console.log(item);
});
console.log();

showListenRepeatCustomSlotTypes();
showQuestionAnswerCustomSlotTypes();
